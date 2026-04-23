import React, { useState } from 'react';
import { Plus, MoreVertical, Trash2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useStore } from '../../store/useStore';
import { ConfirmModal } from '../ui/ConfirmModal';

interface FilmstripProps {
  deletePageFromDatabase: (pageNumber: number) => Promise<void>;
}

export const Filmstrip: React.FC<FilmstripProps> = ({ deletePageFromDatabase }) => {
  const { pages, currentPageId, switchPage, addPage, removePage } = useStore();
  const [pageToDelete, setPageToDelete] = useState<number | null>(null);

  const handleDeleteConfirm = async () => {
    if (pageToDelete === null || pages.length <= 1) return;
    await deletePageFromDatabase(pageToDelete);
    removePage(pageToDelete);
    setPageToDelete(null);
  };

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
            <div key={page.id} className="relative group shrink-0" style={{ width: 96, height: 60 }}>
              <button
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => switchPage(page.id)}
                className={`relative w-full h-full border-0 cursor-pointer rounded-[8px] overflow-hidden transition-all duration-150 ${
                  isActive
                    ? 'ring-1 ring-white/30 ring-offset-1 ring-offset-[#090909]'
                    : 'opacity-70 hover:opacity-100'
                }`}
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

              <div className="absolute top-1 right-1 opacity-40 group-hover:opacity-100 transition-opacity z-10">
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className="w-6 h-6 rounded flex items-center justify-center bg-black/60 hover:bg-black/80 text-white/70 hover:text-white transition-colors"
                    >
                      <MoreVertical size={12} />
                    </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={4}
                      className="z-[200] min-w-[140px] rounded-xl border border-white/[0.08] bg-[#0f0f13] p-1.5 shadow-2xl animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
                    >
                      <DropdownMenu.Item
                        disabled={pages.length <= 1}
                        onSelect={(e) => {
                          if (pages.length <= 1) {
                            e.preventDefault();
                            return;
                          }
                          setPageToDelete(page.id);
                        }}
                        className="flex cursor-pointer select-none items-center gap-2 rounded-[8px] px-2.5 py-2 text-[11px] font-medium font-mono text-red-400 outline-none transition-colors hover:bg-red-500/10 data-[disabled]:opacity-40 data-[disabled]:pointer-events-none"
                      >
                        <Trash2 size={12} />
                        Delete Page
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
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

      <ConfirmModal
        isOpen={pageToDelete !== null}
        title="Delete Scene?"
        description="Are you sure you want to delete this scene? All its associated canvas data and refinement history will be permanently lost."
        confirmText="Delete Scene"
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setPageToDelete(null)}
      />
    </div>
  );
};
