# BetterWrite 新功能规划与实施路线图

> **版本**: v1.0  
> **创建日期**: 2026-08-01  
> **规划范围**: 写作教育平台（Web + 移动端 iBouncy）  
> **目标读者**: 产品、技术负责人与开发团队

---

## 1. 摘要

本规划基于对 BetterWrite 现有代码库的探索，围绕“提升学生写作体验、减轻教师批改负担、增强管理决策效率”三大目标，提出 **10 项新功能建议**。功能覆盖学生、教师、学校管理员、家长四类角色，兼顾 Web 端深度教学场景与移动端碎片化练习需求。

规划采用 **四阶段滚动实施**：先快速落地低复杂度、高用户价值的功能（P0/P1），再逐步推进需要新角色或重型 AI 能力的功能（P2/P3）。每项功能均给出实现复杂度、关键文件、依赖关系及对现有系统的影响评估。

---

## 2. 现状分析

### 2.1 技术架构

- **Monorepo**: pnpm workspace + Turborepo
- **Web**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + shadcn/ui
- **Mobile**: React Native 0.78 + Expo SDK 53
- **API**: Hono 框架，RESTful + Server Actions 混合
- **数据库**: Drizzle ORM + SQLite（生产目标 PostgreSQL）
- **AI**: Vercel AI SDK v5，多模型路由（DeepSeek / GPT-4o / Claude）
- **队列**: BullMQ 用于异步批改
- **状态管理**: Zustand + TanStack Query

### 2.2 已实现/已规划的核心能力

通过阅读 schema、routes 和页面文件，确认平台已具备以下基础：

