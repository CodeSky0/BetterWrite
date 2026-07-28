/**
 * Prompt compression utilities to reduce token usage
 */

/**
 * Remove redundant whitespace and normalize line breaks
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Compress essay content by removing excessive repetition
 * while preserving meaning
 */
export function compressEssay(essay: string): string {
  // Remove duplicate consecutive sentences (simple heuristic)
  const sentences = essay.split(/(?<=[.!?])\s+/);
  const compressed: string[] = [];
  let lastSentence = '';

  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase().trim();
    if (normalized !== lastSentence && normalized.length > 0) {
      compressed.push(sentence.trim());
      lastSentence = normalized;
    }
  }

  return compressed.join(' ');
}

/**
 * Generate a compressed prompt for AI calls
 * Focuses on key information while reducing token count
 */
export function compressPrompt(
  essay: string,
  task: {
    title: string;
    requirements: string;
    keyPoints: string[];
    topicType: string;
  },
): { compressedEssay: string; compressedTask: string } {
  const compressedEssay = compressEssay(essay);

  // Compress task requirements
  const compressedTask = {
    title: task.title,
    requirements:
      task.requirements.length > 200
        ? `${task.requirements.substring(0, 200)}...`
        : task.requirements,
    keyPoints: task.keyPoints.slice(0, 5), // Limit to top 5 key points
    topicType: task.topicType,
  };

  return {
    compressedEssay,
    compressedTask: JSON.stringify(compressedTask),
  };
}

/**
 * Estimate token count (rough approximation)
 * ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate potential savings from compression
 */
export function calculateCompressionSavings(
  original: string,
  compressed: string,
): {
  originalTokens: number;
  compressedTokens: number;
  savingsPercent: number;
} {
  const originalTokens = estimateTokens(original);
  const compressedTokens = estimateTokens(compressed);
  const savingsPercent =
    originalTokens > 0 ? ((originalTokens - compressedTokens) / originalTokens) * 100 : 0;

  return {
    originalTokens,
    compressedTokens,
    savingsPercent,
  };
}
