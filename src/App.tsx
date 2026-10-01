import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Project, UserSettings, Scene, SceneVersion, SceneComment } from './types/writing';
import {
  loadProjects,
  saveProjects,
  getActiveProjectId,
  setActiveProjectId,
  loadSettings,
  saveSettings,
  recordWordCount,
} from './utils/storage';
import { Header } from './components/Header';
import { SidebarProjectTree } from './components/SidebarProjectTree';
import { EditorWorkspace } from './components/EditorWorkspace';
import { SplitReferencePanel } from './components/SplitReferencePanel';
import { AIAssistantPanel } from './components/AIAssistantPanel';
import { PlotBoardView } from './components/PlotBoardView';
import { CharactersView } from './components/CharactersView';
import { LocationsView } from './components/LocationsView';
import { ScheduleView } from './components/ScheduleView';
import { ReaderPreviewModal } from './components/ReaderPreviewModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { ProjectSetupModal } from './components/ProjectSetupModal';
import { SettingsModal } from './components/SettingsModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CorkboardView } from './components/CorkboardView';
import { StyleCritiquePanel } from './components/StyleCritiquePanel';

import { DashboardView } from './components/DashboardView';

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [activeProjectId, setActiveId] = useState<string>(() =>
    getActiveProjectId(projects)
  );
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());

  // Views & Panels
  const [activeView, setActiveView] = useState<
    'dashboard' | 'manuscript' | 'plotboard' | 'characters' | 'locations' | 'schedule'
  >('dashboard');
  const [splitReferenceOpen, setSplitReferenceOpen] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showStyleCritiquePanel, setShowStyleCritiquePanel] = useState(false);
  const [manuscriptMode, setManuscriptMode] = useState<'editor' | 'corkboard'>('editor');
  const [selectedText, setSelectedText] = useState('');

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectModalMode, setProjectModalMode] = useState<'welcome' | 'new'>('welcome');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReaderPreview, setShowReaderPreview] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [mobileOutlineOpen, setMobileOutlineOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Status
  const [savedStatus, setSavedStatus] = useState<string>('Saved');
  const autosaveTimerRef = useRef<any>(null);

  // Current Active Project
  const currentProject = useMemo(() => {
    return (
      projects.find((p) => p.id === activeProjectId) ||
      projects[0] ||
      null
    );
  }, [projects, activeProjectId]);

  // Initial Scene selection
  const [activeSceneId, setActiveSceneId] = useState<string>(() => {
    const firstScene = currentProject?.books[0]?.acts[0]?.chapters[0]?.scenes[0];
    return firstScene ? firstScene.id : '';
  });

  // Ensure active scene is valid when project changes
  useEffect(() => {
    if (!currentProject) return;
    let found = false;
    currentProject.books.forEach((b) => {
      b.acts.forEach((a) => {
        a.chapters.forEach((c) => {
          if (c.scenes.some((s) => s.id === activeSceneId)) {
            found = true;
          }
        });
      });
    });

    if (!found) {
      const firstScene = currentProject.books[0]?.acts[0]?.chapters[0]?.scenes[0];
      if (firstScene) {
        setActiveSceneId(firstScene.id);
      }
    }
  }, [currentProject, activeSceneId]);

  // Sync theme with document element
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'sepia');
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'sepia') {
      document.documentElement.classList.add('sepia');
    }
    saveSettings(settings);
  }, [settings]);

  // Global hotkeys listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Focus mode toggle: Ctrl+F / Cmd+F (without Alt)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F') && !e.altKey) {
        e.preventDefault();
        setIsFocusMode((prev) => {
          const next = !prev;
          if (next && activeView !== 'manuscript') {
            setActiveView('manuscript');
          }
          return next;
        });
        return;
      }
      // Esc key exits Focus Mode if active
      if (e.key === 'Escape' && isFocusMode) {
        e.preventDefault();
        setIsFocusMode(false);
        return;
      }
      // Ctrl+P or Cmd+P opens global project search
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setShowGlobalSearch((prev) => !prev);
        return;
      }
      // Ctrl+/ or Cmd+/ opens shortcuts modal
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }
      // Ctrl+S / Cmd+S quick save
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && !e.shiftKey) {
        e.preventDefault();
        setSavedStatus('Saving...');
        setTimeout(() => setSavedStatus('Saved'), 400);
        return;
      }
      // Ctrl+K / Cmd+K toggle AI Co-Author
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowAIPanel((prev) => !prev);
        return;
      }
      // Ctrl+\ / Cmd+\ toggle split reference
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setSplitReferenceOpen((prev) => !prev);
        return;
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFocusMode, activeView]);

  // Persist projects whenever changed
  const updateProject = (updated: Project) => {
    setSavedStatus('Saving...');
    const nextProjects = projects.map((p) => (p.id === updated.id ? updated : p));
    setProjects(nextProjects);
    saveProjects(nextProjects);

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      setSavedStatus('Saved');
    }, 800);
  };

  // Find active scene & chapter info with real-time chapter & book word counts
  const activeSceneInfo = useMemo(() => {
    if (!currentProject) return { scene: null, chapterTitle: '', bookTitle: '', chapterWords: 0, bookWords: 0 };

    for (const book of currentProject.books) {
      // Calculate total book words
      let bookWords = 0;
      book.acts.forEach((a) => {
        a.chapters.forEach((c) => {
          c.scenes.forEach((s) => {
            bookWords += s.wordCount || 0;
          });
        });
      });

      for (const act of book.acts) {
        for (const chapter of act.chapters) {
          const match = chapter.scenes.find((s) => s.id === activeSceneId);
          if (match) {
            // Calculate total chapter words
            let chapterWords = 0;
            chapter.scenes.forEach((s) => {
              chapterWords += s.wordCount || 0;
            });

            return {
              scene: match,
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              bookTitle: book.title,
              chapterWords,
              bookWords,
              scenes: chapter.scenes,
            };
          }
        }
      }
    }
    return { scene: null, chapterId: '', chapterTitle: '', bookTitle: '', chapterWords: 0, bookWords: 0, scenes: [] };
  }, [currentProject, activeSceneId]);

  // Content Update Handler with word count calculation & auto-snapshot
  const handleUpdateSceneContent = (newContent: string) => {
    if (!currentProject || !activeSceneInfo.scene) return;

    const currentWords = activeSceneInfo.scene.wordCount || 0;
    const wordsArray = newContent.trim().split(/\s+/).filter(Boolean);
    const newWordCount = newContent.trim() ? wordsArray.length : 0;
    const wordDelta = newWordCount - currentWords;

    // Mutate scene deep
    const updatedBooks = currentProject.books.map((book) => ({
      ...book,
      acts: book.acts.map((act) => ({
        ...act,
        chapters: act.chapters.map((chap) => ({
          ...chap,
          scenes: chap.scenes.map((sc) => {
            if (sc.id === activeSceneId) {
              return {
                ...sc,
                content: newContent,
                wordCount: newWordCount,
                updatedAt: new Date().toISOString(),
              };
            }
            return sc;
          }),
        })),
      })),
    }));

    let updatedProject: Project = {
      ...currentProject,
      books: updatedBooks,
      updatedAt: new Date().toISOString(),
    };

    if (wordDelta > 0) {
      updatedProject = recordWordCount(updatedProject, wordDelta, 1);
    }

    updateProject(updatedProject);
  };

  // Add Scene
  const handleAddScene = (chapterId: string) => {
    if (!currentProject) return;
    const newSceneId = `scene_${Date.now()}`;

    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.map((a) => ({
        ...a,
        chapters: a.chapters.map((c) => {
          if (c.id === chapterId) {
            const newScene: Scene = {
              id: newSceneId,
              chapterId,
              title: `Scene ${c.scenes.length + 1}`,
              order: c.scenes.length + 1,
              synopsis: '',
              content: '',
              status: 'Idea',
              wordCount: 0,
              comments: [],
              versions: [],
              updatedAt: new Date().toISOString(),
            };
            return { ...c, scenes: [...c.scenes, newScene] };
          }
          return c;
        }),
      })),
    }));

    updateProject({ ...currentProject, books: updatedBooks });
    setActiveSceneId(newSceneId);
  };

  // Add Chapter
  const handleAddChapter = (actId: string) => {
    if (!currentProject) return;
    const newChapId = `chap_${Date.now()}`;
    const newSceneId = `scene_${Date.now()}`;

    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.map((a) => {
        if (a.id === actId) {
          const newChap = {
            id: newChapId,
            actId,
            title: `Chapter ${a.chapters.length + 1}`,
            order: a.chapters.length + 1,
            scenes: [
              {
                id: newSceneId,
                chapterId: newChapId,
                title: 'Scene 1',
                order: 1,
                synopsis: '',
                content: '',
                status: 'Idea' as const,
                wordCount: 0,
                comments: [],
                versions: [],
                updatedAt: new Date().toISOString(),
              },
            ],
          };
          return { ...a, chapters: [...a.chapters, newChap] };
        }
        return a;
      }),
    }));

    updateProject({ ...currentProject, books: updatedBooks });
    setActiveSceneId(newSceneId);
  };

  // Add Act
  const handleAddAct = (bookId: string) => {
    if (!currentProject) return;
    const newActId = `act_${Date.now()}`;
    const newChapId = `chap_${Date.now()}`;
    const newSceneId = `scene_${Date.now()}`;

    const updatedBooks = currentProject.books.map((b) => {
      if (b.id === bookId) {
        const newAct = {
          id: newActId,
          bookId,
          title: `Act ${b.acts.length + 1}`,
          order: b.acts.length + 1,
          chapters: [
            {
              id: newChapId,
              actId: newActId,
              title: 'Chapter 1',
              order: 1,
              scenes: [
                {
                  id: newSceneId,
                  chapterId: newChapId,
                  title: 'Scene 1',
                  order: 1,
                  synopsis: '',
                  content: '',
                  status: 'Idea' as const,
                  wordCount: 0,
                  comments: [],
                  versions: [],
                  updatedAt: new Date().toISOString(),
                },
              ],
            },
          ],
        };
        return { ...b, acts: [...b.acts, newAct] };
      }
      return b;
    });

    updateProject({ ...currentProject, books: updatedBooks });
    setActiveSceneId(newSceneId);
  };

  // Delete Scene
  const handleDeleteScene = (sceneId: string) => {
    if (!currentProject) return;

    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.map((a) => ({
        ...a,
        chapters: a.chapters.map((c) => ({
          ...c,
          scenes: c.scenes.filter((s) => s.id !== sceneId),
        })),
      })),
    }));

    updateProject({ ...currentProject, books: updatedBooks });
    if (activeSceneId === sceneId) {
      const fallback = updatedBooks[0]?.acts[0]?.chapters[0]?.scenes[0];
      if (fallback) setActiveSceneId(fallback.id);
    }
  };

  // Delete Chapter
  const handleDeleteChapter = (chapterId: string) => {
    if (!currentProject) return;

    let hasScenes = false;
    currentProject.books.forEach((b) => {
      b.acts.forEach((a) => {
        a.chapters.forEach((c) => {
          if (c.id === chapterId && c.scenes.length > 0) {
            hasScenes = true;
          }
        });
      });
    });

    if (hasScenes && !confirm('This chapter contains scenes. Are you sure you want to delete this chapter and all of its scenes?')) {
      return;
    }

    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.map((a) => ({
        ...a,
        chapters: a.chapters.filter((c) => c.id !== chapterId),
      })),
    }));

    updateProject({ ...currentProject, books: updatedBooks });

    // Fallback active scene if it was deleted
    let activeSceneStillExists = false;
    updatedBooks.forEach((b) => {
      b.acts.forEach((a) => {
        a.chapters.forEach((c) => {
          if (c.scenes.some((s) => s.id === activeSceneId)) {
            activeSceneStillExists = true;
          }
        });
      });
    });

    if (!activeSceneStillExists) {
      const fallback = updatedBooks[0]?.acts[0]?.chapters[0]?.scenes[0];
      if (fallback) setActiveSceneId(fallback.id);
    }
  };

  // Delete Act
  const handleDeleteAct = (actId: string) => {
    if (!currentProject) return;

    let hasContent = false;
    currentProject.books.forEach((b) => {
      b.acts.forEach((a) => {
        if (a.id === actId && a.chapters.length > 0) {
          hasContent = true;
        }
      });
    });

    if (hasContent && !confirm('This act contains chapters. Are you sure you want to delete this act and everything inside it?')) {
      return;
    }

    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.filter((a) => a.id !== actId),
    }));

    updateProject({ ...currentProject, books: updatedBooks });

    // Fallback active scene if it was deleted
    let activeSceneStillExists = false;
    updatedBooks.forEach((b) => {
      b.acts.forEach((a) => {
        a.chapters.forEach((c) => {
          if (c.scenes.some((s) => s.id === activeSceneId)) {
            activeSceneStillExists = true;
          }
        });
      });
    });

    if (!activeSceneStillExists) {
      const fallback = updatedBooks[0]?.acts[0]?.chapters[0]?.scenes[0];
      if (fallback) setActiveSceneId(fallback.id);
    }
  };

  // Rename Scene
  const handleRenameScene = (sceneId: string, newTitle: string) => {
    if (!currentProject) return;
    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.map((a) => ({
        ...a,
        chapters: a.chapters.map((c) => ({
          ...c,
          scenes: c.scenes.map((s) => (s.id === sceneId ? { ...s, title: newTitle } : s)),
        })),
      })),
    }));
    updateProject({ ...currentProject, books: updatedBooks });
  };

  // Rename Chapter
  const handleRenameChapter = (chapterId: string, newTitle: string) => {
    if (!currentProject) return;
    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.map((a) => ({
        ...a,
        chapters: a.chapters.map((c) => (c.id === chapterId ? { ...c, title: newTitle } : c)),
      })),
    }));
    updateProject({ ...currentProject, books: updatedBooks });
  };

  // Rename Act
  const handleRenameAct = (actId: string, newTitle: string) => {
    if (!currentProject) return;
    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.map((a) => (a.id === actId ? { ...a, title: newTitle } : a)),
    }));
    updateProject({ ...currentProject, books: updatedBooks });
  };

  // Update Scene Synopsis from Corkboard
  const handleUpdateSceneSynopsis = (sceneId: string, synopsis: string) => {
    if (!currentProject) return;
    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.map((a) => ({
        ...a,
        chapters: a.chapters.map((c) => ({
          ...c,
          scenes: c.scenes.map((s) => (s.id === sceneId ? { ...s, synopsis, updatedAt: new Date().toISOString() } : s)),
        })),
      })),
    }));
    updateProject({ ...currentProject, books: updatedBooks });
  };

  // Update Scene Status from Corkboard
  const handleUpdateSceneStatus = (sceneId: string, status: Scene['status']) => {
    if (!currentProject) return;
    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.map((a) => ({
        ...a,
        chapters: a.chapters.map((c) => ({
          ...c,
          scenes: c.scenes.map((s) => (s.id === sceneId ? { ...s, status, updatedAt: new Date().toISOString() } : s)),
        })),
      })),
    }));
    updateProject({ ...currentProject, books: updatedBooks });
  };

  // Reorder Scenes inside a Chapter from Corkboard
  const handleReorderScenes = (chapterId: string, updatedScenes: Scene[]) => {
    if (!currentProject) return;
    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.map((a) => ({
        ...a,
        chapters: a.chapters.map((c) => {
          if (c.id === chapterId) {
            return { ...c, scenes: updatedScenes };
          }
          return c;
        }),
      })),
    }));
    updateProject({ ...currentProject, books: updatedBooks });
  };

  // Scene Notes
  const handleUpdateSceneNotes = (notes: string) => {
    if (!currentProject || !activeSceneInfo.scene) return;
    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.map((a) => ({
        ...a,
        chapters: a.chapters.map((c) => ({
          ...c,
          scenes: c.scenes.map((s) => (s.id === activeSceneId ? { ...s, notes } : s)),
        })),
      })),
    }));
    updateProject({ ...currentProject, books: updatedBooks });
  };

  // Apply a Grammarly-style prose style suggestions replacement
  const handleApplyStyleSuggestion = (originalText: string, replacementText: string) => {
    if (!activeSceneInfo.scene) return;
    const currentContent = activeSceneInfo.scene.content;
    const nextContent = currentContent.replace(originalText, replacementText);
    handleUpdateSceneContent(nextContent);
  };

  // Comments
  const handleAddComment = (text: string, snippet?: string) => {
    if (!currentProject || !activeSceneInfo.scene) return;
    const newComment: SceneComment = {
      id: `comm_${Date.now()}`,
      author: currentProject.author || 'Author',
      text,
      createdAt: new Date().toISOString(),
      resolved: false,
      selectedSnippet: snippet,
    };

    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.map((a) => ({
        ...a,
        chapters: a.chapters.map((c) => ({
          ...c,
          scenes: c.scenes.map((s) => {
            if (s.id === activeSceneId) {
              return {
                ...s,
                comments: [...(s.comments || []), newComment],
              };
            }
            return s;
          }),
        })),
      })),
    }));

    updateProject({ ...currentProject, books: updatedBooks });
  };

  const handleResolveComment = (commentId: string) => {
    if (!currentProject || !activeSceneInfo.scene) return;
    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.map((a) => ({
        ...a,
        chapters: a.chapters.map((c) => ({
          ...c,
          scenes: c.scenes.map((s) => {
            if (s.id === activeSceneId) {
              return {
                ...s,
                comments: s.comments.map((cm) =>
                  cm.id === commentId ? { ...cm, resolved: !cm.resolved } : cm
                ),
              };
            }
            return s;
          }),
        })),
      })),
    }));
    updateProject({ ...currentProject, books: updatedBooks });
  };

  const handleDeleteComment = (commentId: string) => {
    if (!currentProject || !activeSceneInfo.scene) return;
    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.map((a) => ({
        ...a,
        chapters: a.chapters.map((c) => ({
          ...c,
          scenes: c.scenes.map((s) => {
            if (s.id === activeSceneId) {
              return {
                ...s,
                comments: s.comments.filter((cm) => cm.id !== commentId),
              };
            }
            return s;
          }),
        })),
      })),
    }));
    updateProject({ ...currentProject, books: updatedBooks });
  };

  // Snapshots & Version History
  const handleCreateSnapshot = (title: string) => {
    if (!currentProject || !activeSceneInfo.scene) return;
    const newVersion: SceneVersion = {
      id: `ver_${Date.now()}`,
      timestamp: new Date().toISOString(),
      title,
      content: activeSceneInfo.scene.content,
      wordCount: activeSceneInfo.scene.wordCount,
    };

    const updatedBooks = currentProject.books.map((b) => ({
      ...b,
      acts: b.acts.map((a) => ({
        ...a,
        chapters: a.chapters.map((c) => ({
          ...c,
          scenes: c.scenes.map((s) => {
            if (s.id === activeSceneId) {
              return {
                ...s,
                versions: [newVersion, ...(s.versions || [])],
              };
            }
            return s;
          }),
        })),
      })),
    }));

    updateProject({ ...currentProject, books: updatedBooks });
  };

  const handleRestoreSnapshot = (version: SceneVersion) => {
    handleUpdateSceneContent(version.content);
  };

  // AI Output Application
  const handleApplyAIProse = (
    replacement: string,
    mode: 'replace' | 'insert' | 'append'
  ) => {
    if (!activeSceneInfo.scene) return;

    // Automatically snapshot before AI modification
    handleCreateSnapshot(`Pre-AI (${mode}): ${replacement.slice(0, 25)}...`);

    let newContent = activeSceneInfo.scene.content;

    if (mode === 'replace' && selectedText) {
      newContent = newContent.replace(selectedText, replacement);
    } else if (mode === 'insert') {
      newContent = `${newContent}\n\n${replacement}`;
    } else if (mode === 'append') {
      newContent = `${newContent.trim()}\n\n${replacement.trim()}\n`;
    }

    handleUpdateSceneContent(newContent);
    setSelectedText('');
  };

  // Project Creation / Switching
  const handleSelectProject = (id: string) => {
    setActiveId(id);
    setActiveProjectId(id);
    setActiveView('manuscript');
  };

  const handleCreateNewProject = (newProj: Project) => {
    const nextList = [newProj, ...projects];
    setProjects(nextList);
    saveProjects(nextList);
    setActiveId(newProj.id);
    setActiveProjectId(newProj.id);
    const firstScene = newProj.books[0]?.acts[0]?.chapters[0]?.scenes[0];
    if (firstScene) setActiveSceneId(firstScene.id);
    setActiveView('manuscript');
  };

  const handleImportProject = (imported: Project) => {
    const nextList = [imported, ...projects];
    setProjects(nextList);
    saveProjects(nextList);
    setActiveId(imported.id);
    setActiveProjectId(imported.id);
    setActiveView('manuscript');
  };

  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) {
      alert("You must have at least one project in your library!");
      return;
    }
    const nextList = projects.filter((p) => p.id !== id);
    setProjects(nextList);
    saveProjects(nextList);

    if (activeProjectId === id) {
      const nextActive = nextList[0];
      setActiveId(nextActive.id);
      setActiveProjectId(nextActive.id);
      const firstScene = nextActive.books[0]?.acts[0]?.chapters[0]?.scenes[0];
      if (firstScene) setActiveSceneId(firstScene.id);
    }
  };

  if (!currentProject) {
    return (
      <div className="h-[100dvh] w-screen flex items-center justify-center bg-background text-foreground">
        Loading WriteAI Studio...
      </div>
    );
  }

  // Today's daily word goal and progress calculation based on settings
  const todayStr = new Date().toISOString().split('T')[0];
  const todayStat = currentProject.stats?.find((s) => s.date === todayStr);
  const todayWordsWritten = todayStat?.wordsAdded || 0;
  const effectiveDailyGoal = settings.dailyWordGoal || currentProject.dailyWordGoal || 1000;

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top Header - Hidden in Focus Mode for absolute Full Screen */}
      {!isFocusMode && (
        <Header
          project={currentProject}
          activeView={activeView}
          setActiveView={setActiveView}
          showAIPanel={showAIPanel}
          setShowAIPanel={setShowAIPanel}
          splitReferenceOpen={splitReferenceOpen}
          setSplitReferenceOpen={setSplitReferenceOpen}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenProjectLibrary={() => {
            setProjectModalMode('welcome');
            setShowProjectModal(true);
          }}
          onNewProject={() => {
            setProjectModalMode('new');
            setShowProjectModal(true);
          }}
          onOpenReaderPreview={() => setShowReaderPreview(true)}
          onOpenKeyboardShortcuts={() => setShowShortcutsModal(true)}
          onOpenGlobalSearch={() => setShowGlobalSearch(true)}
          onToggleMobileOutline={() => setMobileOutlineOpen((prev) => !prev)}
          isFocusMode={isFocusMode}
          onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
          settings={settings}
          onUpdateSettings={setSettings}
          savedStatus={savedStatus}
        />
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* VIEW 0: DASHBOARD */}
        {activeView === 'dashboard' && (
          <DashboardView
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={handleSelectProject}
            onCreateNewProject={() => {
              setProjectModalMode('new');
              setShowProjectModal(true);
            }}
            onImportProject={handleImportProject}
            onDeleteProject={handleDeleteProject}
            settings={settings}
          />
        )}

        {/* VIEW 1: MANUSCRIPT EDITOR (Tree + Editor + Split Reference + AI) */}
        {activeView === 'manuscript' && (
          <>
            {/* Desktop Outline Tree (lg and up) */}
            {!isFocusMode && (
              <div className="hidden lg:flex h-full shrink-0">
                <SidebarProjectTree
                  project={currentProject}
                  activeSceneId={activeSceneId}
                  onSelectScene={(id) => setActiveSceneId(id)}
                  onAddScene={handleAddScene}
                  onAddChapter={handleAddChapter}
                  onAddAct={handleAddAct}
                  onDeleteScene={handleDeleteScene}
                  onDeleteChapter={handleDeleteChapter}
                  onDeleteAct={handleDeleteAct}
                  onRenameScene={handleRenameScene}
                  onRenameChapter={handleRenameChapter}
                  onRenameAct={handleRenameAct}
                />
              </div>
            )}

            {/* Mobile & Tablet Slide-Over Outline Drawer (< lg) */}
            {!isFocusMode && mobileOutlineOpen && (
              <div className="fixed inset-0 z-50 lg:hidden flex">
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                  onClick={() => setMobileOutlineOpen(false)}
                />
                <div className="relative w-72 sm:w-80 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200">
                  <SidebarProjectTree
                    project={currentProject}
                    activeSceneId={activeSceneId}
                    onSelectScene={(id) => {
                      setActiveSceneId(id);
                      setMobileOutlineOpen(false);
                    }}
                    onAddScene={handleAddScene}
                    onAddChapter={handleAddChapter}
                    onAddAct={handleAddAct}
                    onDeleteScene={handleDeleteScene}
                    onDeleteChapter={handleDeleteChapter}
                    onDeleteAct={handleDeleteAct}
                    onRenameScene={handleRenameScene}
                    onRenameChapter={handleRenameChapter}
                    onRenameAct={handleRenameAct}
                    onCloseMobile={() => setMobileOutlineOpen(false)}
                  />
                </div>
              </div>
            )}

            {/* Center: Manuscript Column */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Unboxed Segmented View Switcher Header (hidden in focus mode) */}
              {!isFocusMode && (
                <div className="h-11 border-b border-border/80 bg-card/40 px-4 flex items-center justify-between shrink-0 select-none">
                  {/* Left Breadcrumb info */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground truncate max-w-40 sm:max-w-none">{activeSceneInfo.bookTitle || 'Book'}</span>
                    <span className="text-border">/</span>
                    <span className="font-semibold text-foreground truncate max-w-44 sm:max-w-none">{activeSceneInfo.chapterTitle || 'Unscheduled Chapter'}</span>
                  </div>

                  {/* Mode switcher tabs (unboxed inline list) */}
                  <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40">
                    <button
                      onClick={() => setManuscriptMode('editor')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                        manuscriptMode === 'editor'
                          ? 'bg-card text-foreground shadow-2xs border border-border/20'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span>✍️</span>
                      <span>Manuscript Editor</span>
                    </button>
                    <button
                      onClick={() => setManuscriptMode('corkboard')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                        manuscriptMode === 'corkboard'
                          ? 'bg-card text-foreground shadow-2xs border border-border/20'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span>📌</span>
                      <span>Corkboard</span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold px-1 rounded-full">
                        {activeSceneInfo.scenes?.length || 0}
                      </span>
                    </button>
                  </div>

                  {/* Right Header Controls: style audit toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowStyleCritiquePanel((prev) => !prev)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all flex items-center gap-1.5 ${
                        showStyleCritiquePanel
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-xs'
                          : 'bg-card border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                      title="Toggle Grammarly-style Style suggestions panel"
                    >
                      <span>✨</span>
                      <span className="hidden sm:inline">Style Critique</span>
                    </button>
                  </div>
                </div>
              )}

              {/* View Rendering */}
              {manuscriptMode === 'corkboard' ? (
                <CorkboardView
                  scenes={activeSceneInfo.scenes || []}
                  activeSceneId={activeSceneId}
                  onSelectScene={setActiveSceneId}
                  onUpdateSceneSynopsis={handleUpdateSceneSynopsis}
                  onUpdateSceneTitle={handleRenameScene}
                  onUpdateSceneStatus={handleUpdateSceneStatus}
                  onReorderScenes={(updated) => {
                    if (activeSceneInfo.chapterId) {
                      handleReorderScenes(activeSceneInfo.chapterId, updated);
                    }
                  }}
                  onAddScene={() => {
                    if (activeSceneInfo.chapterId) {
                      handleAddScene(activeSceneInfo.chapterId);
                    }
                  }}
                  onDeleteScene={handleDeleteScene}
                  onSwitchToEditor={() => setManuscriptMode('editor')}
                />
              ) : (
                <EditorWorkspace
                  scene={activeSceneInfo.scene}
                  chapterTitle={activeSceneInfo.chapterTitle}
                  bookTitle={activeSceneInfo.bookTitle}
                  chapterTotalWords={activeSceneInfo.chapterWords}
                  bookTotalWords={activeSceneInfo.bookWords}
                  todayWordsWritten={todayWordsWritten}
                  dailyWordGoal={effectiveDailyGoal}
                  onOpenSettings={() => setShowSettingsModal(true)}
                  onUpdateContent={handleUpdateSceneContent}
                  onSelectText={setSelectedText}
                  onOpenVersionHistory={() => setShowVersionHistory(true)}
                  onAddCommentWithSnippet={(snippet) => {
                    const commentText = prompt(`Add comment on selected passage: "${snippet.slice(0, 30)}..."`);
                    if (commentText) {
                      handleAddComment(commentText, snippet);
                    }
                  }}
                  onOpenKeyboardShortcuts={() => setShowShortcutsModal(true)}
                  isFocusMode={isFocusMode}
                  onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
                  settings={settings}
                  splitReferenceOpen={splitReferenceOpen}
                  showAIPanel={showAIPanel}
                  projectGenre={currentProject.genre}
                />
              )}
            </div>

            {/* Split Screen Reference Panel - Docked on xl screens, slide-over drawer on < xl */}
            {!isFocusMode && splitReferenceOpen && (
              <>
                <div className="hidden xl:flex h-full shrink-0">
                  <SplitReferencePanel
                    project={currentProject}
                    activeScene={activeSceneInfo.scene}
                    onClose={() => setSplitReferenceOpen(false)}
                    onUpdateSceneNotes={handleUpdateSceneNotes}
                    onAddComment={(text) => handleAddComment(text)}
                    onResolveComment={handleResolveComment}
                    onDeleteComment={handleDeleteComment}
                  />
                </div>

                <div className="fixed inset-0 z-50 xl:hidden flex justify-end">
                  <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                    onClick={() => setSplitReferenceOpen(false)}
                  />
                  <div className="relative w-full max-w-sm sm:w-88 h-full z-10 animate-in slide-in-from-right duration-200">
                    <SplitReferencePanel
                      project={currentProject}
                      activeScene={activeSceneInfo.scene}
                      onClose={() => setSplitReferenceOpen(false)}
                      onUpdateSceneNotes={handleUpdateSceneNotes}
                      onAddComment={(text) => handleAddComment(text)}
                      onResolveComment={handleResolveComment}
                      onDeleteComment={handleDeleteComment}
                    />
                  </div>
                </div>
              </>
            )}

            {/* AI Co-Author Assistant Panel - Docked on lg screens, slide-over drawer on < lg */}
            {!isFocusMode && showAIPanel && (
              <>
                <div className="hidden lg:flex h-full shrink-0">
                  <AIAssistantPanel
                    project={currentProject}
                    activeScene={activeSceneInfo.scene}
                    selectedText={selectedText}
                    onClose={() => setShowAIPanel(false)}
                    onApplyProse={handleApplyAIProse}
                    settings={settings}
                    onOpenSettings={() => setShowSettingsModal(true)}
                    onUpdateSettings={setSettings}
                  />
                </div>

                <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
                  <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                    onClick={() => setShowAIPanel(false)}
                  />
                  <div className="relative w-full max-w-md sm:w-96 h-full z-10 animate-in slide-in-from-right duration-200">
                    <AIAssistantPanel
                      project={currentProject}
                      activeScene={activeSceneInfo.scene}
                      selectedText={selectedText}
                      onClose={() => setShowAIPanel(false)}
                      onApplyProse={handleApplyAIProse}
                      settings={settings}
                      onOpenSettings={() => setShowSettingsModal(true)}
                      onUpdateSettings={setSettings}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Style Critique Suggestions Panel - Docked on lg screens, slide-over drawer on < lg */}
            {!isFocusMode && showStyleCritiquePanel && (
              <>
                <div className="hidden lg:flex h-full shrink-0">
                  <StyleCritiquePanel
                    scene={activeSceneInfo.scene}
                    onApplySuggestion={handleApplyStyleSuggestion}
                    settings={settings}
                    onClose={() => setShowStyleCritiquePanel(false)}
                  />
                </div>

                <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
                  <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                    onClick={() => setShowStyleCritiquePanel(false)}
                  />
                  <div className="relative w-full max-w-md sm:w-88 h-full z-10 animate-in slide-in-from-right duration-200">
                    <StyleCritiquePanel
                      scene={activeSceneInfo.scene}
                      onApplySuggestion={handleApplyStyleSuggestion}
                      settings={settings}
                      onClose={() => setShowStyleCritiquePanel(false)}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* VIEW 2: PLOT BOARD */}
        {activeView === 'plotboard' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden pb-16 lg:pb-0">
            <PlotBoardView
              project={currentProject}
              onUpdateProject={updateProject}
              settings={settings}
            />
          </div>
        )}

        {/* VIEW 3: CHARACTERS BIBLE */}
        {activeView === 'characters' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden pb-16 lg:pb-0">
            <CharactersView
              project={currentProject}
              onUpdateProject={updateProject}
            />
          </div>
        )}

        {/* VIEW 4: LOCATIONS & SETTINGS */}
        {activeView === 'locations' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden pb-16 lg:pb-0">
            <LocationsView
              project={currentProject}
              onUpdateProject={updateProject}
            />
          </div>
        )}

        {/* VIEW 5: SCHEDULE & VELOCITY */}
        {activeView === 'schedule' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden pb-16 lg:pb-0">
            <ScheduleView
              project={currentProject}
              onUpdateProject={updateProject}
            />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar (hidden on desktop md and up, and hidden in Focus Mode) */}
      {!isFocusMode && (
        <MobileBottomNav
          activeView={activeView}
          setActiveView={setActiveView}
          showAIPanel={showAIPanel}
          setShowAIPanel={setShowAIPanel}
          onToggleOutline={() => setMobileOutlineOpen((prev) => !prev)}
          isOutlineOpen={mobileOutlineOpen}
        />
      )}

      {/* Modals */}
      {showReaderPreview && (
        <ReaderPreviewModal
          project={currentProject}
          onClose={() => setShowReaderPreview(false)}
        />
      )}

      {showVersionHistory && activeSceneInfo.scene && (
        <VersionHistoryModal
          scene={activeSceneInfo.scene}
          onClose={() => setShowVersionHistory(false)}
          onCreateSnapshot={handleCreateSnapshot}
          onRestoreSnapshot={handleRestoreSnapshot}
        />
      )}

      <ProjectSetupModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateNewProject}
        onImportProject={handleImportProject}
        mode={projectModalMode}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />

      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      <GlobalSearchModal
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        project={currentProject}
        onNavigateToScene={(sceneId) => {
          setActiveView('manuscript');
          setActiveSceneId(sceneId);
        }}
        onNavigateToView={(view) => setActiveView(view)}
      />
    </div>
  );
}
