import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle,
  X,
  BookOpen,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Target,
} from 'lucide-react';
import { Scene, UserSettings } from '../types/writing';
import { apiUrl } from '../services/api';

interface Suggestion {
  originalText: string;
  replacementText: string;
  category: 'wordiness' | 'passive_voice' | 'weak_verb' | 'cliché';
  explanation: string;
}

interface StyleCritiquePanelProps {
  scene: Scene | null;
  onApplySuggestion: (originalText: string, replacementText: string) => void;
  settings: UserSettings;
  onClose: () => void;
}

export const StyleCritiquePanel: React.FC<StyleCritiquePanelProps> = ({
  scene,
  onApplySuggestion,
  settings,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (!scene || !scene.content.trim()) {
      setErrorMsg('Please write some content in the active editor first.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(apiUrl('/api/ai/prose-style'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: settings.apiKey,
          model: settings.selectedModel,
          text: scene.content,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze prose.');
      }

      setSuggestions(data.suggestions || []);
      setHasRun(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while running style critique.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = (suggestion: Suggestion) => {
    onApplySuggestion(suggestion.originalText, suggestion.replacementText);
    setSuggestions((prev) =>
      prev.filter(
        (s) =>
          !(
            s.originalText === suggestion.originalText &&
            s.replacementText === suggestion.replacementText
          )
      )
    );
  };

  const handleDismiss = (suggestion: Suggestion) => {
    setSuggestions((prev) =>
      prev.filter(
        (s) =>
          !(
            s.originalText === suggestion.originalText &&
            s.replacementText === suggestion.replacementText
          )
      )
    );
  };

  const getCategoryLabel = (cat: Suggestion['category']) => {
    switch (cat) {
      case 'wordiness':
        return 'Clarity / Wordy';
      case 'passive_voice':
        return 'Passive Voice';
      case 'weak_verb':
        return 'Weak Verb';
      case 'cliché':
        return 'Dialogue Cliché';
      default:
        return 'Style suggestion';
    }
  };

  const getCategoryColor = (cat: Suggestion['category']) => {
    switch (cat) {
      case 'wordiness':
        return 'text-blue-500';
      case 'passive_voice':
        return 'text-amber-500';
      case 'weak_verb':
        return 'text-emerald-500';
      case 'cliché':
        return 'text-purple-500';
    }
  };

  const categoriesCount = suggestions.reduce(
    (acc, sug) => {
      acc[sug.category] = (acc[sug.category] || 0) + 1;
      return acc;
    },
    { wordiness: 0, passive_voice: 0, weak_verb: 0, cliché: 0 } as Record<
      Suggestion['category'],
      number
    >
  );

  return (
    <aside className="w-full lg:w-88 border-l border-border bg-card flex flex-col shrink-0 overflow-hidden h-full shadow-xl lg:shadow-none select-none">
      {/* Panel Header */}
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">Interactive Style Critique</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Grammarly-style co-writer analyzer</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Bar / Status */}
        <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5 space-y-3.5">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-foreground">Prose Rhythm & Clarity Audit</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Scan active scene text to detect passive structures, wordy prepositions, and dialogue clichés.
            </p>
          </div>

          <button
            onClick={runAnalysis}
            disabled={isLoading || !scene?.content.trim()}
            className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Auditing Prose...</span>
              </>
            ) : (
              <>
                <Target className="w-3.5 h-3.5" />
                <span>Analyze Style Quality</span>
              </>
            )}
          </button>
        </div>

        {/* Dashboard statistics block after run */}
        {hasRun && suggestions.length > 0 && (
          <div className="grid grid-cols-2 gap-2 shrink-0">
            {[
              { label: 'Wordy', count: categoriesCount.wordiness, color: 'text-blue-500 bg-blue-500/10' },
              { label: 'Passive', count: categoriesCount.passive_voice, color: 'text-amber-500 bg-amber-500/10' },
              { label: 'Weak Verb', count: categoriesCount.weak_verb, color: 'text-emerald-500 bg-emerald-500/10' },
              { label: 'Clichés', count: categoriesCount.cliché, color: 'text-purple-500 bg-purple-500/10' },
            ].map((stat, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-border/40 bg-card flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground">{stat.label}</span>
                <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${stat.color}`}>
                  {stat.count}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Suggestion Cards list */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
              <p className="text-xs text-muted-foreground">Identifying style improvement opportunities...</p>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((sug, i) => (
              <div
                key={i}
                className="p-3 bg-card border border-border rounded-xl shadow-xs space-y-2.5 transition-all hover:border-emerald-500/30"
              >
                {/* Meta details (using unboxed text, no pills as per styling guidelines) */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-bold ${getCategoryColor(sug.category)}`}>
                    {getCategoryLabel(sug.category)}
                  </span>
                  <button
                    onClick={() => handleDismiss(sug)}
                    className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                    title="Dismiss"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Edit suggestion line */}
                <div className="text-xs text-foreground font-serif leading-relaxed">
                  Replace <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 px-1.5 py-0.2 rounded border border-amber-500/20 line-through">{sug.originalText}</span> with{' '}
                  <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 px-1.5 py-0.2 rounded border border-emerald-500/20 font-bold">{sug.replacementText}</span>
                </div>

                {/* Detailed explanation */}
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {sug.explanation}
                </p>

                {/* Footer action buttons */}
                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/30">
                  <button
                    onClick={() => handleDismiss(sug)}
                    className="px-2 py-1 text-[10px] rounded hover:bg-muted text-muted-foreground transition-colors"
                  >
                    Ignore
                  </button>
                  <button
                    onClick={() => handleAccept(sug)}
                    className="px-2.5 py-1 text-[10px] rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))
          ) : hasRun ? (
            <div className="py-12 text-center space-y-2.5">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full w-fit mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Flawless Prose Style!</h4>
                <p className="text-[10px] text-muted-foreground max-w-[200px] mx-auto mt-0.5">
                  No wordy expressions, weak verbs, passive constructions, or dialogue clichés found in this scene.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground/60 italic space-y-2">
              <BookOpen className="w-5 h-5 mx-auto text-muted-foreground/40" />
              <span>Prose critique ready to audit</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
