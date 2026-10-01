import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  FileText,
  Users,
  Compass,
  Layers,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Sparkles,
  CornerDownLeft,
} from 'lucide-react';
import { Project, Scene, Character, Location, PlotCard } from '../types/writing';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onNavigateToScene: (sceneId: string) => void;
  onNavigateToView: (view: 'manuscript' | 'plotboard' | 'characters' | 'locations') => void;
}

type SearchCategory = 'all' | 'scenes' | 'characters' | 'locations' | 'plot';

interface SceneMatchResult {
  type: 'scene';
  id: string;
  title: string;
  bookTitle: string;
  chapterTitle: string;
  actTitle: string;
  wordCount: number;
  status: string;
  matchedField: 'title' | 'synopsis' | 'content' | 'notes';
  excerpt: string;
  matchCount: number;
}

interface CharacterMatchResult {
  type: 'character';
  id: string;
  name: string;
  role: string;
  archetype?: string;
  traits: string[];
  matchedField: string;
  snippet: string;
}

interface LocationMatchResult {
  type: 'location';
  id: string;
  name: string;
  locationType: string;
  significance?: string;
  snippet: string;
}

interface PlotMatchResult {
  type: 'plot';
  id: string;
  title: string;
  act: string;
  status: string;
  summary: string;
  tags: string[];
}

