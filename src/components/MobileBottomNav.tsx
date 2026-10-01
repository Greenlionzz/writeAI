import React from 'react';
import {
  BookOpen,
  LayoutGrid,
  Users,
  Compass,
  Calendar,
  Sparkles,
  Layers,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeView: 'manuscript' | 'plotboard' | 'characters' | 'locations' | 'schedule';
  setActiveView: (view: 'manuscript' | 'plotboard' | 'characters' | 'locations' | 'schedule') => void;
  showAIPanel: boolean;
  setShowAIPanel: (show: boolean) => void;
  onToggleOutline: () => void;
  isOutlineOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  setActiveView,
  showAIPanel,
  setShowAIPanel,
  onToggleOutline,
  isOutlineOpen,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border/80 px-2 py-1 flex items-center justify-around shadow-lg select-none">
      {/* 1. Manuscript Editor */}
      <button
        onClick={() => {
          setActiveView('manuscript');
        }}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[50px] ${
          activeView === 'manuscript'
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <BookOpen className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] tracking-tight">Write</span>
      </button>

      {/* 2. Scenes / Outline Drawer (only when in manuscript view) */}
      <button
        onClick={() => {
          if (activeView !== 'manuscript') {
            setActiveView('manuscript');
          }
          onToggleOutline();
        }}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[50px] ${
          isOutlineOpen
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Open Scenes & Outline"
      >
        <Layers className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] tracking-tight">Outline</span>
      </button>

      {/* 3. Plot Board */}
      <button
        onClick={() => setActiveView('plotboard')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[50px] ${
          activeView === 'plotboard'
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <LayoutGrid className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] tracking-tight">Plot</span>
      </button>

      {/* 4. Characters */}
      <button
        onClick={() => setActiveView('characters')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[50px] ${
          activeView === 'characters'
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Users className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] tracking-tight">Cast</span>
      </button>

      {/* 5. Locations */}
      <button
        onClick={() => setActiveView('locations')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[50px] ${
          activeView === 'locations'
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Compass className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] tracking-tight">Places</span>
      </button>

      {/* 6. Schedule */}
      <button
        onClick={() => setActiveView('schedule')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[50px] ${
          activeView === 'schedule'
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Calendar className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] tracking-tight">Stats</span>
      </button>

      {/* 7. AI Co-Author Toggle */}
      <button
        onClick={() => setShowAIPanel(!showAIPanel)}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[50px] ${
          showAIPanel
            ? 'text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Sparkles className="w-4 h-4 mb-0.5" />
        <span className="text-[10px] tracking-tight">AI</span>
      </button>
    </nav>
  );
};
