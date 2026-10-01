import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  FileText,
  Folder,
  Layers,
  MoreVertical,
  Trash2,
  Edit2,
  Book,
  X,
} from 'lucide-react';
import { Project, Book as BookType, Act, Chapter, Scene } from '../types/writing';

interface SidebarProjectTreeProps {
  project: Project;
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onAddScene: (chapterId: string) => void;
  onAddChapter: (actId: string) => void;
  onAddAct: (bookId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onDeleteChapter?: (chapterId: string) => void;
  onDeleteAct?: (actId: string) => void;
  onRenameScene: (sceneId: string, newTitle: string) => void;
  onCloseMobile?: () => void;
}

export const SidebarProjectTree: React.FC<SidebarProjectTreeProps> = ({
  project,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onAddChapter,
  onAddAct,
  onDeleteScene,
  onDeleteChapter,
  onDeleteAct,
  onRenameScene,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedActs, setCollapsedActs] = useState<Record<string, boolean>>({});
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const toggleAct = (actId: string) => {
    setCollapsedActs((prev) => ({ ...prev, [actId]: !prev[actId] }));
  };

  const toggleChapter = (chapterId: string) => {
    setCollapsedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const startRename = (scene: Scene) => {
    setEditingSceneId(scene.id);
    setEditTitle(scene.title);
  };

  const saveRename = (sceneId: string) => {
    if (editTitle.trim()) {
      onRenameScene(sceneId, editTitle.trim());
    }
    setEditingSceneId(null);
  };

  // Compute total project words
  let totalWords = 0;
  let totalScenes = 0;
  project.books.forEach((b) => {
    b.acts.forEach((a) => {
      a.chapters.forEach((c) => {
        c.scenes.forEach((s) => {
          totalWords += s.wordCount || 0;
          totalScenes += 1;
        });
      });
    });
  });

  const getStatusColor = (status: Scene['status']) => {
    switch (status) {
      case 'Polished':
        return 'bg-emerald-500';
      case 'Revised':
        return 'bg-blue-500';
      case 'First Draft':
        return 'bg-amber-500';
      case 'In Progress':
        return 'bg-orange-500';
      case 'Idea':
      default:
        return 'bg-muted-foreground/40';
    }
  };

  return (
    <aside className="w-full lg:w-72 border-r border-border bg-card flex flex-col shrink-0 select-none overflow-hidden h-full shadow-lg lg:shadow-none">
      {/* Mobile Top Header (only on mobile) */}
      {onCloseMobile && (
        <div className="lg:hidden p-3 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Layers className="w-4 h-4 text-primary" />
            <span>Manuscript Outline</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Close Outline Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-2.5 border-b border-border/60">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search manuscript scenes..."
            className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-md bg-muted/50 border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {project.books.map((book) => (
          <div key={book.id} className="space-y-1">
            {/* Book Header */}
            <div className="px-2 py-1 flex items-center justify-between text-xs font-semibold text-foreground/90 tracking-wide">
              <span className="flex items-center gap-1.5 truncate">
                <Book className="w-3.5 h-3.5 text-primary" />
                <span className="truncate">{book.title}</span>
              </span>
              <button
                onClick={() => onAddAct(book.id)}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Add Act"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Acts */}
            {book.acts.map((act) => {
              const isActCollapsed = collapsedActs[act.id];
              return (
                <div key={act.id} className="pl-1.5 space-y-0.5">
                  {/* Act Header */}
                  <div className="group flex items-center justify-between px-2 py-1 rounded-md text-xs font-medium text-foreground hover:bg-muted/40 transition-colors">
                    <button
                      onClick={() => toggleAct(act.id)}
                      className="flex items-center gap-1 text-left flex-1 min-w-0"
                    >
                      {isActCollapsed ? (
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      )}
                      <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="truncate text-xs font-medium">{act.title}</span>
                    </button>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddChapter(act.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-opacity"
                        title="Add Chapter to Act"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      {onDeleteAct && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAct(act.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-opacity"
                          title="Delete Act"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chapters */}
                  {!isActCollapsed && (
                    <div className="pl-3 space-y-0.5 border-l border-border/40 ml-2">
                      {act.chapters.map((chapter) => {
                        const isChapterCollapsed = collapsedChapters[chapter.id];
                        return (
                          <div key={chapter.id} className="space-y-0.5">
                            {/* Chapter Header */}
                            <div className="group flex items-center justify-between px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                              <button
                                onClick={() => toggleChapter(chapter.id)}
                                className="flex items-center gap-1 text-left flex-1 min-w-0"
                              >
                                {isChapterCollapsed ? (
                                  <ChevronRight className="w-2.5 h-2.5" />
                                ) : (
                                  <ChevronDown className="w-2.5 h-2.5" />
                                )}
                                <Folder className="w-3 h-3 text-muted-foreground/80" />
                                <span className="truncate">{chapter.title}</span>
                              </button>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddScene(chapter.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-opacity"
                                  title="Add Scene"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                {onDeleteChapter && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteChapter(chapter.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-opacity"
                                    title="Delete Chapter"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Scenes */}
                            {!isChapterCollapsed && (
                              <div className="pl-2 space-y-0.5">
                                {chapter.scenes
                                  .filter(
                                    (s) =>
                                      !searchQuery ||
                                      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      s.content.toLowerCase().includes(searchQuery.toLowerCase())
                                  )
                                  .map((scene) => {
                                    const isActive = scene.id === activeSceneId;
                                    const isEditing = editingSceneId === scene.id;

                                    return (
                                      <div
                                        key={scene.id}
                                        onClick={() => {
                                          if (!isEditing) {
                                            onSelectScene(scene.id);
                                            onCloseMobile?.();
                                          }
                                        }}
                                        className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-all ${
                                          isActive
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'text-foreground/80 hover:bg-muted/60 hover:text-foreground'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <span
                                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(
                                              scene.status
                                            )}`}
                                            title={`Status: ${scene.status}`}
                                          />
                                          {isEditing ? (
                                            <input
                                              type="text"
                                              value={editTitle}
                                              onChange={(e) => setEditTitle(e.target.value)}
                                              onBlur={() => saveRename(scene.id)}
                                              onKeyDown={(e) => e.key === 'Enter' && saveRename(scene.id)}
                                              autoFocus
                                              className="w-full bg-card border border-border px-1 py-0.5 rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                          ) : (
                                            <span className="truncate">{scene.title}</span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                          <span className="text-[10px] text-muted-foreground tabular-nums">
                                            {scene.wordCount || 0}w
                                          </span>

                                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                startRename(scene);
                                              }}
                                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                              title="Rename Scene"
                                            >
                                              <Edit2 className="w-2.5 h-2.5" />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Delete scene "${scene.title}"?`)) {
                                                  onDeleteScene(scene.id);
                                                }
                                              }}
                                              className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                                              title="Delete Scene"
                                            >
                                              <Trash2 className="w-2.5 h-2.5" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Word Count & Quick Stats */}
      <div className="p-3 border-t border-border/60 bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
        <div>
          <span className="font-semibold text-foreground tabular-nums">
            {totalWords.toLocaleString()}
          </span>{' '}
          words
        </div>
        <div className="text-[11px] text-muted-foreground/80">
          <span className="tabular-nums">{totalScenes}</span> scenes
        </div>
      </div>
    </aside>
  );
};