type SearchResultItem =
  | SceneMatchResult
  | CharacterMatchResult
  | LocationMatchResult
  | PlotMatchResult;

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  project,
  onNavigateToScene,
  onNavigateToView,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Helper to extract highlighted excerpt snippet around matching query
  const getSnippetWithContext = (fullText: string, searchTerm: string): string => {
    if (!fullText) return '';
    const idx = fullText.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (idx === -1) return fullText.slice(0, 110) + (fullText.length > 110 ? '...' : '');

    const start = Math.max(0, idx - 45);
    const end = Math.min(fullText.length, idx + searchTerm.length + 65);
    let snippet = fullText.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < fullText.length) snippet = snippet + '...';
    return snippet;
  };

  // Count matches in a text
  const countOccurrences = (text: string, searchTerm: string): number => {
    if (!text || !searchTerm) return 0;
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  };

  // Perform search across all entities
  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const results: SearchResultItem[] = [];

    // 1. Search Manuscript Scenes across all Books, Acts, Chapters
    project.books?.forEach((book) => {
      book.acts?.forEach((act) => {
        act.chapters?.forEach((chapter) => {
          chapter.scenes?.forEach((scene) => {
            const inTitle = scene.title?.toLowerCase().includes(trimmed);
            const inSynopsis = scene.synopsis?.toLowerCase().includes(trimmed);
            const inContent = scene.content?.toLowerCase().includes(trimmed);
            const inNotes = scene.notes?.toLowerCase().includes(trimmed);

            if (inTitle || inSynopsis || inContent || inNotes) {
              let matchedField: 'title' | 'synopsis' | 'content' | 'notes' = 'title';
              let excerpt = scene.synopsis || scene.content?.slice(0, 120) || '';
              let matchCount = 0;

              if (inContent) {
                matchedField = 'content';
                excerpt = getSnippetWithContext(scene.content, trimmed);
                matchCount = countOccurrences(scene.content, trimmed);
              } else if (inSynopsis) {
                matchedField = 'synopsis';
                excerpt = getSnippetWithContext(scene.synopsis, trimmed);
                matchCount = countOccurrences(scene.synopsis, trimmed);
              } else if (inTitle) {
                matchedField = 'title';
                excerpt = scene.synopsis || scene.content?.slice(0, 100) || '';
                matchCount = 1;
              } else if (inNotes) {
                matchedField = 'notes';
                excerpt = getSnippetWithContext(scene.notes || '', trimmed);
                matchCount = countOccurrences(scene.notes || '', trimmed);
              }

              results.push({
                type: 'scene',
                id: scene.id,
                title: scene.title || 'Untitled Scene',
                bookTitle: book.title,
                chapterTitle: chapter.title,
                actTitle: act.title,
                wordCount: scene.wordCount || 0,
                status: scene.status || 'Draft',
                matchedField,
                excerpt,
                matchCount,
              });
            }
          });
        });
      });
    });

    // 2. Search Characters Bible
    project.characters?.forEach((char) => {
      const inName = char.name?.toLowerCase().includes(trimmed);
      const inRole = char.role?.toLowerCase().includes(trimmed);
      const inArchetype = char.archetype?.toLowerCase().includes(trimmed);
      const inAppearance = char.appearance?.toLowerCase().includes(trimmed);
      const inMotive = char.motivation?.toLowerCase().includes(trimmed);
      const inConflict = char.conflict?.toLowerCase().includes(trimmed);
      const inBackstory = char.backstory?.toLowerCase().includes(trimmed);
      const inNotes = char.notes?.toLowerCase().includes(trimmed);
      const inTraits = char.traits?.some((t) => t.toLowerCase().includes(trimmed));

      if (inName || inRole || inArchetype || inAppearance || inMotive || inConflict || inBackstory || inNotes || inTraits) {
        let snippet = char.motivation || char.appearance || char.backstory || char.conflict || '';
        if (inMotive) snippet = getSnippetWithContext(char.motivation, trimmed);
        else if (inAppearance) snippet = getSnippetWithContext(char.appearance, trimmed);
        else if (inBackstory) snippet = getSnippetWithContext(char.backstory || '', trimmed);
        else if (inConflict) snippet = getSnippetWithContext(char.conflict, trimmed);

        results.push({
          type: 'character',
          id: char.id,
          name: char.name,
          role: char.role,
          archetype: char.archetype,
          traits: char.traits || [],
          matchedField: inName ? 'name' : inRole ? 'role' : 'motivation',
          snippet: snippet || 'Character registered in Bible',
        });
      }
    });

    // 3. Search Locations
    project.locations?.forEach((loc) => {
      const inName = loc.name?.toLowerCase().includes(trimmed);
      const inType = loc.type?.toLowerCase().includes(trimmed);
      const inSensory = loc.sensoryDetails?.toLowerCase().includes(trimmed);
      const inLore = loc.loreAndSignificance?.toLowerCase().includes(trimmed);
      const inEra = loc.eraOrClimate?.toLowerCase().includes(trimmed);
      const inNotes = loc.notes?.toLowerCase().includes(trimmed);

      if (inName || inType || inSensory || inLore || inEra || inNotes) {
        let snippet = loc.sensoryDetails || loc.loreAndSignificance || loc.eraOrClimate || '';
        if (inSensory) snippet = getSnippetWithContext(loc.sensoryDetails, trimmed);
        else if (inLore) snippet = getSnippetWithContext(loc.loreAndSignificance, trimmed);
        else if (inEra) snippet = getSnippetWithContext(loc.eraOrClimate || '', trimmed);

        results.push({
          type: 'location',
          id: loc.id,
          name: loc.name,
          locationType: loc.type,
          significance: loc.loreAndSignificance,
          snippet: snippet || 'Worldbuilding location in Bible',
        });
      }
    });

    // 4. Search Plot Cards
    project.plotCards?.forEach((card) => {
      const inTitle = card.title?.toLowerCase().includes(trimmed);
      const inSummary = card.summary?.toLowerCase().includes(trimmed);
      const inAct = card.act?.toLowerCase().includes(trimmed);
      const inTags = card.tags?.some((t) => t.toLowerCase().includes(trimmed));

      if (inTitle || inSummary || inAct || inTags) {
        results.push({
          type: 'plot',
          id: card.id,
          title: card.title,
          act: card.act,
          status: card.status,
          summary: getSnippetWithContext(card.summary, trimmed),
          tags: card.tags || [],
        });
      }
    });

    return results;
  }, [query, project]);

  // Filtered by selected category
  const filteredResults = useMemo(() => {
    if (activeCategory === 'all') return searchResults;
    if (activeCategory === 'scenes') return searchResults.filter((r) => r.type === 'scene');
    if (activeCategory === 'characters') return searchResults.filter((r) => r.type === 'character');
    if (activeCategory === 'locations') return searchResults.filter((r) => r.type === 'location');
    if (activeCategory === 'plot') return searchResults.filter((r) => r.type === 'plot');
    return searchResults;
  }, [searchResults, activeCategory]);

  // Counts by category
  const counts = useMemo(() => {
    return {
      scenes: searchResults.filter((r) => r.type === 'scene').length,
      characters: searchResults.filter((r) => r.type === 'character').length,
      locations: searchResults.filter((r) => r.type === 'location').length,
      plot: searchResults.filter((r) => r.type === 'plot').length,
    };
  }, [searchResults]);

  // Handle clicking or hitting Enter on a result
  const handleSelectResult = (item: SearchResultItem) => {
    onClose();
    if (item.type === 'scene') {
      onNavigateToView('manuscript');
      onNavigateToScene(item.id);
    } else if (item.type === 'character') {
      onNavigateToView('characters');
    } else if (item.type === 'location') {
      onNavigateToView('locations');
    } else if (item.type === 'plot') {
      onNavigateToView('plotboard');
    }
  };

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectResult(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Helper to render highlighted text
  const renderHighlighted = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark
              key={i}
              className="bg-primary/20 text-primary font-bold px-0.5 rounded"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20 selection:bg-primary/20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Input */}
        <div className="p-3.5 sm:p-4 border-b border-border/80 flex items-center gap-3 bg-card shrink-0">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search characters, locations, dialogue, or scene prose..."
            className="flex-1 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />

          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded">
            Esc
          </kbd>
        </div>

        {/* Category Filter Pills (shown when query is present) */}
        {query.trim() && (
          <div className="px-3.5 py-2 border-b border-border/60 bg-muted/20 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            <button
              onClick={() => {
                setActiveCategory('all');
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                activeCategory === 'all'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <span>All Results</span>
              <span className="text-[10px] opacity-80 tabular-nums">
                ({searchResults.length})
              </span>
            </button>

            <button
              onClick={() => {
                setActiveCategory('scenes');
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeCategory === 'scenes'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Scenes</span>
              <span className="text-[10px] opacity-80 tabular-nums">
                ({counts.scenes})
              </span>
            </button>

            <button
              onClick={() => {
                setActiveCategory('characters');
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeCategory === 'characters'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Characters</span>
              <span className="text-[10px] opacity-80 tabular-nums">
                ({counts.characters})
              </span>
            </button>

            <button
              onClick={() => {
                setActiveCategory('locations');
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeCategory === 'locations'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Locations</span>
              <span className="text-[10px] opacity-80 tabular-nums">
                ({counts.locations})
              </span>
            </button>

            <button
              onClick={() => {
                setActiveCategory('plot');
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeCategory === 'plot'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Plot Beats</span>
              <span className="text-[10px] opacity-80 tabular-nums">
                ({counts.plot})
              </span>
            </button>
          </div>
        )}

        {/* Results List */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-2 divide-y divide-border/40"
        >
          {query.trim() === '' ? (
            /* Empty state with helpful project shortcuts */
            <div className="p-4 space-y-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Project Navigation
              </div>

              {/* Characters preview list */}
              {project.characters.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>Characters Bible</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {project.characters.slice(0, 4).map((char) => (
                      <button
                        key={char.id}
                        onClick={() => {
                          onClose();
                          onNavigateToView('characters');
                        }}
                        className="p-2 rounded-lg bg-muted/20 hover:bg-muted/60 text-left border border-border/50 text-xs transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-foreground">
                            {char.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {char.role} · {char.archetype || 'Key Character'}
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Locations preview list */}
              {project.locations.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                    <Compass className="w-3.5 h-3.5 text-primary" />
                    <span>Locations & Lore</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {project.locations.slice(0, 4).map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => {
                          onClose();
                          onNavigateToView('locations');
                        }}
                        className="p-2 rounded-lg bg-muted/20 hover:bg-muted/60 text-left border border-border/50 text-xs transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-foreground">
                            {loc.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {loc.type}
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center justify-between">
                <span>Type any character name, key phrase, clue, or dialogue snippet above to scan your entire manuscript instantly.</span>
              </div>
            </div>
          ) : filteredResults.length === 0 ? (
            /* No results state */
            <div className="p-12 text-center text-muted-foreground space-y-2">
              <Search className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm font-semibold text-foreground">
                No matching results found for "{query}"
              </p>
              <p className="text-xs">
                Try searching for character names, settings, or broad terms across your manuscript.
              </p>
            </div>
          ) : (
            /* Results Items */
            filteredResults.map((item, index) => {
              const isSelected = index === selectedIndex;

              if (item.type === 'scene') {
                return (
                  <div
                    key={`scene_${item.id}`}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary/40 shadow-xs'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <span>{renderHighlighted(item.title, query)}</span>
                            {item.matchCount > 1 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-primary/20 text-primary">
                                {item.matchCount} matches
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {item.bookTitle} · {item.actTitle} · {item.chapterTitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                          {item.wordCount} words
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground border border-border">
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {item.excerpt && (
                      <p className="text-xs text-muted-foreground/90 mt-2 pl-7 line-clamp-2 font-serif italic leading-relaxed">
                        "{renderHighlighted(item.excerpt, query)}"
                      </p>
                    )}
                  </div>
                );
              }

              if (item.type === 'character') {
                return (
                  <div
                    key={`char_${item.id}`}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary/40 shadow-xs'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">
                            {renderHighlighted(item.name, query)}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {item.role} {item.archetype ? `· ${item.archetype}` : ''}
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                        Character
                      </span>
                    </div>

                    {item.snippet && (
                      <p className="text-xs text-muted-foreground/90 mt-2 pl-7 line-clamp-2 leading-relaxed">
                        {renderHighlighted(item.snippet, query)}
                      </p>
                    )}
                  </div>
                );
              }

              if (item.type === 'location') {
                return (
                  <div
                    key={`loc_${item.id}`}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary/40 shadow-xs'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">
                            {renderHighlighted(item.name, query)}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {item.locationType}
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        Location
                      </span>
                    </div>

                    {item.snippet && (
                      <p className="text-xs text-muted-foreground/90 mt-2 pl-7 line-clamp-2 leading-relaxed">
                        {renderHighlighted(item.snippet, query)}
                      </p>
                    )}
                  </div>
                );
              }

              if (item.type === 'plot') {
                return (
                  <div
                    key={`plot_${item.id}`}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary/40 shadow-xs'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">
                            {renderHighlighted(item.title, query)}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {item.act} · Status: {item.status}
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                        Plot Beat
                      </span>
                    </div>

                    {item.summary && (
                      <p className="text-xs text-muted-foreground/90 mt-2 pl-7 line-clamp-2 leading-relaxed">
                        {renderHighlighted(item.summary, query)}
                      </p>
                    )}
                  </div>
                );
              }

              return null;
            })
          )}
        </div>

        {/* Modal Footer Hotkey Guide */}
        <div className="px-4 py-2.5 border-t border-border/80 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-card border border-border text-[9px] font-mono">↑↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-card border border-border text-[9px] font-mono">Enter</kbd>
              <span>Jump to item</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-card border border-border text-[9px] font-mono">Esc</kbd>
              <span>Close</span>
            </span>
          </div>

          <span className="text-[10px] text-muted-foreground/80">
            Project Search Engine
          </span>
        </div>
      </div>
    </div>
  );
};
