import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  Pencil,
  Share2,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ExportModal } from '../export/ExportModal';
import { AuthModal } from '../auth/AuthModal';
import { useAuth } from '../../lib/useAuth';

interface TopBarActionsProps {
  onExport: () => void;
  user: any;
  signOut: () => void;
  onOpenAuth: () => void;
}

const TopBarActions: React.FC<TopBarActionsProps> = ({ onExport, user, signOut, onOpenAuth }) => {
  return (
    <div className="flex items-center gap-2">
      {user ? (
        <div className="flex items-center gap-2 mr-2">
          <span className="font-mono text-[10px] text-white/30 uppercase tracking-wider hidden sm:block">
            {user.email?.split('@')[0]}
          </span>
          <button
            type="button"
            onClick={signOut}
            className="px-3 h-7 rounded-lg font-mono text-[10px] uppercase tracking-wider text-white/40 border border-white/[0.08] hover:text-white/60 hover:border-white/15 transition-all"
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenAuth}
          className="px-3 h-7 rounded-lg font-mono text-[10px] uppercase tracking-wider font-bold transition-all mr-2"
          style={{
            background:
              'linear-gradient(135deg, #12b76a 0%, #0ea5e9 100%)',
            color: '#fff',
          }}
        >
          Sign In
        </button>
      )}
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

export const TopBar: React.FC = () => {
  const [title, setTitle] = useState('Untitled Art');
  const [isEditing, setIsEditing] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const { canUndo, canRedo, triggerUndo, triggerRedo } = useStore();
  const { user, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditing(false);
    }
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

        <div
          className="mx-auto flex min-w-[220px] max-w-[min(34vw,320px)] cursor-pointer items-center justify-center gap-1.5 px-3 py-2 text-center opacity-80 transition-opacity hover:opacity-100"
          onClick={() => setIsEditing(true)}
          title="Edit title"
        >
          {isEditing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={handleKeyDown}
              className="w-full min-w-[20px] max-w-full border-b border-white/[0.2] bg-transparent text-center font-['Inter',sans-serif] text-[13px] font-medium leading-4 text-[#f5f5f5] outline-none"
            />
          ) : (
            <>
              <p className="truncate font-['Inter',sans-serif] text-[13px] font-medium leading-4 text-[#d4d4d4]">
                {title || 'Untitled Art'}
              </p>
              <Pencil size={12} className="shrink-0 text-white/35" aria-hidden />
            </>
          )}
        </div>

        <div className="flex justify-end">
          <TopBarActions 
            onExport={() => setExportOpen(true)} 
            user={user}
            signOut={signOut}
            onOpenAuth={() => setAuthOpen(true)}
          />
        </div>
      </div>

      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setAuthOpen(false)}
      />
    </div>
  );
};
