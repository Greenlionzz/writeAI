/**
 * Readability Analysis Engine
 * Calculates Flesch-Kincaid Grade Level, Flesch Reading Ease,
 * and identifies complex sentences, passive voice, and wordy phrases.
 */

export interface ReadabilityMetrics {
  totalWords: number;
  totalSentences: number;
  totalSyllables: number;
  totalCharacters: number;
  averageSentenceLength: number; // words per sentence
  averageSyllablesPerWord: number;
  fleschKincaidGrade: number; // e.g. 7.4
  fleschReadingEase: number; // 0 - 100
  readingEaseCategory: string;
  gradeLevelCategory: string;
  readingTimeMin: number;
  veryHardSentencesCount: number; // > 25 words
  hardSentencesCount: number; // 18-25 words
  passiveVoiceCount: number;
  wordyPhrasesCount: number;
}

export interface SimplificationSuggestion {
  original: string;
  simplified: string;
  explanation: string;
}

export interface SentenceAnalysis {
  index: number;
  text: string;
  wordCount: number;
  syllableCount: number;
  gradeLevel: number;
  complexity: 'normal' | 'hard' | 'very-hard';
  issues: {
    type: 'length' | 'passive' | 'wordy' | 'syllables';
    message: string;
    suggestion?: string;
  }[];
  simplificationSuggestions: SimplificationSuggestion[];
}

// Common wordy phrases to tighten prose
export const WORDY_PHRASES: Record<string, string> = {
  'in order to': 'to',
  'due to the fact that': 'because',
  'at the present time': 'now',
  'at this point in time': 'now',
  'in spite of the fact that': 'although',
  'for the purpose of': 'to',
  'in the event that': 'if',
  'with the exception of': 'except',
  'is able to': 'can',
  'are able to': 'can',
  'has the ability to': 'can',
  'have the ability to': 'can',
  'in close proximity to': 'near',
  'until such time as': 'until',
  'make an attempt to': 'try to',
  'made an attempt to': 'tried to',
  'take into consideration': 'consider',
  'give an indication of': 'indicate',
  'come to a conclusion': 'conclude',
  'by means of': 'by',
  'in a timely manner': 'promptly',
  'prior to': 'before',
  'subsequent to': 'after',
  'a large number of': 'many',
  'a small number of': 'few',
  'a majority of': 'most',
  'in the near future': 'soon',
  'it is interesting to note that': '',
  'as a matter of fact': 'in fact',
  'each and every': 'every',
  'first and foremost': 'first',
  'for all intents and purposes': 'effectively',
  'in view of the fact that': 'since',
  'with reference to': 'about',
  'with regard to': 'about',
  'in connection with': 'about',
  'the reason why is because': 'because',
  'reach an agreement': 'agree',
  'give consideration to': 'consider',
};

// Count syllables in an English word
export function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 0;
  if (clean.length <= 3) return 1;

  // Suffix rules
  let processed = clean
    .replace(/(?:[^laeiouy]|ed|es|e)$/, '')
    .replace(/^y/, '');

  if (!processed) return 1;

  const matches = processed.match(/[aeiouy]{1,2}/g);
  let count = matches ? matches.length : 1;

  // Corrections
  if (clean.endsWith('le') && clean.length > 2 && !/[aeiouy]/.test(clean[clean.length - 3])) {
    count++;
  }
  if (clean.endsWith('sm') || clean.endsWith('zm')) {
    count++;
  }

  return Math.max(1, count);
}