| 模块 | 状态 | 关键文件 |
|------|------|----------|
| 用户与角色 | 已实现 | [packages/shared/src/constants/roles.ts](file:///c:/Users/xy122/Documents/trae_projects/BetterWrite/packages/shared/src/constants/roles.ts) |
| 作文任务与提交 | 已实现 | [packages/db/src/schema/essays.ts](file:///c:/Users/xy122/Documents/trae_projects/BetterWrite/packages/db/src/schema/essays.ts) |
| AI 批改（内容/语言/结构/卷面） | 已实现 | [packages/ai/src/correctors/index.ts](file:///c:/Users/xy122/Documents/trae_projects/BetterWrite/packages/ai/src/correctors/index.ts) |
| 教师复核 | 已实现 | [apps/web/src/lib/api/routes.ts](file:///c:/Users/xy122/Documents/trae_projects/BetterWrite/apps/web/src/lib/api/routes.ts) |
| 错题本 | 已实现 | [packages/db/src/schema/error-books.ts](file:///c:/Users/xy122/Documents/trae_projects/BetterWrite/packages/db/src/schema/error-books.ts) |
| 微技能练习 | 已设计 schema | [packages/db/src/schema/micro-skills.ts](file:///c:/Users/xy122/Documents/trae_projects/BetterWrite/packages/db/src/schema/micro-skills.ts) |
| 题库与自主练习 | 已设计 schema | [packages/db/src/schema/question-bank.ts](file:///c:/Users/xy122/Documents/trae_projects/BetterWrite/packages/db/src/schema/question-bank.ts) |
| 学习路径 | 已设计 schema | [packages/db/src/schema/learning-paths.ts](file:///c:/Users/xy122/Documents/trae_projects/BetterWrite/packages/db/src/schema/learning-paths.ts) |
| 周报 | 已设计 schema | [packages/db/src/schema/weekly-reports.ts](file:///c:/Users/xy122/Documents/trae_projects/BetterWrite/packages/db/src/schema/weekly-reports.ts) |
| 查重/AI 代写检测 | 已设计 schema | [packages/db/src/schema/similarity-checks.ts](file:///c:/Users/xy122/Documents/trae_projects/BetterWrite/packages/db/src/schema/similarity-checks.ts) |
| 课堂实时监控 | 已设计 schema | [packages/db/src/schema/writing-sessions.ts](file:///c:/Users/xy122/Documents/trae_projects/BetterWrite/packages/db/src/schema/writing-sessions.ts) |
| 教学资源库 | 已设计 schema | [packages/db/src/schema/teaching_resources.ts](file:///c:/Users/xy122/Documents/trae_projects/BetterWrite/packages/db/src/schema/teaching_resources.ts) |
| 设备 Token | 已设计 schema | [packages/db/src/schema/device-tokens.ts](file:///c:/Users/xy122/Documents/trae_projects/BetterWrite/packages/db/src/schema/device-tokens.ts) |
| 成就系统 | 已设计 schema | [packages/db/src/schema/achievements.ts](file:///c:/Users/xy122/Documents/trae_projects/BetterWrite/packages/db/src/schema/achievements.ts) |

### 2.3 关键发现

- 数据库层已为大量扩展功能预留 schema，但部分功能尚未在 API 和前端完整落地。
- Web 端功能远丰富于移动端；移动端目前以学生核心动线为主（写作文、看进度、错题、练习、AI 助手）。
- AI 批改与多模型路由是核心竞争优势，新功能应优先复用现有 AI 基础设施。
- 角色体系已有 `super_admin` / `school_admin` / `teacher` / `student`，**缺少家长角色**。

---

## 3. 功能建议（10 项）

### 优先级说明

- **P0**: 立即做，低复杂度、高价值、可快速验证
- **P1**: 短期做，中复杂度、对教学效果或体验有显著提升
- **P2**: 中期做，需要新增角色或较重交互
- **P3**: 长期做，技术难度大或依赖前置功能

---

### 3.1 P0 功能

#### F1. 每日写作挑战（Daily Writing Challenge）

**功能说明**: 每天向学生推送一个 5-15 分钟可完成的小写作任务（如写一段对话、改写句子、续写故事）。支持连续打卡（streak），与成就系统联动。

**价值**:
- 提升学生打开频率与写作习惯
- 为 AI 批改提供持续语料，优化个性化推荐
- 移动端碎片化场景友好

**复杂度**: 低-中（Low-Medium）

**涉及角色**: 学生（主要）、教师/管理员（数据看板）

**实施要点**:
- 新增 `daily_challenges` 表：日期、题目、学段、难度、参考答案
- 新增 `challenge_submissions` 表：学生提交、AI 评分、打卡记录
- Web/Mobile 增加每日挑战入口与打卡日历
- 与现有 `achievements` 表联动

**影响文件**:
- 新增: `packages/db/src/schema/daily-challenges.ts`
- 新增: `apps/web/src/app/student/daily-challenge/page.tsx`
- 新增: `apps/mobile/src/app/(student)/daily-challenge/index.tsx`
- 修改: `apps/web/src/lib/api/routes.ts`（添加 challenge 相关 endpoint）
- 修改: `packages/shared/src/constants/features.ts`

**对现有系统影响**: 小。主要新增表和页面，复用 AI 批改队列。

---

#### F2. 智能推送提醒（Smart Push Notifications）

**功能说明**: 基于任务截止时间、学习路径进度、错题巩固周期，向学生/教师发送定向提醒。移动端优先使用设备推送，Web 端使用浏览器通知或站内信。

**价值**:
- 减少任务逾期率
- 提高错题复习和微技能练习完成率
- 教师可及时收到待批改作文提醒

**复杂度**: 低（Low）

**涉及角色**: 学生、教师

**实施要点**:
- `device_tokens` 表已存在，补全 token 注册/刷新逻辑
- 新增 `notification_logs` 表记录发送历史
- 使用 BullMQ 定时任务扫描待提醒事件
- 移动端集成 Expo Notifications
- Web 端可选 Web Push（VAPID）或仅站内消息中心

**影响文件**:
- 新增: `apps/worker/src/jobs/notification-jobs.ts`
- 新增: `apps/web/src/components/notification-center.tsx`
- 新增: `apps/mobile/src/hooks/useNotifications.ts`
- 修改: `apps/web/src/lib/api/routes.ts`（注册 token、查询消息）

**对现有系统影响**: 小。主要为基础设施补齐，不影响核心写作流程。

---

### 3.2 P1 功能

#### F3. 同伴互评（Peer Review）

**功能说明**: 学生在教师设定规则下，匿名互评同班同学的作文。系统提供结构化评分维度（内容、语言、结构、卷面）和引导性问题，教师可复核互评结果。

**价值**:
- 培养学生的批判性思维与鉴赏能力
- 减轻教师单一批改压力
- 增加学生之间的学习互动

**复杂度**: 中（Medium）

**涉及角色**: 学生、教师

**实施要点**:
- 新增 `peer_reviews` 表：reviewerId、essayId、维度得分、评语、状态
- 互评分配算法：避免好友互评、保证覆盖率（如每篇作文 2-3 人评）
- 教师端可配置是否启用、评分权重、匿名开关
- 学生端增加“互评任务”列表和评阅界面
- 最终得分 = AI 分 × w1 + 教师分 × w2 + 互评分 × w3（可配置）

**影响文件**:
- 新增: `packages/db/src/schema/peer-reviews.ts`
- 新增: `apps/web/src/app/student/peer-review/page.tsx`
- 新增: `apps/web/src/app/teacher/peer-review/page.tsx`
- 修改: `apps/web/src/lib/api/routes.ts`（分配、提交、查询互评）
- 修改: `packages/shared/src/constants/roles.ts`（无需新增角色）

**对现有系统影响**: 中。会改变作文最终得分计算逻辑，需要教师端配置入口。

---

#### F4. 写作素材库（Writing Material Library）

**功能说明**: 按话题、文体、难度组织的常用表达库，包含高分句型、连接词、地道短语、开头结尾模板、论证素材。学生可在写作时一键插入收藏。

**价值**:
- 解决学生“无话可说、无从下笔”的痛点
- 与错题本、微技能形成互补
- 可直接提升作文语言维度得分

**复杂度**: 低-中（Low-Medium）

**涉及角色**: 学生、教师/管理员（维护素材）

**实施要点**:
- 新增 `writing_materials` 表：类型、标题、内容、话题、学段、标签
- 新增 `student_material_favorites` 表收藏关系
- Web 端写作编辑器右侧增加素材面板
- 移动端写作页增加可折叠素材浮层
- 教师/管理员后台支持 CRUD

**影响文件**:
- 新增: `packages/db/src/schema/writing-materials.ts`
- 新增: `apps/web/src/app/student/materials/page.tsx`
- 新增: `apps/web/src/components/student/material-panel.tsx`
- 新增: `apps/mobile/src/components/MaterialSheet.tsx`
- 修改: `apps/web/src/components/student/writing-editor.tsx`

**对现有系统影响**: 小。新增辅助功能，不改动核心流程。

---

#### F5. 范文精读与仿写（Model Essay Deep Study & Imitation）

**功能说明**: 将现有 `teaching_resources` 中的范文升级为结构化学习模块：分段解析（结构、亮点、可借鉴表达）、重点词汇/句型标注、仿写练习（替换主题词、改写段落）。

**价值**:
- 把“看范文”变成“学范文”，提升学习深度
- 与 AI 批改结合，可对比仿写前后差异
- 适合 Web 端深度学习场景

**复杂度**: 中（Medium）

**涉及角色**: 学生、教师

**实施要点**:
- 扩展 `teaching_resources` 表或新增 `model_essay_studies` 表
- AI 自动解析范文结构（段落功能、衔接词、亮点句）
- 学生端精读页面：原文 + 批注 + 仿写输入框
- 仿写提交后走现有 AI 批改流程
- 教师端可上传范文并查看班级仿写统计

**影响文件**:
- 新增: `packages/db/src/schema/model-essay-studies.ts`
- 新增: `apps/web/src/app/student/model-essays/[id]/page.tsx`
- 新增: `apps/web/src/app/teacher/model-essays/page.tsx`
- 修改: `packages/ai/src/prompts/`（增加范文解析 prompt）
- 修改: `apps/web/src/lib/api/routes.ts`

**对现有系统影响**: 中。会复用并扩展教学资源模块，增加 AI prompt 类型。

---

### 3.3 P2 功能

#### F6. 家长看板（Parent Dashboard）

**功能说明**: 为家长提供只读视图，查看孩子近两周写作提交数量、平均分、错题top类型、学习周报、待完成任务。支持通过学生学号/邀请码绑定。

**价值**:
- 增强家校协同，提高付费/使用粘性
- 让家长直观看到学习进步
- 可拓展为独立 H5/小程序入口

**复杂度**: 中（Medium）

**涉及角色**: 家长（新角色）、学生

**实施要点**:
- 新增 `parent_accounts` 与 `parent_student_bindings` 表
- 新增 `UserRole.PARENT` 角色（权限等级低于 student，只读）
- 数据聚合复用 `weekly_reports` 与 `essays` 已有查询
- 独立登录页与家长端路由组
- 移动端优先做 H5/小程序适配，APP 内可后续集成

**影响文件**:
- 新增: `packages/db/src/schema/parent-accounts.ts`
- 修改: `packages/shared/src/constants/roles.ts`
- 新增: `apps/web/src/app/parent/dashboard/page.tsx`
- 新增: `apps/web/src/app/parent/login/page.tsx`
- 修改: `apps/web/src/lib/api/routes.ts`（家长认证与数据查询）
- 修改: `apps/web/src/lib/auth.ts`

**对现有系统影响**: 中-大。新增角色需要全面检查权限中间件和数据访问控制。

---

#### F7. 写作竞赛与排行榜（Writing Competitions & Leaderboards）

**功能说明**: 教师/管理员发起班级或校级写作竞赛，设定题目、时间、评分规则。系统自动排名，支持按总分、进步幅度、书写质量等维度展示排行榜。

**价值**:
-  gamification 提升学生写作动力
- 促进班级/学校间良性竞争
- 为运营活动提供工具

**复杂度**: 中（Medium）

**涉及角色**: 学生、教师、学校管理员

**实施要点**:
- 新增 `writing_competitions` 与 `competition_submissions` 表
- 排行榜按不同维度预计算并缓存（Redis）
- 竞赛结束自动生成获奖名单与证书/徽章
- Web 端管理后台 + 学生端参赛页面
- 移动端可查看排行榜与提交作品

**影响文件**:
- 新增: `packages/db/src/schema/competitions.ts`
- 新增: `apps/web/src/app/teacher/competitions/page.tsx`
- 新增: `apps/web/src/app/student/competitions/page.tsx`
- 新增: `apps/mobile/src/app/(student)/competitions/index.tsx`
- 修改: `apps/web/src/lib/api/routes.ts`

**对现有系统影响**: 中。会新增大量查询和缓存逻辑，需要防止排行榜带来的性能热点。

---

#### F8. 智能选题推荐（Intelligent Topic Recommendation）

**功能说明**: 基于学生历史作文错题类型、薄弱微技能、本地考试趋势（`exam_history`），AI 推荐下一道最适合练习的作文题或微技能练习。

**价值**:
- 实现“千人千面”的练习路径
- 提高练习针对性和学习效率
- 与 `learning_paths` 形成闭环

**复杂度**: 中（Medium）

**涉及角色**: 学生、教师

**实施要点**:
- 复用 `learning_paths` 与 `micro_skill_progress` 已有数据
- 新增推荐引擎服务 `packages/ai/src/recommendation/`
- 推荐算法：规则 + AI（结合错题统计、能力雷达、考试趋势）
- 每次生成学习路径时调用推荐引擎
- A/B 测试不同推荐策略效果

**影响文件**:
- 新增: `packages/ai/src/recommendation/topic-recommender.ts`
- 修改: `packages/db/src/schema/learning-paths.ts`（扩展推荐字段）
- 修改: `apps/web/src/app/student/learning-path/page.tsx`
- 修改: `apps/mobile/src/app/(student)/progress/index.tsx`

**对现有系统影响**: 中。会改变学习路径生成逻辑，建议通过 feature flag 灰度。

---

### 3.4 P3 功能

#### F9. 实时 AI 写作教练（Real-time AI Writing Coach）

**功能说明**: 在学生写作过程中实时提供句子级建议：语法纠错、词汇升级、逻辑衔接、偏题预警。建议以非侵入式下划线/侧边提示呈现，学生可主动采纳或忽略。

**价值**:
- 把“写后批改”前移到“写中辅导”
- 显著降低最终作文错误率
- 技术壁垒高，产品差异化强

**复杂度**: 高（High）

**涉及角色**: 学生

**实施要点**:
- Web 端基于 Tiptap 编辑器实现实时 debounce 请求
- 移动端输入框实时请求需考虑性能和流量
- AI 服务：流式返回建议（SSE / WebSocket）
- 定义建议类型与编辑器标记协议
- 需要限流与缓存，避免高频请求压垮 AI 服务

**影响文件**:
- 新增: `packages/ai/src/coach/index.ts`
- 新增: `apps/web/src/components/student/realtime-coach.tsx`
- 新增: `apps/mobile/src/components/RealtimeCoach.tsx`
- 修改: `apps/web/src/components/student/writing-editor.tsx`
- 修改: `apps/web/src/lib/api/routes.ts`（新增流式 coach endpoint）

**对现有系统影响**: 大。会显著增加 AI 调用量和成本，需要严密的限流、缓存、降级策略。

---

#### F10. 移动端离线练习（Mobile Offline Practice）

**功能说明**: 允许学生在移动端下载题库和微技能练习包，在无网络环境下完成练习，联网后自动同步结果。优先支持选择题、填空题等轻量题型。

**价值**:
- 覆盖校园网络不稳定或通勤场景
- 提升移动端使用时长
- 与每日挑战、微技能形成协同

**复杂度**: 高（High）

**涉及角色**: 学生

**实施要点**:
- 移动端本地存储：WatermelonDB 或 AsyncStorage + SQLite
- 设计离线任务队列，联网后批量同步
- 冲突解决策略（如离线期间教师已更新题目）
- 离线练习结果需标记 `is_synced`，同步后触发 AI 批改/评分
- 需要下载管理 UI（选择学段、题型、数量）

**影响文件**:
- 新增: `apps/mobile/src/lib/offline/`（存储、队列、同步）
- 新增: `apps/mobile/src/app/(student)/offline/page.tsx`
- 修改: `apps/mobile/src/app/(student)/practice/index.tsx`
- 修改: `apps/web/src/lib/api/routes.ts`（批量同步 endpoint）

**对现有系统影响**: 大。会引入移动端本地数据库和同步机制，需要处理数据一致性问题。

---

## 4. 功能优先级排序

| 优先级 | 功能 | 价值 | 复杂度 | 建议启动阶段 |
|--------|------|------|--------|--------------|
| P0 | F2 智能推送提醒 | 高 | 低 | 第一阶段（0-2 周） |
| P0 | F1 每日写作挑战 | 高 | 低-中 | 第一阶段（0-4 周） |
| P1 | F4 写作素材库 | 高 | 低-中 | 第二阶段（2-6 周） |
| P1 | F3 同伴互评 | 高 | 中 | 第二阶段（4-8 周） |
| P1 | F5 范文精读与仿写 | 高 | 中 | 第二阶段（6-10 周） |
| P2 | F8 智能选题推荐 | 高 | 中 | 第三阶段（8-14 周） |
| P2 | F7 写作竞赛与排行榜 | 中-高 | 中 | 第三阶段（10-16 周） |
| P2 | F6 家长看板 | 中-高 | 中 | 第三阶段（12-18 周） |
| P3 | F9 实时 AI 写作教练 | 高 | 高 | 第四阶段（16-24 周） |
| P3 | F10 移动端离线练习 | 中 | 高 | 第四阶段（18-26 周） |

---

## 5. 开发阶段划分

### 第一阶段：体验增强与留存（第 1-4 周）

**目标**: 低成本快速提升学生打开频率和任务完成率。

- **F2 智能推送提醒**（1-2 周）
  - 完成设备 token 注册、Expo 推送、站内消息中心
  - 任务截止提醒 + 教师待批改提醒
- **F1 每日写作挑战**（2-4 周）
  - 每日题目表、打卡逻辑、AI 快速评分
  - Web + Mobile 双端入口

**交付物**:
- 学生端可见“每日挑战”入口
- 移动端可接收推送提醒
- 教师端看到任务逾期率下降

### 第二阶段：教学深度与互动（第 4-10 周）

**目标**: 提升写作学习深度，减轻教师负担。

- **F4 写作素材库**（第 4-6 周）
  - 素材 CRUD、收藏、写作面板集成
- **F3 同伴互评**（第 5-8 周）
  - 互评分配算法、匿名评阅、教师复核
- **F5 范文精读与仿写**（第 7-10 周）
  - AI 范文解析、仿写提交与批改

**交付物**:
- 学生写作时可引用素材
- 班级可开启互评任务
- 范文模块支持结构化解构

### 第三阶段：个性化与生态扩展（第 8-18 周）

**目标**: 实现个性化推荐，引入家长和竞赛生态。

- **F8 智能选题推荐**（第 8-14 周）
  - 推荐引擎、学习路径升级、A/B 测试
- **F7 写作竞赛与排行榜**（第 10-16 周）
  - 竞赛创建、排行榜、获奖机制
- **F6 家长看板**（第 12-18 周）
  - 家长角色、绑定关系、只读数据看板

**交付物**:
- 学习路径自动推荐题目
- 可发起班级/校级竞赛
- 家长可查看孩子学习数据

### 第四阶段：技术壁垒与移动深化（第 16-26 周）

**目标**: 构建技术护城河，强化移动端体验。

- **F9 实时 AI 写作教练**（第 16-24 周）
  - 流式建议、编辑器集成、限流降级
- **F10 移动端离线练习**（第 18-26 周）
  - 本地存储、同步机制、离线任务队列

**交付物**:
- 写作过程中实时获得 AI 建议
- 移动端支持离线练习与同步

---

## 6. 预估开发时间

下表按“1 个全栈开发者 + 1 个前端/移动端开发者”的保守产能估算，单位为“人周”。

| 功能 | 后端 | Web | Mobile | Worker/AI | 测试&联调 | 合计 |
|------|------|-----|--------|-----------|-----------|------|
| F1 每日写作挑战 | 1 | 1 | 1 | 0.5 | 0.5 | 4 |
| F2 智能推送提醒 | 1 | 0.5 | 1 | 0.5 | 0.5 | 3.5 |
| F3 同伴互评 | 2 | 1.5 | 1 | 0 | 1 | 5.5 |
| F4 写作素材库 | 1 | 1 | 0.5 | 0 | 0.5 | 3 |
| F5 范文精读与仿写 | 1.5 | 1.5 | 0.5 | 1 | 0.5 | 5 |
| F6 家长看板 | 2 | 1.5 | 1* | 0 | 1 | 5.5 |
| F7 写作竞赛与排行榜 | 2 | 1.5 | 1 | 0.5 | 1 | 6 |
| F8 智能选题推荐 | 1.5 | 1 | 0.5 | 1.5 | 0.5 | 5 |
| F9 实时 AI 写作教练 | 2 | 2 | 1.5 | 2 | 1.5 | 9 |
| F10 移动端离线练习 | 1.5 | 0 | 3 | 0.5 | 1 | 6 |

> *注：家长看板的 Mobile 列表示 H5/小程序入口，非 APP 原生页面。*

**总计**: 约 52.5 人周（约 13 个月，按 2 人并行约 6-7 个月完成全部功能）。

---

## 7. 技术实现要点

### 7.1 通用架构原则

1. **复用现有基础设施**
   - 所有新功能优先复用 Hono API、`@betterwrite/db`、BullMQ、AI Router
   - 新增 schema 统一放在 `packages/db/src/schema/`，并在 `index.ts` 导出
   - 新常量统一放在 `packages/shared/src/constants/`

2. **权限与数据隔离**
   - 继续遵循 `assertClassAccess` / `assertStudentAccess` 模式
   - 新增家长角色后，所有查询需额外校验 `parent_student_bindings`
   - 排行榜、竞赛等跨学生数据功能需防止 IDOR

3. **移动端优先轻量化**
   - Mobile 端优先展示核心数据和操作，复杂配置交给 Web
   - 每日挑战、素材库、排行榜等适合移动端首屏
   - 互评、仿写、范文精读等深度学习场景优先在 Web 完成

4. **AI 调用成本控制**
   - 实时写作教练必须 debounce + 缓存 + 限流
   - 推荐引擎可离线批量计算，避免每次请求都调 AI
   - 继续使用 `api_call_logs` 监控 token 消耗

### 7.2 数据库变更规范

- 每新增一个功能模块，至少包含：
  - schema 定义文件
  - 索引设计（按查询场景）
  - Drizzle 迁移脚本
- JSON 字段用于存储可变结构（如推荐列表、排行榜快照），核心关系字段必须建表

### 7.3 API 设计规范

- 遵循现有 `[API /xxx]` 日志前缀
- 新 endpoint 必须加 `authMiddleware` 和必要 `requireRole`
- 列表接口统一使用 `parsePositiveInt` 处理分页
- 新增 endpoint 需在 Scalar OpenAPI 文档中可见

### 7.4 前端实现规范

- Web: 使用 shadcn/ui + Tailwind，新增页面放在对应角色路由组
- Mobile: 使用 Expo Router，组件保持与 Web 设计 Token 一致
- 共享类型通过 `@betterwrite/shared` 引用

---

## 8. 对现有系统的影响评估

### 8.1 正面影响

| 维度 | 影响 |
|------|------|
| 用户体验 | 每日挑战、推送提醒、素材库直接降低使用门槛，提升活跃度 |
| 教学效果 | 同伴互评、范文精读、智能推荐形成“学-练-评-改”闭环 |
| 运营效率 | 家长看板增强付费转化；竞赛提供运营抓手 |
| 数据资产 | 推荐引擎、实时教练产生更多学习行为数据，反哺 AI 模型 |

### 8.2 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 实时教练导致 AI 成本激增 | 高 | 强限流、本地缓存相似请求、非高峰时段降级 |
| 家长角色引入数据泄露 | 高 | 严格绑定验证、只读权限、审计日志 |
| 排行榜/竞赛引发刷榜 | 中 | 查重检测 + 教师复核 + 异常行为监控 |
| 离线同步数据冲突 | 中 | 乐观锁 + 最后写入 wins + 冲突提示 |
| 互评质量不可控 | 中 | 结构化评分引导 + 教师抽检 + 互评信誉分 |
| 功能过多导致维护复杂 | 中 | 按阶段灰度发布，使用 feature flag |

### 8.3 需要升级的基础设施

- **Redis**: 排行榜缓存、实时教练请求限流、推送任务队列
- **AI 配额**: 实时教练、范文解析、智能推荐会显著增加调用量
- **移动端构建**: Expo 推送、离线存储需额外原生模块配置

---

## 9. 验证与验收标准

### 9.1 通用验收标准

- 所有新增功能通过 `pnpm -r build`、`pnpm -r typecheck`、`pnpm -r lint`
- 新增 API endpoint 有对应单元测试或 E2E 测试
- 数据库迁移可正常执行并回滚
- Web + Mobile 双端核心链路可用

### 9.2 各功能验收标准

| 功能 | 验收标准 |
|------|----------|
| F1 每日挑战 | 每日 0 点自动刷新题目；学生提交后 10 秒内返回 AI 评分；连续打卡 7 天解锁成就 |
| F2 推送提醒 | 任务截止前 24h/1h 分别触发推送；教师收到待批改提醒；消息中心可查看历史 |
| F3 同伴互评 | 教师开启后系统自动分配；学生完成 3 篇以上互评才能查看自己互评分；匿名开关生效 |
| F4 素材库 | 写作时 2 步内插入素材；收藏素材在“我的收藏”中可查看；管理员可 CRUD |
| F5 范文精读 | AI 解析出 ≥3 个结构标签；仿写提交后生成批改报告；班级完成率 ≥60% |
| F6 家长看板 | 家长绑定后只能看到自己孩子数据；页面加载 < 2s；数据与周报一致 |
| F7 竞赛 | 创建竞赛后学生可报名/提交；排行榜实时更新；结束后生成获奖名单 |
| F8 智能推荐 | 推荐结果基于学生错题和能力雷达；A/B 测试显示练习完成率提升 ≥10% |
| F9 实时教练 | 输入停顿 1.5s 后给出建议；单篇作文 AI 调用次数 < 20 次；建议准确率 ≥80% |
| F10 离线练习 | 下载后断网可完成；联网后 30s 内同步；冲突时提示用户 |

---

## 10. 假设与决策

### 10.1 关键假设

1. **AI 调用预算可支撑 P3 功能**: F9 实时教练成本较高，建议在产品验证阶段先限制使用频次。
2. **移动端以 APP 为主**: 家长看板优先 H5/小程序，后续视数据决定是否做独立家长 APP。
3. **学校对家长数据共享接受度高**: F6 需要学校/家长授权，建议默认关闭，由学校管理员开启。
4. **现有 schema 可继续扩展**: 当前 SQLite 开发环境支持新增表，生产 PostgreSQL 迁移需额外验证。
5. **团队保持当前技术栈**: 不引入新的状态管理或 UI 框架，延续 Zustand + TanStack Query + shadcn/ui。

### 10.2 已做出的决策

- **先做 F1/F2，再做 F3/F4/F5**: 快速验证留存提升，再投入教学深度功能。
- **家长角色不写入现有学生/教师权限路径**: 单独建立家长绑定关系，避免污染核心角色体系。
- **排行榜使用 Redis 缓存 + 定时更新**: 避免每次请求都实时计算排名。
- **实时教练先 Web 后 Mobile**: Web 编辑器更适合流式交互，移动端后续迭代。
- **离线练习仅支持轻量题型**: 避免作文等长文本离线同步的复杂性。

---

## 11. 下一步行动

1. **产品评审**: 确认 10 项功能的优先级与第一阶段范围。
2. **技术评审**: 评估 AI 成本、Redis 容量、移动端离线方案选型。
3. **设计输出**: 为 F1/F2 输出 PRD 和 UI 稿。
4. **任务拆分**: 将第一阶段功能拆分为可执行的开发任务，进入迭代。

---

*本规划基于 2026-08-01 的代码库状态生成，后续实施时需根据实际业务反馈调整优先级。*
