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
  Trophy,
  Layers,
  ArrowRight,
  AlertCircle,
  X,
  Users,
  GitCommit,
  CheckCircle,
  User,
} from 'lucide-react';
import { Project, UserSettings, Character, PlotCard } from '../types/writing';
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
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [quote] = useState(() => WRITING_QUOTES[Math.floor(Math.random() * WRITING_QUOTES.length)]);

  // Grab the currently active project
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];

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

  // ---------------------------------------------------------------------------
  // GENERATE HEATMAP GRID DATA (Last 16 weeks / 112 days)
  // ---------------------------------------------------------------------------
  const renderHeatmap = () => {
    if (!activeProject) return null;

    const daysCount = 112; // 16 weeks
    const today = new Date();
    const dates: { dateStr: string; dateObj: Date; words: number }[] = [];

    // Fill dates backwards from today
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const statsEntry = activeProject.stats?.find((s) => s.date === dateStr);
      dates.push({
        dateStr,
        dateObj: d,
        words: statsEntry?.wordsAdded || 0,
      });
    }

    // Group dates into columns of 7 days (representing weeks)
    const weeks: typeof dates[] = [];
    for (let i = 0; i < dates.length; i += 7) {
      weeks.push(dates.slice(i, i + 7));
    }

    return (
      <div className="bg-card border border-border/80 rounded-lg p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Writing Activity Heatmap</span>
            </h3>
            <p className="text-[11px] text-muted-foreground">Daily word consistency for active project: {activeProject.title}</p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-800" />
            <span className="w-2.5 h-2.5 rounded bg-indigo-100 dark:bg-indigo-950/40" />
            <span className="w-2.5 h-2.5 rounded bg-indigo-300 dark:bg-indigo-800/60" />
            <span className="w-2.5 h-2.5 rounded bg-indigo-500 dark:bg-indigo-600" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid wrapper */}
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none justify-between">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1 shrink-0">
              {week.map((day, dIdx) => {
                let cellColor = 'bg-slate-200 dark:bg-slate-800';
                if (day.words > 0 && day.words < 300) {
                  cellColor = 'bg-indigo-100 dark:bg-indigo-950/40 border border-indigo-200/20';
                } else if (day.words >= 300 && day.words < 1000) {
                  cellColor = 'bg-indigo-300 dark:bg-indigo-800/60 border border-indigo-400/20';
                } else if (day.words >= 1000) {
                  cellColor = 'bg-indigo-500 dark:bg-indigo-600';
                }

                const dayLabel = day.dateObj.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={dIdx}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-xs transition-all hover:scale-110 hover:ring-2 hover:ring-primary/40 relative group ${cellColor}`}
                    title={`${dayLabel}: ${day.words.toLocaleString()} words written`}
                  >
                    {/* Compact custom rich tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 bg-slate-900 dark:bg-slate-950 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap">
                      <span className="font-semibold block">{dayLabel}</span>
                      <span className="text-indigo-300 font-mono">{day.words.toLocaleString()} words</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // GENERATE PLOTLINE VISUAL TIMELINE WIDGET
  // ---------------------------------------------------------------------------
  const renderPlotlineTimeline = () => {
    if (!activeProject) return null;
    const cards = [...(activeProject.plotCards || [])].sort((a, b) => a.order - b.order);

    return (
      <div className="bg-card border border-border/80 rounded-lg p-5 shadow-2xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <GitCommit className="w-4 h-4 text-indigo-500" />
            <span>Plotline Visual Timeline</span>
          </h3>
          <p className="text-[11px] text-muted-foreground">Horizontal sequence of plot beats & dramatic conflict arcs</p>
        </div>

        {cards.length === 0 ? (
          <div className="border border-dashed border-border/60 rounded-xl p-6 text-center text-xs text-muted-foreground">
            No plot cards defined. Set up beats inside your Plot Board to visualize them here!
          </div>
        ) : (
          <div className="relative flex items-center overflow-x-auto py-4 scrollbar-none gap-6 select-none">
            {/* Absolute horizontal wire-frame connector line */}
            <div className="absolute top-[38px] left-8 right-8 h-[2px] bg-border/60 -z-10" />

            {cards.map((card, idx) => {
              const statusColor =
                card.status === 'Done'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                  : card.status === 'Revised'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-600'
                  : card.status === 'Drafted'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                  : 'border-slate-500 bg-slate-500/10 text-slate-600';

              return (
                <div key={card.id} className="relative flex flex-col items-center shrink-0 w-44 group">
                  {/* Visual Node Dot */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-[10px] shadow-xs z-10 bg-card transition-all group-hover:scale-110 ${statusColor}`}>
                    {idx + 1}
                  </div>

                  {/* Beat Details Card */}
                  <div className="mt-3.5 bg-card/80 border border-border/80 hover:border-border rounded-lg p-2.5 text-center w-full shadow-2xs hover:shadow-xs transition-all">
                    <span className="text-[9px] uppercase tracking-wider font-bold block text-muted-foreground">
                      Act {card.act || '1'}
                    </span>
                    <h4 className="text-xs font-bold text-foreground truncate mt-0.5 leading-tight" title={card.title}>
                      {card.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                      {card.summary}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // GENERATE CHARACTER CAST GALLERY SIDEBAR WIDGET
  // ---------------------------------------------------------------------------
  const renderCharacterGallery = () => {
    if (!activeProject) return null;
    const cast = activeProject.characters || [];

    return (
      <div className="bg-card border border-border/80 rounded-lg p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Core Character Cast</span>
            </h3>
            <p className="text-[11px] text-muted-foreground">Click a portrait to inspect profile & backstory details</p>
          </div>
        </div>

        {cast.length === 0 ? (
          <div className="border border-dashed border-border/60 rounded-xl p-6 text-center text-xs text-muted-foreground leading-relaxed">
            No characters casted. Open your Characters Bible inside the editor to create your first cast list!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {cast.map((char) => {
              const ringColor =
                char.role === 'Protagonist'
                  ? 'border-indigo-500 ring-indigo-500/10'
                  : char.role === 'Antagonist'
                  ? 'border-red-500 ring-red-500/10'
                  : 'border-slate-500 ring-slate-500/10';

              return (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharacter(char)}
                  className="flex flex-col items-center bg-card hover:bg-accent/40 border border-border/60 hover:border-border/90 rounded-xl p-3 text-center transition-all shadow-3xs hover:shadow-2xs group"
                >
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-muted ring-4 shrink-0 transition-transform group-hover:scale-105 ${ringColor}`}>
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h4 className="text-xs font-bold text-foreground truncate w-full mt-2 leading-tight">
                    {char.name}
                  </h4>
                  <span className="text-[9px] font-semibold text-muted-foreground/80 mt-0.5 uppercase tracking-wider block">
                    {char.role}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background selection:bg-primary/20">
      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-6 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase text-muted-foreground">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>WriteAI</span>
              <span className="text-border">/</span>
              <span>Writing studio</span>
            </div>
            <h1 className="font-serif text-3xl leading-tight text-foreground sm:text-4xl">Your writing desk</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Pick up where you left off, or make room for a new story.
            </p>
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
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              title="Import project from a JSON backup"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button
              onClick={onCreateNewProject}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New project
            </button>
          </div>
        </header>

        <section aria-label="Library overview" className="grid grid-cols-2 border-b border-border/80 py-5 md:grid-cols-4">
          <div className="border-r border-border/70 py-2 pr-4 md:px-5 md:first:pl-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <FolderOpen className="h-4 w-4 text-sky-600" /> Projects
            </div>
            <p className="text-2xl font-semibold tabular-nums text-foreground">{projects.length}</p>
          </div>
          <div className="py-2 pl-4 md:border-r md:border-border/70 md:px-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <BookOpen className="h-4 w-4 text-emerald-700" /> Manuscript words
            </div>
            <p className="text-2xl font-semibold tabular-nums text-foreground">{globalTotalWords.toLocaleString()}</p>
          </div>
          <div className="border-r border-border/70 py-2 pr-4 md:border-r md:px-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Layers className="h-4 w-4 text-amber-700" /> Draft scenes
            </div>
            <p className="text-2xl font-semibold tabular-nums text-foreground">{globalTotalScenes}</p>
          </div>
          <div className="py-2 pl-4 md:px-5 md:pr-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Trophy className="h-4 w-4 text-rose-700" /> Daily word goal
            </div>
            <p className="text-2xl font-semibold tabular-nums text-foreground">{(settings.dailyWordGoal || 1000).toLocaleString()}</p>
          </div>
        </section>

        <div className="grid gap-9 py-8 lg:grid-cols-[minmax(0,1fr)_290px] lg:gap-12">
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl text-foreground">Project library</h2>
                <p className="mt-1 text-xs text-muted-foreground">{projects.length} {projects.length === 1 ? 'manuscript' : 'manuscripts'} in your workspace</p>
              </div>
              {activeProject && <span className="hidden text-xs text-muted-foreground sm:inline">Currently active: <strong className="font-semibold text-foreground">{activeProject.title}</strong></span>}
            </div>

            {projects.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center border border-dashed border-border bg-card/50 px-6 text-center">
                <BookOpen className="mb-3 h-6 w-6 text-muted-foreground" />
                <h3 className="font-serif text-lg text-foreground">Start with a blank page</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Create your first project to organize a manuscript, characters, and story beats.</p>
                <button onClick={onCreateNewProject} className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4" /> Create a project
                </button>
              </div>
            ) : (
              <div className="grid gap-3 xl:grid-cols-2">
                {projects.map((proj) => {
                  const wordsCount = getProjectWords(proj);
                  const targetCount = proj.targetWordCount || 80000;
                  const progressPercent = Math.min(100, Math.round((wordsCount / targetCount) * 100));
                  const isActive = proj.id === activeProjectId;

                  return (
                    <article key={proj.id} className={`flex min-w-0 flex-col border bg-card transition-colors ${isActive ? 'border-primary/60' : 'border-border/80 hover:border-border'}`}>
                      <div className="flex-1 p-4 sm:p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="truncate text-[10px] font-bold uppercase text-muted-foreground">{proj.genre}</span>
                          {isActive && <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Active</span>}
                        </div>
                        <h3 className="truncate font-serif text-xl text-foreground">{proj.title}</h3>
                        <p className="mt-1 min-h-10 text-xs leading-relaxed text-muted-foreground line-clamp-2">{proj.synopsis || 'No synopsis added yet.'}</p>

                        <div className="mt-5">
                          <div className="mb-2 flex items-baseline justify-between gap-2 text-xs">
                            <span className="min-w-0 truncate text-muted-foreground"><strong className="font-semibold tabular-nums text-foreground">{wordsCount.toLocaleString()}</strong> / {targetCount.toLocaleString()} words</span>
                            <span className="shrink-0 font-semibold tabular-nums text-foreground">{progressPercent}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden bg-muted" role="progressbar" aria-label={`${proj.title} word count progress`} aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
                            <div className="h-full bg-primary transition-[width] duration-500" style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>
                      </div>

                      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 bg-muted/20 px-4 py-3 sm:px-5">
                        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setProjectToDelete(proj.id)} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Delete project" aria-label={`Delete ${proj.title}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => exportProjectJSON(proj)} className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Download backup" aria-label={`Download ${proj.title} backup`}>
                            <Download className="h-4 w-4" />
                          </button>
                          <button onClick={() => onSelectProject(proj.id)} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-foreground hover:bg-muted/70'}`}>
                            Open studio <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </footer>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-8">
            <section className="border-l-2 border-primary/60 pl-5 py-1">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> A note for today
              </div>
              <blockquote className="font-serif text-lg leading-relaxed text-foreground">“{quote.text}”</blockquote>
              <p className="mt-3 text-xs font-semibold text-muted-foreground">{quote.author}</p>
            </section>
            {renderCharacterGallery()}
            <section className="border-t border-border/80 pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Your work stays yours</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Projects are stored locally in this browser. Export a JSON backup from any project when you need a separate copy.</p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <section className="grid gap-5 border-t border-border/80 py-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {renderHeatmap()}
          {renderPlotlineTimeline()}
        </section>
      </main>

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

      {/* Character Quick Inspect Modal */}
      {selectedCharacter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedCharacter(null)}
          />

          <div className="relative bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200 text-left z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center font-bold text-primary shrink-0">
                  {selectedCharacter.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{selectedCharacter.name}</h3>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                    {selectedCharacter.role} {selectedCharacter.archetype && `· ${selectedCharacter.archetype}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCharacter(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {selectedCharacter.traits?.length > 0 && (
                <div>
                  <h4 className="font-bold text-foreground">Personality Traits</h4>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                    {selectedCharacter.traits.join(' · ')}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-foreground">Core Motivation</h4>
                <p className="text-muted-foreground mt-0.5 leading-relaxed font-serif italic">
                  "{selectedCharacter.motivation}"
                </p>
              </div>

              <div>
                <h4 className="font-bold text-foreground">Core Conflict</h4>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">
                  {selectedCharacter.conflict}
                </p>
              </div>

              {selectedCharacter.backstory && (
                <div>
                  <h4 className="font-bold text-foreground">Backstory Summary</h4>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed font-serif line-clamp-4">
                    {selectedCharacter.backstory}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-border/60 mt-2">
              <button
                onClick={() => setSelectedCharacter(null)}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-colors shadow-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