// Split prose into meaningful sentences
export function splitIntoSentences(text: string): string[] {
  if (!text || !text.trim()) return [];

  // Protect common honorifics and abbreviations
  const protectedText = text
    .replace(/Mr\./gi, 'Mr###')
    .replace(/Mrs\./gi, 'Mrs###')
    .replace(/Ms\./gi, 'Ms###')
    .replace(/Dr\./gi, 'Dr###')
    .replace(/Prof\./gi, 'Prof###')
    .replace(/St\./gi, 'St###')
    .replace(/Gen\./gi, 'Gen###')
    .replace(/Col\./gi, 'Col###')
    .replace(/e\.g\./gi, 'eg###')
    .replace(/i\.e\./gi, 'ie###')
    .replace(/vs\./gi, 'vs###')
    .replace(/etc\./gi, 'etc###');

  // Match sentences including quotes and exclamation/question marks
  const rawMatches = protectedText.match(/[^.!?\n]+(?:[.!?]+["'”]?|\n|$)/g) || [];

  return rawMatches
    .map((s) =>
      s
        .replace(/###/g, '.')
        .replace(/\n+/g, ' ')
        .trim()
    )
    .filter((s) => s.length > 0 && /[a-zA-Z0-9]/.test(s));
}

// Check for passive voice constructs (be + past participle)
const BE_VERBS = ['is', 'are', 'was', 'were', 'been', 'being', 'be'];
const IRREGULAR_PAST_PARTICIPLES = [
  'seen', 'taken', 'done', 'written', 'given', 'known', 'chosen', 'found',
  'brought', 'caught', 'built', 'drawn', 'broken', 'spoken', 'struck',
  'heard', 'felt', 'lost', 'made', 'taught', 'told', 'understood',
];

export function findPassiveVoice(sentence: string): string[] {
  const words = sentence.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  const found: string[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    const current = words[i];
    const next = words[i + 1];

    if (BE_VERBS.includes(current)) {
      if (next.endsWith('ed') || IRREGULAR_PAST_PARTICIPLES.includes(next)) {
        found.push(`${current} ${next}`);
      }
    }
  }

  return found;
}

// Generate automatic split suggestion for very long sentences
export function generateSplitSuggestion(sentence: string): string[] {
  // Try coordinating conjunctions (and, but, so, however, while, whereas)
  const conjunctionMatch = sentence.match(/(,\s*(?:and|but|however|while|whereas|although|because|yet|so)\s+)/i);
  if (conjunctionMatch && conjunctionMatch.index) {
    const splitIndex = conjunctionMatch.index;
    const part1 = sentence.slice(0, splitIndex).trim() + '.';
    const conj = conjunctionMatch[0].replace(/,\s*/, '').trim();
    let part2 = sentence.slice(splitIndex + conjunctionMatch[0].length).trim();
    part2 = part2.charAt(0).toUpperCase() + part2.slice(1);

    // If part 2 doesn't have a clear subject or starts abruptly
    if (['and', 'but', 'so', 'yet'].includes(conj.toLowerCase())) {
      return [part1, part2];
    }
    return [part1, `${conj.charAt(0).toUpperCase() + conj.slice(1)}, ${part2}`];
  }

  // Try semicolon
  if (sentence.includes(';')) {
    const parts = sentence.split(';').map((p) => p.trim());
    if (parts.length === 2) {
      return [
        parts[0] + '.',
        parts[1].charAt(0).toUpperCase() + parts[1].slice(1),
      ];
    }
  }

  // Try em-dash
  if (sentence.includes('—') || sentence.includes('--')) {
    const parts = sentence.split(/—|--/).map((p) => p.trim());
    if (parts.length === 2 && parts[0].length > 15 && parts[1].length > 15) {
      return [
        parts[0] + '.',
        parts[1].charAt(0).toUpperCase() + parts[1].slice(1),
      ];
    }
  }

  return [];
}

// Compute full readability metrics and sentence breakdown
export function analyzeReadability(text: string): {
  metrics: ReadabilityMetrics;
  sentences: SentenceAnalysis[];
} {
  const sentenceList = splitIntoSentences(text);
  const totalSentences = Math.max(1, sentenceList.length);

  let totalWords = 0;
  let totalSyllables = 0;
  let totalCharacters = 0;
  let veryHardSentencesCount = 0;
  let hardSentencesCount = 0;
  let passiveVoiceCount = 0;
  let wordyPhrasesCount = 0;

  const analyzedSentences: SentenceAnalysis[] = sentenceList.map((s, idx) => {
    const words = s
      .replace(/[^a-zA-Z0-9\s'-]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    const sWordCount = words.length;
    let sSyllableCount = 0;

    words.forEach((w) => {
      const syl = countSyllables(w);
      sSyllableCount += syl;
      totalCharacters += w.length;
    });

    totalWords += sWordCount;
    totalSyllables += sSyllableCount;

    // Sentence Flesch-Kincaid Grade Level
    const sAvgSyl = sWordCount > 0 ? sSyllableCount / sWordCount : 1;
    const sGrade = sWordCount > 0
      ? Math.max(1, 0.39 * sWordCount + 11.8 * sAvgSyl - 15.59)
      : 1;

    let complexity: SentenceAnalysis['complexity'] = 'normal';
    if (sWordCount > 25 || sGrade >= 13) {
      complexity = 'very-hard';
      veryHardSentencesCount++;
    } else if (sWordCount >= 18 || sGrade >= 10) {
      complexity = 'hard';
      hardSentencesCount++;
    }

    const issues: SentenceAnalysis['issues'] = [];
    const suggestions: SimplificationSuggestion[] = [];

    // Length issue
    if (sWordCount > 25) {
      issues.push({
        type: 'length',
        message: `Long sentence (${sWordCount} words). Hard for readers to hold in working memory.`,
      });

      const splitOption = generateSplitSuggestion(s);
      if (splitOption.length === 2) {
        suggestions.push({
          original: s,
          simplified: splitOption.join(' '),
          explanation: 'Split into two crisper, punchier sentences at natural clause boundary',
        });
      }
    } else if (sWordCount >= 18) {
      issues.push({
        type: 'length',
        message: `Moderately long sentence (${sWordCount} words). Consider trimming filler words.`,
      });
    }

    // Passive voice check
    const passiveMatches = findPassiveVoice(s);
    if (passiveMatches.length > 0) {
      passiveVoiceCount += passiveMatches.length;
      issues.push({
        type: 'passive',
        message: `Possible passive voice detected ("${passiveMatches.join(', ')}"). Use active verbs for narrative drive.`,
      });
    }

    // Wordy phrase check
    const lowerSentence = s.toLowerCase();
    for (const [wordy, clean] of Object.entries(WORDY_PHRASES)) {
      if (lowerSentence.includes(wordy)) {
        wordyPhrasesCount++;
        issues.push({
          type: 'wordy',
          message: `Wordy phrase: "${wordy}" can be tightened to "${clean || 'omitted'}".`,
          suggestion: clean,
        });

        // Generate simplified version by replacing phrase
        const regex = new RegExp(wordy, 'gi');
        const candidate = s.replace(regex, clean);
        if (candidate !== s) {
          suggestions.push({
            original: s,
            simplified: candidate,
            explanation: `Replace bloated phrase "${wordy}" with concise equivalent "${clean || '[omit]'}"`,
          });
        }
      }
    }

    return {
      index: idx,
      text: s,
      wordCount: sWordCount,
      syllableCount: sSyllableCount,
      gradeLevel: Number(sGrade.toFixed(1)),
      complexity,
      issues,
      simplificationSuggestions: suggestions,
    };
  });

  const avgSentenceLength = totalWords > 0 ? totalWords / totalSentences : 0;
  const avgSyllablesPerWord = totalWords > 0 ? totalSyllables / totalWords : 0;

  // Flesch-Kincaid Grade Level
  // Formula: 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  let fleschKincaidGrade =
    0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;
  fleschKincaidGrade = Math.max(1, Math.min(20, fleschKincaidGrade));

  // Flesch Reading Ease
  // Formula: 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  let fleschReadingEase =
    206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
  fleschReadingEase = Math.max(0, Math.min(100, fleschReadingEase));

  // Categorize Reading Ease
  let readingEaseCategory = 'Standard / Plain English';
  if (fleschReadingEase >= 90) readingEaseCategory = 'Very Easy (Comics & Children)';
  else if (fleschReadingEase >= 80) readingEaseCategory = 'Easy (Conversational Fiction)';
  else if (fleschReadingEase >= 70) readingEaseCategory = 'Fairly Easy (Bestselling Novels)';
  else if (fleschReadingEase >= 60) readingEaseCategory = 'Standard (Mainstream Fiction)';
  else if (fleschReadingEase >= 50) readingEaseCategory = 'Fairly Difficult (Literary Fiction)';
  else if (fleschReadingEase >= 30) readingEaseCategory = 'Difficult (Complex / Classical)';
  else readingEaseCategory = 'Very Confusing / Dense';

  // Categorize Grade Level
  let gradeLevelCategory = 'Grade 7-8: Popular Bestseller Target';
  if (fleschKincaidGrade < 5) gradeLevelCategory = 'Grade 4-5: Elementary / Middle Grade';
  else if (fleschKincaidGrade < 7) gradeLevelCategory = 'Grade 5-6: Young Adult / Fast-Paced';
  else if (fleschKincaidGrade <= 8.5) gradeLevelCategory = 'Grade 7-8: Popular Fiction Benchmark';
  else if (fleschKincaidGrade <= 10.5) gradeLevelCategory = 'Grade 9-10: General Fiction';
  else if (fleschKincaidGrade <= 12) gradeLevelCategory = 'Grade 11-12: Literary / Intricate';
  else gradeLevelCategory = 'College / Scholarly Prose';

  return {
    metrics: {
      totalWords,
      totalSentences,
      totalSyllables,
      totalCharacters,
      averageSentenceLength: Number(avgSentenceLength.toFixed(1)),
      averageSyllablesPerWord: Number(avgSyllablesPerWord.toFixed(2)),
      fleschKincaidGrade: Number(fleschKincaidGrade.toFixed(1)),
      fleschReadingEase: Number(fleschReadingEase.toFixed(1)),
      readingEaseCategory,
      gradeLevelCategory,
      readingTimeMin: Math.max(1, Math.ceil(totalWords / 220)),
      veryHardSentencesCount,
      hardSentencesCount,
      passiveVoiceCount,
      wordyPhrasesCount,
    },
    sentences: analyzedSentences,
  };
}
