import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { type EssayTaskInput, correctEssay } from '@betterwrite/ai';
import { corrections, db, essays } from '@betterwrite/db';
import { getScoreTier } from '@betterwrite/shared';
import { env } from '@betterwrite/shared/env';
import { logger } from '@betterwrite/shared/logger';
import {
  CORRECTION_QUEUE,
  type CorrectionJobData,
  aiProviderCircuitBreaker,
} from '@betterwrite/shared/queue';
import { Worker } from 'bullmq';
import { and, eq, inArray, lt } from 'drizzle-orm';
import { Redis } from 'ioredis';
import { aiRouterManager } from './ai-config.js';

export { performOcr, type OcrResult } from './ocr.js';
export { AiRouterManager, aiRouterManager, loadRouterFromDb } from './ai-config.js';

export interface CorrectionJob {
  essayId: string;
}

// AI Provider 配置不再从环境变量读取，由超管在后台统一配置（api_configs 表），
// aiRouterManager 负责从 DB 加载并通过 Redis 订阅 + 轮询实现热更新。
const workerLogger = logger.child({ component: 'worker' });

// 启动时恢复卡住的作文：仅当 status='correcting' 且 updatedAt 超过 10 分钟仍未更新时
// 才重置为 'pending'。10 分钟是基于实际批改耗时（OpenAI 一次流式 + JSON 解析 5-30s）
// 留出 20x 安全余量；如果某个 worker 真的在 10 分钟内处理不了一篇作文，说明外部问题
// 直接放行反而会引发双 worker 同时处理同一 essay 的竞态。
const STUCK_ESSAY_TIMEOUT_MS = 10 * 60 * 1000;

export async function resetStuckEssays(): Promise<number> {
  const cutoff = new Date(Date.now() - STUCK_ESSAY_TIMEOUT_MS).toISOString();
  // Bug #217: 之前无超时判断，worker 刚启动就可能把"正在被另一个 worker 处理"
  // 的 'correcting' 作文误判为卡住并重置为 'pending'，造成双 worker 同时处理。
  // 改为只重置 updatedAt < cutoff 的真正卡住行。
  const stuck = await db.query.essays.findMany({
    where: and(eq(essays.status, 'correcting'), lt(essays.updatedAt, cutoff)),
  });
  if (stuck.length === 0) return 0;

  const now = new Date().toISOString();
  for (const essay of stuck) {
    await db
      .update(essays)
      .set({ status: 'pending', updatedAt: now })
      .where(and(eq(essays.id, essay.id), eq(essays.status, 'correcting')));
  }
  workerLogger.info(
    { resetCount: stuck.length },
    "Reset stuck essay(s) from 'correcting' to 'pending'",
  );
  return stuck.length;
}

