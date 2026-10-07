import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  Plus,
  Flame,
  BookOpen,
  Users,
  Compass,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  Filter,
} from 'lucide-react';
import {
  Project,
  Plotline,
  TimelineBeat,
  Scene,
  Chapter,
  Character,
  Location,
  UserSettings,
} from '../types/writing';

interface TimelineMatrixViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  settings: UserSettings;
  onNavigateToScene?: (sceneId: string) => void;
}

const DEFAULT_PLOTLINE_COLORS = [
  '#2563EB', // Cobalt Blue
  '#E11D48', // Rose Crimson
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#64748B', // Slate
];

export const TimelineMatrixView: React.FC<TimelineMatrixViewProps> = ({
  project,
  onUpdateProject,
  settings,
  onNavigateToScene,
}) => {
  // Ensure default plotlines exist if none in project
  const plotlines: Plotline[] = useMemo(() => {
    if (project.plotlines && project.plotlines.length > 0) {
      return project.plotlines;
    }
    return [
      {
        id: 'plotline_main',
        title: 'Main Narrative Arc',
        description: 'Core spine and central conflict of the story',
        color: '#2563EB',
        category: 'Main Plot',
      },
      {
        id: 'plotline_character',
        title: 'Protagonist Journey',
        description: 'Internal transformation, flaw, and moral arc',
        color: '#10B981',
        category: 'Character Arc',
      },
      {
        id: 'plotline_antagonist',
        title: 'Antagonist & Threat',
        description: 'Opposing force moves and tightening stakes',
        color: '#E11D48',
        category: 'Subplot',
      },
      {
        id: 'plotline_mystery',
        title: 'B-Plot / Secret Mystery',
        description: 'Underlying clues, relationships, or secondary subplot',
        color: '#8B5CF6',
        category: 'Subplot',
      },
    ];
  }, [project.plotlines]);

  // Ensure default timeline beats if none in project
  const beats: TimelineBeat[] = useMemo(() => {
    if (project.timelineBeats && project.timelineBeats.length > 0) {
      return project.timelineBeats;
    }

    // Seed initial beats from book chapters and scenes if available
    const initialBeats: TimelineBeat[] = [];
    const firstBook = project.books[0];
    if (firstBook) {
      firstBook.acts.forEach((act, actIdx) => {
        act.chapters.forEach((chapter, chIdx) => {
          const firstScene = chapter.scenes[0];
          // Main plot beat
          initialBeats.push({
            id: `beat_main_${chapter.id}`,
            plotlineId: 'plotline_main',
            chapterId: chapter.id,
            title: firstScene ? firstScene.title : `${chapter.title} Hook`,
            summary: firstScene?.synopsis || `Key narrative escalation in ${chapter.title}.`,
            tensionLevel: Math.min(5, Math.max(1, 1 + ((chIdx + actIdx * 2) % 5))),
            sceneId: firstScene?.id,
            status: (firstScene?.status === 'Polished' || firstScene?.status === 'Revised') ? 'Drafted' : 'Outlined',
          });

          // Character arc beat every other chapter
          if (chIdx % 2 === 0) {
            initialBeats.push({
              id: `beat_char_${chapter.id}`,
              plotlineId: 'plotline_character',
              chapterId: chapter.id,
              title: `Internal Choice in ${chapter.title}`,
              summary: 'Character confronts personal doubt or emotional decision.',
              tensionLevel: 3,
              status: 'Outlined',
            });
          }
        });
      });
    }
    return initialBeats;
  }, [project.timelineBeats, project.books]);

  // Flatten all chapters across acts for the column headers
  const allChapters = useMemo(() => {
    const list: { chapter: Chapter; actTitle: string; actOrder: number }[] = [];
    const firstBook = project.books[0];
    if (firstBook) {
      firstBook.acts.forEach((act) => {
        act.chapters.forEach((chapter) => {
          list.push({
            chapter,
            actTitle: act.title,
            actOrder: act.order,
          });
        });
      });
    }
    return list;
  }, [project.books]);

  // All scenes lookup for cross-referencing
  const allScenes = useMemo(() => {
    const map = new Map<string, Scene>();
    project.books.forEach((b) => {
      b.acts.forEach((a) => {
        a.chapters.forEach((c) => {
          c.scenes.forEach((s) => {
            map.set(s.id, s);
          });
        });
      });
    });
    return map;
  }, [project.books]);

  // Filter states
  const [selectedAct, setSelectedAct] = useState<string>('all');
  const [selectedPlotlineFilter, setSelectedPlotlineFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'matrix' | 'tension'>('matrix');

  // Inspector Drawer state
  const [inspectingBeat, setInspectingBeat] = useState<TimelineBeat | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'details' | 'scene' | 'cast'>('details');

  // Plotline Modal State
  const [isPlotlineModalOpen, setIsPlotlineModalOpen] = useState(false);
  const [editingPlotline, setEditingPlotline] = useState<Plotline | null>(null);

  // Filtered chapters & plotlines
  const filteredChapters = useMemo(() => {
    if (selectedAct === 'all') return allChapters;
    return allChapters.filter((c) => c.actTitle === selectedAct);
  }, [allChapters, selectedAct]);

  const filteredPlotlines = useMemo(() => {
    if (selectedPlotlineFilter === 'all') return plotlines;
    return plotlines.filter((p) => p.id === selectedPlotlineFilter);
  }, [plotlines, selectedPlotlineFilter]);

  // Acts list for filtering
  const availableActs = useMemo(() => {
    const acts = new Set<string>();
    allChapters.forEach((c) => acts.add(c.actTitle));
    return Array.from(acts);
  }, [allChapters]);

  // Helper to save plotlines & beats to project
  const saveMatrixData = (newPlotlines: Plotline[], newBeats: TimelineBeat[]) => {
    onUpdateProject({
      ...project,
      plotlines: newPlotlines,
      timelineBeats: newBeats,
      updatedAt: new Date().toISOString(),
    });
  };

  // Add / Edit Beat Handler
  const handleSaveBeat = (updatedBeat: TimelineBeat) => {
    const existingIndex = beats.findIndex((b) => b.id === updatedBeat.id);
    let updatedBeats: TimelineBeat[];
    if (existingIndex >= 0) {
      updatedBeats = [...beats];
      updatedBeats[existingIndex] = updatedBeat;
    } else {
      updatedBeats = [...beats, updatedBeat];
    }
    saveMatrixData(plotlines, updatedBeats);
    setInspectingBeat(updatedBeat);
  };

  // Delete Beat Handler
  const handleDeleteBeat = (beatId: string) => {
    const updatedBeats = beats.filter((b) => b.id !== beatId);
    saveMatrixData(plotlines, updatedBeats);
    setInspectingBeat(null);
  };

  // Create new Beat in specific cell
  const handleCreateBeatInCell = (plotlineId: string, chapterId: string) => {
    const chapter = allChapters.find((c) => c.chapter.id === chapterId)?.chapter;
    const plotline = plotlines.find((p) => p.id === plotlineId);
    const newBeat: TimelineBeat = {
      id: `beat_${Date.now()}`,
      plotlineId,
      chapterId,
      title: `${plotline?.title || 'Beat'} - ${chapter?.title || 'Chapter'}`,
      summary: '',
      tensionLevel: 3,
      status: 'Idea',
    };
    handleSaveBeat(newBeat);
    setInspectingBeat(newBeat);
    setInspectorTab('details');
  };

  // Save Plotline
  const handleSavePlotline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlotline || !editingPlotline.title.trim()) return;

    let updatedPlotlines: Plotline[];
    const idx = plotlines.findIndex((p) => p.id === editingPlotline.id);
    if (idx >= 0) {
      updatedPlotlines = [...plotlines];
      updatedPlotlines[idx] = editingPlotline;
    } else {
      updatedPlotlines = [...plotlines, editingPlotline];
    }

    saveMatrixData(updatedPlotlines, beats);
    setIsPlotlineModalOpen(false);
    setEditingPlotline(null);
  };

  // Delete Plotline
  const handleDeletePlotline = (plotlineId: string) => {
    if (!confirm('Are you sure you want to delete this plotline and all its timeline beats?')) return;
    const updatedPlotlines = plotlines.filter((p) => p.id !== plotlineId);
    const updatedBeats = beats.filter((b) => b.plotlineId !== plotlineId);
    saveMatrixData(updatedPlotlines, updatedBeats);
    if (inspectingBeat?.plotlineId === plotlineId) {
      setInspectingBeat(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden select-none">
      {/* Top Action Bar */}
      <div className="border-b border-border p-3 sm:px-4 bg-card/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-foreground">
                  Story Arc Matrix
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground hidden sm:inline">
                  Plottr-Style Timeline
                </span>
              </div>
              <p className="text-xs text-muted-foreground hidden md:block">
                Plot multiple narrative threads across chapters with linked manuscript cross-referencing.
              </p>
            </div>
          </div>
        </div>

        {/* Controls & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/50 text-xs">
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'matrix'
                  ? 'bg-card text-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="2D Swimlane Matrix"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('tension')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'tension'
                  ? 'bg-card text-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Narrative Tension Curve"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Tension Curve</span>
            </button>
          </div>

          {/* Act Filter */}
          {availableActs.length > 1 && (
            <select
              value={selectedAct}
              onChange={(e) => setSelectedAct(e.target.value)}
              className="text-xs bg-card border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Acts ({allChapters.length} ch)</option>
              {availableActs.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          )}

          {/* Plotline Filter */}
          <select
            value={selectedPlotlineFilter}
            onChange={(e) => setSelectedPlotlineFilter(e.target.value)}
            className="text-xs bg-card border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Plotlines ({plotlines.length})</option>
            {plotlines.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {/* Add Plotline Button */}
          <button
            onClick={() => {
              setEditingPlotline({
                id: `plotline_${Date.now()}`,
                title: '',
                description: '',
                color: DEFAULT_PLOTLINE_COLORS[plotlines.length % DEFAULT_PLOTLINE_COLORS.length],
                category: 'Subplot',
              });
              setIsPlotlineModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Plotline</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area with Optional Side-by-Side Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Matrix Canvas */}
        <div className="flex-1 overflow-auto bg-background/50 p-4">
          {viewMode === 'matrix' ? (
            <div className="min-w-fit border border-border/80 rounded-xl bg-card shadow-sm overflow-hidden">
              <table className="w-full border-collapse text-left">
                {/* Column Headers: Chapters grouped by Act */}
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    {/* Top Left Corner */}
                    <th className="sticky left-0 z-20 bg-muted/80 backdrop-blur p-3 border-r border-border min-w-[200px] max-w-[240px] text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center justify-between">
                        <span>Plotline / Chapter</span>
                        <span className="font-mono text-[10px] text-muted-foreground/80 lowercase">
                          {filteredChapters.length} cols
                        </span>
                      </div>
                    </th>

                    {/* Chapter Headers */}
                    {filteredChapters.map(({ chapter, actTitle }) => (
                      <th
                        key={chapter.id}
                        className="p-3 border-r border-border/60 min-w-[220px] max-w-[260px] align-top text-xs"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider truncate">
                            {actTitle}
                          </span>
                          <span className="font-semibold text-foreground text-xs truncate" title={chapter.title}>
                            {chapter.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {chapter.scenes.length} {chapter.scenes.length === 1 ? 'scene' : 'scenes'}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Rows: Plotlines */}
                <tbody>
                  {filteredPlotlines.map((plotline) => {
                    return (
                      <tr key={plotline.id} className="border-b border-border/60 group/row hover:bg-muted/10 transition-colors">
                        {/* Sticky Row Header for Plotline */}
                        <td className="sticky left-0 z-10 bg-card p-3 border-r border-border align-top min-w-[200px] max-w-[240px] shadow-xs">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                                  style={{ backgroundColor: plotline.color }}
                                />
                                <span className="font-semibold text-xs text-foreground truncate" title={plotline.title}>
                                  {plotline.title}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingPlotline(plotline);
                                  setIsPlotlineModalOpen(true);
                                }}
                                className="opacity-0 group-hover/row:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                title="Edit Plotline"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <span className="px-1.5 py-0.2 rounded bg-muted font-medium">
                                {plotline.category}
                              </span>
                            </div>

                            {plotline.description && (
                              <p className="text-[10px] text-muted-foreground/80 line-clamp-2 leading-relaxed">
                                {plotline.description}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Intersection Cells (Chapters) */}
                        {filteredChapters.map(({ chapter }) => {
                          const cellBeats = beats.filter(
                            (b) => b.plotlineId === plotline.id && b.chapterId === chapter.id
                          );

                          return (
                            <td
                              key={chapter.id}
                              className="p-2 border-r border-border/60 align-top min-w-[220px] max-w-[260px] group/cell hover:bg-muted/20 transition-colors"
                            >
                              <div className="flex flex-col gap-2 min-h-[90px]">
                                {cellBeats.map((beat) => {
                                  const linkedScene = beat.sceneId ? allScenes.get(beat.sceneId) : null;
                                  const isSelected = inspectingBeat?.id === beat.id;

                                  return (
                                    <div
                                      key={beat.id}
                                      onClick={() => {
                                        setInspectingBeat(beat);
                                        setInspectorTab('details');
                                      }}
                                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-150 shadow-2xs relative ${
                                        isSelected
                                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                          : 'border-border/80 bg-card hover:border-border hover:shadow-xs'
                                      }`}
                                      style={{ borderLeftWidth: '4px', borderLeftColor: plotline.color }}
                                    >
                                      {/* Header with Title and Tension Rating */}
                                      <div className="flex items-start justify-between gap-1 mb-1">
                                        <span className="text-xs font-semibold text-foreground line-clamp-1 leading-snug">
                                          {beat.title}
                                        </span>
                                        <div className="flex items-center text-amber-500 text-[10px] shrink-0" title={`Tension Level: ${beat.tensionLevel}/5`}>
                                          <Flame className="w-3 h-3 fill-amber-500" />
                                          <span className="font-mono font-bold text-[9px] ml-0.5">{beat.tensionLevel}</span>
                                        </div>
                                      </div>

                                      {/* Summary */}
                                      {beat.summary && (
                                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-1.5">
                                          {beat.summary}
                                        </p>
                                      )}

                                      {/* Linked Scene & Status Pill */}
                                      <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-1 border-t border-border/40 text-[10px]">
                                        {linkedScene ? (
                                          <span className="inline-flex items-center gap-1 text-primary font-medium truncate max-w-[140px]" title={`Linked to Scene: ${linkedScene.title}`}>
                                            <BookOpen className="w-2.5 h-2.5 shrink-0" />
                                            <span className="truncate">{linkedScene.title}</span>
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground/60 italic text-[9px]">
                                            Unlinked scene
                                          </span>
                                        )}
                                        <span className="ml-auto font-mono text-[9px] text-muted-foreground uppercase px-1 rounded bg-muted/60">
                                          {beat.status}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Quick Add Button in Empty/Populated Cell */}
                                <button
                                  onClick={() => handleCreateBeatInCell(plotline.id, chapter.id)}
                                  className="w-full py-1.5 px-2 rounded-md border border-dashed border-border/60 hover:border-primary/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 text-[11px] flex items-center justify-center gap-1 transition-all opacity-0 group-hover/cell:opacity-100"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Beat</span>
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Tension Curve Graph View */
            <div className="p-6 bg-card border border-border rounded-xl">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-foreground">Narrative Tension Arc</h2>
                <p className="text-xs text-muted-foreground">
                  Tracks pacing intensity (1–5) across chapters to detect flatlines, pacing dips, and climax peaks.
                </p>
              </div>

              <div className="w-full overflow-x-auto">
                <svg className="w-full min-w-[700px] h-64" viewBox={`0 0 ${Math.max(700, filteredChapters.length * 90)} 240`}>
                  {/* Grid Lines for Tension 1 to 5 */}
                  {[1, 2, 3, 4, 5].map((level) => {
                    const y = 220 - ((level - 1) / 4) * 180;
                    return (
                      <g key={level}>
                        <line x1="50" y1={y} x2={Math.max(700, filteredChapters.length * 90) - 20} y2={y} stroke="currentColor" className="text-border/40" strokeDasharray="3 3" />
                        <text x="35" y={y + 4} textAnchor="end" className="text-[10px] fill-muted-foreground font-mono">
                          Lvl {level}
                        </text>
                      </g>
                    );
                  })}

                  {/* Vertical Lines for Chapters */}
                  {filteredChapters.map(({ chapter }, idx) => {
                    const x = 70 + idx * 85;
                    return (
                      <g key={chapter.id}>
                        <line x1={x} y1="30" x2={x} y2="220" stroke="currentColor" className="text-border/20" />
                        <text x={x} y="235" textAnchor="middle" className="text-[9px] fill-muted-foreground font-medium truncate">
                          Ch {idx + 1}
                        </text>
                      </g>
                    );
                  })}

                  {/* Polyline for each plotline */}
                  {filteredPlotlines.map((plotline) => {
                    const points = filteredChapters
                      .map(({ chapter }, idx) => {
                        const beat = beats.find((b) => b.plotlineId === plotline.id && b.chapterId === chapter.id);
                        if (!beat) return null;
                        const x = 70 + idx * 85;
                        const y = 220 - ((beat.tensionLevel - 1) / 4) * 180;
                        return { x, y, beat };
                      })
                      .filter(Boolean) as { x: number; y: number; beat: TimelineBeat }[];

                    if (points.length < 1) return null;

                    const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

                    return (
                      <g key={plotline.id}>
                        {points.length > 1 && (
                          <polyline
                            points={polylinePoints}
                            fill="none"
                            stroke={plotline.color}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.85"
                          />
                        )}
                        {points.map((p) => (
                          <circle
                            key={p.beat.id}
                            cx={p.x}
                            cy={p.y}
                            r="4.5"
                            fill={plotline.color}
                            className="cursor-pointer hover:r-6 transition-all"
                            onClick={() => {
                              setInspectingBeat(p.beat);
                              setInspectorTab('details');
                            }}
                          >
                            <title>{`${plotline.title}: ${p.beat.title} (Tension: ${p.beat.tensionLevel})`}</title>
                          </circle>
                        ))}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border">
                {filteredPlotlines.map((plotline) => (
                  <div key={plotline.id} className="flex items-center gap-1.5 text-xs text-foreground">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: plotline.color }} />
                    <span className="font-medium">{plotline.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side-by-Side Cross-Reference Inspector Drawer */}
        {inspectingBeat && (
          <div className="w-80 md:w-96 border-l border-border bg-card shadow-xl flex flex-col h-full shrink-0 z-30 transition-all duration-200">
            {/* Drawer Header */}
            <div className="p-3.5 border-b border-border flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {(() => {
                  const plotline = plotlines.find((p) => p.id === inspectingBeat.plotlineId);
                  return (
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: plotline?.color || '#2563EB' }}
                    />
                  );
                })()}
                <span className="text-xs font-bold text-foreground truncate">
                  {inspectingBeat.title || 'Story Beat'}
                </span>
              </div>
              <button
                onClick={() => setInspectingBeat(null)}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Close Inspector (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inspector Tabs */}
            <div className="flex border-b border-border text-xs bg-muted/40">
              <button
                onClick={() => setInspectorTab('details')}
                className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
                  inspectorTab === 'details'
                    ? 'border-primary text-foreground font-semibold bg-card'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Beat Details
              </button>
              <button
                onClick={() => setInspectorTab('scene')}
                className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors flex items-center justify-center gap-1 ${
                  inspectorTab === 'scene'
                    ? 'border-primary text-foreground font-semibold bg-card'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Scene Prose</span>
              </button>
              <button
                onClick={() => setInspectorTab('cast')}
                className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors flex items-center justify-center gap-1 ${
                  inspectorTab === 'cast'
                    ? 'border-primary text-foreground font-semibold bg-card'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Cast & Lore</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* TAB 1: BEAT DETAILS */}
              {inspectorTab === 'details' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                      Beat Title
                    </label>
                    <input
                      type="text"
                      value={inspectingBeat.title}
                      onChange={(e) => handleSaveBeat({ ...inspectingBeat, title: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                      placeholder="e.g. Inciting Discovery"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                      Narrative Summary & Objective
                    </label>
                    <textarea
                      rows={3}
                      value={inspectingBeat.summary}
                      onChange={(e) => handleSaveBeat({ ...inspectingBeat, summary: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden text-xs resize-none"
                      placeholder="What happens in this beat? What is the turning point?"
                    />
                  </div>

                  {/* Tension Level Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Tension Rating ({inspectingBeat.tensionLevel}/5)</span>
                      </label>
                      <span className="text-[10px] text-muted-foreground">
                        {inspectingBeat.tensionLevel === 1 && 'Calm / Setup'}
                        {inspectingBeat.tensionLevel === 2 && 'Mild Friction'}
                        {inspectingBeat.tensionLevel === 3 && 'Escalating Conflict'}
                        {inspectingBeat.tensionLevel === 4 && 'High Stakes / Crisis'}
                        {inspectingBeat.tensionLevel === 5 && 'Climax / Peak Tension'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleSaveBeat({ ...inspectingBeat, tensionLevel: lvl })}
                          className={`flex-1 py-1.5 rounded-md font-mono text-xs font-bold transition-all ${
                            inspectingBeat.tensionLevel >= lvl
                              ? 'bg-amber-500 text-amber-950 shadow-2xs'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status & Plotline Switcher */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                        Beat Status
                      </label>
                      <select
                        value={inspectingBeat.status}
                        onChange={(e) => handleSaveBeat({ ...inspectingBeat, status: e.target.value as any })}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground"
                      >
                        <option value="Idea">Idea</option>
                        <option value="Outlined">Outlined</option>
                        <option value="Drafted">Drafted</option>
                        <option value="Revised">Revised</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                        Plotline
                      </label>
                      <select
                        value={inspectingBeat.plotlineId}
                        onChange={(e) => handleSaveBeat({ ...inspectingBeat, plotlineId: e.target.value })}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground"
                      >
                        {plotlines.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notes / Conflict Stakes */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                      Author's Internal Notes / Stakes
                    </label>
                    <textarea
                      rows={2}
                      value={inspectingBeat.notes || ''}
                      onChange={(e) => handleSaveBeat({ ...inspectingBeat, notes: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden text-xs resize-none"
                      placeholder="Subtext, foreshadowing clues, emotional stakes..."
                    />
                  </div>

                  {/* Delete Beat Button */}
                  <div className="pt-2 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => handleDeleteBeat(inspectingBeat.id)}
                      className="flex items-center gap-1.5 text-destructive hover:underline text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete this beat</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: LINKED SCENE PROSE CROSS-REFERENCE */}
              {inspectorTab === 'scene' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                      Link Manuscript Scene
                    </label>
                    <select
                      value={inspectingBeat.sceneId || ''}
                      onChange={(e) => handleSaveBeat({ ...inspectingBeat, sceneId: e.target.value || undefined })}
                      className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-foreground"
                    >
                      <option value="">-- No Scene Linked --</option>
                      {Array.from(allScenes.values()).map((scene) => (
                        <option key={scene.id} value={scene.id}>
                          {scene.title} ({scene.wordCount || 0} words)
                        </option>
                      ))}
                    </select>
                  </div>

                  {inspectingBeat.sceneId && allScenes.has(inspectingBeat.sceneId) ? (
                    (() => {
                      const linkedScene = allScenes.get(inspectingBeat.sceneId)!;
                      return (
                        <div className="p-3 rounded-lg border border-border/80 bg-background space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-border/40">
                            <div>
                              <h3 className="font-bold text-foreground text-xs">{linkedScene.title}</h3>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {linkedScene.wordCount || 0} words · Status: {linkedScene.status}
                              </span>
                            </div>
                            {onNavigateToScene && (
                              <button
                                onClick={() => onNavigateToScene(linkedScene.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                                title="Jump into Editor"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Open Editor</span>
                              </button>
                            )}
                          </div>

                          {linkedScene.synopsis && (
                            <div>
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                                Scene Synopsis
                              </span>
                              <p className="text-xs text-foreground mt-0.5 leading-relaxed italic">
                                "{linkedScene.synopsis}"
                              </p>
                            </div>
                          )}

                          <div>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                              Manuscript Draft Preview
                            </span>
                            <div className="mt-1 p-2 rounded bg-muted/40 font-serif text-xs text-foreground leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap border border-border/40">
                              {linkedScene.content
                                ? linkedScene.content.slice(0, 500) + (linkedScene.content.length > 500 ? '...' : '')
                                : '(Scene is currently empty. Click Open Editor to draft.)'}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-6 text-center border border-dashed border-border rounded-lg text-muted-foreground">
                      <BookOpen className="w-6 h-6 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">No manuscript scene attached yet.</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Select a scene above to cross-reference prose side-by-side with your plot beats.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CAST & LORE CROSS-REFERENCE */}
              {inspectorTab === 'cast' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                      Attached Characters
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {project.characters.map((char) => {
                        const isAttached = inspectingBeat.characterIds?.includes(char.id);
                        return (
                          <button
                            key={char.id}
                            type="button"
                            onClick={() => {
                              const curr = inspectingBeat.characterIds || [];
                              const updated = isAttached
                                ? curr.filter((id) => id !== char.id)
                                : [...curr, char.id];
                              handleSaveBeat({ ...inspectingBeat, characterIds: updated });
                            }}
                            className={`px-2 py-1 rounded-md text-xs font-medium border transition-all ${
                              isAttached
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/50 text-muted-foreground border-border/60 hover:text-foreground'
                            }`}
                          >
                            {char.name} ({char.role})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Display Character Dossiers for attached characters */}
                  {inspectingBeat.characterIds && inspectingBeat.characterIds.length > 0 ? (
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Active Character Dossiers
                      </span>
                      {inspectingBeat.characterIds.map((charId) => {
                        const char = project.characters.find((c) => c.id === charId);
                        if (!char) return null;
                        return (
                          <div key={char.id} className="p-2.5 rounded-lg border border-border/70 bg-background space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground text-xs">{char.name}</span>
                              <span className="text-[10px] text-primary font-medium">{char.role}</span>
                            </div>
                            {char.motivation && (
                              <p className="text-[11px] text-muted-foreground">
                                <strong className="text-foreground">Motivation:</strong> {char.motivation}
                              </p>
                            )}
                            {char.conflict && (
                              <p className="text-[11px] text-muted-foreground">
                                <strong className="text-foreground">Conflict:</strong> {char.conflict}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      No characters attached to this beat. Select cast members above to display their core motivations and conflicts.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Plotline Edit / Create Modal */}
      {isPlotlineModalOpen && editingPlotline && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-5 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">
                {editingPlotline.title ? 'Edit Plotline' : 'Add New Narrative Thread'}
              </h2>
              <button
                onClick={() => setIsPlotlineModalOpen(false)}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlotline} className="space-y-4 pt-4">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                  Plotline Title
                </label>
                <input
                  type="text"
                  required
                  value={editingPlotline.title}
                  onChange={(e) => setEditingPlotline({ ...editingPlotline, title: e.target.value })}
                  placeholder="e.g. Murder Mystery B-Plot, Romance Thread"
                  className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={editingPlotline.category}
                    onChange={(e) => setEditingPlotline({ ...editingPlotline, category: e.target.value as any })}
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground"
                  >
                    <option value="Main Plot">Main Plot</option>
                    <option value="Subplot">Subplot</option>
                    <option value="Character Arc">Character Arc</option>
                    <option value="Theme">Theme</option>
                    <option value="World Event">World Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                    Thread Color
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {DEFAULT_PLOTLINE_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditingPlotline({ ...editingPlotline, color })}
                        className={`w-5 h-5 rounded-full border transition-all ${
                          editingPlotline.color === color ? 'ring-2 ring-primary scale-110' : 'border-border/60 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                  Description / Narrative Goal
                </label>
                <textarea
                  rows={2}
                  value={editingPlotline.description || ''}
                  onChange={(e) => setEditingPlotline({ ...editingPlotline, description: e.target.value })}
                  placeholder="What is the central question or outcome of this thread?"
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                {plotlines.some((p) => p.id === editingPlotline.id) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlotlineModalOpen(false);
                      handleDeletePlotline(editingPlotline.id);
                    }}
                    className="text-destructive hover:underline text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlotlineModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-foreground text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 shadow-2xs"
                  >
                    Save Plotline
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
