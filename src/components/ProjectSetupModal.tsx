import React, { useState } from 'react';
import {
  BookOpen,
  FolderOpen,
  Plus,
  Upload,
  Sparkles,
  Layers,
  ChevronRight,
  Book,
  Clock,
  X,
  Target,
} from 'lucide-react';
import { Project, POVType, Book as BookType } from '../types/writing';
import { defaultDemoProject } from '../data/defaultProject';

interface ProjectSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (project: Project) => void;
  onImportProject: (project: Project) => void;
  mode: 'welcome' | 'new';
}

export const ProjectSetupModal: React.FC<ProjectSetupModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onImportProject,
  mode: initialMode,
}) => {
  const [viewState, setViewState] = useState<'welcome' | 'new'>(initialMode);

  // New Project Form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('Sci-Fi / Cyberpunk');
  const [format, setFormat] = useState<'Novel' | 'Series' | 'Novella' | 'Short Story'>('Novel');
  const [pov, setPov] = useState<POVType>('Third Person Limited');
  const [synopsis, setSynopsis] = useState('');
  const [targetWordCount, setTargetWordCount] = useState('80000');
  const [dailyWordGoal, setDailyWordGoal] = useState('1000');
  const [template, setTemplate] = useState<'standalone' | 'series' | 'mystery' | 'scifi' | 'short'>('standalone');

  if (!isOpen) return null;

  const handleTemplateSelect = (tmpl: 'standalone' | 'series' | 'mystery' | 'scifi' | 'short') => {
    setTemplate(tmpl);
    switch (tmpl) {
      case 'mystery':
        setGenre('Mystery / Crime Thriller');
        setTargetWordCount('75000');
        setFormat('Novel');
        setPov('Third Person Limited');
        break;
      case 'scifi':
        setGenre('Sci-Fi / Space Opera');
        setTargetWordCount('95000');
        setFormat('Novel');
        setPov('Third Person Limited');
        break;
      case 'series':
        setGenre('Epic Fantasy');
        setTargetWordCount('110000');
        setFormat('Series');
        setPov('Third Person Omniscient');
        break;
      case 'short':
        setGenre('Literary Fiction');
        setTargetWordCount('15000');
        setFormat('Short Story');
        setPov('First Person');
        break;
      case 'standalone':
      default:
        setGenre('Fiction / General');
        setTargetWordCount('80000');
        setFormat('Novel');
        setPov('Third Person Limited');
        break;
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const projectId = `proj_${Date.now()}`;
    const bookId = `book_${Date.now()}`;
    const act1Id = `act_1_${Date.now()}`;
    const act2Id = `act_2_${Date.now()}`;
    const act3Id = `act_3_${Date.now()}`;
    const chap1Id = `chap_1_${Date.now()}`;
    const scene1Id = `scene_1_${Date.now()}`;

    const newProject: Project = {
      id: projectId,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      author: author.trim() || 'Anonymous Author',
      genre: genre.trim() || 'Fiction',
      format,
      pov,
      synopsis: synopsis.trim(),
      targetWordCount: parseInt(targetWordCount, 10) || 80000,
      dailyWordGoal: parseInt(dailyWordGoal, 10) || 1000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      books: [
        {
          id: bookId,
          projectId,
          title: format === 'Series' ? `Book 1: ${title.trim()}` : title.trim(),
          volumeNumber: 1,
          synopsis: synopsis.trim(),
          targetWords: parseInt(targetWordCount, 10) || 80000,
          acts: [
            {
              id: act1Id,
              bookId,
              title: 'Act I: Setup & Catalyst',
              order: 1,
              chapters: [
                {
                  id: chap1Id,
                  actId: act1Id,
                  title: 'Chapter 1: The Inciting Incident',
                  order: 1,
                  scenes: [
                    {
                      id: scene1Id,
                      chapterId: chap1Id,
                      title: 'Scene 1: Opening Hook',
                      order: 1,
                      synopsis: 'Establish the status quo and introduce the protagonist.',
                      content: `The morning began like any other, until the knocking at the front door refused to cease.\n\n`,
                      status: 'In Progress',
                      wordCount: 16,
                      comments: [],
                      versions: [],
                      updatedAt: new Date().toISOString(),
                    },
                  ],
                },
              ],
            },
            {
              id: act2Id,
              bookId,
              title: 'Act II: Confrontation & Rising Stakes',
              order: 2,
              chapters: [],
            },
            {
              id: act3Id,
              bookId,
              title: 'Act III: Climax & Resolution',
              order: 3,
              chapters: [],
            },
          ],
        },
      ],
      characters: [
        {
          id: `char_lead_${Date.now()}`,
          name: 'Main Protagonist',
          role: 'Protagonist',
          appearance: 'Determined expression, watchful gaze.',
          traits: ['Resourceful', 'Cautious', 'Observant'],
          motivation: 'To uncover the truth before time runs out.',
          conflict: 'Haunted by a mistake from the past.',
          colorTag: '#3B82F6',
        },
      ],
      locations: [
        {
          id: `loc_main_${Date.now()}`,
          name: 'Primary Setting',
          type: 'City / Main Hub',
          sensoryDetails: 'Crowded streets, echoing footfalls, the scent of rain and old stone.',
          loreAndSignificance: 'The heart of the story where events unfold.',
        },
      ],
      plotCards: [
        {
          id: `plot_init_${Date.now()}`,
          act: 'Act I',
          title: 'The Spark',
          summary: 'The event that irrevocably disrupts the protagonist’s normal world.',
          tags: ['Inciting Incident'],
          status: 'Outlined',
          order: 1,
        },
      ],
      stats: [
        {
          date: new Date().toISOString().split('T')[0],
          wordsAdded: 16,
          totalWords: 16,
          writingMinutes: 5,
        },
      ],
    };

    onCreateProject(newProject);
    onClose();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.title && parsed.books) {
          onImportProject(parsed);
          onClose();
        } else {
          alert('Invalid project backup file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {viewState === 'welcome' ? 'Project Library & Hub' : 'Create New Writing Project'}
              </h2>
              <p className="text-xs text-muted-foreground">
                WriteAI · Professional Novelist Studio & Universe Planner
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewState === 'new' && (
              <button
                onClick={() => setViewState('welcome')}
                className="text-xs px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Back to Library
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View State: Welcome & Library */}
        {viewState === 'welcome' && (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Quick Actions Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setViewState('new')}
                className="p-4 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all text-left space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                    <Plus className="w-4 h-4 text-primary" />
                    <span>Create New Project</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Start a fresh novel, series, or short story with customizable narrative structure.
                </p>
              </button>

              <label className="p-4 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-all text-left space-y-1.5 cursor-pointer group">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span>Import Backup File</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Restore a previously exported .json manuscript backup with full character bible.
                </p>
              </label>
            </div>

            {/* Existing Projects Library */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Your Projects ({projects.length})
                </h3>
              </div>

              <div className="space-y-2.5">
                {projects.map((proj) => {
                  const isActive = proj.id === activeProjectId;
                  let wordCount = 0;
                  proj.books.forEach((b) => {
                    b.acts.forEach((a) => {
                      a.chapters.forEach((c) => {
                        c.scenes.forEach((s) => {
                          wordCount += s.wordCount || 0;
                        });
                      });
                    });
                  });

                  return (
                    <div
                      key={proj.id}
                      onClick={() => {
                        onSelectProject(proj.id);
                        onClose();
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                        isActive
                          ? 'bg-card border-primary ring-1 ring-primary/40 shadow-xs'
                          : 'bg-card/60 border-border/70 hover:border-border hover:bg-card'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground truncate">
                            {proj.title}
                          </h4>
                          {isActive && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>By {proj.author}</span>
                          <span>·</span>
                          <span>{proj.genre}</span>
                          <span>·</span>
                          <span className="font-mono tabular-nums">{wordCount.toLocaleString()} words</span>
                        </div>
                        {proj.synopsis && (
                          <p className="text-xs text-muted-foreground/80 line-clamp-1 italic pt-0.5">
                            "{proj.synopsis}"
                          </p>
                        )}
                      </div>

                      <button
                        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-muted group-hover:bg-primary group-hover:text-primary-foreground text-foreground transition-colors shrink-0"
                      >
                        Open Workspace
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* View State: Create New Project Wizard */}
        {viewState === 'new' && (
          <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
            {/* Template Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Choose Structure Preset / Template
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { id: 'standalone', label: 'Standalone', desc: 'Classic 3-Act Novel' },
                  { id: 'mystery', label: 'Mystery / Noir', desc: 'Clues & Suspects' },
                  { id: 'scifi', label: 'Sci-Fi Opera', desc: 'High Tech & Factions' },
                  { id: 'series', label: 'Epic Series', desc: 'Multi-Book Universe' },
                  { id: 'short', label: 'Short Story', desc: 'Single Arc Novella' },
                ].map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleTemplateSelect(tmpl.id as any)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      template === tmpl.id
                        ? 'bg-primary/10 border-primary text-primary font-semibold shadow-xs'
                        : 'bg-muted/20 border-border text-foreground hover:bg-muted/40'
                    }`}
                  >
                    <div className="truncate">{tmpl.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{tmpl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Project / Book Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Echoes of the Void"
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. A Chronological Mystery"
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                />
              </div>
            </div>

            {/* Author, Genre, Format */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Author Name
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your Name or Pen Name"
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Genre
                </label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Sci-Fi / Noir"
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                >
                  <option value="Novel">Novel</option>
                  <option value="Series">Series (Multi-Book)</option>
                  <option value="Novella">Novella</option>
                  <option value="Short Story">Short Story</option>
                </select>
              </div>
            </div>

            {/* POV & Word Goals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Narrative Point of View (POV)
                </label>
                <select
                  value={pov}
                  onChange={(e) => setPov(e.target.value as POVType)}
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                >
                  <option value="Third Person Limited">Third Person Limited</option>
                  <option value="First Person">First Person</option>
                  <option value="Third Person Omniscient">Third Person Omniscient</option>
                  <option value="Second Person">Second Person</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Target Word Count
                </label>
                <input
                  type="number"
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(e.target.value)}
                  placeholder="80000"
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Daily Word Goal
                </label>
                <input
                  type="number"
                  value={dailyWordGoal}
                  onChange={(e) => setDailyWordGoal(e.target.value)}
                  placeholder="1000"
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                />
              </div>
            </div>

            {/* Synopsis */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">
                Story Synopsis & Logline
              </label>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                rows={3}
                placeholder="What is the central question, dramatic hook, and conflict of this story?"
                className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setViewState('welcome')}
                className="px-4 py-2 rounded-md hover:bg-muted text-muted-foreground text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
              >
                Initialize Workspace
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
