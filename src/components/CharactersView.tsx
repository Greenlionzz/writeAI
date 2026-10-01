import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  Tag,
  Shield,
  Heart,
  AlertTriangle,
  BookOpen,
  Upload,
  Camera,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { Project, Character, CharacterRole } from '../types/writing';

interface CharactersViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

export const CharactersView: React.FC<CharactersViewProps> = ({
  project,
  onUpdateProject,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChar, setEditingChar] = useState<Character | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProfileChar, setActiveProfileChar] = useState<Character | null>(null);

  const [activeTab, setActiveTab] = useState<'cards' | 'graph'>('cards');
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [newRelType, setNewRelType] = useState<string>('Allies');
  const [newRelDesc, setNewRelDesc] = useState<string>('');

  // Circular Layout Nodes for the visual relationship mapper
  const width = 600;
  const height = 500;
  const cx = width / 2;
  const cy = height / 2;
  const layoutRadius = 165;

  const nodes = project.characters.map((char, idx) => {
    const angle = (2 * Math.PI / Math.max(1, project.characters.length)) * idx - Math.PI / 2;
    return {
      ...char,
      x: cx + layoutRadius * Math.cos(angle),
      y: cy + layoutRadius * Math.sin(angle),
    };
  });

  const handleAddPersonalityTag = (charId: string, tag: string) => {
    const updated = project.characters.map((c) => {
      if (c.id === charId) {
        const currentTags = c.personalityTags || [];
        if (currentTags.includes(tag)) return c;
        const nextTags = [...currentTags, tag];
        const updatedChar = { ...c, personalityTags: nextTags };
        if (activeProfileChar && activeProfileChar.id === charId) {
          setActiveProfileChar(updatedChar);
        }
        return updatedChar;
      }
      return c;
    });
    onUpdateProject({ ...project, characters: updated });
  };

  const handleRemovePersonalityTag = (charId: string, tag: string) => {
    const updated = project.characters.map((c) => {
      if (c.id === charId) {
        const nextTags = (c.personalityTags || []).filter((t) => t !== tag);
        const updatedChar = { ...c, personalityTags: nextTags };
        if (activeProfileChar && activeProfileChar.id === charId) {
          setActiveProfileChar(updatedChar);
        }
        return updatedChar;
      }
      return c;
    });
    onUpdateProject({ ...project, characters: updated });
  };

  const handleAddGoal = (charId: string, goal: string) => {
    const updated = project.characters.map((c) => {
      if (c.id === charId) {
        const currentGoals = c.goals || [];
        if (currentGoals.includes(goal)) return c;
        const nextGoals = [...currentGoals, goal];
        const updatedChar = { ...c, goals: nextGoals };
        if (activeProfileChar && activeProfileChar.id === charId) {
          setActiveProfileChar(updatedChar);
        }
        return updatedChar;
      }
      return c;
    });
    onUpdateProject({ ...project, characters: updated });
  };

  const handleRemoveGoal = (charId: string, goal: string) => {
    const updated = project.characters.map((c) => {
      if (c.id === charId) {
        const nextGoals = (c.goals || []).filter((g) => g !== goal);
        const updatedChar = { ...c, goals: nextGoals };
        if (activeProfileChar && activeProfileChar.id === charId) {
          setActiveProfileChar(updatedChar);
        }
        return updatedChar;
      }
      return c;
    });
    onUpdateProject({ ...project, characters: updated });
  };

  const handleAddRelationship = (
    charId: string,
    relation: { characterId: string; type: string; description: string }
  ) => {
    const updated = project.characters.map((c) => {
      if (c.id === charId) {
        const currentRels = c.relationships || [];
        const filteredRels = currentRels.filter((r) => r.characterId !== relation.characterId);
        const nextRels = [...filteredRels, relation];
        const updatedChar = { ...c, relationships: nextRels };
        if (activeProfileChar && activeProfileChar.id === charId) {
          setActiveProfileChar(updatedChar);
        }
        return updatedChar;
      }
      return c;
    });
    onUpdateProject({ ...project, characters: updated });
  };

  const handleRemoveRelationship = (charId: string, targetCharId: string) => {
    const updated = project.characters.map((c) => {
      if (c.id === charId) {
        const nextRels = (c.relationships || []).filter((r) => r.characterId !== targetCharId);
        const updatedChar = { ...c, relationships: nextRels };
        if (activeProfileChar && activeProfileChar.id === charId) {
          setActiveProfileChar(updatedChar);
        }
        return updatedChar;
      }
      return c;
    });
    onUpdateProject({ ...project, characters: updated });
  };

  const roles: CharacterRole[] = [
    'Protagonist',
    'Antagonist',
    'Deuteragonist',
    'Supporting',
    'Minor',
  ];

  const colorPalette = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#64748B', // Slate
  ];

  const handleImageFile = (
    file: File,
    callback: (base64: string) => void
  ) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP, etc.).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size should be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        callback(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleQuickAvatarUpload = (charId: string, dataUrl: string) => {
    const updated = project.characters.map((c) =>
      c.id === charId ? { ...c, imageUrl: dataUrl } : c
    );
    onUpdateProject({ ...project, characters: updated });
  };

  const handleOpenAdd = () => {
    setEditingChar({
      id: `char_${Date.now()}`,
      name: '',
      role: 'Supporting',
      archetype: '',
      age: '',
      occupation: '',
      appearance: '',
      traits: [],
      motivation: '',
      conflict: '',
      backstory: '',
      notes: '',
      colorTag: colorPalette[project.characters.length % colorPalette.length],
    });
    setIsModalOpen(true);
  };

  const handleSaveChar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChar || !editingChar.name.trim()) return;

    const chars = [...project.characters];
    const existingIndex = chars.findIndex((c) => c.id === editingChar.id);

    if (existingIndex >= 0) {
      chars[existingIndex] = editingChar;
    } else {
      chars.push(editingChar);
    }

    onUpdateProject({
      ...project,
      characters: chars,
      updatedAt: new Date().toISOString(),
    });
    setIsModalOpen(false);
    setEditingChar(null);
  };

  const handleDeleteChar = (charId: string) => {
    if (confirm('Delete this character profile?')) {
      const chars = project.characters.filter((c) => c.id !== charId);
      onUpdateProject({
        ...project,
        characters: chars,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const filteredChars = project.characters.filter((c) => {
    const matchesRole = selectedRole === 'All' || c.role === selectedRole;
    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.occupation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.traits.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Top Header & Search Bar */}
      <div className="border-b border-border p-3.5 bg-card/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-foreground">Character Bible</h2>
          
          <div className="flex bg-muted/65 p-0.5 rounded-md text-xs shrink-0 select-none mr-1.5">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-2.5 py-1 rounded-sm font-semibold transition-all ${
                activeTab === 'cards' ? 'bg-card text-foreground shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cast Cards
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-2.5 py-1 rounded-sm font-semibold transition-all ${
                activeTab === 'graph' ? 'bg-card text-foreground shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Relationship Graph
            </button>
          </div>

          {activeTab === 'cards' && (
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              <button
                onClick={() => setSelectedRole('All')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  selectedRole === 'All'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({project.characters.length})
              </button>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    selectedRole === r
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'cards' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cast members..."
                className="text-xs pl-8 pr-2.5 py-1.5 rounded-md bg-muted/30 border border-border text-foreground w-48 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Character</span>
          </button>
        </div>
      </div>

      {/* Character Cards Grid */}
      {activeTab === 'cards' && (
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChars.map((char) => {
            const initials = char.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={char.id}
                onClick={() => setActiveProfileChar(char)}
                className="p-4 bg-card border border-border/80 rounded-xl shadow-xs hover:border-primary/50 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2.5">
                  {/* Top Bar with Avatar */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative group/avatar w-11 h-11 shrink-0">
                        {char.imageUrl ? (
                          <img
                            src={char.imageUrl}
                            alt={char.name}
                            className="w-11 h-11 rounded-full object-cover border border-border/80 shadow-xs"
                          />
                        ) : (
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs"
                            style={{ backgroundColor: char.colorTag || '#3B82F6' }}
                          >
                            {initials}
                          </div>
                        )}
                        <label
                          className="absolute inset-0 rounded-full bg-black/60 text-white opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                          title="Click to upload profile image"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageFile(file, (dataUrl) => {
                                  handleQuickAvatarUpload(char.id, dataUrl);
                                });
                              }
                            }}
                          />
                        </label>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-foreground">
                          {char.name}
                        </h3>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <span>{char.role}</span>
                          {char.occupation && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[140px]">
                                {char.occupation}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                     <div className="flex items-center gap-1.5 transition-colors">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChar(char);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-border/80 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-2xs"
                        title="Edit Character"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChar(char.id);
                        }}
                        className="p-1.5 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive hover:text-destructive/20 hover:bg-destructive/10 transition-colors shadow-2xs"
                        title="Delete Character"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Appearance & Archetype */}
                  {char.appearance && (
                    <div className="text-xs text-foreground/80 leading-relaxed bg-muted/20 p-2 rounded-md border border-border/40">
                      {char.appearance}
                    </div>
                  )}

                  {/* Traits List */}
                  {char.traits && char.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                      {char.traits.map((trait, i) => (
                        <span key={i} className="text-muted-foreground">
                          {trait}{i < char.traits.length - 1 ? ' ·' : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Motivation & Conflict */}
                  <div className="space-y-1 text-xs pt-1">
                    {char.motivation && (
                      <div className="text-[11px] text-foreground/80">
                        <strong className="text-foreground font-medium">Core Desire:</strong>{' '}
                        {char.motivation}
                      </div>
                    )}
                    {char.conflict && (
                      <div className="text-[11px] text-foreground/80">
                        <strong className="text-foreground font-medium">Inner Conflict:</strong>{' '}
                        {char.conflict}
                      </div>
                    )}
                  </div>
                </div>
                {/* Footer notes */}
                {char.notes && (
                  <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground italic truncate">
                    Note: {char.notes}
                  </div>
                )}
              </div>
            );
          })}

          {filteredChars.length === 0 && (
            <div className="col-span-full py-16 text-center text-xs text-muted-foreground italic">
              No character profiles found matching this filter.
            </div>
          )}
        </div>
      </div>
      )}

      {/* Relationship Graph Tab Visualiser */}
      {activeTab === 'graph' && (
        <div className="flex-1 flex flex-col p-5 overflow-y-auto space-y-4">
          <div className="bg-card border border-border/80 rounded-xl p-5 flex flex-col items-center shadow-xs">
            <div className="w-full flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2 mb-4 select-none">
              <div>
                <strong className="text-foreground font-semibold">Visual Cast Networks</strong> · Click a source character, then click another to map relationship paths.
              </div>
              <div className="flex items-center gap-3 text-[10px] uppercase font-bold shrink-0">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" /> Allies</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block" /> Enemies</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-pink-500 rounded-full inline-block" /> Romantic</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" /> Family</span>
              </div>
            </div>

            {project.characters.length < 2 ? (
              <div className="py-24 text-center text-xs text-muted-foreground italic">
                Create at least 2 character profiles to begin visualising cast networks.
              </div>
            ) : (
              <div className="relative w-full max-w-2xl aspect-[6/5] bg-muted/15 border border-border/60 rounded-xl overflow-hidden shadow-2xs flex items-center justify-center p-4">
                <svg className="w-full h-full" viewBox="0 0 600 500">
                  {/* Lines Section */}
                  {project.characters.flatMap((sourceChar) => {
                    const sourceNode = nodes.find((n) => n.id === sourceChar.id);
                    if (!sourceNode) return [];

                    return (sourceChar.relationships || []).map((rel, rIdx) => {
                      const targetNode = nodes.find((n) => n.id === rel.characterId);
                      if (!targetNode) return null;

                      // Symmetrical check to avoid rendering twice
                      if (sourceChar.id > rel.characterId) return null;

                      const isEnemies = rel.type.toLowerCase().includes('enemy') || rel.type.toLowerCase().includes('enemies') || rel.type.toLowerCase().includes('rival');
                      const isAllies = rel.type.toLowerCase().includes('ally') || rel.type.toLowerCase().includes('allies') || rel.type.toLowerCase().includes('friend');
                      const isRomantic = rel.type.toLowerCase().includes('romantic') || rel.type.toLowerCase().includes('lover') || rel.type.toLowerCase().includes('spouse') || rel.type.toLowerCase().includes('husband') || rel.type.toLowerCase().includes('wife') || rel.type.toLowerCase().includes('couple');
                      const isFamily = rel.type.toLowerCase().includes('family') || rel.type.toLowerCase().includes('sister') || rel.type.toLowerCase().includes('brother') || rel.type.toLowerCase().includes('parent') || rel.type.toLowerCase().includes('mother') || rel.type.toLowerCase().includes('father');

                      let strokeColor = '#94A3B8';
                      let isDashed = false;
                      let strokeWidth = '1.5';

                      if (isEnemies) {
                        strokeColor = '#EF4444';
                        isDashed = true;
                      } else if (isAllies) {
                        strokeColor = '#10B981';
                      } else if (isRomantic) {
                        strokeColor = '#EC4899';
                        strokeWidth = '2.5';
                      } else if (isFamily) {
                        strokeColor = '#F59E0B';
                      }

                      const midX = (sourceNode.x + targetNode.x) / 2;
                      const midY = (sourceNode.y + targetNode.y) / 2;

                      return (
                        <g key={`${sourceChar.id}-${rel.characterId}-${rIdx}`}>
                          {/* Connection Path */}
                          <line
                            x1={sourceNode.x}
                            y1={sourceNode.y}
                            x2={targetNode.x}
                            y2={targetNode.y}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={isDashed ? '5,5' : 'none'}
                            className="transition-all"
                          />
                          {/* Midpoint Label Badge */}
                          <g transform={`translate(${midX}, ${midY})`}>
                            <rect
                              x="-25"
                              y="-7"
                              width="50"
                              height="14"
                              rx="3"
                              fill="#1E293B"
                              stroke={strokeColor}
                              strokeWidth="1"
                              className="shadow-2xs fill-card border border-border"
                            />
                            <text
                              textAnchor="middle"
                              y="3"
                              fill={strokeColor}
                              fontSize="8"
                              fontWeight="bold"
                              className="select-none font-sans"
                            >
                              {rel.type}
                            </text>
                          </g>
                        </g>
                      );
                    });
                  })}

                  {/* Nodes Section */}
                  {nodes.map((node) => {
                    const isSelectedSource = selectedSourceId === node.id;
                    const isSelectedTarget = selectedTargetId === node.id;

                    const initials = node.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() => {
                          if (!selectedSourceId) {
                            setSelectedSourceId(node.id);
                          } else if (selectedSourceId === node.id) {
                            setSelectedSourceId(null);
                            setSelectedTargetId(null);
                          } else {
                            setSelectedTargetId(node.id);
                          }
                        }}
                        className="cursor-pointer group/node"
                      >
                        {/* Selector Glow Pulse */}
                        {isSelectedSource && (
                          <circle
                            r="28"
                            fill="transparent"
                            stroke="#3B82F6"
                            strokeWidth="2.5"
                            className="animate-ping opacity-45"
                          />
                        )}
                        {isSelectedTarget && (
                          <circle
                            r="28"
                            fill="transparent"
                            stroke="#EC4899"
                            strokeWidth="2.5"
                            className="animate-ping opacity-45"
                          />
                        )}

                        {/* Static Selection Ring */}
                        <circle
                          r="23"
                          fill="#1E293B"
                          stroke={
                            isSelectedSource
                              ? '#3B82F6'
                              : isSelectedTarget
                              ? '#EC4899'
                              : node.colorTag || '#3B82F6'
                          }
                          strokeWidth={isSelectedSource || isSelectedTarget ? '3.5' : '1.5'}
                          className="transition-all hover:scale-110 shadow-md fill-card"
                        />

                        {/* Node Avatar initials */}
                        <text
                          textAnchor="middle"
                          y="4"
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="bold"
                          className="select-none font-sans"
                        >
                          {initials}
                        </text>

                        {/* Float label */}
                        <g transform="translate(0, 36)">
                          <rect
                            x="-40"
                            y="-8"
                            width="80"
                            height="16"
                            rx="3"
                            fill="#111827"
                            className="fill-card border border-border"
                          />
                          <text
                            textAnchor="middle"
                            y="3"
                            fill="#F1F5F9"
                            fontSize="9"
                            fontWeight="semibold"
                            className="select-none font-sans fill-foreground"
                          >
                            {node.name.split(' ')[0]}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Create relationship panel */}
          {selectedSourceId && (
            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-md max-w-2xl mx-auto w-full animate-in slide-in-from-bottom duration-200 shrink-0">
              {!selectedTargetId ? (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                    <span>
                      Mapping from <strong className="text-foreground">{project.characters.find((c) => c.id === selectedSourceId)?.name}</strong>. Click another cast member to connect them!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSourceId(null);
                      setSelectedTargetId(null);
                    }}
                    className="text-muted-foreground hover:text-foreground font-semibold"
                  >
                    Cancel Selection
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <h4 className="text-xs font-bold text-foreground">
                      Map Cast Connection: <span className="text-blue-500">{project.characters.find((c) => c.id === selectedSourceId)?.name}</span> ⟷ <span className="text-pink-500">{project.characters.find((c) => c.id === selectedTargetId)?.name}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSourceId(null);
                        setSelectedTargetId(null);
                      }}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Relationship Type</label>
                      <select
                        value={newRelType}
                        onChange={(e) => setNewRelType(e.target.value)}
                        className="w-full p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                      >
                        <option value="Allies">Allies</option>
                        <option value="Enemies">Enemies</option>
                        <option value="Romantic">Romantic</option>
                        <option value="Family">Family</option>
                        <option value="Mentor">Mentor</option>
                        <option value="Rival">Rival</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Describe Connection (backstory)</label>
                      <input
                        type="text"
                        value={newRelDesc}
                        onChange={(e) => setNewRelDesc(e.target.value)}
                        placeholder="e.g. Sworn sworn to protect them, secret rivalry..."
                        className="w-full p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSourceId(null);
                        setSelectedTargetId(null);
                        setNewRelDesc('');
                      }}
                      className="px-3 py-1.5 rounded hover:bg-muted text-muted-foreground font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleAddRelationship(selectedSourceId, {
                          characterId: selectedTargetId,
                          type: newRelType,
                          description: newRelDesc,
                        });
                        handleAddRelationship(selectedTargetId, {
                          characterId: selectedSourceId,
                          type: newRelType,
                          description: newRelDesc,
                        });
                        setSelectedSourceId(null);
                        setSelectedTargetId(null);
                        setNewRelDesc('');
                      }}
                      className="px-4 py-1.5 rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                    >
                      Connect Cast members
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Character Modal */}
      {isModalOpen && editingChar && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-foreground">
              {project.characters.some((c) => c.id === editingChar.id)
                ? 'Edit Character Profile'
                : 'Create New Character'}
            </h3>

            <form onSubmit={handleSaveChar} className="space-y-3 text-xs">
              {/* Profile Image / Portrait Upload */}
              <div className="p-3 rounded-lg bg-muted/20 border border-border/70 flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-border shadow-xs">
                  {editingChar.imageUrl ? (
                    <img
                      src={editingChar.imageUrl}
                      alt={editingChar.name || 'Character'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: editingChar.colorTag || '#3B82F6' }}
                    >
                      {editingChar.name ? editingChar.name.slice(0, 2).toUpperCase() : '??'}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-foreground">
                    Character Profile Image
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-card border border-border hover:bg-muted text-foreground text-xs font-medium cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      <span>{editingChar.imageUrl ? 'Change Image' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageFile(file, (dataUrl) => {
                              setEditingChar({ ...editingChar, imageUrl: dataUrl });
                            });
                          }
                        }}
                      />
                    </label>

                    {editingChar.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setEditingChar({ ...editingChar, imageUrl: undefined })}
                        className="flex items-center gap-1 px-2 py-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs transition-colors"
                      >
                        <X className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Upload PNG, JPG, or WebP portrait. Stored with character metadata.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editingChar.name}
                    onChange={(e) =>
                      setEditingChar({ ...editingChar, name: e.target.value })
                    }
                    required
                    placeholder="e.g. Detective Aria Vance"
                    className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Role
                  </label>
                  <select
                    value={editingChar.role}
                    onChange={(e) =>
                      setEditingChar({
                        ...editingChar,
                        role: e.target.value as CharacterRole,
                      })
                    }
                    className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Age
                  </label>
                  <input
                    type="text"
                    value={editingChar.age || ''}
                    onChange={(e) =>
                      setEditingChar({ ...editingChar, age: e.target.value })
                    }
                    placeholder="34"
                    className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Archetype
                  </label>
                  <input
                    type="text"
                    value={editingChar.archetype || ''}
                    onChange={(e) =>
                      setEditingChar({ ...editingChar, archetype: e.target.value })
                    }
                    placeholder="Cynical Inquisitor"
                    className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={editingChar.occupation || ''}
                    onChange={(e) =>
                      setEditingChar({ ...editingChar, occupation: e.target.value })
                    }
                    placeholder="Temporal Fraud Det."
                    className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Appearance & Distinctive Habits
                </label>
                <textarea
                  value={editingChar.appearance}
                  onChange={(e) =>
                    setEditingChar({ ...editingChar, appearance: e.target.value })
                  }
                  rows={2}
                  placeholder="Physical description, signature clothing, physical ticks or scars..."
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Personality Traits (comma separated)
                </label>
                <input
                  type="text"
                  value={editingChar.traits.join(', ')}
                  onChange={(e) =>
                    setEditingChar({
                      ...editingChar,
                      traits: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Sharp-tongued, Insomniac, Methodical, Secretive"
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Core Motivation / Goal
                  </label>
                  <textarea
                    value={editingChar.motivation}
                    onChange={(e) =>
                      setEditingChar({ ...editingChar, motivation: e.target.value })
                    }
                    rows={2}
                    placeholder="What do they desperately want?"
                    className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs resize-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Fatal Flaw / Conflict
                  </label>
                  <textarea
                    value={editingChar.conflict}
                    onChange={(e) =>
                      setEditingChar({ ...editingChar, conflict: e.target.value })
                    }
                    rows={2}
                    placeholder="What internal or external struggle holds them back?"
                    className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Color Tag
                </label>
                <div className="flex gap-2 mt-1">
                  {colorPalette.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() =>
                        setEditingChar({ ...editingChar, colorTag: col })
                      }
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        editingChar.colorTag === col
                          ? 'border-foreground scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Character Profile Modal */}
      {activeProfileChar && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-border/80 flex items-center justify-between bg-muted/20 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 overflow-hidden"
                  style={{ backgroundColor: activeProfileChar.colorTag || '#3B82F6' }}
                >
                  {activeProfileChar.imageUrl ? (
                    <img src={activeProfileChar.imageUrl} alt={activeProfileChar.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    activeProfileChar.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground leading-none">{activeProfileChar.name}</h3>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-1.5 block">
                    {activeProfileChar.role} · {activeProfileChar.archetype || 'No Archetype'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveProfileChar(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Close Profile"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Core Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/25 border border-border/50">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Age</span>
                  <span className="text-xs font-bold text-foreground mt-0.5 block">{activeProfileChar.age || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Occupation</span>
                  <span className="text-xs font-bold text-foreground mt-0.5 block truncate">{activeProfileChar.occupation || 'Unemployed'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Motivation</span>
                  <span className="text-xs font-bold text-foreground mt-0.5 block truncate" title={activeProfileChar.motivation}>{activeProfileChar.motivation || 'None'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Archetype</span>
                  <span className="text-xs font-bold text-foreground mt-0.5 block truncate">{activeProfileChar.archetype || 'None'}</span>
                </div>
              </div>

              {/* Dynamic Personality Tags */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  <span>Dynamic Personality Tags</span>
                </h4>
                <p className="text-[10px] text-muted-foreground">Add specific temperament adjectives or cognitive styles to anchor character actions.</p>
                
                {/* Tag Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new-personality-tag-input"
                    placeholder="e.g. INFJ, Melancholic, Hot-headed, Hyper-logical..."
                    className="flex-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          handleAddPersonalityTag(activeProfileChar.id, val);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-personality-tag-input') as HTMLInputElement;
                      const val = input?.value.trim();
                      if (val) {
                        handleAddPersonalityTag(activeProfileChar.id, val);
                        input.value = '';
                      }
                    }}
                    className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-xs transition-colors"
                  >
                    Add Tag
                  </button>
                </div>

                {/* Display Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(activeProfileChar.personalityTags || []).length > 0 ? (
                    (activeProfileChar.personalityTags || []).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium animate-in fade-in duration-100"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePersonalityTag(activeProfileChar.id, tag)}
                          className="w-3.5 h-3.5 rounded-full hover:bg-primary/20 flex items-center justify-center text-[9px] transition-colors"
                          title="Remove personality tag"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic">No personality tags added yet. Type a tag above and press Enter!</span>
                  )}
                </div>
              </div>

              {/* Character Goals & Plot Alignment */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>Story Goals & Plot Alignment</span>
                </h4>
                <p className="text-[10px] text-muted-foreground">Define key narrative check-points and milestone objectives to direct active subplots.</p>
                
                {/* Goal Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new-goal-input"
                    placeholder="e.g. Find the key before Chapter 5, Hide identity from Aria..."
                    className="flex-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          handleAddGoal(activeProfileChar.id, val);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-goal-input') as HTMLInputElement;
                      const val = input?.value.trim();
                      if (val) {
                        handleAddGoal(activeProfileChar.id, val);
                        input.value = '';
                      }
                    }}
                    className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-xs transition-colors"
                  >
                    Add Goal
                  </button>
                </div>

                {/* Display Goals */}
                <div className="space-y-1.5 pt-1">
                  {(activeProfileChar.goals || []).length > 0 ? (
                    (activeProfileChar.goals || []).map((goal, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border/80 hover:border-border transition-colors shadow-2xs"
                      >
                        <span className="text-xs font-medium text-foreground">{goal}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGoal(activeProfileChar.id, goal)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic block">No active goals set. Add a goal above to coordinate plot alignment!</span>
                  )}
                </div>
              </div>

              {/* Relationship Mappings */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-pink-500" />
                  <span>Relationship Mappings</span>
                </h4>
                <p className="text-[10px] text-muted-foreground">Map active dynamics, family roots, or rivals to align social conflicts inside scenes.</p>

                {/* New Relationship Input */}
                <div className="p-3 rounded-xl bg-muted/15 border border-border/60 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-semibold text-muted-foreground uppercase block mb-1 font-sans">Target Cast Member</label>
                      <select
                        id="relation-target-select"
                        className="w-full p-2 rounded-md bg-card border border-border text-foreground text-xs focus:outline-none"
                      >
                        <option value="">Select Character...</option>
                        {project.characters
                          .filter((c) => c.id !== activeProfileChar.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-semibold text-muted-foreground uppercase block mb-1 font-sans">Type of relation</label>
                      <input
                        type="text"
                        id="relation-type-input"
                        placeholder="e.g. Mentor, Rival, Lover, Sister"
                        className="w-full p-2 rounded-md bg-card border border-border text-foreground text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-muted-foreground uppercase block mb-1 font-sans">Relationship backstory / details</label>
                    <input
                      type="text"
                      id="relation-desc-input"
                      placeholder="e.g. Intensely competitive since early academy years, harbors secret respect..."
                      className="w-full p-2 rounded-md bg-card border border-border text-foreground text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const targetSelect = document.getElementById('relation-target-select') as HTMLSelectElement;
                        const typeInput = document.getElementById('relation-type-input') as HTMLInputElement;
                        const descInput = document.getElementById('relation-desc-input') as HTMLInputElement;
                        
                        const targetId = targetSelect?.value;
                        const relType = typeInput?.value.trim();
                        const relDesc = descInput?.value.trim();

                        if (targetId && relType) {
                          handleAddRelationship(activeProfileChar.id, {
                            characterId: targetId,
                            type: relType,
                            description: relDesc || '',
                          });
                          targetSelect.value = '';
                          typeInput.value = '';
                          descInput.value = '';
                        } else {
                          alert('Please select a target character and specify a relationship type (e.g., Rival).');
                        }
                      }}
                      className="px-3 py-1 text-xs font-bold rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Relationship</span>
                    </button>
                  </div>
                </div>

                {/* Display Relationships */}
                <div className="space-y-1.5 pt-1">
                  {(activeProfileChar.relationships || []).length > 0 ? (
                    (activeProfileChar.relationships || []).map((rel, idx) => {
                      const targetChar = project.characters.find((c) => c.id === rel.characterId);
                      if (!targetChar) return null;
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border border-border/70 bg-card flex items-start justify-between gap-3 shadow-3xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="font-extrabold text-foreground">{targetChar.name}</span>
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-500 font-sans">{rel.type}</span>
                            </div>
                            {rel.description && (
                              <p className="text-[10px] text-muted-foreground pt-0.5 italic leading-relaxed">"{rel.description}"</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveRelationship(activeProfileChar.id, rel.characterId)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            title="Remove relation mapping"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic block">No relationship mappings defined for this cast member yet. Add one above!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/20 shrink-0 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveProfileChar(null)}
                className="px-4 py-2 rounded-lg bg-card border border-border hover:bg-muted text-foreground font-bold text-xs shadow-3xs"
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
