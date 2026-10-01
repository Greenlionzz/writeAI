import React, { useState, useMemo } from 'react';
import {
  X,
  Gauge,
  Sparkles,
  Check,
  ArrowRight,
  Split,
  Scissors,
  AlertTriangle,
  Info,
  Clock,
  BookOpen,
  Filter,
  RefreshCw,
  Sliders,
  ChevronDown,
  Layers,
  Wand2,
  Copy,
  Lightbulb,
} from 'lucide-react';
import { Scene, UserSettings } from '../types/writing';
import {
  analyzeReadability,
  SentenceAnalysis,
  SimplificationSuggestion,
} from '../utils/readability';

interface ReadabilityInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene | null;
  onApplySentenceReplacement: (
    originalText: string,
    replacementText: string
  ) => void;
  settings: UserSettings;
}

type FilterType = 'all-flagged' | 'very-hard' | 'hard' | 'wordy' | 'passive' | 'all';

interface AISimplificationResult {
  punchy: string;
  fluid: string;
  split: string;
  explanation: string;
}

export const ReadabilityInspectorModal: React.FC<
  ReadabilityInspectorModalProps
> = ({ isOpen, onClose, scene, onApplySentenceReplacement, settings }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all-flagged');
  const [aiLoadingSentenceIndex, setAiLoadingSentenceIndex] = useState<number | null>(null);
  const [aiResults, setAiResults] = useState<Record<number, AISimplificationResult>>({});
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  const sceneContent = scene?.content || '';

  // Analyze readability reactively
  const { metrics, sentences } = useMemo(() => {
    return analyzeReadability(sceneContent);
  }, [sceneContent]);

  // Filter sentences based on active tab
  const filteredSentences = useMemo(() => {
    switch (activeFilter) {
      case 'very-hard':
        return sentences.filter((s) => s.complexity === 'very-hard');
      case 'hard':
        return sentences.filter((s) => s.complexity === 'hard');
      case 'wordy':
        return sentences.filter((s) =>
          s.issues.some((i) => i.type === 'wordy')
        );
      case 'passive':
        return sentences.filter((s) =>
          s.issues.some((i) => i.type === 'passive')
        );
      case 'all':
        return sentences;
      case 'all-flagged':
      default:
        return sentences.filter(
          (s) => s.complexity !== 'normal' || s.issues.length > 0
        );
    }
  }, [sentences, activeFilter]);

  const handleApplyReplacement = (
    originalText: string,
    replacementText: string
  ) => {
    onApplySentenceReplacement(originalText, replacementText);
    setAppliedNotification('Sentence updated in manuscript!');
    setTimeout(() => setAppliedNotification(null), 2500);
  };

  const handleRequestAISimplification = async (sentence: SentenceAnalysis) => {
    setAiLoadingSentenceIndex(sentence.index);

    try {
      const res = await fetch('/api/ai/simplify-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: settings.apiKey,
          model: settings.selectedModel,
          sentence: sentence.text,
          context: sceneContent,
          tone: 'Immersive Bestselling Fiction',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiResults((prev) => ({
          ...prev,
          [sentence.index]: {
            punchy: data.punchy,
            fluid: data.fluid,
            split: data.split,
            explanation: data.explanation,
          },
        }));
      }
    } catch (err) {
      console.error('Failed to simplify sentence with AI:', err);
    } finally {
      setAiLoadingSentenceIndex(null);
    }
  };

  if (!isOpen) return null;

  // Grade color helper
  const getGradeBadgeColor = (grade: number) => {
    if (grade <= 8.5) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (grade <= 11) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    if (grade <= 13) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  // Reading ease progress color
  const getReadingEaseColor = (score: number) => {
    if (score >= 70) return 'from-emerald-500 to-teal-500';
    if (score >= 60) return 'from-blue-500 to-indigo-500';
    if (score >= 50) return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-red-600';
  };

  const totalFlaggedCount = sentences.filter(
    (s) => s.complexity !== 'normal' || s.issues.length > 0
  ).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 selection:bg-primary/20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground tracking-tight">
                  Prose Readability & Sentence Simplifier
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getGradeBadgeColor(
                    metrics.fleschKincaidGrade
                  )}`}
                >
                  Grade {metrics.fleschKincaidGrade}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Flesch-Kincaid complexity metrics and intelligent simplification suggestions for "{scene?.title || 'Current Scene'}"
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Applied notification pill */}
        {appliedNotification && (
          <div className="bg-emerald-500 text-white text-xs px-4 py-2 font-medium flex items-center justify-center gap-2 shadow-xs shrink-0 animate-in fade-in slide-in-from-top-2">
            <Check className="w-3.5 h-3.5" />
            <span>{appliedNotification}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Flesch-Kincaid Grade Level */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Flesch-Kincaid Level
                </span>
                <span className="text-[10px] text-muted-foreground">Target: 7-8</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                  {metrics.fleschKincaidGrade}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Grade Level
                </span>
              </div>

              <div className="text-[11px] text-muted-foreground leading-snug">
                {metrics.gradeLevelCategory}
              </div>

              {/* Author Benchmarks bar */}
              <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground/90 space-y-1">
                <div className="flex justify-between">
                  <span>Hemingway (4-6)</span>
                  <span>King (7-8)</span>
                  <span>Tolkien (9+)</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (metrics.fleschKincaidGrade / 14) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Flesch Reading Ease */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Reading Ease
                </span>
                <span className="text-[10px] text-muted-foreground">0 - 100</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                  {metrics.fleschReadingEase}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  / 100
                </span>
              </div>

              <div className="text-[11px] text-muted-foreground leading-snug">
                {metrics.readingEaseCategory}
              </div>

              {/* Score bar */}
              <div className="pt-2 border-t border-border/50">
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getReadingEaseColor(
                      metrics.fleschReadingEase
                    )} rounded-full transition-all duration-300`}
                    style={{ width: `${metrics.fleschReadingEase}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Sentence Cadence & Stats */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Sentence Rhythm
                </span>
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {metrics.averageSentenceLength}
                </span>
                <span className="text-xs text-muted-foreground">
                  words / sentence
                </span>
              </div>

              <div className="text-[11px] text-muted-foreground">
                {metrics.averageSyllablesPerWord} syllables/word · ~{metrics.readingTimeMin} min read
              </div>

              <div className="pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between">
                <span>Total Words: {metrics.totalWords.toLocaleString()}</span>
                <span>Sentences: {metrics.totalSentences}</span>
              </div>
            </div>

            {/* Card 4: Complexity Flags Summary */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Simplification Flags
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {totalFlaggedCount}
                </span>
                <span className="text-xs text-muted-foreground">
                  flagged sentences
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>{metrics.veryHardSentencesCount} Very Hard</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>{metrics.hardSentencesCount} Hard</span>
                </div>
                <div className="flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>{metrics.wordyPhrasesCount} Wordy</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-500 dark:text-purple-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span>{metrics.passiveVoiceCount} Passive</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Pills Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <button
                onClick={() => setActiveFilter('all-flagged')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === 'all-flagged'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                All Flagged ({totalFlaggedCount})
              </button>

              <button
                onClick={() => setActiveFilter('very-hard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'very-hard'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Very Hard ({metrics.veryHardSentencesCount})</span>
              </button>

              <button
                onClick={() => setActiveFilter('hard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'hard'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Hard ({metrics.hardSentencesCount})</span>
              </button>

              <button
                onClick={() => setActiveFilter('wordy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'wordy'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Wordy ({metrics.wordyPhrasesCount})</span>
              </button>

              <button
                onClick={() => setActiveFilter('passive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'passive'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Passive ({metrics.passiveVoiceCount})</span>
              </button>

              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                All Sentences ({sentences.length})
              </button>
            </div>

            <div className="text-[11px] text-muted-foreground">
              Showing {filteredSentences.length} of {sentences.length} sentences
            </div>
          </div>

          {/* Sentence Simplification Cards List */}
          <div className="space-y-4">
            {filteredSentences.length === 0 ? (
              <div className="p-8 text-center bg-muted/20 border border-border/60 rounded-xl space-y-2">
                <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                <h3 className="text-sm font-bold text-foreground">
                  No flagged sentences in this category!
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Your prose flows with consistent rhythm and accessible readability in this section.
                </p>
              </div>
            ) : (
              filteredSentences.map((sentence) => {
                const aiResult = aiResults[sentence.index];
                const isAiLoading = aiLoadingSentenceIndex === sentence.index;

                return (
                  <div
                    key={sentence.index}
                    className={`p-4 rounded-xl border transition-all space-y-3 bg-card ${
                      sentence.complexity === 'very-hard'
                        ? 'border-rose-500/30 hover:border-rose-500/60 shadow-xs'
                        : sentence.complexity === 'hard'
                        ? 'border-amber-500/30 hover:border-amber-500/60 shadow-xs'
                        : 'border-border/70 hover:border-border'
                    }`}
                  >
                    {/* Top Sentence Meta Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-muted-foreground">
                          #{sentence.index + 1}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            sentence.complexity === 'very-hard'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : sentence.complexity === 'hard'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {sentence.complexity === 'very-hard'
                            ? 'Very Complex'
                            : sentence.complexity === 'hard'
                            ? 'Moderately Long'
                            : 'Standard'}
                        </span>

                        <span className="font-mono text-[11px] text-muted-foreground">
                          {sentence.wordCount} words · Grade {sentence.gradeLevel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Issues badges */}
                        {sentence.issues.map((issue, iIdx) => (
                          <span
                            key={iIdx}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-foreground/80 border border-border/50"
                          >
                            {issue.type === 'length'
                              ? 'Length'
                              : issue.type === 'passive'
                              ? 'Passive Voice'
                              : issue.type === 'wordy'
                              ? 'Wordy Phrase'
                              : 'Syllables'}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Original Sentence Text */}
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-xs text-foreground font-serif leading-relaxed select-text">
                      "{sentence.text}"
                    </div>

                    {/* Issue Explanations */}
                    {sentence.issues.length > 0 && (
                      <div className="space-y-1">
                        {sentence.issues.map((issue, iIdx) => (
                          <div
                            key={iIdx}
                            className="text-[11px] text-muted-foreground flex items-start gap-1.5"
                          >
                            <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span>{issue.message}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Instant Rule-Based Simplification Suggestions */}
                    {sentence.simplificationSuggestions.length > 0 && (
                      <div className="space-y-2 pt-1 border-t border-border/50">
                        <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5 text-primary" />
                          <span>Direct Rule-Based Simplification:</span>
                        </div>

                        {sentence.simplificationSuggestions.map((sug, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2"
                          >
                            <p className="text-xs text-foreground font-serif italic">
                              "{sug.simplified}"
                            </p>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-muted-foreground">
                                {sug.explanation}
                              </span>
                              <button
                                onClick={() =>
                                  handleApplyReplacement(
                                    sentence.text,
                                    sug.simplified
                                  )
                                }
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-2xs text-[11px]"
                              >
                                <Check className="w-3 h-3" />
                                <span>Apply to Scene</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Smart Simplifications */}
                    <div className="pt-2 border-t border-border/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          <span>AI Context-Aware Simplification:</span>
                        </span>

                        <button
                          onClick={() =>
                            handleRequestAISimplification(sentence)
                          }
                          disabled={isAiLoading}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-2xs transition-all disabled:opacity-50"
                        >
                          {isAiLoading ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Analyzing with Gemini...</span>
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-3 h-3" />
                              <span>Simplify with AI</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Display AI Results if generated */}
                      {aiResult && (
                        <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
                          {aiResult.explanation && (
                            <p className="text-[11px] text-muted-foreground italic">
                              💡 Editor's Note: {aiResult.explanation}
                            </p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            {/* Option 1: Punchy */}
                            <div className="p-2.5 rounded-lg bg-card border border-border/80 flex flex-col justify-between space-y-2 hover:border-primary/40 transition-colors">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                                  Punchy & Direct
                                </span>
                                <p className="text-xs text-foreground font-serif mt-1">
                                  "{aiResult.punchy}"
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  handleApplyReplacement(
                                    sentence.text,
                                    aiResult.punchy
                                  )
                                }
                                className="w-full py-1 px-2 rounded bg-muted hover:bg-primary hover:text-primary-foreground text-foreground text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Apply Punchy</span>
                              </button>
                            </div>

                            {/* Option 2: Fluid */}
                            <div className="p-2.5 rounded-lg bg-card border border-border/80 flex flex-col justify-between space-y-2 hover:border-primary/40 transition-colors">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                                  Fluid & Lyrical
                                </span>
                                <p className="text-xs text-foreground font-serif mt-1">
                                  "{aiResult.fluid}"
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  handleApplyReplacement(
                                    sentence.text,
                                    aiResult.fluid
                                  )
                                }
                                className="w-full py-1 px-2 rounded bg-muted hover:bg-primary hover:text-primary-foreground text-foreground text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Apply Fluid</span>
                              </button>
                            </div>

                            {/* Option 3: Split */}
                            <div className="p-2.5 rounded-lg bg-card border border-border/80 flex flex-col justify-between space-y-2 hover:border-primary/40 transition-colors">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                                  Split in Two
                                </span>
                                <p className="text-xs text-foreground font-serif mt-1">
                                  "{aiResult.split}"
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  handleApplyReplacement(
                                    sentence.text,
                                    aiResult.split
                                  )
                                }
                                className="w-full py-1 px-2 rounded bg-muted hover:bg-primary hover:text-primary-foreground text-foreground text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Apply Split</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-border/80 bg-muted/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>
              Pro tip: Aiming for Grade 7-8 maximizes narrative drive and reader immersion in fiction.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
