import React, { useState } from 'react';
import {
  X,
  Wand2,
  Sparkles,
  Check,
  RefreshCw,
  Columns,
  ListRestart,
  HeartPulse,
  BookOpen,
  Info,
  Layers,
  Copy,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Scene, UserSettings } from '../types/writing';

interface SmartParagraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene | null;
  onApplyParagraphing: (updatedContent: string) => void;
  settings: UserSettings;
  projectGenre?: string;
}

type PacingPreset = 'balanced' | 'fast' | 'poetic';

export const SmartParagraphModal: React.FC<SmartParagraphModalProps> = ({
  isOpen,
  onClose,
  scene,
  onApplyParagraphing,
  settings,
  projectGenre = 'Fiction',
}) => {
  const [activePreset, setActivePreset] = useState<PacingPreset>('balanced');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    originalText: string;
    paragraphedText: string;
    explanation: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleAnalyzePacing = async () => {
    if (!scene || !scene.content.trim()) {
      setErrorMsg('Please write some content in the editor before running pacing analysis.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const toneLabel =
      activePreset === 'fast'
        ? 'High-Tension, Fast-Paced Action Thriller (shorter paragraphs, rapid dialogue beats)'
        : activePreset === 'poetic'
        ? 'Reflective, Poetic & Slow-Paced (isolating internal states and atmospheric details)'
        : 'Balanced Immersive Novel Novel Pacing';

    try {
      const res = await fetch('/api/ai/smart-paragraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: settings.apiKey,
          model: settings.selectedModel,
          text: scene.content,
          genre: projectGenre,
          tone: toneLabel,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze prose pacing');
      }

      setResult({
        originalText: data.originalText || scene.content,
        paragraphedText: data.paragraphedText || '',
        explanation: data.explanation || 'No explanation provided.',
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while connecting to the Gemini pacing module.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!result?.paragraphedText) return;
    onApplyParagraphing(result.paragraphedText);
    onClose();
  };

  const handleCopyResult = () => {
    if (!result?.paragraphedText) return;
    navigator.clipboard.writeText(result.paragraphedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[85vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/80 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                Smart Paragraphing & Prose Pacing Editor
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Analyzes scene rhythm, inserts smart line breaks, splits bunched dialogue, and breaks walls of text.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0 bg-muted/10">
          {/* Left panel: Presets and Configuration */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border p-4 sm:p-5 flex flex-col shrink-0 gap-5 overflow-y-auto bg-card">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                1. Select Pacing Profile
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Choose how dense or rapid the paragraph breaks should be.
              </p>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2.5">
              {[
                {
                  id: 'balanced',
                  title: 'Balanced Novel',
                  desc: 'Standard commercial fiction flow. Breaks up walls of text and isolates dialogue beats naturally.',
                  icon: BookOpen,
                  color: 'text-blue-500 bg-blue-500/10',
                },
                {
                  id: 'fast',
                  title: 'High-Tension / Action',
                  desc: 'Short, snappy single-sentence split lines to escalate dramatic moments, fights, and rapid dialogue.',
                  icon: HeartPulse,
                  color: 'text-rose-500 bg-rose-500/10',
                },
                {
                  id: 'poetic',
                  title: 'Atmospheric / Poetic',
                  desc: 'Longer lyrical blocks with rhythmic splits highlighting sensory environment detail and deep thoughts.',
                  icon: Layers,
                  color: 'text-emerald-500 bg-emerald-500/10',
                },
              ].map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActivePreset(p.id as PacingPreset);
                      if (result) setResult(null); // Reset result on preset change to prompt re-analysis
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex gap-3 ${
                      activePreset === p.id
                        ? 'border-primary bg-primary/5 shadow-2xs'
                        : 'border-border/80 hover:border-border hover:bg-muted/40'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 h-fit ${p.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-foreground">{p.title}</div>
                      <div className="text-[10px] text-muted-foreground leading-relaxed">{p.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border/60 space-y-3 mt-auto">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                onClick={handleAnalyzePacing}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Prose...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Smart Paragraph Prose</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right panel: Comparison / Editor Split */}
          <div className="flex-1 flex flex-col min-h-0">
            {!result && !isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3.5">
                <div className="p-4 rounded-full bg-muted/40 text-muted-foreground/60">
                  <Columns className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h4 className="text-sm font-bold text-foreground">
                    Prose Pacing Comparison Board
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Select a pacing preset on the left and click <strong>Smart Paragraph Prose</strong>. We'll analyze your scene content and display a side-by-side comparison of the proposed formatting.
                  </p>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <div className="max-w-sm space-y-1">
                  <h4 className="text-sm font-bold text-foreground">
                    Intelligent Line Break Analysis
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Gemini is reading your scene flow, mapping dialogue tags, identifying physical response beats, and drafting rhythm recommendations...
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Side-by-Side Scrolling Panels */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0 border-b border-border/85">
                  {/* Original Panel */}
                  <div className="flex flex-col min-h-0 border-r border-border">
                    <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Original Prose (Wall of Text)
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {scene?.content.split('\n\n').length || 1} paragraphs
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 font-serif text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap selection:bg-primary/10">
                      {result?.originalText}
                    </div>
                  </div>

                  {/* Suggestion Panel */}
                  <div className="flex flex-col min-h-0 bg-primary/5">
                    <div className="px-4 py-2 bg-primary/10 border-b border-border/80 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Proposed Prose (Beautiful Rhythm)</span>
                      </span>
                      <span className="text-[10px] text-primary font-bold tabular-nums">
                        {result?.paragraphedText.split('\n\n').length || 1} paragraphs
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 font-serif text-sm text-foreground leading-relaxed whitespace-pre-wrap selection:bg-primary/20 bg-card border-l border-border/20">
                      {result?.paragraphedText}
                    </div>
                  </div>
                </div>

                {/* Editor's Note/Explanation Block */}
                <div className="p-4 bg-muted/20 border-t border-border shrink-0 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Info className="w-3.5 h-3.5 text-primary" />
                    <span>Gemini Editor's Note on Pacing:</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {result?.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-border/80 bg-card flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Info className="w-3.5 h-3.5 text-primary" />
            <span>Smart Paragraphing only formats breaks; your words remain 100% untouched.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground text-xs font-medium"
            >
              Cancel
            </button>

            {result && (
              <>
                <button
                  onClick={handleCopyResult}
                  className="px-3.5 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleApply}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Paragraphing</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
