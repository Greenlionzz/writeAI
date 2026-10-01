import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  LayoutGrid,
  Users,
  Compass,
  Calendar,
  Download,
  Settings,
  FolderOpen,
  Plus,
  Eye,
  Columns,
  Moon,
  Sun,
  Coffee,
  Check,
  Keyboard,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  Search,
  Loader2,
  PanelLeft,
  MoreVertical,
} from 'lucide-react';
import { Project, UserSettings } from '../types/writing';
import {
  exportProjectJSON,
  exportProjectHTML,
  exportProjectEPUB,
  exportProjectODT,
} from '../utils/storage';
import { exportProjectPDF, PDFExportProgress } from '../utils/pdfExport';
import { PDFExportModal } from './PDFExportModal';

interface HeaderProps {
  project: Project;
  activeView: 'dashboard' | 'manuscript' | 'plotboard' | 'characters' | 'locations' | 'schedule';
  setActiveView: (view: 'dashboard' | 'manuscript' | 'plotboard' | 'characters' | 'locations' | 'schedule') => void;
  showAIPanel: boolean;
  setShowAIPanel: (show: boolean) => void;
  splitReferenceOpen: boolean;
  setSplitReferenceOpen: (open: boolean) => void;
  onOpenSettings: () => void;
  onOpenProjectLibrary: () => void;
  onNewProject: () => void;
  onOpenReaderPreview: () => void;
  onOpenKeyboardShortcuts?: () => void;
  onOpenGlobalSearch?: () => void;
  onToggleMobileOutline?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  savedStatus: string;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  activeView,
  setActiveView,
  showAIPanel,
  setShowAIPanel,
  splitReferenceOpen,
  setSplitReferenceOpen,
  onOpenSettings,
  onOpenProjectLibrary,
  onNewProject,
  onOpenReaderPreview,
  onOpenKeyboardShortcuts,
  onOpenGlobalSearch,
  onToggleMobileOutline,
  isFocusMode = false,
  onToggleFocusMode,
  settings,
  onUpdateSettings,
  savedStatus,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showProjectsMenu, setShowProjectsMenu] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);

  // References for outside-click menu dismissals
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const projectsMenuRef = useRef<HTMLDivElement>(null);
  const mobileMoreMenuRef = useRef<HTMLDivElement>(null);

  // Click outside menu auto-closing effect
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (showExportMenu && exportMenuRef.current && !exportMenuRef.current.contains(target)) {
        setShowExportMenu(false);
      }
      if (showProjectsMenu && projectsMenuRef.current && !projectsMenuRef.current.contains(target)) {
        setShowProjectsMenu(false);
      }
      if (showMobileMoreMenu && mobileMoreMenuRef.current && !mobileMoreMenuRef.current.contains(target)) {
        setShowMobileMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showExportMenu, showProjectsMenu, showMobileMoreMenu]);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfExportProgress, setPdfExportProgress] = useState<PDFExportProgress | null>(null);

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : settings.theme === 'light' ? 'sepia' : 'dark';
    onUpdateSettings({ ...settings, theme: nextTheme });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'manuscript', label: 'Manuscript', icon: BookOpen },
    { id: 'plotboard', label: 'Plot Board', icon: LayoutGrid },
    { id: 'characters', label: 'Characters', icon: Users },
    { id: 'locations', label: 'Locations', icon: Compass },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
  ] as const;

  return (
    <header className="h-14 border-b border-border bg-card/95 backdrop-blur px-2.5 sm:px-4 flex items-center justify-between shrink-0 select-none z-30 transition-colors gap-2">
      {/* Zone 1: Brand & Project Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
        {/* Toggle Mobile Outline Button (only when in manuscript view on screens < lg) */}
        {activeView === 'manuscript' && onToggleMobileOutline && (
          <button
            onClick={onToggleMobileOutline}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/50 transition-colors shrink-0"
            title="Open Scenes & Outline"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('dashboard');
          }}
          className="text-sm sm:text-base font-semibold tracking-tight text-foreground flex items-center gap-1 hover:opacity-90 shrink-0"
        >
          <span className="font-serif italic text-base sm:text-lg text-primary">Write</span>
          <span className="font-sans font-bold text-[10px] sm:text-xs uppercase tracking-widest px-1 py-0.5 rounded bg-primary/10 text-primary hidden xs:inline">
            AI
          </span>
        </a>

        <div className="h-4 w-[1px] bg-border mx-0.5 hidden xs:block" />

        <div className="relative min-w-0" ref={projectsMenuRef}>
          <button
            onClick={() => setShowProjectsMenu(!showProjectsMenu)}
            className="flex items-center gap-1 sm:gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-1.5 sm:px-2 py-1 rounded-md hover:bg-accent transition-colors max-w-[80px] xs:max-w-[110px] sm:max-w-[130px] xl:max-w-[210px] truncate"
            title={project.title}
          >
            <span className="truncate">{project.title}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">▾</span>
          </button>

          {showProjectsMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-60 rounded-lg shadow-xl border border-border bg-popover text-popover-foreground py-1.5 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Current Project
              </div>
              <div className="px-3 py-1 text-xs font-medium text-foreground truncate">
                {project.title}
              </div>
              <div className="px-3 text-[11px] text-muted-foreground mb-1.5">
                {project.genre} · {project.books.length} {project.books.length === 1 ? 'Book' : 'Books'}
              </div>
              <div className="h-[1px] bg-border my-1" />
              <button
                onClick={() => {
                  setShowProjectsMenu(false);
                  onOpenProjectLibrary();
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent flex items-center gap-2 text-foreground"
              >
                <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Open Project Library</span>
              </button>
              <button
                onClick={() => {
                  setShowProjectsMenu(false);
                  onNewProject();
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent flex items-center gap-2 text-foreground"
              >
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Create New Project</span>
              </button>
            </div>
          )}
        </div>

        {savedStatus && (
          <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="hidden xl:inline">{savedStatus}</span>
          </span>
        )}
      </div>

      {/* Zone 2: Navigation Links (desktop) */}
      <nav className="hidden lg:flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/40 shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-card text-foreground shadow-xs border border-border/50 font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{item.label}</span>
              <span className="lg:hidden">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Actions & AI Co-Author */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Toggle Split Reference (manuscript view only) */}
        {activeView === 'manuscript' && (
          <button
            onClick={() => setSplitReferenceOpen(!splitReferenceOpen)}
            className={`p-1.5 rounded-md text-xs transition-colors hidden sm:flex ${
              splitReferenceOpen
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Toggle Split Reference Panel (Characters & Plot)"
          >
            <Columns className="w-4 h-4" />
          </button>
        )}

        {/* Reader Preview (desktop) */}
        <button
          onClick={onOpenReaderPreview}
          className="p-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors hidden lg:flex"
          title="Reader Preview (Formatted Book Mode)"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Global Search Button */}
        {onOpenGlobalSearch && (
          <button
            onClick={onOpenGlobalSearch}
            className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted border border-border/40 transition-colors shadow-2xs"
            title="Search characters, locations & scenes (Ctrl+P)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px] font-normal">Search...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[9px] font-mono text-muted-foreground/80 bg-card rounded border border-border/80">
              Ctrl+P
            </kbd>
          </button>
        )}

        {/* Theme Switcher (desktop) */}
        <button
          onClick={toggleTheme}
          className="px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors hidden lg:flex items-center gap-1.5 border border-border/40"
          title={`Active Theme: ${settings.theme.toUpperCase()} (Click to toggle: Dark → Light → Sepia)`}
        >
          {settings.theme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-blue-400" />
          ) : settings.theme === 'light' ? (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <Coffee className="w-3.5 h-3.5 text-amber-700 dark:text-amber-500" />
          )}
          <span className="text-[11px] capitalize font-medium hidden lg:inline">
            {settings.theme}
          </span>
        </button>

        {/* Focus Mode Toggle (tablet & desktop) */}
        {onToggleFocusMode && (
          <button
            onClick={onToggleFocusMode}
            className={`px-2 py-1.5 rounded-md text-xs transition-colors border hidden xl:flex items-center gap-1.5 ${
              isFocusMode
                ? 'bg-primary text-primary-foreground border-primary shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted border-border/40'
            }`}
            title={
              isFocusMode
                ? 'Exit Focus Mode (Ctrl+F or Esc)'
                : 'Enter Focus Mode - Distraction-free full-screen writing (Ctrl+F)'
            }
          >
            {isFocusMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium hidden xl:inline">Exit Focus</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium hidden xl:inline">Focus</span>
              </>
            )}
          </button>
        )}

        {/* Keyboard Shortcuts Sheet (large desktop) */}
        {onOpenKeyboardShortcuts && (
          <button
            onClick={onOpenKeyboardShortcuts}
            className="p-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/40 hidden xl:flex"
            title="Keyboard Shortcuts Cheat Sheet (Ctrl+/)"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Visual PDF Generation Progress Pill in Header */}
        {pdfExportProgress && (
          <button
            onClick={() => setShowPDFModal(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-500/15 via-purple-500/15 to-indigo-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs shadow-2xs hover:opacity-90 transition-all cursor-pointer animate-in fade-in duration-200"
            title={`${pdfExportProgress.stage} (${pdfExportProgress.percent}%) - Click to open PDF options`}
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 dark:text-purple-400 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-foreground leading-tight">
                {pdfExportProgress.percent}%
              </span>
              <div className="w-10 sm:w-16 h-1 bg-purple-500/20 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300"
                  style={{ width: `${pdfExportProgress.percent}%` }}
                />
              </div>
            </div>
          </button>
        )}

        {/* Export Dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors border border-border/40"
            title="Export Manuscript"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
            <span className="text-[9px]">▾</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-lg shadow-xl border border-border bg-popover text-popover-foreground py-1 z-50">
              <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Export Manuscript
              </div>
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  setShowPDFModal(true);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-accent flex items-center justify-between text-foreground font-semibold border-b border-border/40 group ${
                  pdfExportProgress ? 'bg-purple-500/10' : 'bg-primary/5'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {pdfExportProgress ? (
                    <Loader2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                  )}
                  <span>
                    {pdfExportProgress
                      ? `Generating (${pdfExportProgress.percent}%)...`
                      : 'Formatted Book PDF'}
                  </span>
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold shadow-2xs ${
                    pdfExportProgress
                      ? 'bg-purple-600 text-white font-mono'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {pdfExportProgress ? `${pdfExportProgress.percent}%` : '.pdf'}
                </span>
              </button>
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  exportProjectHTML(project);
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent flex items-center justify-between text-foreground"
              >
                <span>Standalone HTML Book</span>
                <span className="text-[10px] text-muted-foreground">.html</span>
              </button>
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  exportProjectEPUB(project);
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent flex items-center justify-between text-foreground"
              >
                <span>Standard EPUB E-Book</span>
                <span className="text-[10px] text-muted-foreground">.epub</span>
              </button>
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  exportProjectODT(project);
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent flex items-center justify-between text-foreground"
              >
                <span>Word / ODT Document</span>
                <span className="text-[10px] text-muted-foreground">.odt</span>
              </button>
              <div className="h-[1px] bg-border my-1" />
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  exportProjectJSON(project);
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent flex items-center justify-between text-foreground"
              >
                <span>Project JSON Backup</span>
                <span className="text-[10px] text-muted-foreground">.json</span>
              </button>
            </div>
          )}
        </div>

        {/* Settings button (desktop) */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors hidden xl:flex"
          title="Settings & Gemini API Key"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Mobile Overflow Menu Button (mobile only) */}
        <div className="relative xl:hidden" ref={mobileMoreMenuRef}>
          <button
            onClick={() => setShowMobileMoreMenu(!showMobileMoreMenu)}
            className="p-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/40"
            title="More Options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMobileMoreMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl shadow-xl border border-border bg-card p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setShowMobileMoreMenu(false);
                  toggleTheme();
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-md flex items-center justify-between text-foreground"
              >
                <span className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Theme</span>
                </span>
                <span className="text-[10px] capitalize text-muted-foreground font-mono">{settings.theme}</span>
              </button>

              <button
                onClick={() => {
                  setShowMobileMoreMenu(false);
                  onOpenReaderPreview();
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-md flex items-center gap-2 text-foreground"
              >
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>Reader Mode</span>
              </button>

              {onToggleFocusMode && (
                <button
                  onClick={() => {
                    setShowMobileMoreMenu(false);
                    onToggleFocusMode();
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-md flex items-center gap-2 text-foreground"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{isFocusMode ? 'Exit Focus Mode' : 'Focus Mode'}</span>
                </button>
              )}

              {onOpenKeyboardShortcuts && (
                <button
                  onClick={() => {
                    setShowMobileMoreMenu(false);
                    onOpenKeyboardShortcuts();
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-md flex items-center gap-2 text-foreground"
                >
                  <Keyboard className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Shortcuts</span>
                </button>
              )}

              <div className="h-[1px] bg-border my-1" />

              <button
                onClick={() => {
                  setShowMobileMoreMenu(false);
                  onOpenSettings();
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-md flex items-center gap-2 text-foreground font-medium"
              >
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Settings & API Key</span>
              </button>
            </div>
          )}
        </div>

        {/* AI Co-Author Toggle */}
        <button
          onClick={() => setShowAIPanel(!showAIPanel)}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-xs shrink-0 ${
            showAIPanel
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-primary/10 text-primary hover:bg-primary/20'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Co-Author</span>
          <span className="sm:hidden text-[11px]">AI</span>
        </button>
      </div>

      {/* PDF Export Modal */}
      <PDFExportModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        project={project}
        onProgressChange={setPdfExportProgress}
      />
    </header>
  );
};
