import React, { useState } from 'react';
import {
  Settings,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Palette,
  Type,
  Cpu,
  Shield,
  Target,
} from 'lucide-react';
import { UserSettings } from '../types/writing';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(settings.selectedModel || 'gemini-3.8-flash');
  const [customModel, setCustomModel] = useState('');
  const [theme, setTheme] = useState(settings.theme || 'dark');
  const [editorFontSize, setEditorFontSize] = useState(settings.editorFontSize || 18);
  const [editorFontFamily, setEditorFontFamily] = useState(
    settings.editorFontFamily || 'Newsreader'
  );
  const [dailyWordGoal, setDailyWordGoal] = useState<number>(
    settings.dailyWordGoal || 1000
  );
  const [spellcheckEnabled, setSpellcheckEnabled] = useState<boolean>(
    settings.spellcheckEnabled !== false
  );

  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  if (!isOpen) return null;

  const standardModels = [
    { id: 'gemini-3.8-flash', label: 'gemini-3.8-flash (Recommended Fast & Fluid)' },
    { id: 'gemini-3.1-flash-lite', label: 'gemini-3.1-flash-lite (Flash Lite - Fast & Efficient)' },
    { id: 'gemini-3.5-flash-lite', label: 'gemini-3.5-flash-lite (Flash Lite Next)' },
    { id: 'gemini-2.5-flash', label: 'gemini-2.5-flash (Standard Flash)' },
    { id: 'gemini-2.5-pro', label: 'gemini-2.5-pro (Deep Literary Fiction)' },
    { id: 'gemini-3.1-pro-preview', label: 'gemini-3.1-pro-preview (Flagship Pro)' },
    { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
    { id: 'gemini-1.5-pro', label: 'gemini-1.5-pro' },
  ];

  const handleTestKey = async () => {
    setTestingStatus('testing');
    setTestMessage('');

    try {
      const activeModel = customModel.trim() || selectedModel;
      const res = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: activeModel,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestingStatus('success');
        setTestMessage(`Successfully authenticated with model: ${data.model}`);
      } else {
        setTestingStatus('error');
        setTestMessage(data.error || 'Authentication failed. Please verify your API key.');
      }
    } catch (err: any) {
      setTestingStatus('error');
      setTestMessage(err.message || 'Network error while contacting authentication server.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveModel = customModel.trim() || selectedModel;

    onSaveSettings({
      ...settings,
      apiKey: apiKey.trim(),
      selectedModel: effectiveModel,
      theme,
      editorFontSize,
      editorFontFamily,
      dailyWordGoal: Math.max(50, Number(dailyWordGoal) || 1000),
      spellcheckEnabled,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-card">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Settings & Gemini Configuration
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Manage your API key, active model, and studio preferences
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Gemini API Key Section */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Key className="w-3.5 h-3.5 text-primary" />
                <span>Gemini API Key</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Stored securely in local environment
              </span>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key (AIzaSy...)"
                className="w-full pr-10 pl-3 py-2 rounded-md bg-card border border-border text-foreground font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="text-[11px] text-muted-foreground leading-relaxed">
              If left blank, WriteAI will attempt to utilize the studio's automatically configured server key.
            </div>

            {/* Test Connection Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testingStatus === 'testing'}
                className="px-3 py-1.5 rounded-md bg-card border border-border hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {testingStatus === 'testing' ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                    <span>Verifying key...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3 h-3 text-primary" />
                    <span>Test API Connection</span>
                  </>
                )}
              </button>

              {testingStatus === 'success' && (
                <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Connection Verified</span>
                </div>
              )}

              {testingStatus === 'error' && (
                <div className="flex items-center gap-1 text-[11px] text-destructive font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Error connecting</span>
                </div>
              )}
            </div>

            {testMessage && (
              <div
                className={`p-2 rounded text-[11px] leading-relaxed ${
                  testingStatus === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                {testMessage}
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span>Default AI Model</span>
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {standardModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            <div>
              <span className="text-[10px] text-muted-foreground">
                Or enter any custom Gemini model identifier:
              </span>
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g. gemini-3.8-flash or gemini-2.5-pro"
                className="w-full mt-1 p-2 rounded-md bg-muted/20 border border-border text-foreground text-xs"
              />
            </div>
          </div>

          {/* Theme & Palette */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-primary" />
              <span>Studio Theme</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dark', label: 'Dark Slate' },
                { id: 'sepia', label: 'Warm Sepia' },
                { id: 'light', label: 'Daylight' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id as any)}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    theme === t.id
                      ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                      : 'bg-muted/20 border-border text-foreground hover:bg-muted/40'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Editor Typography */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-primary" />
              <span>Manuscript Typography</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'Newsreader', label: 'Newsreader Serif' },
                { id: 'Plus Jakarta Sans', label: 'Clean Sans' },
                { id: 'JetBrains Mono', label: 'Monospace' },
                { id: 'Lora', label: 'Lora Book Serif' },
                { id: 'Playfair Display', label: 'Playfair Elegance' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setEditorFontFamily(f.id as any)}
                  className={`px-3 py-2 rounded-lg border text-xs text-center transition-all flex-1 min-w-[120px] ${
                    editorFontFamily === f.id
                      ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                      : 'bg-muted/20 border-border text-foreground hover:bg-muted/40'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Editor Font Size:</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="14"
                  max="26"
                  value={editorFontSize}
                  onChange={(e) => setEditorFontSize(parseInt(e.target.value, 10))}
                  className="w-32 accent-primary"
                />
                <span className="font-mono text-xs tabular-nums text-foreground w-8">
                  {editorFontSize}px
                </span>
              </div>
            </div>
          </div>

          {/* Daily Writing Goal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span>Daily Word Count Goal</span>
              </label>
              <span className="font-mono text-xs text-foreground font-bold">
                {dailyWordGoal.toLocaleString()} words/day
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="50"
                step="50"
                max="20000"
                value={dailyWordGoal}
                onChange={(e) =>
                  setDailyWordGoal(
                    Math.max(50, parseInt(e.target.value, 10) || 500)
                  )
                }
                className="w-full bg-card border border-border rounded-md px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. 1000"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              {[500, 1000, 1500, 2000, 2500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDailyWordGoal(preset)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-colors ${
                    dailyWordGoal === preset
                      ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {preset.toLocaleString()}w
                </button>
              ))}
            </div>
          </div>

          {/* Spellcheck Preference */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>🔴</span>
                <span>Real-Time Spell Check</span>
              </label>
              <p className="text-[10px] text-muted-foreground">
                Highlight typos in real-time with red wavy underlines
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={spellcheckEnabled}
                onChange={(e) => setSpellcheckEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted/80 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Footer Save */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md hover:bg-muted text-muted-foreground text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
