import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Minus,
  Search,
  Replace,
  History,
  MessageSquarePlus,
  Maximize2,
  Minimize2,
  Check,
  Sparkles,
  BookOpen,
  Layers,
  Keyboard,
  Gauge,
  Target,
  Trophy,
  Undo,
  Redo,
  Volume2,
  VolumeX,
  Zap,
  Flame,
  AlignVerticalJustifyCenter,
  X,
} from 'lucide-react';
import { Scene, UserSettings } from '../types/writing';
import { analyzeReadability } from '../utils/readability';
import { ReadabilityInspectorModal } from './ReadabilityInspectorModal';
import { SmartParagraphModal } from './SmartParagraphModal';
import { playTypewriterSound } from '../utils/typewriterAudio';
import { loadSettings, saveSettings } from '../utils/storage';

interface EditorWorkspaceProps {
  scene: Scene | null;
  chapterTitle?: string;
  bookTitle?: string;
  chapterTotalWords?: number;
  bookTotalWords?: number;
  todayWordsWritten?: number;
  dailyWordGoal?: number;
  onOpenSettings?: () => void;
  onUpdateContent: (content: string) => void;
  onSelectText: (selectedText: string) => void;
  onOpenVersionHistory: () => void;
  onAddCommentWithSnippet: (snippet: string) => void;
  onOpenKeyboardShortcuts?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  settings: UserSettings;
  splitReferenceOpen: boolean;
  showAIPanel: boolean;
  projectGenre?: string;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  scene,
  chapterTitle,
  bookTitle,
  chapterTotalWords = 0,
  bookTotalWords = 0,
  todayWordsWritten = 0,
  dailyWordGoal,
  onOpenSettings,
  onUpdateContent,
  onSelectText,
  onOpenVersionHistory,
  onAddCommentWithSnippet,
  onOpenKeyboardShortcuts,
  isFocusMode: propIsFocusMode,
  onToggleFocusMode,
  settings,
  splitReferenceOpen,
  showAIPanel,
  projectGenre = 'Fiction',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showReadabilityModal, setShowReadabilityModal] = useState(false);
  const [showSmartParagraphModal, setShowSmartParagraphModal] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [internalFocusMode, setInternalFocusMode] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isTypewriterMode, setIsTypewriterMode] = useState<boolean>(() => settings.typewriterMode ?? false);
  const [isTypewriterSound, setIsTypewriterSound] = useState<boolean>(() => settings.typewriterSoundEnabled ?? false);
  const [typewriterVolume, setTypewriterVolume] = useState<number>(() => settings.typewriterVolume ?? 0.35);
  const [showSoundPopover, setShowSoundPopover] = useState(false);
  const [showGoalTooltip, setShowGoalTooltip] = useState(false);

  // Floating selection quick formatting bar
  const [floatingSelection, setFloatingSelection] = useState<{
    text: string;
    wordCount: number;
  } | null>(null);

  // Custom Undo/Redo tracking states
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);

  // Flow State & Typing Sprint Tracking
  const [sessionInitialWords, setSessionInitialWords] = useState<number | null>(null);
  const [sessionWordsCount, setSessionWordsCount] = useState<number>(0);
  const [currentWpm, setCurrentWpm] = useState<number>(0);
  const [isFlowActive, setIsFlowActive] = useState<boolean>(false);
  const [milestoneCelebration, setMilestoneCelebration] = useState<string | null>(null);
  const keystrokesRef = useRef<number[]>([]);
  const flowTimerRef = useRef<any>(null);
  const lastMilestoneRef = useRef<number>(0);

  // Reset session words baseline on scene change
  useEffect(() => {
    if (scene && (sessionInitialWords === null || scene.id !== currentSceneId)) {
      setSessionInitialWords(scene.wordCount || 0);
      setSessionWordsCount(0);
      lastMilestoneRef.current = 0;
    }
  }, [scene?.id, currentSceneId]);

  // Track added words in session and trigger milestone celebrations
  useEffect(() => {
    if (sessionInitialWords !== null && scene) {
      const currentWords = scene.wordCount || 0;
      const added = Math.max(0, currentWords - sessionInitialWords);
      setSessionWordsCount(added);

      if (added >= 100 && Math.floor(added / 100) > Math.floor(lastMilestoneRef.current / 100)) {
        lastMilestoneRef.current = added;
        setMilestoneCelebration(`🎉 +${Math.floor(added / 100) * 100} words written in this session!`);
        if (isTypewriterSound) {
          playTypewriterSound('bell', typewriterVolume);
        }
        const timer = setTimeout(() => setMilestoneCelebration(null), 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [scene?.wordCount, sessionInitialWords, isTypewriterSound, typewriterVolume]);

  const recordKeystroke = () => {
    const now = Date.now();
    keystrokesRef.current.push(now);
    const cutoff = now - 30000;
    keystrokesRef.current = keystrokesRef.current.filter((t) => t > cutoff);

    const calculatedWpm = Math.round(keystrokesRef.current.length * 0.4);
    setCurrentWpm(calculatedWpm);

    if (calculatedWpm >= 20 && keystrokesRef.current.length >= 12) {
      setIsFlowActive(true);
    }

    if (flowTimerRef.current) clearTimeout(flowTimerRef.current);
    flowTimerRef.current = setTimeout(() => {
      setIsFlowActive(false);
      setCurrentWpm(0);
    }, 4000);
  };

  const centerCursorInViewport = () => {
    if (!isTypewriterMode || !textareaRef.current || !scrollContainerRef.current) return;
    const textarea = textareaRef.current;
    const container = scrollContainerRef.current;

    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
    const lineIndex = textBeforeCursor.split('\n').length;

    const lineHeightPx = settings.editorFontSize * 1.85;
    const cursorYInTextarea = lineIndex * lineHeightPx;

    const textareaRect = textarea.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const targetScrollTop =
      container.scrollTop +
      (textareaRect.top - containerRect.top) +
      cursorYInTextarea -
      containerRect.height / 2;

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth',
    });
  };

  const handleToggleTypewriterMode = () => {
    const next = !isTypewriterMode;
    setIsTypewriterMode(next);
    const curr = loadSettings();
    saveSettings({ ...curr, typewriterMode: next });
    if (next) {
      setTimeout(centerCursorInViewport, 60);
    }
  };

  const handleToggleSound = () => {
    const next = !isTypewriterSound;
    setIsTypewriterSound(next);
    const curr = loadSettings();
    saveSettings({ ...curr, typewriterSoundEnabled: next });
    if (next) {
      playTypewriterSound('key', typewriterVolume);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setTypewriterVolume(newVol);
    const curr = loadSettings();
    saveSettings({ ...curr, typewriterVolume: newVol });
    playTypewriterSound('key', newVol);
  };

  // Initialize/reset history when the scene changes
  useEffect(() => {
    if (scene) {
      if (scene.id !== currentSceneId) {
        // We switched scenes! Start fresh with the current content
        setHistory([scene.content || '']);
        setHistoryIndex(0);
        setCurrentSceneId(scene.id);
      } else {
        // Standard content change. Check if we need to record a history state.
        const currentHistText = history[historyIndex];
        if (scene.content !== currentHistText) {
          const newHistory = history.slice(0, historyIndex + 1);
          setHistory([...newHistory, scene.content || '']);
          setHistoryIndex(newHistory.length);
        }
      }
    } else {
      setHistory([]);
      setHistoryIndex(-1);
      setCurrentSceneId(null);
    }
  }, [scene?.id, scene?.content]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      onUpdateContent(history[nextIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      onUpdateContent(history[nextIndex]);
    }
  };

  const isFocusMode = propIsFocusMode !== undefined ? propIsFocusMode : internalFocusMode;
  const toggleFocusMode = onToggleFocusMode || (() => setInternalFocusMode((prev) => !prev));

  // Debounce expensive readability analysis to prevent main thread stutters while typing
  const [debouncedContent, setDebouncedContent] = useState(scene?.content || '');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedContent(scene?.content || '');
    }, 1000);
    return () => clearTimeout(handler);
  }, [scene?.content]);

  // Compute live readability analysis for current scene based on debounced content
  const readabilityAnalysis = useMemo(() => {
    return analyzeReadability(debouncedContent);
  }, [debouncedContent]);

  // Daily writing goal metrics based on settings and scene word count
  const dailyGoal = dailyWordGoal || settings.dailyWordGoal || 1000;
  const sceneWords = scene?.wordCount || 0;
  const wordsToday = todayWordsWritten || 0;
  const goalPercent = Math.min(100, Math.round((wordsToday / dailyGoal) * 100));
  const isGoalMet = wordsToday >= dailyGoal;
  const sceneGoalPercent = dailyGoal > 0 ? Math.round((sceneWords / dailyGoal) * 100) : 0;
  const progressRatio = Math.min(1, sceneWords / (dailyGoal || 1));
  const isGoalExceeded = sceneWords >= dailyGoal;
  const overflowWords = Math.max(0, sceneWords - dailyGoal);
  const remainingWords = Math.max(0, dailyGoal - sceneWords);
  const overflowPercent = Math.max(0, sceneGoalPercent - 100);

  // Apply sentence replacement directly to scene prose
  const handleApplySentenceReplacement = (
    originalText: string,
    replacementText: string
  ) => {
    if (!scene) return;
    const current = scene.content || '';
    if (current.includes(originalText)) {
      const updated = current.replace(originalText, replacementText);
      onUpdateContent(updated);
    }
  };

  // Keep track of text selection
  const handleSelectionChange = () => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd, value } = textareaRef.current;
    if (selectionStart !== selectionEnd) {
      const selected = value.substring(selectionStart, selectionEnd);
      onSelectText(selected);
    } else {
      onSelectText('');
    }
  };

  // Find occurrences
  useEffect(() => {
    if (!findText || !scene?.content) {
      setMatchCount(0);
      return;
    }
    try {
      const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = scene.content.match(regex);
      setMatchCount(matches ? matches.length : 0);
    } catch (e) {
      setMatchCount(0);
    }
  }, [findText, scene?.content]);

  const handleReplaceOne = () => {
    if (!findText || !scene || !textareaRef.current) return;
    const content = scene.content;
    const idx = content.toLowerCase().indexOf(findText.toLowerCase());
    if (idx !== -1) {
      const updated = content.slice(0, idx) + replaceText + content.slice(idx + findText.length);
      onUpdateContent(updated);
    }
  };

  const handleReplaceAll = () => {
    if (!findText || !scene) return;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const updated = scene.content.replace(regex, replaceText);
    onUpdateContent(updated);
  };

  // Quick formatting insert helpers
  const applyFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current || !scene) return;
    const { selectionStart, selectionEnd, value } = textareaRef.current;
    const selected = value.substring(selectionStart, selectionEnd);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent =
      value.substring(0, selectionStart) + replacement + value.substring(selectionEnd);
    onUpdateContent(newContent);

    // Reposition cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          selectionStart + prefix.length,
          selectionStart + prefix.length + (selected ? selected.length : 4)
        );
      }
    }, 0);
  };

  const insertParagraphBreak = () => {
    applyFormatting('\n\n* * *\n\n');
  };

  const handleCommentOnSelection = () => {
    if (!textareaRef.current || !scene) return;
    const { selectionStart, selectionEnd, value } = textareaRef.current;
    const selected = value.substring(selectionStart, selectionEnd);
    onAddCommentWithSnippet(selected || 'General scene comment');
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Esc key exits Focus Mode if active
    if (e.key === 'Escape' && isFocusMode) {
      e.preventDefault();
      toggleFocusMode();
      return;
    }

    const isMod = e.ctrlKey || e.metaKey;

    if (isMod) {
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        applyFormatting('**', '**');
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        applyFormatting('*', '*');
      } else if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        applyFormatting('<u>', '</u>');
      } else if (e.key.toLowerCase() === 'x' && e.shiftKey) {
        e.preventDefault();
        applyFormatting('~~', '~~');
      } else if (e.key.toLowerCase() === 'f' && !e.altKey) {
        // Ctrl+F / Cmd+F triggers Focus Mode
        e.preventDefault();
        toggleFocusMode();
      } else if (e.key.toLowerCase() === 'f' && e.altKey) {
        // Ctrl+Alt+F toggles Find & Replace
        e.preventDefault();
        setShowFindReplace((prev) => !prev);
      } else if (e.key.toLowerCase() === 'h' && e.shiftKey) {
        e.preventDefault();
        onOpenVersionHistory();
      } else if (e.key.toLowerCase() === 'c' && e.shiftKey) {
        e.preventDefault();
        handleCommentOnSelection();
      } else if (e.key === '/') {
        e.preventDefault();
        onOpenKeyboardShortcuts?.();
      } else if (e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          applyFormatting('# ');
        } else if (e.key === '2') {
          e.preventDefault();
          applyFormatting('## ');
        } else if (e.key === '3') {
          e.preventDefault();
          applyFormatting('### ');
        } else if (e.key.toLowerCase() === 'q') {
          e.preventDefault();
          applyFormatting('> ');
        } else if (e.key.toLowerCase() === 'l') {
          e.preventDefault();
          applyFormatting('- ');
        } else if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          applyFormatting('1. ');
        } else if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          insertParagraphBreak();
        }
      }
    }
  };

  // Compute metrics
  const wordCount = scene?.wordCount || 0;
  const charCount = scene?.content?.length || 0;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 220));

  const getFontFamilyStyle = () => {
    switch (settings.editorFontFamily) {
      case 'Plus Jakarta Sans':
        return '"Plus Jakarta Sans", sans-serif';
      case 'JetBrains Mono':
        return '"JetBrains Mono", monospace';
      case 'Lora':
        return '"Lora", serif';
      case 'Playfair Display':
        return '"Playfair Display", serif';
      case 'Newsreader':
      default:
        return '"Newsreader", serif';
    }
  };

  if (!scene) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background select-none">
        <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
          <Quote className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">No Scene Selected</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
          Select a scene from the left project tree, or create a new chapter to begin writing.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 min-w-0 bg-background transition-colors ${
        isFocusMode ? 'fixed inset-0 z-50 p-6 bg-background' : ''
      }`}
    >
      {/* Top Toolbar */}
      <div role="toolbar" aria-label="Manuscript editing tools" className="min-h-12 border-b border-border/80 bg-card px-2 py-1.5 sm:px-3 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none">
        <div className="flex min-w-0 flex-1 items-center gap-0.5 sm:gap-1 overflow-x-auto rounded-lg border border-border/60 bg-muted/30 px-1 py-0.5 scrollbar-none">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className={`p-1.5 rounded hover:bg-muted transition-all duration-150 ${
              historyIndex <= 0 ? 'text-muted-foreground/35 cursor-not-allowed opacity-40' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className={`p-1.5 rounded hover:bg-muted transition-all duration-150 ${
              historyIndex >= history.length - 1 ? 'text-muted-foreground/35 cursor-not-allowed opacity-40' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Redo (Ctrl+Shift+Z or Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Text Style Controls */}
          <button
            onClick={() => applyFormatting('**', '**')}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormatting('*', '*')}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormatting('~~', '~~')}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Strikethrough (~~text~~)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Heading Controls */}
          <button
            onClick={() => applyFormatting('\n# ')}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormatting('\n## ')}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormatting('\n### ')}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Quote & Lists */}
          <button
            onClick={() => applyFormatting('\n> ')}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormatting('\n- ')}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyFormatting('\n1. ')}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={insertParagraphBreak}
            className="px-2 py-1 rounded hover:bg-muted text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
            title="Scene Break (* * *)"
          >
            * * *
          </button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Inline Comment on selection */}
          <button
            onClick={handleCommentOnSelection}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Add Comment to Selected Passage"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Comment</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
          {/* Daily Goal Circular Progress Ring */}
          <div
            className="relative"
            onMouseEnter={() => setShowGoalTooltip(true)}
            onMouseLeave={() => setShowGoalTooltip(false)}
          >
            <button
              type="button"
              onClick={onOpenSettings}
              onFocus={() => setShowGoalTooltip(true)}
              onBlur={() => setShowGoalTooltip(false)}
              className={`relative flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full text-xs transition-all duration-200 cursor-pointer group shrink-0 select-none border ${
                isGoalExceeded
                  ? 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/60'
                  : 'border-border/60 hover:border-border hover:bg-muted/60'
              }`}
              aria-label={`Daily Goal Progress: ${sceneWords.toLocaleString()} of ${dailyGoal.toLocaleString()} words in this scene (${sceneGoalPercent}%)`}
            >
              {/* Radial celebration halo pulse when exceeding goal */}
              {isGoalExceeded && (
                <span
                  className="absolute -inset-0.5 rounded-full bg-amber-500/20 blur-xs pointer-events-none animate-pulse"
                  aria-hidden="true"
                />
              )}

              {/* Progress Ring Visualizer */}
              <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
                {/* SVG Ring with Smooth Transitions */}
                <svg
                  className="w-full h-full -rotate-90 transform"
                  viewBox="0 0 32 32"
                  style={{
                    filter: isGoalExceeded
                      ? 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.55))'
                      : undefined,
                  }}
                >
                  {/* Track Circle */}
                  <circle
                    cx="16"
                    cy="16"
                    r="13"
                    className="stroke-muted-foreground/15"
                    strokeWidth="2.75"
                    fill="none"
                  />
                  {/* Progress Circle Fill with Smooth CSS Transition */}
                  <circle
                    cx="16"
                    cy="16"
                    r="13"
                    className={`transition-[stroke-dashoffset,stroke] duration-500 ease-out ${
                      isGoalExceeded
                        ? 'stroke-amber-500 dark:stroke-amber-400'
                        : 'stroke-primary'
                    }`}
                    strokeWidth="2.75"
                    strokeDasharray="81.68"
                    strokeDashoffset={81.68 * (1 - progressRatio)}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>

                {/* Inner Percentage Display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={`font-mono font-bold tracking-tighter tabular-nums leading-none ${
                      isGoalExceeded
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-foreground'
                    } ${
                      sceneGoalPercent >= 1000
                        ? 'text-[7px]'
                        : sceneGoalPercent >= 100
                        ? 'text-[8px]'
                        : 'text-[9px]'
                    }`}
                  >
                    {sceneGoalPercent}%
                  </span>
                </div>
              </div>

              {/* Stat Details and Overflow Counter */}
              <div className="flex flex-col text-left leading-tight hidden sm:flex">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Scene / Goal
                  </span>
                  {isGoalExceeded && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8.5px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Flame className="w-2.5 h-2.5 shrink-0" />
                      +{overflowWords.toLocaleString()}w
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-foreground tabular-nums font-mono mt-0.5">
                  {sceneWords.toLocaleString()} <span className="font-normal text-muted-foreground">/ {dailyGoal.toLocaleString()}</span>
                </span>
              </div>
            </button>

            {/* Instant Floating Tooltip Card on Hover */}
            {showGoalTooltip && (
              <div
                role="tooltip"
                className="absolute top-full mt-2 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-50 w-64 p-3 bg-popover/95 backdrop-blur-md rounded-xl border border-border shadow-xl text-left animate-in fade-in zoom-in-95 duration-150 pointer-events-none select-none"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                  <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-primary" />
                    Daily Writing Target
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {dailyGoal.toLocaleString()} words
                  </span>
                </div>

                <div className="py-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">This Scene:</span>
                    <span className="font-bold text-foreground font-mono tabular-nums">
                      {sceneWords.toLocaleString()} words ({sceneGoalPercent}%)
                    </span>
                  </div>

                  {/* Visual Mini Progress Bar */}
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isGoalExceeded ? 'bg-amber-500' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(100, sceneGoalPercent)}%` }}
                    />
                  </div>

                  <div className="text-[11px]">
                    {isGoalExceeded ? (
                      <div className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 shrink-0" />
                        <span>Surpassed daily goal by +{overflowWords.toLocaleString()} words!</span>
                      </div>
                    ) : (
                      <div className="text-muted-foreground flex items-center justify-between">
                        <span>Remaining to goal:</span>
                        <span className="font-semibold text-foreground font-mono">
                          {remainingWords.toLocaleString()} words
                        </span>
                      </div>
                    )}
                  </div>

                  {wordsToday > 0 && wordsToday !== sceneWords && (
                    <div className="pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Today's Total Session:</span>
                      <span className="font-mono font-medium text-foreground">
                        {wordsToday.toLocaleString()} words
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-1 text-[10px] text-muted-foreground/80 text-center italic">
                  Click to customize goal in Settings
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-border mx-0.5 hidden sm:block shrink-0" />

          {/* Readability & Sentence Complexity Inspector */}
          <button
            onClick={() => setShowReadabilityModal(true)}
            className="p-1 sm:px-2 sm:py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 border border-border/40 shadow-2xs group shrink-0"
            title={`Readability: Grade ${readabilityAnalysis.metrics.fleschKincaidGrade} (${readabilityAnalysis.metrics.gradeLevelCategory}) - Click to inspect & simplify complex sentences`}
          >
            <Gauge className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform shrink-0" />
            <span className="hidden md:inline font-medium">Readability:</span>
            <span className="font-mono font-bold text-[11px] text-foreground">
              Gr. {readabilityAnalysis.metrics.fleschKincaidGrade}
            </span>
          </button>

          {/* Smart Paragraphing & Prose Pacing Tool */}
          <button
            onClick={() => setShowSmartParagraphModal(true)}
            className="p-1 sm:px-2 sm:py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 border border-border/40 shadow-2xs group shrink-0"
            title="Intelligently split dense paragraphs and optimize story flow pace"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500 group-hover:scale-110 transition-transform shrink-0" />
            <span className="hidden md:inline font-medium">Prose Pacing</span>
          </button>

          <button
            onClick={() => setShowFindReplace(!showFindReplace)}
            className={`p-1.5 rounded text-xs transition-colors ${
              showFindReplace
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Find & Replace"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenVersionHistory}
            className="p-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
            title="Version History & Snapshots"
          >
            <History className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Snapshots</span>
          </button>

          <button
            onClick={toggleFocusMode}
            className={`p-1.5 rounded text-xs transition-colors ${
              isFocusMode
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title={isFocusMode ? 'Exit Focus Mode (Ctrl+F or Esc)' : 'Enter Focus Mode - Distraction-free (Ctrl+F)'}
          >
            {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {onOpenKeyboardShortcuts && (
            <button
              onClick={onOpenKeyboardShortcuts}
              className="p-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Keyboard Shortcuts Cheat Sheet (Ctrl+/)"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Find & Replace Bar */}
      {showFindReplace && (
        <div className="border-b border-border/80 bg-muted/40 p-2.5 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Find:</span>
            <input
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Word or phrase..."
              className="px-2 py-1 rounded bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary w-40"
            />
            {findText && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {matchCount} {matchCount === 1 ? 'match' : 'matches'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Replace:</span>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replacement..."
              className="px-2 py-1 rounded bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary w-40"
            />
            <button
              onClick={handleReplaceOne}
              disabled={matchCount === 0}
              className="px-2 py-1 rounded bg-card border border-border hover:bg-muted text-foreground disabled:opacity-50 text-xs"
            >
              Replace
            </button>
            <button
              onClick={handleReplaceAll}
              disabled={matchCount === 0}
              className="px-2 py-1 rounded bg-card border border-border hover:bg-muted text-foreground disabled:opacity-50 text-xs"
            >
              Replace All
            </button>
          </div>
        </div>
      )}

      {/* Manuscript Canvas Container */}
      <div className="flex-1 overflow-y-auto bg-muted/20 px-2 sm:px-4 py-4 sm:py-8 pb-20 md:pb-8 flex justify-center selection:bg-primary/20 relative">
        {/* Floating Focus Mode Banner */}
        {isFocusMode && (
          <div className="fixed top-4 right-4 sm:right-6 z-30 flex items-center">
            <div className="bg-card/90 backdrop-blur-xs border border-border/80 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2.5 text-xs animate-in fade-in duration-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-foreground text-[11px]">Focus Mode</span>
              <button
                onClick={toggleFocusMode}
                className="ml-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 bg-muted/70 px-2 py-0.5 rounded-full"
                title="Exit Focus Mode (Esc or Ctrl+F)"
              >
                <span>Exit</span>
                <kbd className="text-[9px] font-mono px-1 rounded bg-card border border-border">Esc</kbd>
              </button>
            </div>
          </div>
        )}

        <div className={`w-full transition-all duration-300 flex flex-col ${isFocusMode ? 'max-w-4xl' : 'max-w-3xl'}`}>
          {/* Manuscript Sheet Elevation */}
          <div className="w-full bg-card border border-border/70 rounded-md p-4 sm:p-6 md:p-10 lg:p-12 shadow-sm transition-colors flex flex-col flex-1 min-h-[480px] sm:min-h-[600px] md:min-h-[720px]">
            {/* Chapter / Scene Heading */}
            <div className="border-b border-border/50 pb-5 mb-6 select-none">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="uppercase tracking-widest font-medium">
                  {bookTitle} {chapterTitle ? `· ${chapterTitle}` : ''}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-muted-foreground/80">
                  {scene.wordCount} words
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mt-1 font-serif">
                {scene.title}
              </h1>
              {scene.synopsis && (
                <p className="text-xs text-muted-foreground mt-1.5 italic font-serif leading-relaxed">
                  "{scene.synopsis}"
                </p>
              )}
            </div>

            {/* Prose Editor Textarea */}
            <textarea
              ref={textareaRef}
              value={scene.content}
              onChange={(e) => onUpdateContent(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              onSelect={handleSelectionChange}
              onKeyUp={handleSelectionChange}
              onMouseUp={handleSelectionChange}
              spellCheck={settings.spellcheckEnabled ?? true}
              placeholder="Type your scene here or prompt the AI Co-Author to begin drafting..."
              className="w-full flex-1 bg-transparent text-foreground border-none outline-none resize-none leading-relaxed transition-all placeholder:text-muted-foreground/40"
              style={{
                fontSize: `${settings.editorFontSize}px`,
                lineHeight: 1.85,
                fontFamily: getFontFamilyStyle(),
              }}
            />
          </div>
        </div>
      </div>

      {/* Editor Footer Status Bar with Floating Word Count Indicator */}
      <div className="relative h-10 border-t border-border/80 bg-card/60 px-4 flex items-center justify-between text-xs text-muted-foreground shrink-0 select-none">
        {/* Left: Current Scene Metrics */}
        <div className="flex items-center gap-2.5">
          <span className="tabular-nums">
            <strong className="text-foreground">{wordCount.toLocaleString()}</strong> words
          </span>
          <span className="text-border" aria-hidden="true">·</span>
          <span className="tabular-nums">{charCount.toLocaleString()} chars</span>
          <span className="text-border" aria-hidden="true">·</span>
          <span>~{readingTimeMin} min read</span>
          <span className="text-border" aria-hidden="true">·</span>
          <button
            onClick={() => setShowReadabilityModal(true)}
            className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium"
            title="Inspect Flesch-Kincaid Grade Level & Sentence Complexity"
          >
            <Gauge className="w-3 h-3 text-primary" />
            <span>Grade {readabilityAnalysis.metrics.fleschKincaidGrade}</span>
            <span className="text-[10px] text-muted-foreground/70 hidden sm:inline">
              ({readabilityAnalysis.metrics.fleschReadingEase} ease)
            </span>
          </button>
        </div>

        {/* Center: Floating Real-time Scope Word Count Indicator */}
        <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 -top-3.5 z-10 items-center gap-2 px-3 py-1 rounded-full bg-card border border-border/90 shadow-md text-xs transition-all hover:shadow-lg">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground text-[11px]">Book:</span>
            <span className="font-semibold tabular-nums text-foreground">
              {bookTotalWords.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground">words</span>
          </div>

          <span className="text-border" aria-hidden="true">·</span>

          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="text-muted-foreground text-[11px]">Chapter:</span>
            <span className="font-semibold tabular-nums text-foreground">
              {chapterTotalWords.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground">words</span>
          </div>

          <span className="text-border" aria-hidden="true">·</span>

          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>Scene:</span>
            <span className="font-semibold tabular-nums text-primary">
              {wordCount.toLocaleString()}w
            </span>
          </div>
        </div>

        {/* Right: Daily Word Goal Visual Progress Bar, Scene Status & Typography */}
        <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
          {/* Daily Goal Visual Progress Bar */}
          <div
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-muted/60 hover:bg-muted border border-border/70 text-xs transition-all cursor-pointer group shadow-2xs"
            title={`Daily Word Goal: ${wordsToday.toLocaleString()} of ${dailyGoal.toLocaleString()} words (${goalPercent}%) - Click to adjust goal in Settings`}
          >
            <div className="flex items-center gap-1">
              {isGoalMet ? (
                <Trophy className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
              ) : (
                <Target className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
              )}
              <span className="font-semibold text-foreground text-[10px] sm:text-[11px] tabular-nums hidden xs:inline">
                {wordsToday.toLocaleString()}/{dailyGoal.toLocaleString()}w
              </span>
              <span
                className={`text-[10px] font-mono font-bold ${
                  isGoalMet ? 'text-emerald-500' : 'text-primary'
                }`}
              >
                {goalPercent}%
              </span>
            </div>

            {/* Visual Progress Bar Track & Fill */}
            <div className="w-12 xs:w-16 sm:w-20 md:w-24 h-1.5 sm:h-2 bg-muted-foreground/20 rounded-full overflow-hidden p-[1px] border border-border/40">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isGoalMet
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-xs'
                    : goalPercent >= 60
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                }`}
                style={{ width: `${Math.max(4, goalPercent)}%` }}
              />
            </div>
          </div>

          <span className="text-border hidden md:inline" aria-hidden="true">·</span>

          {scene.status && (
            <span className="text-muted-foreground hidden lg:inline">
              Status: <span className="text-foreground font-medium">{scene.status}</span>
            </span>
          )}

          <span className="text-border hidden lg:inline" aria-hidden="true">·</span>

          <span className="text-muted-foreground hidden sm:inline">
            {settings.editorFontFamily} · {settings.editorFontSize}px
          </span>
        </div>
      </div>

      {/* Readability & Sentence Complexity Inspector Modal */}
      <ReadabilityInspectorModal
        isOpen={showReadabilityModal}
        onClose={() => setShowReadabilityModal(false)}
        scene={scene}
        onApplySentenceReplacement={handleApplySentenceReplacement}
        settings={settings}
      />

      {/* Smart Paragraphing & Prose Pacing Modal */}
      <SmartParagraphModal
        isOpen={showSmartParagraphModal}
        onClose={() => setShowSmartParagraphModal(false)}
        scene={scene}
        onApplyParagraphing={onUpdateContent}
        settings={settings}
        projectGenre={projectGenre}
      />
    </div>
  );
};
