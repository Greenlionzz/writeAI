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
        </div>

        <div className="flex items-center gap-2">
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
                className="p-4 bg-card border border-border/80 rounded-xl shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between space-y-3 group"
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

                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingChar(char);
                          setIsModalOpen(true);
                        }}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Edit Character"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteChar(char.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        title="Delete Character"
                      >
                        <Trash2 className="w-3 h-3" />
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
    </div>
  );
};
