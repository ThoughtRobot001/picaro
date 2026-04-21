import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  Pencil,
  Share2,
  Download,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ExportModal } from '../export/ExportModal';

interface TopBarActionsProps {
  onExport: () => void;
}

const TopBarActions: React.FC<TopBarActionsProps> = ({ onExport }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        title="Share"
        className="picaro-topbar-icon"
      >
        <Share2 size={16} strokeWidth={1.8} />
      </button>

      <button
        type="button"
        title="Export"
        onClick={onExport}
        className="picaro-topbar-icon"
      >
        <Download size={16} strokeWidth={1.8} />
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
          <TopBarActions onExport={() => setExportOpen(true)} />
        </div>
      </div>

      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
};
