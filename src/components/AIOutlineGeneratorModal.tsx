import React, { useState } from 'react';
import {
  Sparkles,
  X,
  BookOpen,
  Layers,
  ChevronRight,
  Check,
  Copy,
  RefreshCw,
  Plus,
  ArrowRight,
  Flame,
  Compass,
  FileText,
  AlertCircle,
  Clock,
  Send,
  User,
  ExternalLink,
} from 'lucide-react';
import { Project, PlotCard, UserSettings, Book, Act, Chapter, Scene } from '../types/writing';
import { apiUrl } from '../services/api';

interface AIOutlineGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject: (project: Project) => void;
  settings: UserSettings;
}

interface GeneratedBeat {
  chapterNumber: number;
  title: string;
  milestone: string;
  summary: string;
  characterFocus: string;
  coreConflict: string;
}

interface GeneratedAct {
  act: string;
  actTitle: string;
  synopsis: string;
  beats: GeneratedBeat[];
}

interface OutlineResult {
  projectOverview: string;
  acts: GeneratedAct[];
  model?: string;
  isSimulated?: boolean;
  fallbackNotice?: string;
}

const ARC_MODELS = [
  {
    id: 'Classic 3-Act Structure',
    label: 'Classic 3-Act Structure',
    description: 'Setup, Confrontation & Midpoint, Climax & Resolution',
  },
  {
    id: "Hero's Journey",
    label: "Hero's Journey / Monomyth",
    description: 'Ordinary World, Threshold, Ordeal, Rebirth, Return with Elixir',
  },
  {
    id: 'Mystery / Thriller Beat Sheet',
    label: 'Mystery / Thriller Arc',
    description: 'Inciting Crime, Tangled Threads, Midpoint Reversal, Final Unmasking',
  },
  {
    id: 'Save the Cat Beats',
    label: 'Save the Cat Dramatic Arc',
    description: 'Debate, Break into Two, Midpoint, Dark Night of the Soul, Finale',
  },
  {
    id: 'Character-Driven Internal Arc',
    label: 'Character-Driven Arc',
    description: 'Flawed Belief, Resistance, Disillusionment, Self-Actualization',
  },
];

