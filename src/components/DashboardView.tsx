import React, { useRef, useState } from 'react';
import {
  FolderOpen,
  BookOpen,
  Plus,
  Trash2,
  Upload,
  Download,
  Sparkles,
  Clock,
  TrendingUp,
  Compass,
  Trophy,
  Layers,
  ArrowRight,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';
import { Project, UserSettings } from '../types/writing';
import { exportProjectJSON } from '../utils/storage';

interface DashboardViewProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateNewProject: () => void;
  onImportProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  settings: UserSettings;
}

// Famous inspirational writing quotes
const WRITING_QUOTES = [
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou" },
  { text: "We are all apprentices in a craft where no one ever becomes a master.", author: "Ernest Hemingway" },
  { text: "If there's a book that you want to read, but it hasn't been written yet, then you must write it.", author: "Toni Morrison" },
  { text: "The first draft is just you telling yourself the story.", author: "Terry Pratchett" },
  { text: "You can't use up creativity. The more you use, the more you have.", author: "Maya Angelou" },
  { text: "Write what should not be forgotten.", author: "Isabel Allende" },
  { text: "Start before you're ready. Don't prepare. Write.", author: "Steven Pressfield" },
  { text: "You must write for yourself, and if others like it, that's a bonus.", author: "Stephen King" },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateNewProject,
  onImportProject,
  onDeleteProject,
  settings,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [quote] = useState(() => WRITING_QUOTES[Math.floor(Math.random() * WRITING_QUOTES.length)]);

  // Helper to calculate total words inside a project
  const getProjectWords = (project: Project): number => {
    let total = 0;
    project.books?.forEach((b) => {
      b.acts?.forEach((a) => {
        a.chapters?.forEach((c) => {
          c.scenes?.forEach((s) => {
            total += s.wordCount || 0;
          });
        });
      });
    });
    return total;
  };

  // Helper to calculate total scenes count
  const getProjectScenesCount = (project: Project): number => {
    let total = 0;
    project.books?.forEach((b) => {
      b.acts?.forEach((a) => {
        a.chapters?.forEach((c) => {
          total += c.scenes?.length || 0;
        });
      });
    });
    return total;
  };

  // Global calculations across all projects in the library
  const globalTotalWords = projects.reduce((acc, p) => acc + getProjectWords(p), 0);
  const globalTotalScenes = projects.reduce((acc, p) => acc + getProjectScenesCount(p), 0);

  // JSON Import Trigger
  const handleFileImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.id && json.title && Array.isArray(json.books)) {
          // Add random ID suffix to prevent duplicate key collisions
          const importedProject: Project = {
            ...json,
            id: `${json.id}_imported_${Date.now()}`,
            title: `${json.title} (Imported)`,
            updatedAt: new Date().toISOString(),
          };
          onImportProject(importedProject);
          alert(`Successfully imported "${importedProject.title}" to your library!`);
        } else {
          alert('Invalid file format. Please select a valid WriteAI Backup JSON file.');
        }
      } catch (err) {
        alert('Error parsing JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background/50 selection:bg-primary/20">
      {/* 1. Hero Welcome & Inspiration Banner */}
      <div className="relative px-4 sm:px-8 pt-8 pb-12 overflow-hidden bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent border-b border-border/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Studio Workspace Dashboard</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-serif leading-tight">
              Welcome back, Writer.
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              Your stories are waiting. Open an ongoing manuscript below to continue sculpting your worlds, or start a clean project to capture a fresh spark of inspiration.
            </p>
          </div>

          <div className="md:max-w-xs shrink-0 bg-card/60 backdrop-blur-xs border border-border/80 rounded-xl p-4 shadow-xs">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">
              Daily Inspiration
            </span>
            <p className="text-xs italic text-muted-foreground leading-relaxed font-serif">
              "{quote.text}"
            </p>
            <span className="text-[10px] font-semibold text-foreground/80 mt-1.5 block text-right">
              — {quote.author}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {/* 2. Global Library Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border/80 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center gap-2.5 text-muted-foreground mb-1.5">
              <FolderOpen className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold">Total Projects</span>
            </div>
            <span className="text-2xl font-extrabold text-foreground tracking-tight leading-none">
              {projects.length}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-1">In local storage library</span>
          </div>

          <div className="bg-card border border-border/80 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center gap-2.5 text-muted-foreground mb-1.5">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-semibold">Manuscript Words</span>
            </div>
            <span className="text-2xl font-extrabold text-foreground tracking-tight leading-none">
              {globalTotalWords.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-1">Across all project drafts</span>
          </div>

          <div className="bg-card border border-border/80 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center gap-2.5 text-muted-foreground mb-1.5">
              <Layers className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-semibold">Draft Scenes</span>
            </div>
            <span className="text-2xl font-extrabold text-foreground tracking-tight leading-none">
              {globalTotalScenes}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-1">Fully mapped & outlined</span>
          </div>

          <div className="bg-card border border-border/80 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center gap-2.5 text-muted-foreground mb-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold">Creative Streak</span>
            </div>
            <span className="text-2xl font-extrabold text-foreground tracking-tight leading-none flex items-center gap-1.5">
              <span>{settings.dailyWordGoal ? 'Active' : 'Ready'}</span>
            </span>
            <span className="text-[10px] text-muted-foreground block mt-1">
              Goal: {settings.dailyWordGoal || 1000}w daily
            </span>
          </div>
        </div>

        {/* 3. Main Project Library Grid */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">Your Project Library</h2>
                <p className="text-xs text-muted-foreground">Select a manuscript to enter the writing studio workspace.</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileImportChange}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-card text-xs font-medium text-muted-foreground hover:text-foreground transition-all shadow-2xs"
                  title="Import project from an existing JSON backup file"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Import Backup</span>
                </button>
                <button
                  onClick={onCreateNewProject}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Project</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.map((proj) => {
                const wordsCount = getProjectWords(proj);
                const targetCount = proj.targetWordCount || 80000;
                const progressPercent = Math.min(100, Math.round((wordsCount / targetCount) * 100));
                const isActive = proj.id === activeProjectId;

                return (
                  <div
                    key={proj.id}
                    className={`group bg-card rounded-xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative shadow-2xs ${
                      isActive
                        ? 'border-primary shadow-sm hover:shadow-md'
                        : 'border-border/80 hover:border-border hover:shadow-xs'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
                    )}

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Genre / Tag Row */}
                        <div className="flex items-center justify-between gap-2 mb-3.5">
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-muted text-muted-foreground">
                            {proj.genre}
                          </span>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              <span>Active Project</span>
                            </span>
                          )}
                        </div>

                        {/* Project Title */}
                        <h3 className="text-base font-bold text-foreground tracking-tight font-serif group-hover:text-primary transition-colors truncate">
                          {proj.title}
                        </h3>
                        {proj.synopsis && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-serif italic">
                            "{proj.synopsis}"
                          </p>
                        )}
                      </div>

                      {/* Progress Bar Row */}
                      <div className="mt-5">
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <div className="flex items-center gap-1 text-muted-foreground font-medium">
                            <FileText className="w-3.5 h-3.5 text-muted-foreground/80" />
                            <span className="font-bold tabular-nums text-foreground">
                              {wordsCount.toLocaleString()}
                            </span>
                            <span>/ {targetCount.toLocaleString()} words</span>
                          </div>
                          <span className="font-mono font-bold text-primary">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="px-5 py-3.5 bg-muted/30 border-t border-border/50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                        <Clock className="w-3 h-3 text-muted-foreground/60" />
                        <span>Last modified: {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectToDelete(proj.id);
                          }}
                          className="p-1.5 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors shadow-2xs"
                          title="Delete Project permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Export Project JSON Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportProjectJSON(proj);
                          }}
                          className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors shadow-2xs"
                          title="Download Backup JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Launch/Open Button */}
                        <button
                          onClick={() => onSelectProject(proj.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs border ${
                            isActive
                              ? 'bg-primary border-primary text-primary-foreground hover:bg-primary/95 hover:scale-[1.02]'
                              : 'bg-card border-border/80 text-foreground hover:bg-accent'
                          }`}
                        >
                          <span>Open Studio</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Sidebar Panels */}
          <div className="w-full md:w-80 flex flex-col gap-6 shrink-0">
            {/* Quick Tutorial Card */}
            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-2.5">
                <Compass className="w-4 h-4 text-primary" />
                <span>WriteAI Quick-Start Tips</span>
              </h3>
              <ul className="text-xs text-muted-foreground space-y-3 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-foreground">AI Co-Author:</strong> Press the Sparkles icon or highlight text to invoke prompt options directly in line with your canvas.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-foreground">Plot Architecture:</strong> Use the Plot Board to plan plotlines, beats, and keep notes perfectly synchronized.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>
                    <strong className="text-foreground">Formatting Book PDF:</strong> Export polished, standard PDF drafts containing custom typography, page numbering, and title sheets.
                  </span>
                </li>
              </ul>
            </div>

            {/* Local Storage Notice Card */}
            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-2xs flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Offline-First Design</h4>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  All projects are safely backed up locally inside your browser's Local Storage. Feel free to use the <strong>Export Backup (.json)</strong> buttons to keep secondary files saved on your system!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setProjectToDelete(null)}
          />

          <div className="relative bg-card border border-border rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200 text-left z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-bold">Delete Project?</h3>
              </div>
              <button
                onClick={() => setProjectToDelete(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this project? This will permanently erase the manuscript draft, book outlines, character bible, locations, and statistics. This action is irreversible.
            </p>

            <div className="flex justify-end gap-2.5 mt-6">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (projectToDelete) {
                    onDeleteProject(projectToDelete);
                    setProjectToDelete(null);
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/95 transition-colors shadow-sm"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
