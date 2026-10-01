import React, { useState, useEffect, useMemo } from 'react';
import { Keyboard, X, Search, Command, Check } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  id: string;
  category: 'formatting' | 'editor' | 'workflow';
  label: string;
  description: string;
  macKeys: string[];
  winKeys: string[];
}

const SHORTCUTS: ShortcutItem[] = [
  // Formatting
  {
    id: 'bold',
    category: 'formatting',
    label: 'Bold Text',
    description: 'Toggle strong bold emphasis on selected prose',
    macKeys: ['⌘', 'B'],
    winKeys: ['Ctrl', 'B'],
  },
  {
    id: 'italic',
    category: 'formatting',
    label: 'Italic Text',
    description: 'Toggle cursive italic emphasis on selected prose',
    macKeys: ['⌘', 'I'],
    winKeys: ['Ctrl', 'I'],
  },
  {
    id: 'underline',
    category: 'formatting',
    label: 'Underline Text',
    description: 'Underline selected words or passages',
    macKeys: ['⌘', 'U'],
    winKeys: ['Ctrl', 'U'],
  },
  {
    id: 'strike',
    category: 'formatting',
    label: 'Strikethrough',
    description: 'Cross out dialogue or obsolete draft passages',
    macKeys: ['⌘', 'Shift', 'X'],
    winKeys: ['Ctrl', 'Shift', 'X'],
  },
  {
    id: 'h1',
    category: 'formatting',
    label: 'Heading 1',
    description: 'Format current line as major chapter title (#)',
    macKeys: ['⌘', '⌥', '1'],
    winKeys: ['Ctrl', 'Alt', '1'],
  },
  {
    id: 'h2',
    category: 'formatting',
    label: 'Heading 2',
    description: 'Format line as secondary act or scene heading (##)',
    macKeys: ['⌘', '⌥', '2'],
    winKeys: ['Ctrl', 'Alt', '2'],
  },
  {
    id: 'h3',
    category: 'formatting',
    label: 'Heading 3',
    description: 'Format line as subsection heading (###)',
    macKeys: ['⌘', '⌥', '3'],
    winKeys: ['Ctrl', 'Alt', '3'],
  },
  {
    id: 'quote',
    category: 'formatting',
    label: 'Blockquote',
    description: 'Format passage as blockquote (>)',
    macKeys: ['⌘', '⌥', 'Q'],
    winKeys: ['Ctrl', 'Alt', 'Q'],
  },
  {
    id: 'bullet_list',
    category: 'formatting',
    label: 'Bulleted List',
    description: 'Insert unordered bulleted list item (-)',
    macKeys: ['⌘', '⌥', 'L'],
    winKeys: ['Ctrl', 'Alt', 'L'],
  },
  {
    id: 'num_list',
    category: 'formatting',
    label: 'Numbered List',
    description: 'Insert ordered sequential list item (1.)',
    macKeys: ['⌘', '⌥', 'N'],
    winKeys: ['Ctrl', 'Alt', 'N'],
  },
  {
    id: 'divider',
    category: 'formatting',
    label: 'Scene Divider Break',
    description: 'Insert canonical three-star manuscript separator (* * *)',
    macKeys: ['⌘', '⌥', 'D'],
    winKeys: ['Ctrl', 'Alt', 'D'],
  },

  // Editor Navigation & Search
  {
    id: 'save',
    category: 'editor',
    label: 'Quick Save Manuscript',
    description: 'Force immediate snapshot save without waiting for debounce',
    macKeys: ['⌘', 'S'],
    winKeys: ['Ctrl', 'S'],
  },
  {
    id: 'focus',
    category: 'editor',
    label: 'Focus Writing Mode',
    description: 'Toggle distraction-free full-screen writing (hides all sidebars)',
    macKeys: ['⌘', 'F'],
    winKeys: ['Ctrl', 'F'],
  },
  {
    id: 'find',
    category: 'editor',
    label: 'Find & Replace',
    description: 'Open the in-scene manuscript search and replace toolbar',
    macKeys: ['⌘', '⌥', 'F'],
    winKeys: ['Ctrl', 'Alt', 'F'],
  },
  {
    id: 'history',
    category: 'editor',
    label: 'Version History',
    description: 'Open scene revisions, snapshots, and restore points',
    macKeys: ['⌘', 'Shift', 'H'],
    winKeys: ['Ctrl', 'Shift', 'H'],
  },
  {
    id: 'shortcuts',
    category: 'editor',
    label: 'Keyboard Shortcuts Sheet',
    description: 'Open this hotkey reference modal at any time',
    macKeys: ['⌘', '/'],
    winKeys: ['Ctrl', '/'],
  },

  // Workflow & AI
  {
    id: 'ai',
    category: 'workflow',
    label: 'Toggle AI Co-Author',
    description: 'Open Gemini drafting, critique, and dialogue assist panel',
    macKeys: ['⌘', 'K'],
    winKeys: ['Ctrl', 'K'],
  },
  {
    id: 'split',
    category: 'workflow',
    label: 'Toggle Split Reference',
    description: 'Open character bible & worldbuilding side-by-side drawer',
    macKeys: ['⌘', '\\'],
    winKeys: ['Ctrl', '\\'],
  },
  {
    id: 'comment',
    category: 'workflow',
    label: 'Comment on Selection',
    description: 'Attach revision note or critique to selected passage',
    macKeys: ['⌘', 'Shift', 'C'],
    winKeys: ['Ctrl', 'Shift', 'C'],
  },
  {
    id: 'search',
    category: 'workflow',
    label: 'Global Project Search',
    description: 'Quickly find characters, locations, dialogue, or scenes across manuscript',
    macKeys: ['⌘', 'P'],
    winKeys: ['Ctrl', 'P'],
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMac, setIsMac] = useState(true);

  // Auto-detect Mac / PC
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator?.platform) {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
    }
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return SHORTCUTS;
    const q = searchQuery.toLowerCase();
    return SHORTCUTS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.winKeys.join(' ').toLowerCase().includes(q) ||
        s.macKeys.join(' ').toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const categories = [
    { id: 'formatting', label: 'Rich Text Formatting' },
    { id: 'editor', label: 'Editor & Navigation' },
    { id: 'workflow', label: 'Manuscript & AI Workflow' },
  ] as const;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 selection:bg-primary/20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-border/70 flex items-center justify-between bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Keyboard Shortcuts Cheat Sheet
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Instant editor hotkeys for seamless drafting and formatting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mac vs Windows toggle */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/40 text-xs">
              <button
                type="button"
                onClick={() => setIsMac(true)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  isMac
                    ? 'bg-card text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                macOS (⌘)
              </button>
              <button
                type="button"
                onClick={() => setIsMac(false)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  !isMac
                    ? 'bg-card text-foreground shadow-2xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Windows / Linux (Ctrl)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-border/50 bg-muted/20">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts (e.g. bold, find, heading, save)..."
              autoFocus
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-card border border-border text-foreground text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Shortcuts List Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {categories.map((cat) => {
            const items = filteredShortcuts.filter((s) => s.category === cat.id);
            if (items.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-2.5">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {cat.label}
                </div>

                <div className="divide-y divide-border/40 rounded-xl border border-border/60 bg-muted/10 overflow-hidden">
                  {items.map((item) => {
                    const keys = isMac ? item.macKeys : item.winKeys;

                    return (
                      <div
                        key={item.id}
                        className="px-3.5 py-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors"
                      >
                        <div className="space-y-0.5 pr-4">
                          <div className="text-xs font-semibold text-foreground">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-muted-foreground leading-snug">
                            {item.description}
                          </div>
                        </div>

                        {/* Keys Badge */}
                        <div className="flex items-center gap-1 shrink-0">
                          {keys.map((k, idx) => (
                            <React.Fragment key={idx}>
                              <kbd className="px-2 py-1 rounded bg-card border border-border text-foreground text-[11px] font-mono shadow-2xs min-w-[24px] text-center font-semibold">
                                {k}
                              </kbd>
                              {idx < keys.length - 1 && (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  +
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredShortcuts.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground italic">
              No shortcuts found matching "{searchQuery}".
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 border-t border-border/60 bg-muted/20 px-5 flex items-center justify-between text-xs text-muted-foreground">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-mono text-[10px]">Esc</kbd> or click outside to dismiss</span>
          <span>Open anytime with <kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-mono text-[10px]">{isMac ? '⌘' : 'Ctrl'} + /</kbd></span>
        </div>
      </div>
    </div>
  );
};