export const AIOutlineGeneratorModal: React.FC<AIOutlineGeneratorModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  settings,
}) => {
  const books = project.books || [];
  const [selectedBookIndex, setSelectedBookIndex] = useState(0);

  const activeBook: Book | undefined = books[selectedBookIndex] || books[0];

  // Initialize synopsis from book synopsis or project synopsis
  const [synopsis, setSynopsis] = useState<string>(() => {
    return activeBook?.synopsis || project.synopsis || '';
  });

  const [arcType, setArcType] = useState('Classic 3-Act Structure');
  const [beatCount, setBeatCount] = useState<number>(12);
  const [customFocus, setCustomFocus] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [outlineResult, setOutlineResult] = useState<OutlineResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeActTab, setActiveActTab] = useState<'All' | 'Act I' | 'Act II' | 'Act III'>('All');
  const [copied, setCopied] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  // When book changes, offer to sync synopsis
  const handleSelectBook = (index: number) => {
    setSelectedBookIndex(index);
    const target = books[index];
    if (target?.synopsis) {
      setSynopsis(target.synopsis);
    }
  };

  const handleGenerateOutline = async () => {
    if (!synopsis.trim()) {
      setErrorMessage('Please provide a synopsis for the story to generate an outline.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setApplySuccessMessage(null);
    setLoadingStep(1);

    // Progress step animation for delightful feedback
    const timer1 = setTimeout(() => setLoadingStep(2), 1200);
    const timer2 = setTimeout(() => setLoadingStep(3), 2800);

    try {
      const payload = {
        apiKey: settings.apiKey,
        model: settings.selectedModel || 'gemini-3.8-flash',
        synopsis: synopsis.trim(),
        bookTitle: activeBook?.title || project.title,
        projectTitle: project.title,
        genre: project.genre,
        arcType,
        beatCount,
        characters: project.characters,
        locations: project.locations,
        customFocus: customFocus.trim(),
      };

      const res = await fetch(apiUrl('/api/ai/outline'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate outline.');
      }

      setOutlineResult(data);
    } catch (err: any) {
      console.error('Error generating outline:', err);
      setErrorMessage(
        err.message || 'Failed to connect to the outline generator. Please check your network or API key.'
      );
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsLoading(false);
    }
  };

  // Convert outline beats into PlotCard items on the Plot Board
  const handleApplyToPlotBoard = () => {
    if (!outlineResult?.acts) return;

    const existingCards = [...project.plotCards];
    const newCards: PlotCard[] = [];

    outlineResult.acts.forEach((actData) => {
      actData.beats.forEach((beat, index) => {
        newCards.push({
          id: `plot_${Date.now()}_${actData.act}_${index}`,
          act: actData.act,
          title: beat.title,
          summary: `${beat.summary}\n\n• Milestone: ${beat.milestone}\n• Focus: ${beat.characterFocus}\n• Conflict: ${beat.coreConflict}`,
          tags: [actData.act.replace(/\s+/g, '-'), 'AI-Outline', beat.milestone.split(' ')[0]],
          status: 'Outlined',
          order: existingCards.length + newCards.length + 1,
        });
      });
    });

    onUpdateProject({
      ...project,
      plotCards: [...existingCards, ...newCards],
      updatedAt: new Date().toISOString(),
    });

    setApplySuccessMessage(`Successfully added ${newCards.length} chapter beats to your Plot Board!`);
    setTimeout(() => setApplySuccessMessage(null), 4000);
  };

  // Convert outline beats into actual Acts & Chapters in the manuscript
  const handleApplyToManuscript = () => {
    if (!outlineResult?.acts || !activeBook) return;

    const updatedBooks = [...project.books];
    const currentBook = { ...activeBook };

    // Map each generated Act to the book's acts
    const updatedActs: Act[] = outlineResult.acts.map((genAct, actIdx) => {
      const actId = `act_${Date.now()}_${actIdx}`;

      const chapters: Chapter[] = genAct.beats.map((beat, chIdx) => {
        const chapterId = `ch_${Date.now()}_${actIdx}_${chIdx}`;
        const sceneId = `sc_${Date.now()}_${actIdx}_${chIdx}`;

        const initialScene: Scene = {
          id: sceneId,
          chapterId,
          title: beat.title,
          order: 1,
          status: 'Outlined',
          content: `# ${beat.title}\n\n*${beat.milestone}*\n\n> **Scene Objective & Core Conflict:** ${beat.coreConflict}\n> **POV / Character Focus:** ${beat.characterFocus}\n\n${beat.summary}\n\n* * *\n\n[Begin drafting scene prose here...]`,
          synopsis: beat.summary,
          wordCount: 0,
          notes: `Milestone: ${beat.milestone}\nConflict: ${beat.coreConflict}`,
          comments: [],
          versions: [],
          updatedAt: new Date().toISOString(),
        };

        return {
          id: chapterId,
          actId,
          title: beat.title,
          order: chIdx + 1,
          synopsis: beat.summary,
          scenes: [initialScene],
        };
      });

      return {
        id: actId,
        bookId: currentBook.id,
        title: `${genAct.act}: ${genAct.actTitle}`,
        order: actIdx + 1,
        synopsis: genAct.synopsis,
        chapters,
      };
    });

    currentBook.acts = updatedActs;
    updatedBooks[selectedBookIndex] = currentBook;

    onUpdateProject({
      ...project,
      books: updatedBooks,
      updatedAt: new Date().toISOString(),
    });

    setApplySuccessMessage(
      `Manuscript synced! Created 3 Acts with ${
        updatedActs.reduce((acc, a) => acc + a.chapters.length, 0)
      } chapter drafts in "${currentBook.title}".`
    );
    setTimeout(() => setApplySuccessMessage(null), 4000);
  };

  // Copy full outline to clipboard as clean Markdown
  const handleCopyMarkdown = () => {
    if (!outlineResult) return;

    let md = `# 3-Act Story Arc Outline: ${activeBook?.title || project.title}\n`;
    md += `*Genre: ${project.genre} | Story Arc: ${arcType}*\n\n`;
    md += `## Premise & Synopsis\n${synopsis}\n\n`;
    md += `## Narrative Overview\n${outlineResult.projectOverview}\n\n`;

    outlineResult.acts.forEach((act) => {
      md += `### ${act.act}: ${act.actTitle}\n`;
      md += `*${act.synopsis}*\n\n`;

      act.beats.forEach((beat) => {
        md += `#### ${beat.title} [${beat.milestone}]\n`;
        md += `- **Summary:** ${beat.summary}\n`;
        md += `- **Character Focus:** ${beat.characterFocus}\n`;
        md += `- **Core Conflict:** ${beat.coreConflict}\n\n`;
      });
    });

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 selection:bg-primary/20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground tracking-tight">
                  AI 3-Act Outline Generator
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  Plot Architecture
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate a three-act story arc structure and chapter beats from your book's synopsis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Two column layout on desktop */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border/60">
          {/* LEFT COLUMN: Input Configuration (5 cols) */}
          <div className="lg:col-span-5 p-5 space-y-4 bg-muted/10 overflow-y-auto">
            {/* Book Selector (if multiple volumes) */}
            {books.length > 1 && (
              <div>
                <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider block mb-1.5">
                  Target Book / Volume
                </label>
                <select
                  value={selectedBookIndex}
                  onChange={(e) => handleSelectBook(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-card border border-border text-foreground text-xs font-medium focus:ring-1 focus:ring-primary"
                >
                  {books.map((b, idx) => (
                    <option key={b.id} value={idx}>
                      Volume {b.volumeNumber}: {b.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Synopsis Input Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>Book Synopsis *</span>
                </label>
                <button
                  type="button"
                  onClick={() => setSynopsis(activeBook?.synopsis || project.synopsis || '')}
                  className="text-[10px] text-primary hover:underline font-medium"
                >
                  Reset to Current Synopsis
                </button>
              </div>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Paste or draft your story's synopsis here (e.g. core conflict, central premise, stakes, protagonist dilemma)..."
                rows={6}
                className="w-full p-3 rounded-lg bg-card border border-border text-foreground text-xs leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-y"
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{synopsis.trim().split(/\s+/).filter(Boolean).length} words</span>
                <span>Supports fiction, thrillers, fantasy, sci-fi & drama</span>
              </div>
            </div>

            {/* Story Arc Model Preset */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                Story Arc Model
              </label>
              <div className="space-y-1.5">
                {ARC_MODELS.map((model) => (
                  <label
                    key={model.id}
                    onClick={() => setArcType(model.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      arcType === model.id
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-card border-border/70 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    }`}
                  >
                    <input
                      type="radio"
                      name="arcModel"
                      checked={arcType === model.id}
                      onChange={() => setArcType(model.id)}
                      className="mt-0.5 text-primary focus:ring-primary"
                    />
                    <div>
                      <div className="text-xs font-semibold leading-tight text-foreground">
                        {model.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {model.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Target Beat Count */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                Target Chapter Beats
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[9, 12, 15].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setBeatCount(count)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      beatCount === count
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {count} Beats
                    <span className="block text-[9px] font-normal opacity-80 mt-0.5">
                      ~{Math.round(count / 3)} per act
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Custom Twist / Focus Prompt */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                Special Focus or Narrative Twist (Optional)
              </label>
              <input
                type="text"
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                placeholder="e.g. Include a major betrayal by the mentor at the midpoint..."
                className="w-full p-2.5 rounded-lg bg-card border border-border text-foreground text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Characters Context Pill */}
            {project.characters.length > 0 && (
              <div className="p-2.5 rounded-lg bg-card border border-border/70 text-[11px] text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>Integrating {project.characters.length} characters from Bible</span>
                </span>
                <span className="text-[10px] font-medium text-foreground/80">Auto-wired</span>
              </div>
            )}

            {/* Generate Trigger Button */}
            <button
              onClick={handleGenerateOutline}
              disabled={isLoading || !synopsis.trim()}
              className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Generating 3-Act Structure...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Generate 3-Act Story Arc</span>
                </>
              )}
            </button>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: 3-Act Structure Output (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-card overflow-hidden">
            {/* Top Toolbar / Act Filter Tabs */}
            {outlineResult && (
              <div className="p-3 border-b border-border/70 bg-muted/20 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-card p-0.5 rounded-lg border border-border/60">
                  {(['All', 'Act I', 'Act II', 'Act III'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveActTab(tab)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                        activeActTab === tab
                          ? 'bg-primary text-primary-foreground shadow-2xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyMarkdown}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-card border border-border hover:bg-muted text-foreground text-xs font-medium transition-colors"
                    title="Copy Outline as Markdown"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Copy Markdown</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Success toast banner */}
            {applySuccessMessage && (
              <div className="px-4 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200 shrink-0">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{applySuccessMessage}</span>
                </span>
                <button
                  onClick={() => setApplySuccessMessage(null)}
                  className="hover:opacity-75"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {isLoading ? (
                /* Animated loading state */
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-500 via-purple-500 to-indigo-500 animate-pulse flex items-center justify-center text-white shadow-xl">
                      <Sparkles className="w-8 h-8 animate-spin" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {loadingStep === 1
                        ? 'Analyzing Book Synopsis & Character Drivers...'
                        : loadingStep === 2
                        ? `Architecting ${arcType} Tension Curve...`
                        : 'Calibrating Dramatic Milestones & Chapter Beats...'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      Crafting a tightly woven narrative arc with inciting incidents, midpoints, and dramatic resolutions.
                    </p>
                  </div>
                </div>
              ) : outlineResult ? (
                /* Rendered 3-Act Structure */
                <div className="space-y-6">
                  {/* Overview Premise Card */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
                    <div className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" />
                      <span>Story Architecture Overview</span>
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed font-serif italic">
                      "{outlineResult.projectOverview}"
                    </p>
                  </div>

                  {/* Acts List */}
                  {outlineResult.acts
                    .filter((act) => activeActTab === 'All' || act.act === activeActTab)
                    .map((actData, actIndex) => {
                      const isAct1 = actData.act.includes('I') && !actData.act.includes('II') && !actData.act.includes('III');
                      const isAct2 = actData.act.includes('II');
                      const isAct3 = actData.act.includes('III');

                      const actBadgeColor = isAct1
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                        : isAct2
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';

                      return (
                        <div
                          key={actData.act}
                          className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs space-y-3"
                        >
                          {/* Act Header */}
                          <div className="p-4 border-b border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${actBadgeColor}`}>
                                  {actData.act}
                                </span>
                                <h3 className="text-sm font-bold text-foreground">
                                  {actData.actTitle}
                                </h3>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                                {actData.synopsis}
                              </p>
                            </div>

                            <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap bg-card px-2.5 py-1 rounded-full border border-border">
                              {actData.beats.length} Beats
                            </span>
                          </div>

                          {/* Act Chapter Beats */}
                          <div className="p-4 pt-1 space-y-3">
                            {actData.beats.map((beat) => (
                              <div
                                key={beat.chapterNumber}
                                className="p-3.5 rounded-lg border border-border/70 bg-card hover:border-primary/40 hover:shadow-xs transition-all space-y-2 group"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center font-bold text-[11px] text-foreground shrink-0">
                                      {beat.chapterNumber}
                                    </span>
                                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                      {beat.title}
                                    </span>
                                  </div>

                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border border-border shrink-0">
                                    {beat.milestone}
                                  </span>
                                </div>

                                <p className="text-xs text-foreground/80 leading-relaxed font-serif">
                                  {beat.summary}
                                </p>

                                <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground border-t border-border/40">
                                  <div className="flex items-center gap-1">
                                    <strong className="text-foreground/80 font-medium">Focus:</strong>
                                    <span>{beat.characterFocus}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <strong className="text-foreground/80 font-medium">Conflict:</strong>
                                    <span>{beat.coreConflict}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                /* Empty state prompt */
                <div className="py-16 text-center flex flex-col items-center justify-center space-y-3 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                    <Layers className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    Ready to Generate Your Story Arc
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                    Review or fine-tune your book's synopsis in the left panel, choose your narrative structure model, and click <strong>"Generate 3-Act Story Arc"</strong> to produce dramatic chapter beats.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Action Footer */}
            {outlineResult && (
              <div className="p-4 border-t border-border/80 bg-muted/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="text-[11px] text-muted-foreground">
                  Total Beats Generated:{' '}
                  <strong className="text-foreground">
                    {outlineResult.acts.reduce((acc, a) => acc + a.beats.length, 0)}
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApplyToPlotBoard}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-border hover:bg-muted text-foreground text-xs font-semibold transition-colors shadow-2xs"
                    title="Add all generated beats to the Plot Board"
                  >
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>Apply to Plot Board</span>
                  </button>

                  <button
                    onClick={handleApplyToManuscript}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors shadow-xs"
                    title="Create Acts & Chapter drafts in Manuscript"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Sync to Manuscript Chapters</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
