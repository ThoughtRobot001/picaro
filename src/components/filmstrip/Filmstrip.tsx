import React from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const Filmstrip: React.FC = () => {
  const { pages, currentPageId, switchPage, addPage } = useStore();

  return (
    <div className="picaro-filmstrip relative w-full shrink-0 overflow-hidden bg-[#090909]">
      {/* Header bar */}
      <div className="flex items-center border-b border-white/[0.06] px-4 py-2 bg-[#0a0a0b]">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-white/35">
          Timeline / Scene_01
        </span>
      </div>

      {/* Thumbnail row */}
      <div className="flex min-h-0 items-center gap-2 overflow-x-auto overflow-y-hidden px-3 py-2 [scrollbar-width:thin]">
        {pages.map((page, i) => {
          const isActive = page.id === currentPageId;
          return (
            <button
              key={page.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => switchPage(page.id)}
              className={`group relative shrink-0 border-0 cursor-pointer rounded-[8px] overflow-hidden transition-all duration-150 ${
                isActive
                  ? 'ring-1 ring-white/30 ring-offset-1 ring-offset-[#090909]'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{ width: 96, height: 60 }}
            >
              {page.canvasDataURL ? (
                <img
                  src={page.canvasDataURL}
                  alt={`Frame ${i + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: 'brightness(0.82) saturate(0.6)' }}
                />
              ) : (
                <div className="absolute inset-0 bg-[#141416]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              <div className="absolute bottom-1 left-2">
                <span className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-white/60">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              {isActive && (
                <div className="absolute bottom-0 inset-x-0 h-[2px] bg-[#3b82f6]" />
              )}
            </button>
          );
        })}

        {/* Append button */}
        <button
          type="button"
          onClick={addPage}
          className="picaro-focus flex shrink-0 flex-col items-center justify-center gap-1 rounded-[8px] border border-dashed border-white/[0.1] bg-white/[0.015] text-white/25 transition-all hover:border-[#3b82f6]/40 hover:bg-[#3b82f6]/[0.05] hover:text-[#7ab3ff] active:scale-[0.98]"
          style={{ width: 80, height: 60 }}
        >
          <Plus size={14} strokeWidth={1.5} />
          <span className="font-mono text-[8px] uppercase tracking-[0.18em]">
            Append
          </span>
        </button>
      </div>
    </div>
  );
};
