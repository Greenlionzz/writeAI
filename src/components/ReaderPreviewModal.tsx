import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Printer,
  Sun,
  Moon,
  Coffee,
  Type,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Project, Scene, UserSettings } from '../types/writing';

// Safe helper to parse inline Markdown into React nodes
const parseInlineMarkdown = (text: string): React.ReactNode[] => {
  // Split the text by inline tags: bold (**), italic (*), strikethrough (~~), and underline (<u>...</u>)
  const regex = /(\*\*.*?\*\*|\*.*?\*|~~.*?~~|<u>.*?<\/u>)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return (
        <del key={idx} className="line-through opacity-75">
          {part.slice(2, -2)}
        </del>
      );
    }
    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      return (
        <u key={idx} className="underline">
          {part.slice(3, -4)}
        </u>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

// Helper to render lines with headings, blockquotes, or dividers
const renderParagraphWithMarkdown = (para: string, pIdx: number) => {
  const trimmed = para.trim();
  if (!trimmed) return null;

  // Scene break separator
  if (trimmed === '* * *' || trimmed === '***') {
    return (
      <div key={pIdx} className="py-6 text-center tracking-widest opacity-55 font-mono text-xs select-none">
        * * *
      </div>
    );
  }

  // Heading H1
  if (trimmed.startsWith('# ')) {
    return (
      <h1 key={pIdx} className="text-2xl md:text-3xl font-bold tracking-tight mt-8 mb-4 border-b border-current/10 pb-2 font-serif text-foreground">
        {parseInlineMarkdown(trimmed.slice(2))}
      </h1>
    );
  }

  // Heading H2
  if (trimmed.startsWith('## ')) {
    return (
      <h2 key={pIdx} className="text-xl md:text-2xl font-bold tracking-tight mt-6 mb-3 font-serif text-foreground">
        {parseInlineMarkdown(trimmed.slice(3))}
      </h2>
    );
  }

  // Heading H3
  if (trimmed.startsWith('### ')) {
    return (
      <h3 key={pIdx} className="text-lg md:text-xl font-bold tracking-tight mt-5 mb-2 font-serif text-foreground">
        {parseInlineMarkdown(trimmed.slice(4))}
      </h3>
    );
  }

  // Blockquote
  if (trimmed.startsWith('> ')) {
    return (
      <blockquote key={pIdx} className="border-l-4 border-primary/40 pl-4 py-1 italic my-4 text-muted-foreground/90 leading-relaxed font-serif">
        {parseInlineMarkdown(trimmed.slice(2))}
      </blockquote>
    );
  }

  // Standard paragraph
  return (
    <p
      key={pIdx}
      className={pIdx === 0 ? 'prose-drop-cap text-justify leading-relaxed font-serif' : 'indent-6 text-justify leading-relaxed font-serif'}
    >
      {parseInlineMarkdown(trimmed)}
    </p>
  );
};

interface ReaderPreviewModalProps {
  project: Project;
  onClose: () => void;
  settings: UserSettings;
}

export const ReaderPreviewModal: React.FC<ReaderPreviewModalProps> = ({
  project,
  onClose,
  settings,
}) => {
  const [readerTheme, setReaderTheme] = useState<'paper' | 'sepia' | 'dark'>('paper');
  const [fontSize, setFontSize] = useState<number>(19);
  const [fontFamily, setFontFamily] = useState<string>(settings.editorFontFamily || 'Newsreader');

  const getThemeClasses = () => {
    switch (readerTheme) {
      case 'sepia':
        return 'bg-[#F4ECD8] text-[#3E3127] selection:bg-[#E3D1B4]';
      case 'dark':
        return 'bg-[#121214] text-[#E4E4E7] selection:bg-slate-700';
      case 'paper':
      default:
        return 'bg-[#FAF8F5] text-[#1A1A1A] selection:bg-amber-100';
    }
  };

  const getCardBg = () => {
    switch (readerTheme) {
      case 'sepia':
        return 'bg-[#FDFBF7] border-[#EADFCB] shadow-lg';
      case 'dark':
        return 'bg-[#1C1C1F] border-[#2E2E33] shadow-xl';
      case 'paper':
      default:
        return 'bg-[#FFFFFF] border-[#EFECE6] shadow-xl';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col select-none animate-in fade-in duration-200">
      {/* Top Floating Control Bar */}
      <div className="h-14 bg-card/90 backdrop-blur border-b border-border px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-primary" />
          <div>
            <h3 className="text-xs font-bold text-foreground truncate max-w-sm">
              {project.title} · Reader Preview
            </h3>
            <span className="text-[10px] text-muted-foreground">
              By {project.author} · Formatted Book Layout
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Typography Font Selector Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
            <span className="hidden md:inline font-medium">Font:</span>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="bg-muted border border-border/80 text-foreground rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              title="Change reading typeface"
            >
              <option value="Newsreader">Newsreader Serif</option>
              <option value="Plus Jakarta Sans">Clean Sans</option>
              <option value="JetBrains Mono">Monospace</option>
              <option value="Lora">Lora Book Serif</option>
              <option value="Playfair Display">Playfair Elegance</option>
            </select>
          </div>

          {/* Font Size Adjusters */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <button
              onClick={() => setFontSize(Math.max(15, fontSize - 2))}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Decrease Font Size"
            >
              A-
            </button>
            <span className="text-[11px] tabular-nums">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(26, fontSize + 2))}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* Reader Palette Switcher */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md text-xs">
            <button
              onClick={() => setReaderTheme('paper')}
              className={`p-1.5 rounded ${
                readerTheme === 'paper' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
              }`}
              title="Paper Light"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setReaderTheme('sepia')}
              className={`p-1.5 rounded ${
                readerTheme === 'sepia' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
              }`}
              title="Warm Sepia"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setReaderTheme('dark')}
              className={`p-1.5 rounded ${
                readerTheme === 'dark' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
              }`}
              title="Midnight Dark"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Print Manuscript"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted ml-2"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Book Reader Viewport */}
      <div className={`flex-1 overflow-y-auto px-4 py-12 flex justify-center transition-colors ${getThemeClasses()}`}>
        <article
          className={`w-full max-w-2xl p-8 md:p-14 rounded-2xl border transition-all select-text ${getCardBg()}`}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.85,
            fontFamily:
              fontFamily === 'Plus Jakarta Sans'
                ? '"Plus Jakarta Sans", sans-serif'
                : fontFamily === 'JetBrains Mono'
                ? '"JetBrains Mono", monospace'
                : fontFamily === 'Lora'
                ? '"Lora", serif'
                : fontFamily === 'Playfair Display'
                ? '"Playfair Display", serif'
                : '"Newsreader", serif',
          }}
        >
          {/* Title Page */}
          <header className="text-center py-12 border-b border-current/15 mb-14">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              {project.title}
            </h1>
            {project.subtitle && (
              <p className="text-lg opacity-80 italic mb-4">{project.subtitle}</p>
            )}
            <div className="text-sm uppercase tracking-widest opacity-60">
              By {project.author}
            </div>
            {project.synopsis && (
              <p className="mt-8 text-sm italic opacity-75 max-w-lg mx-auto leading-relaxed">
                "{project.synopsis}"
              </p>
            )}
          </header>

          {/* Manuscript Flow */}
          <div className="space-y-12">
            {project.books.map((book) => (
              <div key={book.id} className="space-y-12">
                {book.acts.map((act) => (
                  <div key={act.id} className="space-y-10">
                    <div className="text-center py-6">
                      <span className="text-xs uppercase tracking-widest opacity-50 block mb-1">
                        Act Division
                      </span>
                      <h2 className="text-xl md:text-2xl font-bold tracking-wide uppercase">
                        {act.title}
                      </h2>
                    </div>

                    {act.chapters.map((chapter) => (
                      <div key={chapter.id} className="space-y-8">
                        <div className="border-b border-current/10 pb-3">
                          <h3 className="text-xl font-bold tracking-tight">
                            {chapter.title}
                          </h3>
                        </div>

                        {chapter.scenes.map((scene) => (
                          <section key={scene.id} className="space-y-4">
                            <h4 className="text-sm font-semibold opacity-60 italic">
                              {scene.title}
                            </h4>
                            <div className="space-y-4 text-justify">
                              {scene.content
                                .split('\n\n')
                                .map((para, pIdx) => renderParagraphWithMarkdown(para, pIdx))}
                            </div>
                          </section>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* The End */}
          <div className="py-16 text-center text-sm uppercase tracking-widest opacity-50 font-semibold">
            · To Be Continued ·
          </div>
        </article>
      </div>
    </div>
  );
};
