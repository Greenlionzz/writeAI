import React, { useState } from 'react';
import {
  Users,
  Compass,
  LayoutGrid,
  FileText,
  X,
  Plus,
  MessageSquare,
  Search,
  Sparkles,
} from 'lucide-react';
import { Project, Scene, Character, Location } from '../types/writing';

interface SplitReferencePanelProps {
  project: Project;
  activeScene: Scene | null;
  onClose: () => void;
  onUpdateSceneNotes: (notes: string) => void;
  onAddComment: (text: string) => void;
  onResolveComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export const SplitReferencePanel: React.FC<SplitReferencePanelProps> = ({
  project,
  activeScene,
  onClose,
  onUpdateSceneNotes,
  onAddComment,
  onResolveComment,
  onDeleteComment,
}) => {
  const [activeTab, setActiveTab] = useState<'characters' | 'locations' | 'plot' | 'notes'>('characters');
  const [searchQuery, setSearchQuery] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  const handleCreateComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(newCommentText.trim());
    setNewCommentText('');
  };

  return (
    <aside className="w-full sm:w-88 xl:w-80 max-w-full border-l border-border bg-card flex flex-col shrink-0 overflow-hidden h-full shadow-2xl xl:shadow-none z-30 transition-all">
      {/* Header Tabs */}
      <div className="border-b border-border p-2 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md text-xs">
          <button
            onClick={() => setActiveTab('characters')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'characters'
                ? 'bg-card text-foreground font-medium shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Characters Bible"
          >
            <Users className="w-3.5 h-3.5 inline mr-1" />
            Cast
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'locations'
                ? 'bg-card text-foreground font-medium shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Settings & Locations"
          >
            <Compass className="w-3.5 h-3.5 inline mr-1" />
            Places
          </button>
          <button
            onClick={() => setActiveTab('plot')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'plot'
                ? 'bg-card text-foreground font-medium shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Plot Notes"
          >
            <LayoutGrid className="w-3.5 h-3.5 inline mr-1" />
            Plot
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-2 py-1 rounded transition-colors ${
              activeTab === 'notes'
                ? 'bg-card text-foreground font-medium shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Scene Notes & Comments"
          >
            <FileText className="w-3.5 h-3.5 inline mr-1" />
            Notes
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Close Reference Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Characters Tab */}
        {activeTab === 'characters' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cast members..."
                className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-md bg-muted/40 border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div className="space-y-2.5">
              {project.characters
                .filter(
                  (c) =>
                    !searchQuery ||
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.traits.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map((char) => (
                  <div
                    key={char.id}
                    className="p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        {char.imageUrl ? (
                          <img
                            src={char.imageUrl}
                            alt={char.name}
                            className="w-4 h-4 rounded-full object-cover border border-border shrink-0"
                          />
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: char.colorTag || '#3B82F6' }}
                          />
                        )}
                        <span>{char.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {char.role}
                      </span>
                    </div>

                    {char.occupation && (
                      <div className="text-[11px] text-muted-foreground italic">
                        {char.occupation}
                      </div>
                    )}

                    <div className="text-[11px] text-foreground/80 leading-relaxed">
                      {char.appearance}
                    </div>

                    <div className="pt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                      {char.traits.map((trait, i) => (
                        <span key={i} className="text-muted-foreground/90">
                          {trait}{i < char.traits.length - 1 ? ' ·' : ''}
                        </span>
                      ))}
                    </div>

                    {char.motivation && (
                      <div className="pt-1 text-[11px] text-foreground/70">
                        <strong className="text-foreground/90 font-medium">Goal:</strong>{' '}
                        {char.motivation}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search locations & settings..."
                className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-md bg-muted/40 border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div className="space-y-2.5">
              {project.locations
                .filter(
                  (l) =>
                    !searchQuery ||
                    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    l.type.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((loc) => (
                  <div
                    key={loc.id}
                    className="p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-foreground">{loc.name}</div>
                      <span className="text-[10px] text-muted-foreground">{loc.type}</span>
                    </div>

                    <div className="text-[11px] text-foreground/80 leading-relaxed">
                      {loc.sensoryDetails}
                    </div>

                    {loc.loreAndSignificance && (
                      <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                        <strong className="text-foreground/90 font-medium">Lore:</strong>{' '}
                        {loc.loreAndSignificance}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Plot Cards Tab */}
        {activeTab === 'plot' && (
          <div className="space-y-2.5">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Story Beat Sheet
            </div>
            {project.plotCards.map((card) => (
              <div
                key={card.id}
                className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{card.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {card.act} · {card.status}
                  </span>
                </div>
                <p className="text-[11px] text-foreground/80 leading-relaxed">{card.summary}</p>
                <div className="pt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                  {card.tags.map((tag, i) => (
                    <span key={i}>
                      #{tag}{i < card.tags.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scene Notes & Comments Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            {activeScene ? (
              <>
                {/* Scene Scratchpad Notes */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-foreground">
                    Scene Scratchpad ({activeScene.title})
                  </div>
                  <textarea
                    value={activeScene.notes || ''}
                    onChange={(e) => onUpdateSceneNotes(e.target.value)}
                    placeholder="Write private scene notes, pacing thoughts, sensory reminders..."
                    className="w-full h-32 text-xs p-2.5 rounded-md bg-muted/30 border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-none leading-relaxed"
                  />
                </div>

                {/* Paragraph Comments */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      Comments ({activeScene.comments?.length || 0})
                    </span>
                  </div>

                  <form onSubmit={handleCreateComment} className="space-y-1.5">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Add an author note or critique..."
                      className="w-full text-xs px-2.5 py-1.5 rounded-md bg-muted/40 border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                    <button
                      type="submit"
                      disabled={!newCommentText.trim()}
                      className="text-xs px-2.5 py-1 rounded bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      Post Note
                    </button>
                  </form>

                  <div className="space-y-2 pt-1">
                    {activeScene.comments && activeScene.comments.length > 0 ? (
                      activeScene.comments.map((comm) => (
                        <div
                          key={comm.id}
                          className={`p-2.5 rounded-md border text-xs space-y-1 transition-colors ${
                            comm.resolved
                              ? 'bg-muted/10 border-border/30 opacity-60'
                              : 'bg-muted/30 border-border/60'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="font-semibold text-foreground">{comm.author}</span>
                            <span>{new Date(comm.createdAt).toLocaleDateString()}</span>
                          </div>
                          {comm.selectedSnippet && (
                            <div className="text-[10px] italic border-l-2 border-primary/50 pl-1.5 text-muted-foreground truncate">
                              "{comm.selectedSnippet}"
                            </div>
                          )}
                          <p className="text-[11px] text-foreground/90">{comm.text}</p>
                          <div className="flex items-center gap-2 pt-1 text-[10px]">
                            <button
                              onClick={() => onResolveComment(comm.id)}
                              className="text-primary hover:underline"
                            >
                              {comm.resolved ? 'Reopen' : 'Mark Resolved'}
                            </button>
                            <span>·</span>
                            <button
                              onClick={() => onDeleteComment(comm.id)}
                              className="text-destructive hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground italic py-2 text-center">
                        No comments on this scene yet.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground italic py-4 text-center">
                Select a scene from the left to view notes and comments.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