export async function processCorrection(job: CorrectionJob): Promise<void> {
  const { essayId } = job;
  const correctionLogger = workerLogger.child({ essayId });
  correctionLogger.info('Correcting essay');

  // Check circuit breaker before processing
  if (!aiProviderCircuitBreaker.canAttempt()) {
    const state = aiProviderCircuitBreaker.getState();
    correctionLogger.warn(
      {
        isOpen: state.isOpen,
        failureCount: state.failureCount,
        nextAttemptTime: new Date(state.nextAttemptTime).toISOString(),
      },
      'Circuit breaker is open, skipping correction',
    );
    throw new Error('Circuit breaker is open, AI provider unavailable');
  }

  const essay = await db.query.essays.findFirst({
    where: eq(essays.id, essayId),
    with: { task: true, student: true },
  });

  if (!essay) {
    throw new Error(`Essay ${essayId} not found`);
  }

  // 幂等性：已完成的作文不重复批改，避免重复插入 correction 行。
  if (essay.status === 'completed') {
    correctionLogger.info('Essay already completed, skipping');
    return;
  }

  const now = new Date().toISOString();

  // 抢占式状态更新：仅在 status ∈ {pending, failed} 时才将状态置为 correcting。
  // 多个 worker 实例并发处理同一 essayId 时，只有一个 UPDATE 会真正修改行；
  // 其他实例返回 0 行变更，立即放弃以避免重复调用 AI（Bug #5 修复）。
  const claimResult = await db
    .update(essays)
    .set({ status: 'correcting', updatedAt: now })
    .where(and(eq(essays.id, essayId), inArray(essays.status, ['pending', 'failed'])))
    .returning({ id: essays.id });

  if (claimResult.length === 0) {
    correctionLogger.warn(
      { status: essay.status },
      'Essay already claimed by another worker, skipping',
    );
    return;
  }

  const startTime = Date.now();

  try {
    // 每次批改都从管理器获取当前路由器，配置热更新后新任务自动使用新配置。
    const router = await aiRouterManager.ensureRouter();
    let result: Awaited<ReturnType<typeof correctEssay>>;

    // 构建 taskInput（所有分支共用，用于保存学段信息到 correction 记录）
    const taskInput: EssayTaskInput = essay.task
      ? {
          title: essay.task.title,
          requirements: essay.task.requirements,
          keyPoints: safeParseJson<string[]>(essay.task.keyPoints, []),
          topicType: essay.task.topicType,
          wordLimitMin: essay.task.wordLimitMin,
          wordLimitMax: essay.task.wordLimitMax,
          stage: (essay.task.stage as 'junior' | 'senior') ?? 'junior',
          seniorEssayType:
            (essay.task.seniorEssayType as 'applied_writing' | 'continuation_writing') ?? undefined,
          readingPassage: essay.task.readingPassage ?? undefined,
          continuationParagraphStarts: essay.task.continuationParagraphStarts
            ? safeParseJson<string[]>(essay.task.continuationParagraphStarts, [])
            : undefined,
        }
      : {
          title: '自由写作',
          requirements: '请根据题目要求完成一篇英语作文。',
          keyPoints: [],
          topicType: 'narration',
          wordLimitMin: 80,
          wordLimitMax: 125,
          stage: 'junior' as const,
        };

    if (router.availableNames().length === 0) {
      correctionLogger.warn('No AI provider configured, using mock correction');
      result = createMockCorrection(essay.content, essay.wordCount ?? 0, taskInput);
    } else if (!essay.task) {
      result = await correctEssay(essay.content, taskInput, router);
    } else {
      result = await correctEssay(essay.content, taskInput, router);
    }

    // Record success in circuit breaker
    aiProviderCircuitBreaker.recordSuccess();

    const correctionTimeMs = Date.now() - startTime;
    const correctionId = randomUUID();

    // 事务保证 correction 写入与 essay 状态更新的原子性；
    // 末尾 UPDATE 附加 status='correcting' 条件，防止并发重复处理写入第二份结果。
    // Bug #147: BullMQ attempts=3 配置会让 worker 对同一 essay 重新执行该事务，
    // 每次 retry 都会在 corrections 表里新增一行，但旧的 correction 行不会被清理，
    // 累积成孤儿。改为：事务首步删除同 essayId 的旧 correction（如果有），再插入新行。
    await db.transaction(async (tx) => {
      await tx.delete(corrections).where(eq(corrections.essayId, essayId));

      await tx.insert(corrections).values({
        id: correctionId,
        essayId,
        topicAdherenceScore: result.topicAdherenceScore,
        contentScore: result.contentScore,
        languageScore: result.languageScore,
        structureScore: result.structureScore,
        presentationScore: result.presentationScore,
        totalScore: result.totalScore,
        scoreTier: result.scoreTier,
        errors: JSON.stringify(result.errors),
        errorStats: JSON.stringify(aggregateErrorStats(result.errors)),
        highlights: JSON.stringify(result.highlights),
        sentenceAnalysis: JSON.stringify([]),
        revisedEssay: result.revisedEssay,
        suggestions: JSON.stringify(result.suggestions),
        aiProvider: result.aiProvider,
        aiModel: result.aiModel,
        correctionTimeMs,
        stage: taskInput.stage ?? 'junior',
        seniorEssayType: taskInput.seniorEssayType ?? null,
        createdAt: now,
      });

      const updated = await tx
        .update(essays)
        .set({
          status: 'completed',
          totalScore: result.totalScore,
          scoreTier: result.scoreTier,
          correctionId,
          correctedAt: now,
          updatedAt: now,
        })
        .where(and(eq(essays.id, essayId), eq(essays.status, 'correcting')));

      if (updated.rowsAffected === 0) {
        throw new Error(`Essay ${essayId} was not in 'correcting' state, aborting`);
      }
    });

    correctionLogger.info(
      { totalScore: result.totalScore, scoreTier: result.scoreTier },
      'Essay corrected',
    );
  } catch (error) {
    // Record failure in circuit breaker
    aiProviderCircuitBreaker.recordFailure();

    correctionLogger.error({ err: error }, 'Essay correction failed');
    // Bug #218: 失败兜底更新前附加 status='correcting' 条件，避免覆盖"已被并发 worker
    // 标记为 completed / 再次重置为 pending"的状态；并 try/catch 自身防止"DB 不可用
    // 时连兜底都写不进"导致原始错误丢失。
    try {
      await db
        .update(essays)
        .set({ status: 'failed', updatedAt: new Date().toISOString() })
        .where(and(eq(essays.id, essayId), eq(essays.status, 'correcting')));
    } catch (rollbackErr) {
      correctionLogger.error(
        { err: rollbackErr },
        '[API processCorrection] failed to mark essay as failed',
      );
    }
    throw error;
  }
}

function aggregateErrorStats(errors: Array<{ type: string }>): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const error of errors) {
    stats[error.type] = (stats[error.type] ?? 0) + 1;
  }
  return stats;
}

function safeParseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function createMockCorrection(
  content: string,
  wordCount: number,
  task: EssayTaskInput,
): Awaited<ReturnType<typeof correctEssay>> {
  const length = content.length;
  let base = 10;

  if (length > 600) base = 13;
  else if (length > 400) base = 12;
  else if (length > 200) base = 10;
  else base = 7;

  // 使用任务的真实字数上下限（Bug #2 修复）
  const wordMin = task.wordLimitMin;
  const wordMax = task.wordLimitMax;
  let total = base;
  if (wordCount < wordMin) total = Math.min(total, 9.5);
  if (wordCount >= Math.max(100, wordMin) && wordCount <= wordMax) {
    total = Math.min(15, total + 0.5);
  }

  // 使用 SCORING_WEIGHTS 中定义的真实权重（Bug #1 修复）
  // topicAdherence: 2.0 / 15 = 0.1333
  // content:       5.0 / 15 = 0.3333
  // language:      4.0 / 15 = 0.2667
  // structure:     2.5 / 15 = 0.1667
  // presentation:  1.5 / 15 = 0.1
  const DIMENSION_MAX = {
    topicAdherence: 2.0,
    content: 5.0,
    language: 4.0,
    structure: 2.5,
    presentation: 1.5,
  } as const;
  const topicAdherenceScore =
    Math.round(Math.min(total * (2.0 / 15), DIMENSION_MAX.topicAdherence) * 10) / 10;
  const contentScore = Math.round(Math.min(total * (5.0 / 15), DIMENSION_MAX.content) * 10) / 10;
  const languageScore = Math.round(Math.min(total * (4.0 / 15), DIMENSION_MAX.language) * 10) / 10;
  const structureScore =
    Math.round(Math.min(total * (2.5 / 15), DIMENSION_MAX.structure) * 10) / 10;
  const presentationScore =
    Math.round(Math.min(total * (1.5 / 15), DIMENSION_MAX.presentation) * 10) / 10;

  const tier = getScoreTier(total);

  return {
    topicAdherenceScore,
    contentScore,
    languageScore,
    structureScore,
    presentationScore,
    totalScore: total,
    scoreTier: tier.tier,
    errors: [],
    highlights: [],
    revisedEssay: content,
    suggestions: [
      {
        priority: 'medium' as const,
        category: '系统提示',
        suggestion: 'AI Provider 未配置，当前为模拟评分。请配置 API Key 后启用真实批改。',
      },
    ],
    aiProvider: 'mock',
    aiModel: 'mock',
  };
}

async function main(): Promise<void> {
  if (!env.REDIS_URL) {
    workerLogger.error('REDIS_URL is required to run the worker');
    process.exit(1);
  }

  const resetCount = await resetStuckEssays();
  workerLogger.info({ resetCount }, 'Worker starting');

  // 启动时加载 AI 配置，并订阅配置变更频道实现热更新。
  await aiRouterManager.start(env.REDIS_URL);

  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  connection.on('error', (err) => {
    workerLogger.error({ err }, 'Redis connection error');
  });
  connection.on('close', () => {
    workerLogger.warn('Redis connection closed');
  });
  connection.on('end', async () => {
    workerLogger.error('Redis connection ended, shutting down worker');
    await shutdown('Redis end');
  });

  const worker = new Worker<CorrectionJobData>(
    CORRECTION_QUEUE,
    async (job) => {
      workerLogger.info(
        { essayId: job.data.essayId, attempt: job.attemptsMade + 1 },
        'Processing correction',
      );
      await processCorrection({ essayId: job.data.essayId });
    },
    { connection, concurrency: env.WORKER_CONCURRENCY },
  );

  worker.on('failed', (job, err) => {
    workerLogger.error({ essayId: job?.data.essayId, err }, 'Correction job failed');
  });

  worker.on('completed', (job) => {
    workerLogger.info({ essayId: job.data.essayId }, 'Correction job completed');
  });

  const healthServer = createServer(async (req, res) => {
    if (req.url === '/health') {
      let database: 'ok' | 'error' = 'ok';
      try {
        await db.query.users.findFirst({ columns: { id: true } });
      } catch (err) {
        workerLogger.error({ err }, 'Health check database failed');
        database = 'error';
      }

      let redis: 'ok' | 'error' = 'ok';
      try {
        await connection.ping();
      } catch (err) {
        workerLogger.error({ err }, 'Health check redis failed');
        redis = 'error';
      }

      const ok = worker.isRunning() && database === 'ok' && redis === 'ok';
      res.writeHead(ok ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: ok ? 'ok' : 'error',
          queue: CORRECTION_QUEUE,
          database,
          redis,
        }),
      );
      return;
    }
    res.writeHead(404);
    res.end();
  });

  healthServer.listen(env.WORKER_HEALTH_PORT, () => {
    workerLogger.info({ port: env.WORKER_HEALTH_PORT }, 'Worker health server listening');
  });

  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    workerLogger.info({ signal }, 'Shutting down worker');
    await worker.close();
    await aiRouterManager.stop();
    await new Promise<void>((resolve, reject) => {
      healthServer.close((err) => (err ? reject(err) : resolve()));
    });
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

// 仅当以 node dist/index.js 直接启动时才运行 worker，避免被 web 引入时误启动。
const isMainModule =
  typeof process !== 'undefined' &&
  process.argv.length > 1 &&
  fileURLToPath(import.meta.url) === fileURLToPath(pathToFileURL(process.argv[1]));

if (isMainModule) {
  main().catch((err) => {
    logger.error(err, 'Worker failed to start');
    process.exit(1);
  });
}
