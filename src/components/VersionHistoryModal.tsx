import React, { useState } from 'react';
import {
  History,
  X,
  Plus,
  RotateCcw,
  Clock,
  FileText,
  Check,
} from 'lucide-react';
import { Scene, SceneVersion } from '../types/writing';

interface VersionHistoryModalProps {
  scene: Scene;
  onClose: () => void;
  onCreateSnapshot: (title: string) => void;
  onRestoreSnapshot: (version: SceneVersion) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  scene,
  onClose,
  onCreateSnapshot,
  onRestoreSnapshot,
}) => {
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<SceneVersion | null>(
    scene.versions?.[0] || null
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotTitle.trim()) return;
    onCreateSnapshot(snapshotTitle.trim());
    setSnapshotTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Version History & Snapshots
              </h3>
              <p className="text-xs text-muted-foreground">
                Scene: {scene.title} · {scene.wordCount} words currently
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Left sidebar of snapshots, right preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Snapshots List */}
          <div className="w-72 border-r border-border p-3 flex flex-col justify-between shrink-0 overflow-y-auto space-y-3 bg-muted/20">
            {/* Create Snapshot Form */}
            <form onSubmit={handleCreate} className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Create Milestone Snapshot
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={snapshotTitle}
                  onChange={(e) => setSnapshotTitle(e.target.value)}
                  placeholder="e.g. Before AI rewrite..."
                  className="flex-1 px-2 py-1.5 rounded-md bg-card border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!snapshotTitle.trim()}
                  className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  title="Save Snapshot"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pt-2 border-t border-border/50">
              <div className="text-[11px] font-medium text-muted-foreground">
                Saved Snapshots ({scene.versions?.length || 0})
              </div>
              {scene.versions && scene.versions.length > 0 ? (
                scene.versions.map((ver) => {
                  const isSelected = selectedVersion?.id === ver.id;
                  return (
                    <div
                      key={ver.id}
                      onClick={() => setSelectedVersion(ver)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-card border-primary text-foreground shadow-xs'
                          : 'bg-card/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-card/80'
                      }`}
                    >
                      <div className="font-semibold text-foreground truncate">
                        {ver.title}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                        <span>{new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(ver.timestamp).toLocaleDateString()}</span>
                        <span className="font-mono tabular-nums">{ver.wordCount}w</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-muted-foreground italic py-6 text-center">
                  No snapshots saved yet. Create a snapshot before making major revisions.
                </div>
              )}
            </div>
          </div>

          {/* Snapshot Content Preview */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-between space-y-4">
            {selectedVersion ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">
                        {selectedVersion.title}
                      </h4>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>Saved {new Date(selectedVersion.timestamp).toLocaleString()}</span>
                        <span>·</span>
                        <span>{selectedVersion.wordCount} words</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Restore "${selectedVersion.title}"? Current edits will be replaced.`)) {
                          onRestoreSnapshot(selectedVersion);
                          onClose();
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore this Version</span>
                    </button>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto p-4 rounded-lg bg-muted/20 border border-border/60 font-serif text-xs leading-relaxed text-foreground whitespace-pre-wrap selection:bg-primary/20">
                    {selectedVersion.content}
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground italic text-right">
                  Restoring a previous version overwrites current scene text.
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground italic">
                Select a snapshot on the left to preview its content.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
