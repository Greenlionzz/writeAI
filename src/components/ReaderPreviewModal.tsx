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
import { Project, Scene } from '../types/writing';

interface ReaderPreviewModalProps {
  project: Project;
  onClose: () => void;
}

export const ReaderPreviewModal: React.FC<ReaderPreviewModalProps> = ({
  project,
  onClose,
}) => {
  const [readerTheme, setReaderTheme] = useState<'paper' | 'sepia' | 'dark'>('paper');
  const [fontSize, setFontSize] = useState<number>(19);
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');

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
          {/* Font Family */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md text-xs">
            <button
              onClick={() => setFontFamily('serif')}
              className={`px-2 py-1 rounded font-serif ${
                fontFamily === 'serif' ? 'bg-card text-foreground font-semibold shadow-xs' : 'text-muted-foreground'
              }`}
            >
              Serif
            </button>
            <button
              onClick={() => setFontFamily('sans')}
              className={`px-2 py-1 rounded font-sans ${
                fontFamily === 'sans' ? 'bg-card text-foreground font-semibold shadow-xs' : 'text-muted-foreground'
              }`}
            >
              Sans
            </button>
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
          className={`w-full max-w-2xl p-8 md:p-14 rounded-2xl border transition-colors select-text ${getCardBg()} ${
            fontFamily === 'serif' ? 'font-serif' : 'font-sans'
          }`}
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.85 }}
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
                                .map((para, pIdx) => {
                                  const trimmed = para.trim();
                                  if (!trimmed) return null;
                                  if (trimmed === '* * *' || trimmed === '***') {
                                    return (
                                      <div
                                        key={pIdx}
                                        className="py-4 text-center tracking-widest opacity-50 font-mono text-xs"
                                      >
                                        * * *
                                      </div>
                                    );
                                  }
                                  return (
                                    <p
                                      key={pIdx}
                                      className={pIdx === 0 ? 'prose-drop-cap' : 'indent-6'}
                                    >
                                      {trimmed}
                                    </p>
                                  );
                                })}
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
