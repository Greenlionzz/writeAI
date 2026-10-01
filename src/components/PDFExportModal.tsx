import React, { useState } from 'react';
import {
  FileText,
  X,
  Download,
  Check,
  BookOpen,
  Layers,
  Settings2,
  FileCheck,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Project } from '../types/writing';
import {
  exportProjectPDF,
  PDFExportOptions,
  PDFExportProgress,
} from '../utils/pdfExport';

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onProgressChange?: (progress: PDFExportProgress | null) => void;
}

export const PDFExportModal: React.FC<PDFExportModalProps> = ({
  isOpen,
  onClose,
  project,
  onProgressChange,
}) => {
  const books = project.books || [];

  const [scope, setScope] = useState<'all' | 'current-book'>('all');
  const [selectedBookId, setSelectedBookId] = useState<string>(
    books[0]?.id || ''
  );
  const [pageSize, setPageSize] = useState<'letter' | 'a4'>('letter');
  const [fontStyle, setFontStyle] = useState<'times' | 'helvetica'>('times');

  const [includeTitlePage, setIncludeTitlePage] = useState(true);
  const [includeToc, setIncludeToc] = useState(true);
  const [includeSynopsis, setIncludeSynopsis] = useState(true);
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [includeRunningHeaders, setIncludeRunningHeaders] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<PDFExportProgress | null>(
    null
  );

  // Compute metrics for scope
  const targetBooks =
    scope === 'current-book'
      ? books.filter((b) => b.id === selectedBookId)
      : books;

  let totalActs = 0;
  let totalChapters = 0;
  let totalScenes = 0;
  let totalWords = 0;

  targetBooks.forEach((b) => {
    b.acts?.forEach((a) => {
      totalActs++;
      a.chapters?.forEach((c) => {
        totalChapters++;
        c.scenes?.forEach((s) => {
          totalScenes++;
          totalWords += s.wordCount || 0;
        });
      });
    });
  });

  const estimatedPages = Math.max(
    3,
    Math.ceil(totalWords / 280) +
      (includeTitlePage ? 1 : 0) +
      (includeToc ? 1 : 0)
  );

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    const initialProgress: PDFExportProgress = {
      percent: 5,
      stage: 'Preparing document layout & typography...',
      detail: `Scope: ${scope === 'all' ? 'All volumes' : 'Single volume'}`,
    };
    setCurrentProgress(initialProgress);
    onProgressChange?.(initialProgress);

    try {
      const options: PDFExportOptions = {
        scope,
        bookId: selectedBookId,
        pageSize,
        fontStyle,
        includeTitlePage,
        includeToc,
        includeSynopsis,
        includePageNumbers,
        includeRunningHeaders,
        onProgress: (p) => {
          setCurrentProgress(p);
          onProgressChange?.(p);
        },
      };

      await exportProjectPDF(project, options);
      setExportSuccess(true);
      setTimeout(() => {
        setIsExporting(false);
        setCurrentProgress(null);
        onProgressChange?.(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setIsExporting(false);
      setCurrentProgress(null);
      onProgressChange?.(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 selection:bg-primary/20"
      onClick={() => {
        if (!isExporting) onClose();
      }}
    >
      <div
        className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Export Manuscript to PDF
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate a typeset, print-ready PDF preserving acts, chapters, and scene formatting
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Visual Progress Indicator while processing */}
          {isExporting && currentProgress && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 border border-purple-500/30 space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground block text-xs">
                      {currentProgress.stage}
                    </span>
                    {currentProgress.detail && (
                      <span className="text-[11px] text-muted-foreground block truncate max-w-sm mt-0.5">
                        {currentProgress.detail}
                      </span>
                    )}
                  </div>
                </div>

                <span className="font-mono text-sm font-extrabold text-purple-600 dark:text-purple-400 tabular-nums">
                  {currentProgress.percent}%
                </span>
              </div>

              {/* Progress bar container */}
              <div className="w-full h-2.5 bg-muted/70 rounded-full overflow-hidden p-0.5 border border-border/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 transition-all duration-300 ease-out shadow-xs"
                  style={{ width: `${currentProgress.percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                <span>Preserving chapter structure & scene dividers</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {currentProgress.percent === 100
                    ? 'Finalizing...'
                    : 'Typesetting in progress...'}
                </span>
              </div>
            </div>
          )}

          {/* Success banner */}
          {exportSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
              <Check className="w-4 h-4 shrink-0" />
              <span>
                Document successfully generated and downloaded! Preserved all chapter headings and formatting.
              </span>
            </div>
          )}

          {/* Summary Scope Card */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/70 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-foreground text-sm block">
                {project.title}
              </span>
              <span className="text-muted-foreground mt-0.5 block">
                By {project.author} · {project.genre}
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-foreground tabular-nums text-sm block">
                ~{estimatedPages} pages
              </span>
              <span className="text-[11px] text-muted-foreground">
                {totalChapters} chapters · {totalWords.toLocaleString()} words
              </span>
            </div>
          </div>

          {/* Export Scope: Entire Project or Current Book */}
          {books.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Export Scope
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => setScope('all')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    scope === 'all'
                      ? 'bg-primary/10 border-primary text-foreground font-semibold'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  } disabled:opacity-50`}
                >
                  <div>Complete Series</div>
                  <div className="text-[10px] text-muted-foreground font-normal">
                    All {books.length} volumes in project
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => setScope('current-book')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    scope === 'current-book'
                      ? 'bg-primary/10 border-primary text-foreground font-semibold'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  } disabled:opacity-50`}
                >
                  <div>Single Book</div>
                  <div className="text-[10px] text-muted-foreground font-normal">
                    Select specific volume
                  </div>
                </button>
              </div>

              {scope === 'current-book' && (
                <div className="pt-1.5">
                  <select
                    disabled={isExporting}
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    className="w-full p-2 rounded-lg bg-card border border-border text-foreground text-xs font-medium focus:ring-1 focus:ring-primary disabled:opacity-50"
                  >
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        Volume {b.volumeNumber}: {b.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Typesetting & Page Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Paper Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Paper Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => setPageSize('letter')}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    pageSize === 'letter'
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  } disabled:opacity-50`}
                >
                  US Letter (8.5 × 11")
                </button>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => setPageSize('a4')}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    pageSize === 'a4'
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  } disabled:opacity-50`}
                >
                  Standard A4 (210 × 297mm)
                </button>
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Typeface Family
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => setFontStyle('times')}
                  className={`py-2 px-3 rounded-lg border text-xs transition-all ${
                    fontStyle === 'times'
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  } disabled:opacity-50`}
                >
                  Classic Serif (Book)
                </button>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => setFontStyle('helvetica')}
                  className={`py-2 px-3 rounded-lg border text-xs transition-all ${
                    fontStyle === 'helvetica'
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  } disabled:opacity-50`}
                >
                  Modern Sans
                </button>
              </div>
            </div>
          </div>

          {/* Book Elements Checklist */}
          <div className="space-y-2 pt-1 border-t border-border/60">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
              Document Structure & Elements
            </label>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isExporting}
                  checked={includeTitlePage}
                  onChange={(e) => setIncludeTitlePage(e.target.checked)}
                  className="rounded text-primary focus:ring-primary disabled:opacity-50"
                />
                <span className="text-foreground">
                  Include Formal Title Page (Title, Subtitle, Author, Metadata)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isExporting}
                  checked={includeToc}
                  onChange={(e) => setIncludeToc(e.target.checked)}
                  className="rounded text-primary focus:ring-primary disabled:opacity-50"
                />
                <span className="text-foreground">
                  Include Table of Contents (Structured by Acts & Chapters)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isExporting}
                  checked={includeSynopsis}
                  onChange={(e) => setIncludeSynopsis(e.target.checked)}
                  className="rounded text-primary focus:ring-primary disabled:opacity-50"
                />
                <span className="text-foreground">
                  Include Story Synopsis & Epigraph
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isExporting}
                  checked={includeRunningHeaders}
                  onChange={(e) => setIncludeRunningHeaders(e.target.checked)}
                  className="rounded text-primary focus:ring-primary disabled:opacity-50"
                />
                <span className="text-foreground">
                  Include Running Headers (Book title & Author)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isExporting}
                  checked={includePageNumbers}
                  onChange={(e) => setIncludePageNumbers(e.target.checked)}
                  className="rounded text-primary focus:ring-primary disabled:opacity-50"
                />
                <span className="text-foreground">
                  Include Running Footers with Page Numbers
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border/80 bg-muted/20 flex items-center justify-between shrink-0">
          <button
            type="button"
            disabled={isExporting}
            onClick={onClose}
            className="px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-colors disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md transition-all disabled:opacity-50"
          >
            {exportSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Downloaded PDF!</span>
              </>
            ) : isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {currentProgress?.percent ? `Typesetting (${currentProgress.percent}%)...` : 'Generating PDF...'}
                </span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Book PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
