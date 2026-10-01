import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Search,
  Edit2,
  Trash2,
  Wind,
  MapPin,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Project, Location } from '../types/writing';

interface LocationsViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

export const LocationsView: React.FC<LocationsViewProps> = ({
  project,
  onUpdateProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const locationTypes = [
    'City / Metropole',
    'Building / Citadel',
    'Room / Interior',
    'Wilderness / Nature',
    'Vehicle / Vessel',
    'Subterranean / Vault',
    'Other Realm / Dimension',
  ];

  const handleOpenAdd = () => {
    setEditingLoc({
      id: `loc_${Date.now()}`,
      name: '',
      type: 'Building / Citadel',
      eraOrClimate: '',
      sensoryDetails: '',
      loreAndSignificance: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSaveLoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoc || !editingLoc.name.trim()) return;

    const locs = [...project.locations];
    const existingIndex = locs.findIndex((l) => l.id === editingLoc.id);

    if (existingIndex >= 0) {
      locs[existingIndex] = editingLoc;
    } else {
      locs.push(editingLoc);
    }

    onUpdateProject({
      ...project,
      locations: locs,
      updatedAt: new Date().toISOString(),
    });
    setIsModalOpen(false);
    setEditingLoc(null);
  };

  const handleDeleteLoc = (locId: string) => {
    if (confirm('Delete this location profile?')) {
      const locs = project.locations.filter((l) => l.id !== locId);
      onUpdateProject({
        ...project,
        locations: locs,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const filteredLocations = project.locations.filter(
    (l) =>
      !searchQuery ||
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.sensoryDetails.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Top Header */}
      <div className="border-b border-border p-3.5 bg-card/60 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-foreground">Locations & Settings Index</h2>
          <span className="text-xs text-muted-foreground">
            {project.locations.length} {project.locations.length === 1 ? 'place' : 'places'} established
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search places..."
              className="text-xs pl-8 pr-2.5 py-1.5 rounded-md bg-muted/30 border border-border text-foreground w-48 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Location</span>
          </button>
        </div>
      </div>

      {/* Grid of Locations */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((loc) => (
            <div
              key={loc.id}
              className="p-4 bg-card border border-border/80 rounded-xl shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span>{loc.name}</span>
                    </h3>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {loc.type}
                    </div>
                  </div>

                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingLoc(loc);
                        setIsModalOpen(true);
                      }}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Edit Location"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteLoc(loc.id)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Delete Location"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {loc.eraOrClimate && (
                  <div className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                    <Wind className="w-3 h-3 text-muted-foreground/70" />
                    <span>{loc.eraOrClimate}</span>
                  </div>
                )}

                {/* Sensory Details */}
                <div className="space-y-1 bg-muted/20 p-2.5 rounded-lg border border-border/40 text-xs">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Atmosphere & Sensory Palette
                  </div>
                  <p className="text-[11px] text-foreground/80 leading-relaxed">
                    {loc.sensoryDetails}
                  </p>
                </div>

                {/* Lore / Significance */}
                {loc.loreAndSignificance && (
                  <div className="text-xs pt-1 space-y-0.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Narrative Significance
                    </span>
                    <p className="text-[11px] text-foreground/80 leading-relaxed">
                      {loc.loreAndSignificance}
                    </p>
                  </div>
                )}
              </div>

              {loc.notes && (
                <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground italic truncate">
                  Notes: {loc.notes}
                </div>
              )}
            </div>
          ))}

          {filteredLocations.length === 0 && (
            <div className="col-span-full py-16 text-center text-xs text-muted-foreground italic">
              No location profiles found. Add key story settings to ground your narrative.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Location Modal */}
      {isModalOpen && editingLoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-foreground">
              {project.locations.some((l) => l.id === editingLoc.id)
                ? 'Edit Location Profile'
                : 'Create New Location'}
            </h3>

            <form onSubmit={handleSaveLoc} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    value={editingLoc.name}
                    onChange={(e) =>
                      setEditingLoc({ ...editingLoc, name: e.target.value })
                    }
                    required
                    placeholder="e.g. The Brass Spire"
                    className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Setting Type
                  </label>
                  <select
                    value={editingLoc.type}
                    onChange={(e) =>
                      setEditingLoc({ ...editingLoc, type: e.target.value })
                    }
                    className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                  >
                    {locationTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Era, Climate & Weather
                </label>
                <input
                  type="text"
                  value={editingLoc.eraOrClimate || ''}
                  onChange={(e) =>
                    setEditingLoc({ ...editingLoc, eraOrClimate: e.target.value })
                  }
                  placeholder="e.g. Neo-Victorian, perpetual damp autumn drizzle, alpine winds"
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Sensory Details (Sight, Sound, Smell, Temperature, Mood) *
                </label>
                <textarea
                  value={editingLoc.sensoryDetails}
                  onChange={(e) =>
                    setEditingLoc({ ...editingLoc, sensoryDetails: e.target.value })
                  }
                  required
                  rows={3}
                  placeholder="What does a character immediately notice upon entering? Smells of hot oil, metronomic clatter, dim gaslights..."
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Lore & Story Significance
                </label>
                <textarea
                  value={editingLoc.loreAndSignificance}
                  onChange={(e) =>
                    setEditingLoc({
                      ...editingLoc,
                      loreAndSignificance: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="Why does this place matter to the plot? Historical secrets, restricted access..."
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Author Scratch Notes
                </label>
                <input
                  type="text"
                  value={editingLoc.notes || ''}
                  onChange={(e) =>
                    setEditingLoc({ ...editingLoc, notes: e.target.value })
                  }
                  placeholder="e.g. Scene 3 takes place in the eastern clock tower wing"
                  className="w-full mt-1 p-2 rounded-md bg-muted/30 border border-border text-foreground text-xs"
                />
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
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
