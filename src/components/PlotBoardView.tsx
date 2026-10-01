import React, { useState } from 'react';
import {
  Plus,
  Tag,
  Users,
  Compass,
  CheckCircle2,
  Clock,
  MoreVertical,
  Trash2,
  Edit2,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Project, PlotCard, PlotStatus, UserSettings } from '../types/writing';
import { AIOutlineGeneratorModal } from './AIOutlineGeneratorModal';

interface PlotBoardViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  settings: UserSettings;
}

export const PlotBoardView: React.FC<PlotBoardViewProps> = ({
  project,
  onUpdateProject,
  settings,
}) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<PlotCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOutlineGeneratorOpen, setIsOutlineGeneratorOpen] = useState(false);

  const statuses: PlotStatus[] = ['Idea', 'Outlined', 'Drafted', 'Revised', 'Done'];

  const allTags = Array.from(
    new Set(project.plotCards.flatMap((c) => c.tags || []))
  );

  const handleOpenAddModal = (status: PlotStatus = 'Idea') => {
    setEditingCard({
      id: `plot_${Date.now()}`,
      act: 'Act I',
      title: '',
      summary: '',
      tags: [],
      status,
      order: project.plotCards.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard || !editingCard.title.trim()) return;

    const cards = [...project.plotCards];
    const existingIndex = cards.findIndex((c) => c.id === editingCard.id);

    if (existingIndex >= 0) {
      cards[existingIndex] = editingCard;
    } else {
      cards.push(editingCard);
    }

    onUpdateProject({
      ...project,
      plotCards: cards,
      updatedAt: new Date().toISOString(),
    });
    setIsModalOpen(false);
    setEditingCard(null);
  };

  const handleDeleteCard = (cardId: string) => {
    if (confirm('Delete this plot beat?')) {
      const cards = project.plotCards.filter((c) => c.id !== cardId);
      onUpdateProject({
        ...project,
        plotCards: cards,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleMoveCardStatus = (card: PlotCard, nextStatus: PlotStatus) => {
    const cards = project.plotCards.map((c) =>
      c.id === card.id ? { ...c, status: nextStatus } : c
    );
    onUpdateProject({
      ...project,
      plotCards: cards,
      updatedAt: new Date().toISOString(),
    });
  };

  const filteredCards = selectedTag
    ? project.plotCards.filter((c) => c.tags.includes(selectedTag))
    : project.plotCards;

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Top Filter Bar */}
      <div className="border-b border-border p-3.5 bg-card/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-foreground">Plot Architecture Board</h2>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                selectedTag === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              All Beats ({project.plotCards.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  selectedTag === tag
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOutlineGeneratorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white transition-all shadow-xs"
            title="Generate a complete 3-act story arc with chapter beats using AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Outline Generator</span>
          </button>

          <button
            onClick={() => handleOpenAddModal('Idea')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Plot Card</span>
          </button>
        </div>
      </div>

      {/* Columns Grid */}
      <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-start select-none">
        {statuses.map((status) => {
          const cardsInCol = filteredCards.filter((c) => c.status === status);
          return (
            <div
              key={status}
              className="w-72 shrink-0 bg-muted/20 border border-border/60 rounded-xl flex flex-col max-h-full overflow-hidden shadow-xs"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-border/50 flex items-center justify-between bg-card/40">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-foreground tracking-tight">
                    {status}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono tabular-nums bg-muted px-1.5 py-0.2 rounded-full">
                    {cardsInCol.length}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenAddModal(status)}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title={`Add to ${status}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                {cardsInCol.map((card) => (
                  <div
                    key={card.id}
                    className="p-3 bg-card border border-border/80 rounded-lg shadow-xs hover:border-primary/50 transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-muted-foreground/80 font-medium">
                          {card.act}
                        </span>
                        <h4 className="text-xs font-bold text-foreground leading-snug">
                          {card.title}
                        </h4>
                      </div>

                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingCard(card);
                            setIsModalOpen(true);
                          }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Edit Card"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          title="Delete Card"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-foreground/80 leading-relaxed">
                      {card.summary}
                    </p>

                    {/* Metadata & Tags */}
                    {card.tags && card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground pt-1">
                        {card.tags.map((t, i) => (
                          <span key={i} className="text-muted-foreground">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Move Status Selector */}
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Status:</span>
                      <select
                        value={card.status}
                        onChange={(e) =>
                          handleMoveCardStatus(card, e.target.value as PlotStatus)
                        }
                        className="bg-muted/60 border border-border/40 rounded px-1.5 py-0.5 text-[10px] text-foreground focus:outline-none"
                      >
                        {statuses.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {cardsInCol.length === 0 && (
                  <div className="py-8 text-center text-xs text-muted-foreground/60 italic">
                    No cards in {status}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Plot Card Modal */}
      {isModalOpen && editingCard && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground">
              {project.plotCards.some((c) => c.id === editingCard.id)
                ? 'Edit Plot Card'
                : 'New Story Beat Card'}
            </h3>

            <form onSubmit={handleSaveCard} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Title
                </label>
                <input
                  type="text"
                  value={editingCard.title}
                  onChange={(e) =>
                    setEditingCard({ ...editingCard, title: e.target.value })
                  }
                  required
                  placeholder="e.g. Infiltration of the Flooded Vault"
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Act / Phase
                  </label>
                  <select
                    value={editingCard.act}
                    onChange={(e) =>
                      setEditingCard({ ...editingCard, act: e.target.value })
                    }
                    className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                  >
                    <option value="Act I">Act I</option>
                    <option value="Act II">Act II</option>
                    <option value="Act III">Act III</option>
                    <option value="Epilogue">Epilogue</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Status
                  </label>
                  <select
                    value={editingCard.status}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        status: e.target.value as PlotStatus,
                      })
                    }
                    className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Summary & Conflict
                </label>
                <textarea
                  value={editingCard.summary}
                  onChange={(e) =>
                    setEditingCard({ ...editingCard, summary: e.target.value })
                  }
                  rows={3}
                  placeholder="What dramatic conflict occurs, what stakes are raised, what is revealed?"
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editingCard.tags.join(', ')}
                  onChange={(e) =>
                    setEditingCard({
                      ...editingCard,
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Inciting Incident, Climax, Reveal, Action"
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-md hover:bg-muted text-muted-foreground text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90"
                >
                  Save Beat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Outline Generator Modal */}
      <AIOutlineGeneratorModal
        isOpen={isOutlineGeneratorOpen}
        onClose={() => setIsOutlineGeneratorOpen(false)}
        project={project}
        onUpdateProject={onUpdateProject}
        settings={settings}
      />
    </div>
  );
};
