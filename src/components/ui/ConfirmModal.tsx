import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="relative flex flex-col rounded-2xl border border-white/[0.08] shadow-2xl w-full max-w-sm mx-4"
        style={{ background: '#0a0a0c' }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-400">
              <AlertTriangle size={14} />
            </div>
            <h2 className="font-mono text-[13px] font-bold uppercase tracking-[0.16em] text-white/90">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-[13px] text-white/60 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06] bg-black/20">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[11px] font-mono font-semibold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-[11px] font-mono font-semibold uppercase tracking-wider text-white transition-colors bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
