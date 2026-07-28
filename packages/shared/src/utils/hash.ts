import { createHash } from 'node:crypto';

/**
 * Generate a content hash for essay caching
 * Uses SHA-256 for collision resistance
 */
export function generateContentHash(
  content: string,
  task: {
    title: string;
    requirements: string;
    keyPoints: string[];
    topicType: string;
  },
): string {
  const normalizedContent = content.trim().toLowerCase();
  const normalizedTask = JSON.stringify({
    title: task.title.trim().toLowerCase(),
    requirements: task.requirements.trim().toLowerCase(),
    keyPoints: task.keyPoints.map((k) => k.trim().toLowerCase()).sort(),
    topicType: task.topicType.toLowerCase(),
  });

  return createHash('sha256').update(`${normalizedContent}|||${normalizedTask}`).digest('hex');
}

/**
 * Generate a simplified hash for quick similarity checks
 * Uses word-level fingerprinting
 */
export function generateFingerprint(content: string): string {
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .sort();

  return createHash('md5').update(words.join(' ')).digest('hex');
}

/**
 * Calculate similarity between two essays (0-1)
 * Uses Jaccard similarity on word sets
 */
export function calculateSimilarity(content1: string, content2: string): number {
  const words1 = new Set(
    content1
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );

  const words2 = new Set(
    content2
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );

  if (words1.size === 0 && words2.size === 0) return 1;
  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}
