import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  CheckCircle2,
  ArrowRight,
  Copy,
  Plus,
  RefreshCw,
  AlertCircle,
  Key,
  ShieldCheck,
  Cpu,
  Layers,
  FileCheck,
  ChevronDown,
  X,
  MessageSquare,
  BookOpen,
  Feather,
  Zap,
} from 'lucide-react';
import { Project, Scene, UserSettings, AIActionType, AIResponsePayload } from '../types/writing';
import { apiUrl } from '../services/api';

interface AIAssistantPanelProps {
  project: Project;
  activeScene: Scene | null;
  selectedText: string;
  onClose: () => void;
  onApplyProse: (replacementText: string, mode: 'replace' | 'insert' | 'append') => void;
  settings: UserSettings;
  onOpenSettings: () => void;
  onUpdateSettings: (settings: UserSettings) => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  project,
  activeScene,
  selectedText,
  onClose,
  onApplyProse,
  settings,
  onOpenSettings,
  onUpdateSettings,
}) => {
  const [selectedAction, setSelectedAction] = useState<AIActionType>('suggest');
  const [customInstruction, setCustomInstruction] = useState('');
  const [selectedTone, setSelectedTone] = useState('Suspenseful & Atmospheric');
  const [continuationWords, setContinuationWords] = useState('250');
  const [dialogueSpeakerA, setDialogueSpeakerA] = useState(
    project.characters[0]?.name || 'Detective Aria Vance'
  );
  const [dialogueSpeakerB, setDialogueSpeakerB] = useState(
    project.characters[1]?.name || 'Dr. Lucas Thorne'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResponsePayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const availableModels = [
    { id: 'gemini-3.8-flash', label: 'gemini-3.8-flash (Recommended Fast)' },
    { id: 'gemini-3.1-flash-lite', label: 'gemini-3.1-flash-lite (Flash Lite - Fast & Efficient)' },
    { id: 'gemini-3.5-flash-lite', label: 'gemini-3.5-flash-lite (Flash Lite Next)' },
    { id: 'gemini-2.5-flash', label: 'gemini-2.5-flash (Standard Flash)' },
    { id: 'gemini-2.5-pro', label: 'gemini-2.5-pro (Deep Literary Reasoning)' },
    { id: 'gemini-3.1-pro-preview', label: 'gemini-3.1-pro-preview (Flagship Pro)' },
    { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
    { id: 'gemini-1.5-pro', label: 'gemini-1.5-pro' },
  ];

  const tones = [
    'Suspenseful & Atmospheric',
    'Gritty Noir & Visceral',
    'Poetic & Lyrical',
    'Humorous & Witty',
    'Formal & Victorian Classic',
    'Urgent & Fast-Paced',
    'Intimate & Vulnerable',
    'Epic & Mythic',
  ];

  const aiFeatures = [
    { id: 'proofread', label: 'Proofreading', desc: 'Grammar, spelling & prose flow' },
    { id: 'suggest', label: 'Prose Suggestions', desc: 'Tighten prose, sensory verbs' },
    { id: 'tone', label: 'Tone Adjustment', desc: 'Shift style to match mood' },
    { id: 'continue', label: 'Scene Continuation', desc: 'Continue seamlessly from cursor' },
    { id: 'expand', label: 'Expand Outline/Beat', desc: 'Transform notes into rich scene' },
    { id: 'summarize', label: 'Summarize Scene', desc: 'Dramatic beat-by-beat summary' },
    { id: 'dialogue', label: 'Dialogue Generator', desc: 'Character-authentic speech' },
    { id: 'plothole', label: 'Plot Hole Checker', desc: 'Audit continuity against bible' },
    { id: 'worldbuild', label: 'World-building', desc: 'Develop factions, lore & rules' },
    { id: 'titles', label: 'Titles & Taglines', desc: '5 compelling chapter/book hooks' },
    { id: 'custom', label: 'Custom Instruction', desc: 'Tailored prompt for current scene' },
  ] as const;

  const handleRunAI = async () => {
    if (!activeScene) {
      setErrorMessage('Please select a scene from the left outline to work on.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setAiResult(null);

    // Identify current chapter and book titles
    let currentChapterTitle = '';
    let currentBookTitle = '';
    project.books.forEach((b) => {
      b.acts.forEach((a) => {
        a.chapters.forEach((c) => {
          if (c.scenes.some((s) => s.id === activeScene.id)) {
            currentChapterTitle = c.title;
            currentBookTitle = b.title;
          }
        });
      });
    });

    try {
      const payload = {
        apiKey: settings.apiKey,
        model: settings.selectedModel,
        action: selectedAction,
        instruction: customInstruction,
        selectedText: selectedText || '',
        sceneContent: activeScene.content,
        sceneTitle: activeScene.title,
        chapterTitle: currentChapterTitle,
        bookTitle: currentBookTitle,
        projectInfo: {
          title: project.title,
          genre: project.genre,
          pov: project.pov,
          synopsis: project.synopsis,
        },
        characters: project.characters,
        locations: project.locations,
        plotNotes: project.plotCards,
        tone: selectedTone,
        targetWords: continuationWords,
        dialogueSpeakers: {
          speakerA: dialogueSpeakerA,
          speakerB: dialogueSpeakerB,
        },
      };

      const res = await fetch(apiUrl('/api/ai/action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete AI action');
      }

      setAiResult(data);
    } catch (err: any) {
      console.error('AI invocation error:', err);
      setErrorMessage(
        err.message || 'An error occurred while connecting to the Gemini API.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!aiResult?.output) return;
    navigator.clipboard.writeText(aiResult.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-full sm:w-96 max-w-full border-l border-border bg-card flex flex-col shrink-0 overflow-hidden h-full z-30 shadow-2xl lg:shadow-xl transition-all">
      {/* Top Header */}
      <div className="border-b border-border p-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground tracking-tight">AI Co-Author</h3>
            <div className="text-[10px] text-muted-foreground">
              Powered by Gemini
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenSettings}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              settings.apiKey
                ? 'text-emerald-500 hover:bg-emerald-500/10'
                : 'text-amber-500 hover:bg-amber-500/10 animate-pulse'
            }`}
            title={settings.apiKey ? 'API Key Configured' : 'Configure API Key in Settings'}
          >
            <Key className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Close AI Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Model & Reading Context Dossier */}
      <div className="p-2.5 bg-muted/30 border-b border-border/60 text-xs space-y-2">
        {/* Model Selector Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Cpu className="w-3 h-3 text-primary" />
            <span>Model:</span>
          </div>
          <select
            value={settings.selectedModel}
            onChange={(e) => onUpdateSettings({ ...settings, selectedModel: e.target.value })}
            className="text-xs bg-card border border-border/60 rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[210px] truncate"
          >
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* AI Reading Rules Indicator */}
        <div className="p-2 rounded bg-card/70 border border-border/40 text-[11px] space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <BookOpen className="w-3 h-3 text-primary" />
              Reading Active Context:
            </span>
            <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
              {activeScene ? `${activeScene.wordCount} words` : 'No scene'}
            </span>
          </div>
          <div className="text-muted-foreground truncate">
            {activeScene ? (
              <span>
                <strong className="text-foreground/90">{activeScene.title}</strong> · {project.characters.length} characters in bible · {project.locations.length} locations
              </span>
            ) : (
              <span className="italic text-amber-500">Select a scene to provide narrative context</span>
            )}
          </div>
          {selectedText && (
            <div className="text-[10px] text-primary/90 bg-primary/5 px-1.5 py-0.5 rounded truncate">
              Targeting selection: "{selectedText.slice(0, 45)}..."
            </div>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* Action Grid */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Select AI Action
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {aiFeatures.map((feat) => {
              const isSelected = selectedAction === feat.id;
              return (
                <button
                  key={feat.id}
                  onClick={() => setSelectedAction(feat.id as AIActionType)}
                  className={`p-2 rounded-md text-left transition-all border ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary shadow-xs font-semibold'
                      : 'bg-muted/20 border-border/40 text-foreground/80 hover:bg-muted/40 hover:text-foreground'
                  }`}
                >
                  <div className="text-xs truncate">{feat.label}</div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1">
                    {feat.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Specific Action Configs */}
        {selectedAction === 'tone' && (
          <div className="space-y-1.5 p-2.5 rounded-lg bg-muted/20 border border-border/50 text-xs">
            <label className="font-medium text-foreground">Target Tone & Style:</label>
            <select
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {tones.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedAction === 'continue' && (
          <div className="space-y-1.5 p-2.5 rounded-lg bg-muted/20 border border-border/50 text-xs">
            <label className="font-medium text-foreground">Continuation Length (approx words):</label>
            <div className="flex gap-2">
              {['150', '250', '400', '600'].map((w) => (
                <button
                  key={w}
                  onClick={() => setContinuationWords(w)}
                  className={`flex-1 py-1 rounded border text-xs ${
                    continuationWords === w
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-foreground hover:bg-muted'
                  }`}
                >
                  {w}w
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedAction === 'dialogue' && (
          <div className="space-y-2 p-2.5 rounded-lg bg-muted/20 border border-border/50 text-xs">
            <label className="font-medium text-foreground">Speaking Characters:</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-muted-foreground">Speaker 1:</span>
                <select
                  value={dialogueSpeakerA}
                  onChange={(e) => setDialogueSpeakerA(e.target.value)}
                  className="w-full bg-card border border-border rounded px-1.5 py-1 text-xs text-foreground"
                >
                  {project.characters.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">Speaker 2:</span>
                <select
                  value={dialogueSpeakerB}
                  onChange={(e) => setDialogueSpeakerB(e.target.value)}
                  className="w-full bg-card border border-border rounded px-1.5 py-1 text-xs text-foreground"
                >
                  {project.characters.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">Subtext / Objective:</span>
              <input
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="e.g. Aria interrogates Thorne about the missing ledger"
                className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground mt-0.5"
              />
            </div>
          </div>
        )}

        {(selectedAction === 'expand' || selectedAction === 'worldbuild' || selectedAction === 'custom') && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {selectedAction === 'expand'
                ? 'Outline Beat or Notes to Expand'
                : selectedAction === 'worldbuild'
                ? 'Worldbuilding Prompt'
                : 'Specific Instructions'}
            </label>
            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder={
                selectedAction === 'expand'
                  ? 'Paste beat notes or summarize what needs to happen in this scene...'
                  : selectedAction === 'worldbuild'
                  ? 'Describe a technology, culture, magical system, or historical event to flesh out...'
                  : 'Enter exact directions for the AI co-author...'
              }
              rows={3}
              className="w-full text-xs p-2.5 rounded-md bg-muted/30 border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-none leading-relaxed"
            />
          </div>
        )}

        {/* Primary Action Button */}
        <button
          onClick={handleRunAI}
          disabled={isLoading || !activeScene}
          className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Context & Writing...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" />
              <span>
                {selectedText ? 'Execute on Selected Passage' : 'Execute on Full Scene'}
              </span>
            </>
          )}
        </button>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-start gap-2 space-y-1">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="font-semibold">Generation Failed</div>
              <div className="text-[11px] text-foreground/80 leading-relaxed">
                {errorMessage}
              </div>
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={onOpenSettings}
                  className="text-[11px] font-semibold underline hover:text-foreground"
                >
                  Verify API Key & Model
                </button>
                <span>·</span>
                <button
                  onClick={handleRunAI}
                  className="text-[11px] font-semibold underline hover:text-foreground"
                >
                  Retry Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Output Result Section */}
        {aiResult && (
          <div className="p-3.5 rounded-xl border border-primary/30 bg-muted/30 space-y-3 shadow-xs">
            {/* Confidence & Explanation Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/50 text-xs">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-foreground">AI Co-Author Output</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                <span>Confidence:</span>
                <span className="font-bold text-amber-500">
                  {'★'.repeat(aiResult.confidence || 5)}
                  <span className="text-muted-foreground/30">
                    {'★'.repeat(5 - (aiResult.confidence || 5))}
                  </span>
                </span>
              </div>
            </div>

            {/* Explanation */}
            {aiResult.explanation && (
              <div className="text-[11px] text-muted-foreground leading-relaxed italic bg-card/60 p-2 rounded border border-border/40">
                "{aiResult.explanation}"
              </div>
            )}

            {/* Output Text Block */}
            <div className="relative">
              <div className="max-h-60 overflow-y-auto p-3 rounded-lg bg-card border border-border/80 text-xs font-serif leading-relaxed text-foreground whitespace-pre-wrap selection:bg-primary/20">
                {aiResult.output}
              </div>
            </div>

            {/* Application & Insertion Controls */}
            <div className="pt-1 space-y-1.5">
              <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Apply to Manuscript
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {selectedText ? (
                  <button
                    onClick={() => onApplyProse(aiResult.output, 'replace')}
                    className="py-1.5 px-2 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center justify-center gap-1 transition-colors"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Replace Selection
                  </button>
                ) : (
                  <button
                    onClick={() => onApplyProse(aiResult.output, 'append')}
                    className="py-1.5 px-2 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Append to Scene
                  </button>
                )}

                <button
                  onClick={() => onApplyProse(aiResult.output, 'insert')}
                  className="py-1.5 px-2 rounded bg-muted hover:bg-muted/80 text-foreground text-xs font-medium border border-border/60 flex items-center justify-center gap-1 transition-colors"
                >
                  <Feather className="w-3 h-3" />
                  Insert at Cursor
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleCopy}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 py-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied to clipboard' : 'Copy Output'}</span>
                </button>

                <button
                  onClick={handleRunAI}
                  className="text-xs text-primary hover:underline flex items-center gap-1 py-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
