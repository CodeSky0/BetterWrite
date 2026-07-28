/**
 * Local rule-based pre-filtering for obvious errors
 * This reduces AI API calls by catching simple issues locally
 */

export interface LocalError {
  type: string;
  original: string;
  corrected: string;
  explanation: string;
  position: { start: number; end: number };
}

/**
 * Common spelling corrections
 */
const SPELLING_CORRECTIONS: Record<string, string> = {
  teh: 'the',
  adn: 'and',
  thier: 'their',
  recieve: 'receive',
  occured: 'occurred',
  seperate: 'separate',
  definately: 'definitely',
  accomodate: 'accommodate',
  neccessary: 'necessary',
  untill: 'until',
  wich: 'which',
  throught: 'through',
  alot: 'a lot',
  couldnt: "couldn't",
  wouldnt: "wouldn't",
  shouldnt: "shouldn't",
  dont: "don't",
  doesnt: "doesn't",
  didnt: "didn't",
  wont: "won't",
  cant: "can't",
  im: "I'm",
  youre: "you're",
  theyre: "they're",
  its: "it's", // when used as possessive
};

/**
 * Common grammar patterns to detect
 */
const GRAMMAR_PATTERNS = [
  {
    pattern: /\ba\s+([aeiou])/gi,
    type: 'article',
    explanation: 'Use "an" before words starting with a vowel sound',
  },
  {
    pattern: /\bhe\b.*\bhimself\b/gi,
    type: 'pronoun',
    explanation: 'Reflexive pronoun mismatch - should be "he himself"',
  },
  {
    pattern: /\bshe\b.*\bherself\b/gi,
    type: 'pronoun',
    explanation: 'Reflexive pronoun mismatch - should be "she herself"',
  },
];

/**
 * Detect and correct obvious spelling errors
 */
export function detectSpellingErrors(text: string): LocalError[] {
  const errors: LocalError[] = [];
  const words = text.split(/(\s+)/);
  let position = 0;

  for (const word of words) {
    const trimmed = word.trim().toLowerCase();
    if (SPELLING_CORRECTIONS[trimmed]) {
      errors.push({
        type: 'spelling',
        original: word,
        corrected: SPELLING_CORRECTIONS[trimmed],
        explanation: `Correct spelling: "${SPELLING_CORRECTIONS[trimmed]}"`,
        position: { start: position, end: position + word.length },
      });
    }
    position += word.length;
  }

  return errors;
}

/**
 * Detect obvious grammar patterns
 */
export function detectGrammarErrors(text: string): LocalError[] {
  const errors: LocalError[] = [];

  for (const pattern of GRAMMAR_PATTERNS) {
    const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);

    let match: RegExpExecArray | null = regex.exec(text);
    while (match !== null) {
      errors.push({
        type: pattern.type,
        original: match[0],
        corrected: match[0], // Placeholder - actual correction would need more context
        explanation: pattern.explanation,
        position: { start: match.index, end: match.index + match[0].length },
      });
      match = regex.exec(text);
    }
  }

  return errors;
}

/**
 * Check word count limits
 */
export function checkWordCount(
  text: string,
  min: number,
  max: number,
): {
  withinLimits: boolean;
  wordCount: number;
  message?: string;
} {
  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  if (wordCount < min) {
    return {
      withinLimits: false,
      wordCount,
      message: `Essay is too short (${wordCount} words, minimum ${min} required)`,
    };
  }

  if (wordCount > max) {
    return {
      withinLimits: false,
      wordCount,
      message: `Essay is too long (${wordCount} words, maximum ${max} allowed)`,
    };
  }

  return {
    withinLimits: true,
    wordCount,
  };
}

/**
 * Run all local filters
 */
export function runLocalFilters(
  text: string,
  minWords: number,
  maxWords: number,
): {
  spellingErrors: LocalError[];
  grammarErrors: LocalError[];
  wordCountCheck: ReturnType<typeof checkWordCount>;
  hasObviousErrors: boolean;
} {
  const spellingErrors = detectSpellingErrors(text);
  const grammarErrors = detectGrammarErrors(text);
  const wordCountCheck = checkWordCount(text, minWords, maxWords);

  return {
    spellingErrors,
    grammarErrors,
    wordCountCheck,
    hasObviousErrors:
      spellingErrors.length > 0 || grammarErrors.length > 0 || !wordCountCheck.withinLimits,
  };
}
