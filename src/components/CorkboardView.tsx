import React, { useState } from 'react';
import {
  FileText,
  Plus,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Edit,
  Trash2,
  Calendar,
  Layers,
  StickyNote,
} from 'lucide-react';
import { Scene, Project } from '../types/writing';

interface CorkboardViewProps {
  scenes: Scene[];
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onUpdateSceneSynopsis: (sceneId: string, synopsis: string) => void;
  onUpdateSceneTitle: (sceneId: string, title: string) => void;
  onUpdateSceneStatus: (sceneId: string, status: Scene['status']) => void;
  onReorderScenes: (updatedScenes: Scene[]) => void;
  onAddScene: () => void;
  onDeleteScene: (sceneId: string) => void;
  onSwitchToEditor: () => void;
}

export const CorkboardView: React.FC<CorkboardViewProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
  onUpdateSceneSynopsis,
  onUpdateSceneTitle,
  onUpdateSceneStatus,
  onReorderScenes,
  onAddScene,
  onDeleteScene,
  onSwitchToEditor,
}) => {
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');

  const handleMove = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === scenes.length - 1) return;

    const nextIndex = direction === 'left' ? index - 1 : index + 1;
    const reordered = [...scenes];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, moved);

    // Update their internal order numbers
    const finalScenes = reordered.map((s, idx) => ({
      ...s,
      order: idx + 1,
    }));

    onReorderScenes(finalScenes);
  };

  const getStatusBg = (status: Scene['status']) => {
    switch (status) {
      case 'Polished':
        return 'border-t-emerald-500 bg-emerald-500/5';
      case 'Revised':
        return 'border-t-blue-500 bg-blue-500/5';
      case 'First Draft':
        return 'border-t-amber-500 bg-amber-500/5';
      case 'In Progress':
        return 'border-t-orange-500 bg-orange-500/5';
      case 'Idea':
      default:
        return 'border-t-purple-500 bg-purple-500/5';
    }
  };

  const getStatusBadgeColor = (status: Scene['status']) => {
    switch (status) {
      case 'Polished':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'Revised':
        return 'text-blue-600 dark:text-blue-400';
      case 'First Draft':
        return 'text-amber-600 dark:text-amber-400';
      case 'In Progress':
        return 'text-orange-600 dark:text-orange-400';
      case 'Idea':
      default:
        return 'text-purple-600 dark:text-purple-400';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] bg-muted/40 dark:bg-background/95 sepia:bg-[#caa985]/20 overflow-y-auto p-6 sm:p-8 select-none">
      {/* Top control bar inside Corkboard */}
      <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-primary" />
            <span>Chapter Corkboard Planning</span>
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
            Reorder scenes, edit synopses, and plan pacing. Rearranging cards directly reorders your manuscript chapters. Double-click any card to draft its prose.
          </p>
        </div>

        <button
          onClick={onAddScene}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Scene Card</span>
        </button>
      </div>

      {/* Grid Canvas of Index Cards */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenes.map((scene, index) => {
          const isSelected = scene.id === activeSceneId;
          const isEditingTitle = editingTitleId === scene.id;

          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={`group flex flex-col h-64 border border-border/80 rounded-xl bg-card shadow-md hover:shadow-lg transition-all border-t-[6px] relative overflow-hidden ${getStatusBg(
                scene.status
              )} ${isSelected ? 'ring-2 ring-primary shadow-xl' : ''}`}
            >
              {/* Pushpin indicator */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-red-600 dark:bg-red-500 rounded-full shadow-md z-10 border border-black/20" />

              {/* Title & Header */}
              <div className="p-4 pt-6 pb-2 shrink-0 border-b border-border/40 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {isEditingTitle ? (
                    <input
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onBlur={() => {
                        if (tempTitle.trim()) {
                          onUpdateSceneTitle(scene.id, tempTitle.trim());
                        }
                        setEditingTitleId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (tempTitle.trim()) {
                            onUpdateSceneTitle(scene.id, tempTitle.trim());
                          }
                          setEditingTitleId(null);
                        }
                      }}
                      autoFocus
                      className="w-full bg-background border border-primary/40 rounded px-1.5 py-0.5 text-xs text-foreground font-bold focus:outline-none"
                    />
                  ) : (
                    <h3
                      onDoubleClick={() => {
                        setEditingTitleId(scene.id);
                        setTempTitle(scene.title);
                      }}
                      className="text-xs font-extrabold text-foreground truncate cursor-pointer hover:underline"
                      title="Double click to rename"
                    >
                      {scene.title}
                    </h3>
                  )}
                  <div className="text-[10px] text-muted-foreground/80 mt-0.5 flex items-center gap-1">
                    <span>Scene {index + 1}</span>
                    <span>·</span>
                    <span className="tabular-nums font-mono">{scene.wordCount || 0} words</span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTitleId(scene.id);
                      setTempTitle(scene.title);
                    }}
                    className="p-1 rounded hover:bg-muted text-muted-foreground"
                    title="Rename"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete scene "${scene.title}" from Corkboard?`)) {
                        onDeleteScene(scene.id);
                      }
                    }}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Synopsis Editable Textarea */}
              <div className="flex-1 p-4 py-3 min-h-0">
                <textarea
                  value={scene.synopsis || ''}
                  onChange={(e) => onUpdateSceneSynopsis(scene.id, e.target.value)}
                  placeholder="Outline the conflict, character movement, or key revelations..."
                  className="w-full h-full bg-transparent text-[11px] text-foreground leading-relaxed font-sans placeholder:text-muted-foreground/50 resize-none border-0 focus:outline-none focus:ring-0 select-text cursor-text scrollbar-thin"
                />
              </div>

              {/* Bottom Controls / Status Picker / Move arrows */}
              <div className="p-3 bg-muted/20 border-t border-border/40 shrink-0 flex items-center justify-between text-[10px] text-muted-foreground">
                <select
                  value={scene.status}
                  onChange={(e) =>
                    onUpdateSceneStatus(scene.id, e.target.value as Scene['status'])
                  }
                  className={`bg-card border border-border/50 rounded px-1 py-0.5 text-[10px] focus:outline-none font-bold ${getStatusBadgeColor(
                    scene.status
                  )}`}
                >
                  <option value="Idea">Idea</option>
                  <option value="In Progress">In Progress</option>
                  <option value="First Draft">First Draft</option>
                  <option value="Revised">Revised</option>
                  <option value="Polished">Polished</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(index, 'left');
                    }}
                    className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                    title="Shift scene earlier"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectScene(scene.id);
                      onSwitchToEditor();
                    }}
                    className="px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary font-semibold flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>Write</span>
                  </button>

                  <button
                    disabled={index === scenes.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(index, 'right');
                    }}
                    className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                    title="Shift scene later"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Dynamic Add Card Placeholder */}
        <button
          onClick={onAddScene}
          className="group flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-xl bg-card/40 hover:bg-card hover:border-primary transition-all gap-2 p-6"
        >
          <div className="p-3 rounded-full bg-muted/80 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-foreground group-hover:text-primary">
              Create New Scene Card
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Append a new planning slot to this chapter outline
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
