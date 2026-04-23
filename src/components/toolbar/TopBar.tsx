import React, { useEffect, useState, useRef } from 'react';
import { Redo2, Pencil, Plus, Share2, Undo2, ChevronDown, Check, LogOut, User as UserIcon, FolderPlus, Sparkles, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ExportModal } from '../export/ExportModal';
import { AuthModal } from '../auth/AuthModal';
import { useAuth } from '../../lib/useAuth';
import { useUsage } from '../../lib/useUsage';
import type { ProjectSummary } from '../../services/database';

interface TopBarProps {
  projectTitle: string;
  projects: ProjectSummary[];
  currentProjectId: string | null;
  onCreateProject: (title?: string) => void;
  onProjectRename: (title: string) => void;
  onProjectSwitch: (projectId: string) => void;
}

interface TopBarActionsProps {
  onExport: () => void;
  user: { email?: string | null } | null;
  signOut: () => void;
  onOpenAuth: () => void;
}

const UserDropdown: React.FC<{
  user: { email?: string | null } | null;
  signOut: () => void;
  onOpenAuth: () => void;
}> = ({ user, signOut, onOpenAuth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) {
    return (
      <button
        type="button"
        onClick={onOpenAuth}
        className="mr-2 h-7 rounded-lg px-3 font-mono text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-90"
        style={{
          background: 'linear-gradient(135deg, #12b76a 0%, #0ea5e9 100%)',
          color: '#fff',
        }}
      >
        Sign In
      </button>
    );
  }

  const initial = user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="relative mr-2" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[13px] font-medium text-white transition-colors hover:bg-white/20"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f0f11] shadow-2xl z-50">
          <div className="border-b border-white/[0.08] px-4 py-3">
            <p className="truncate text-xs font-medium text-white/80">{user.email}</p>
          </div>
          <div className="p-1">
            <button
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-red-400 transition-colors hover:bg-white/5"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ProjectDropdown: React.FC<{
  title: string;
  projects: ProjectSummary[];
  currentProjectId: string | null;
  onCreateProject: () => void;
  onProjectSwitch: (projectId: string) => void;
  onRenameClick: () => void;
}> = ({
  title,
  projects,
  currentProjectId,
  onCreateProject,
  onProjectSwitch,
  onRenameClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative flex items-center justify-center" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors hover:bg-white/5"
      >
        <span className="truncate font-['Inter',sans-serif] text-[14px] font-medium leading-5 text-[#f5f5f5]">
          {title || 'Untitled Art'}
        </span>
        <ChevronDown size={14} className="text-white/40" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-56 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0f0f11] shadow-2xl z-50">
          <div className="p-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onRenameClick();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-white/80 transition-colors hover:bg-white/5"
            >
              <Pencil size={14} className="text-white/40" />
              Rename
            </button>
          </div>
          
          <div className="h-px w-full bg-white/[0.08]" />
          
          <div className="max-h-60 overflow-y-auto p-1">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/30">
              Recent Projects
            </div>
            {projects.map((p, i) => (
              <button
                key={p.id}
                onClick={() => {
                  setIsOpen(false);
                  if (p.id !== currentProjectId) onProjectSwitch(p.id);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-white/80 transition-colors hover:bg-white/5"
              >
                {p.id === currentProjectId ? (
                  <Check size={14} className="text-[#12b76a] shrink-0" />
                ) : (
                  <div className="w-[14px] shrink-0" />
                )}
                <span className="truncate">{p.title || `Project ${i + 1}`}</span>
              </button>
            ))}
          </div>

          <div className="h-px w-full bg-white/[0.08]" />

          <div className="p-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onCreateProject();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-white/80 transition-colors hover:bg-white/5"
            >
              <Plus size={14} className="text-white/40" />
              New Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TopBarActions: React.FC<TopBarActionsProps> = ({
  onExport,
  user,
  signOut,
  onOpenAuth,
}) => {
  return (
    <div className="flex items-center gap-2">
      <UserDropdown user={user} signOut={signOut} onOpenAuth={onOpenAuth} />

      <button
        type="button"
        title="Share"
        className="picaro-topbar-icon"
      >
        <Share2 size={16} strokeWidth={1.8} />
      </button>

      <button
        type="button"
        className="picaro-export-btn"
        onClick={onExport}
      >
        Export
      </button>
    </div>
  );
};

export const TopBar: React.FC<TopBarProps> = ({
  projectTitle,
  projects,
  currentProjectId,
  onCreateProject,
  onProjectRename,
  onProjectSwitch,
}) => {
  const [title, setTitle] = useState(projectTitle || 'Untitled Art');
  const [isEditing, setIsEditing] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const { canUndo, canRedo, triggerUndo, triggerRedo } = useStore();
  const { user, signOut } = useAuth();
  const { count, limit } = useUsage();

  useEffect(() => {
    setTitle(projectTitle || 'Untitled Art');
  }, [projectTitle]);

  useEffect(() => {
    const handleOpenExport = () => {
      setExportOpen(true);
    };

    window.addEventListener('picaro:open-export', handleOpenExport);
    return () =>
      window.removeEventListener('picaro:open-export', handleOpenExport);
  }, []);

  const finishEditing = () => {
    const nextTitle = title.trim() || 'Untitled Art';
    setTitle(nextTitle);
    setIsEditing(false);
    if (nextTitle !== projectTitle) {
      void onProjectRename(nextTitle);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      finishEditing();
    }
  };

  const handleCreateProject = () => {
    const nextTitle = newProjectTitle.trim() || 'Untitled Art';
    void onCreateProject(nextTitle);
    setNewProjectTitle('');
    setCreateProjectOpen(false);
  };

  return (
    <div className="relative flex w-full shrink-0 flex-col">
      <div className="picaro-topbar-shell grid min-h-[58px] w-full shrink-0 grid-cols-[auto_1fr_auto] items-center gap-4 px-4">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            title="Undo"
            disabled={!canUndo}
            onClick={() => canUndo && triggerUndo()}
            className={`picaro-tool-hit picaro-focus shrink-0 border-0 ${canUndo ? 'picaro-tool-hit--inactive text-white' : 'cursor-default text-[#525252] opacity-50'}`}
          >
            <Undo2 size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            title="Redo"
            disabled={!canRedo}
            onClick={() => canRedo && triggerRedo()}
            className={`picaro-tool-hit picaro-focus shrink-0 border-0 ${canRedo ? 'picaro-tool-hit--inactive text-white' : 'cursor-default text-[#525252] opacity-50'}`}
          >
            <Redo2 size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="mx-auto flex min-w-[280px] max-w-[min(46vw,460px)] items-center justify-center gap-2">
          {isEditing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={handleKeyDown}
              className="w-full max-w-[300px] border-b border-white/[0.2] bg-transparent text-center font-['Inter',sans-serif] text-[14px] font-medium leading-5 text-[#f5f5f5] outline-none focus:border-white/40"
            />
          ) : (
            <ProjectDropdown
              title={title}
              projects={projects}
              currentProjectId={currentProjectId}
              onCreateProject={() => setCreateProjectOpen(true)}
              onProjectSwitch={onProjectSwitch}
              onRenameClick={() => setIsEditing(true)}
            />
          )}
        </div>

        <div className="flex justify-end">
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                  {count}/{limit}
                </span>
                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((count / limit) * 100, 100)}%`,
                      background:
                        count >= limit
                          ? '#ef4444'
                          : count >= limit * 0.8
                            ? '#f59e0b'
                            : '#12b76a',
                    }}
                  />
                </div>
              </div>
            )}
            <TopBarActions
              onExport={() => setExportOpen(true)}
              user={user ? { email: user.email } : null}
              signOut={signOut}
              onOpenAuth={() => setAuthOpen(true)}
            />
          </div>
        </div>
      </div>

      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setAuthOpen(false)}
      />

      {createProjectOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[400px] overflow-hidden rounded-[24px] border border-white/10 bg-[#0f0f12] shadow-[0_0_80px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
            {/* Header with subtle gradient */}
            <div className="relative border-b border-white/5 bg-white/[0.02] px-6 py-5">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#12b76a]/30 to-transparent" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-[#12b76a] shadow-inner border border-white/5">
                    <FolderPlus size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight">
                      New Project
                    </h3>
                    <p className="text-xs text-white/50 font-medium mt-0.5">
                      Create a fresh canvas
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCreateProjectOpen(false);
                    setNewProjectTitle('');
                  }}
                  className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="group relative">
                <label className="mb-2 flex items-center gap-2 text-xs font-medium text-white/60">
                  Project Name
                  <Sparkles size={12} className="text-[#0ea5e9]/70" />
                </label>
                <div className="relative">
                  <input
                    autoFocus
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateProject();
                      }
                      if (e.key === 'Escape') {
                        setCreateProjectOpen(false);
                        setNewProjectTitle('');
                      }
                    }}
                    placeholder="Untitled Art"
                    className="w-full rounded-[16px] border border-white/10 bg-black/20 px-4 py-3.5 text-[14px] text-white outline-none transition-all focus:border-[#12b76a]/50 focus:bg-black/40 focus:ring-4 focus:ring-[#12b76a]/10 placeholder:text-white/20"
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-[16px] border border-white/5 transition-colors group-hover:border-white/10" />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreateProjectOpen(false);
                    setNewProjectTitle('');
                  }}
                  className="flex-1 rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-[13px] font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateProject}
                  className="group relative flex-1 overflow-hidden rounded-[14px] bg-white px-4 py-3 text-[13px] font-semibold text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="relative">Create Project</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
