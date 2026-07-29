export function scorerPrompt(input: {
  topicAdherenceResult: { topicAdherenceScore: number; issues: unknown[] };
  contentResult: { contentScore: number; pointCoverage: unknown[] };
  languageResult: { languageScore: number; errors: unknown[] };
  structureResult: { structureScore: number };
  wordCount: number;
  task: { wordLimitMin: number; wordLimitMax: number; stage?: string; seniorEssayType?: string };
}): string {
  const stage = input.task.stage ?? 'junior';

  if (stage === 'senior') {
    return seniorScorerPrompt(input);
  }
  return juniorScorerPrompt(input);
}

// ──────────────────────────────────────────────────────────────────────────────
// 初中（中考）综合评分 Prompt — 深圳中考 15 分制
// ──────────────────────────────────────────────────────────────────────────────

function juniorScorerPrompt(input: {
  topicAdherenceResult: { topicAdherenceScore: number; issues: unknown[] };
  contentResult: { contentScore: number; pointCoverage: unknown[] };
  languageResult: { languageScore: number; errors: unknown[] };
  structureResult: { structureScore: number };
  wordCount: number;
  task: { wordLimitMin: number; wordLimitMax: number };
}): string {
  return `你是一位深圳中考英语作文阅卷老师。请根据以下各维度分析结果，进行综合评分。

## 评分原则（定档制）
真实阅卷采用"先定档、后微调"：
1. 先通读全文，根据"内容要点是否齐全、语言是否基本正确、结构是否清晰"确定所属档次。
2. 再在各维度得分上微调，但维度分必须与档次一致：缺要点不能给第一档；语言错误过多不能给第一档；结构混乱不能给第一档。
3. 内容要点是入档门槛：漏写一个核心要点，内容分直接扣 1.5-2.0 分，并可能降一档。

## 深圳中考英语作文评分标准（15分制）
| 档次 | 分数 | 标准 |
|------|------|------|
| 第一档（优） | 15-13 | 要点齐全且展开充分，语言正确无误，行文流畅，结构清晰 |
| 第二档（良） | 12-10 | 要点较完整，语言有少量错误，意思较连贯，结构基本清晰 |
| 第三档（中） | 9-7 | 要点部分缺失或展开不足，有一些语言错误，连贯性一般 |
| 第四档（及格） | 6-4 | 要点缺失较多，语言错误较多，意思表达部分清楚 |
| 第五档（差） | 3-0 | 只能写出少量相关词，不能表达完整意思 |

## 各维度满分
- 审题扣题维度: 2.0 分（文体、格式、人称、时态）
- 内容维度: 5.0 分（要点覆盖、要点展开、切题度）
- 语言维度: 4.0 分（语法正确性、词汇丰富性、句式多样性）
- 结构维度: 2.5 分（段落结构、连接词、逻辑连贯）
- 卷面维度: 1.5 分（字数达标、格式规范；打字输入默认满分，OCR 按书写质量调整）

## 各维度分析结果
- 审题扣题得分: ${input.topicAdherenceResult.topicAdherenceScore}/2.0
- 内容得分: ${input.contentResult.contentScore}/5.0
- 语言得分: ${input.languageResult.languageScore}/4.0
- 结构得分: ${input.structureResult.structureScore}/2.5

## 要点覆盖情况
${JSON.stringify(input.contentResult.pointCoverage, null, 2)}

## 审题扣题问题
${JSON.stringify(input.topicAdherenceResult.issues, null, 2)}

## 语言错误
${JSON.stringify(input.languageResult.errors, null, 2)}

## 词数
当前词数: ${input.wordCount}
要求范围: ${input.task.wordLimitMin}-${input.task.wordLimitMax}词

## 扣分与定档规则
- 每遗漏一个核心要点：内容分扣 1.5-2.0 分，并可能导致降档
- 每个关键语法/时态/主谓一致错误：语言分扣 0.5-1.0 分
- 格式错误（如书信无称呼/结尾）：审题扣题或结构分扣 0.5-1.5 分
- 字数不足下限：最高只能进入第三档（≤9分）
- 字数在最佳区间且内容与审题良好：可在同档内上浮 0.5 分

## 输出步骤
1. 先给出整体档次判断及理由。
2. 再给出各维度得分（必须与档次一致）。
3. 最后给出总分（各维度分之和，允许 0.5 分微调）。

## 输出格式
{
  "totalScore": 13.5,
  "scoreTier": "1st",
  "tierLabel": "第一档（优）",
  "dimensionScores": {
    "topicAdherence": 1.5,
    "content": 4.5,
    "language": 3.5,
    "structure": 2.0,
    "presentation": 1.5
  },
  "suggestions": [
    { "priority": "high", "category": "内容", "suggestion": "补充遗漏的第二个要点，并给出具体例子" }
  ],
  "comment": "整体评语"
}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// 高中（高考）综合评分 Prompt — 全国卷 25 分制
// ──────────────────────────────────────────────────────────────────────────────

function seniorScorerPrompt(input: {
  topicAdherenceResult: { topicAdherenceScore: number; issues: unknown[] };
  contentResult: { contentScore: number; pointCoverage: unknown[] };
  languageResult: { languageScore: number; errors: unknown[] };
  structureResult: { structureScore: number };
  wordCount: number;
  task: { wordLimitMin: number; wordLimitMax: number; stage?: string; seniorEssayType?: string };
}): string {
  const essayType = input.task.seniorEssayType ?? 'applied_writing';

  if (essayType === 'continuation_writing') {
    return seniorContinuationScorerPrompt(input);
  }
  return seniorAppliedScorerPrompt(input);
}

// 高考应用文综合评分
function seniorAppliedScorerPrompt(input: {
  topicAdherenceResult: { topicAdherenceScore: number; issues: unknown[] };
  contentResult: { contentScore: number; pointCoverage: unknown[] };
  languageResult: { languageScore: number; errors: unknown[] };
  structureResult: { structureScore: number };
  wordCount: number;
  task: { wordLimitMin: number; wordLimitMax: number };
}): string {
  return `你是一位高考全国卷英语作文阅卷老师。请根据以下各维度分析结果，进行综合评分。

## 评分原则（定档制）
高考英语作文评分采用"先定档、后微调"原则：
1. 先根据文章的内容和语言初步确定所属档次。
2. 以该档次的要求来衡量，确定或调整档次。
3. 词数少于80或多于120的，从总分中减去2分。

## 高考全国卷英语作文评分标准（25分制）
| 档次 | 分数 | 标准 |
|------|------|------|
| 第五档（很好） | 21-25 | 完全完成试题规定的任务；覆盖所有内容要点；应用了较多的语法结构和词汇；语法结构或词汇方面有些许错误，但为尽力使用较复杂结构或较高级词汇所致；具备较强的语言运用能力；有效地使用了语句间的连接成分，使全文结构紧凑 |
| 第四档（好） | 16-20 | 完全完成了试题规定的任务；虽漏掉1、2个次重点，但覆盖所有主要内容；应用的语法结构和词汇能满足任务的要求；语法结构或词汇方面应用基本准确，些许错误主要是因尝试较复杂语法结构或词汇所致；应用简单的语句间的连接成分，使全文结构紧凑 |
| 第三档（适当） | 11-15 | 基本完成了试题规定的任务；虽漏掉一些内容，但覆盖所有主要内容；应用的语法结构和词汇能满足任务的要求；有一些语法结构或词汇方面的错误，但不影响理解；应用简单的语句间的连接成分，使全文内容连贯 |
| 第二档（较差） | 6-10 | 未恰当完成试题规定的任务；漏掉或未描述清楚一些主要内容，写了一些无关内容；语法结构单调、词汇项目有限；有一些语法结构或词汇方面的错误，影响了对写作内容的理解；较少使用语句间的连接成分，内容缺少连贯性 |
| 第一档（差） | 1-5 | 未完成试题规定的任务；明显遗漏主要内容，写了一些无关内容；语法结构单调、词汇项目有限；较多语法结构或词汇方面的错误，影响对写作内容的理解；缺乏语句间的连接成分，内容不连贯 |

## 各维度分析结果
- 审题扣题得分: ${input.topicAdherenceResult.topicAdherenceScore}/3.0
- 内容得分: ${input.contentResult.contentScore}/10.0
- 语言得分: ${input.languageResult.languageScore}/10.0
- 结构得分: ${input.structureResult.structureScore}/5.0

## 要点覆盖情况
${JSON.stringify(input.contentResult.pointCoverage, null, 2)}

## 审题扣题问题
${JSON.stringify(input.topicAdherenceResult.issues, null, 2)}

## 语言错误
${JSON.stringify(input.languageResult.errors, null, 2)}

## 词数
当前词数: ${input.wordCount}
要求范围: ${input.task.wordLimitMin}-${input.task.wordLimitMax}词

## 扣分与定档规则
- 遗漏主要内容要点：显著降档
- 语法结构单调、词汇有限：最高第三档
- 较多语法错误影响理解：第二档或以下
- 词数少于80或多于120：从总分中减去2分
- 有效使用连接成分使全文紧凑：可上浮

## 输出步骤
1. 先给出整体档次判断及理由。
2. 再给出各维度得分（必须与档次一致）。
3. 最后给出总分（各维度分之和，允许微调）。

## 输出格式
{
  "totalScore": 20.0,
  "scoreTier": "4th",
  "tierLabel": "第四档（好）",
  "dimensionScores": {
    "topicAdherence": 2.5,
    "content": 8.0,
    "language": 7.5,
    "structure": 4.0,
    "presentation": 1.5
  },
  "suggestions": [
    { "priority": "high", "category": "内容", "suggestion": "..." }
  ],
  "comment": "整体评语，对标高考全国卷评分标准"
}`;
}

// 高考读后续写综合评分
function seniorContinuationScorerPrompt(input: {
  topicAdherenceResult: { topicAdherenceScore: number; issues: unknown[] };
  contentResult: { contentScore: number; pointCoverage: unknown[] };
  languageResult: { languageScore: number; errors: unknown[] };
  structureResult: { structureScore: number };
  wordCount: number;
  task: { wordLimitMin: number; wordLimitMax: number };
}): string {
  return `你是一位高考全国卷英语作文阅卷老师。请根据以下各维度分析结果，对读后续写进行综合评分。

## 评分原则（定档制）
读后续写评分采用"先定档、后微调"原则，重点考察：
1. 与原文情境的融合度
2. 情节的合理性和创造性
3. 语言资源的丰富性和准确性
4. 上下文的连贯性

## 高考全国卷读后续写评分标准（25分制）
| 档次 | 分数 | 标准 |
|------|------|------|
| 第五档（很好） | 21-25 | 与原文情境融合度高，情节合理且有创造性，语言丰富，连贯性好 |
| 第四档（好） | 16-20 | 与原文情境融合度较高，情节较合理，语言较丰富，连贯性较好 |
| 第三档（适当） | 11-15 | 与原文情境基本融合，情节基本合理，语言基本连贯 |
| 第二档（较差） | 6-10 | 与原文情境融合度低，情节不够合理，语言单调，连贯性差 |
| 第一档（差） | 1-5 | 与原文情境脱节，情节不合理，语言错误多，影响理解 |

## 各维度分析结果
- 审题扣题得分: ${input.topicAdherenceResult.topicAdherenceScore}/3.0
- 内容得分: ${input.contentResult.contentScore}/10.0
- 语言得分: ${input.languageResult.languageScore}/10.0
- 结构得分: ${input.structureResult.structureScore}/5.0

## 要点覆盖情况
${JSON.stringify(input.contentResult.pointCoverage, null, 2)}

## 审题扣题问题
${JSON.stringify(input.topicAdherenceResult.issues, null, 2)}

## 语言错误
${JSON.stringify(input.languageResult.errors, null, 2)}

## 词数
当前词数: ${input.wordCount}
要求范围: ${input.task.wordLimitMin}-${input.task.wordLimitMax}词

## 读后续写特殊评分规则
- 与原文情境融合度高：可上浮至第五档
- 情节合理且有创造性：可上浮
- 语言风格与原文一致：加分项
- 词数少于120：从总分中减去2分
- 两段续写均完成：基本要求

## 输出步骤
1. 先给出整体档次判断及理由。
2. 再给出各维度得分（必须与档次一致）。
3. 最后给出总分。

## 输出格式
{
  "totalScore": 20.0,
  "scoreTier": "4th",
  "tierLabel": "第四档（好）",
  "dimensionScores": {
    "topicAdherence": 2.5,
    "content": 8.0,
    "language": 7.5,
    "structure": 4.0,
    "presentation": 1.5
  },
  "suggestions": [
    { "priority": "high", "category": "内容", "suggestion": "..." }
  ],
  "comment": "整体评语，对标高考全国卷读后续写标准"
}`;
}
