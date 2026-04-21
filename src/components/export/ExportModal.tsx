import React, { useEffect, useState, useCallback } from 'react';
import { X, Download } from 'lucide-react';
import JSZip from 'jszip';
import { useStore } from '../../store/useStore';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { pages } = useStore();
  const [isRendering, setIsRendering] = useState(false);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [selectedPanels, setSelectedPanels] = useState<Set<number>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  const exportPages = pages.filter((p) => p.aiResult);

  const PANEL_SIZE = 512;
  const GAP = 16;
  const PADDING = 32;
  const LABEL_HEIGHT = 32;

  // FIX 3: No auto-render on open — just init selection
  useEffect(() => {
    if (isOpen) {
      setSelectedPanels(new Set(exportPages.map((_, i) => i)));
      setPreviewURL(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const togglePanel = (i: number) => {
    setSelectedPanels((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
    setPreviewURL(null);
  };

  const renderStrip = useCallback(async (): Promise<string | null> => {
    const pagesToRender = exportPages.filter((_, i) => selectedPanels.has(i));
    if (pagesToRender.length === 0) return null;

    setIsRendering(true);
    setPreviewURL(null);

    // ── Step 1: Resolve all URLs to data URLs BEFORE touching the canvas ──
    // canvas.drawImage() taints the canvas if the source is a cross-origin URL
    // (even if it visually loaded). Converting to a data URL first avoids this.
    const resolvedURLs: (string | null)[] = await Promise.all(
      pagesToRender.map(async (page) => {
        if (!page.aiResult) return null;
        // Already a data URL — safe for canvas
        if (page.aiResult.startsWith('data:')) return page.aiResult;
        // Legacy remote URL — fetch and convert to data URL
        try {
          const response = await fetch(page.aiResult);
          if (!response.ok) return null;
          const blob = await response.blob();
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          console.warn('Could not convert panel to data URL (may be expired):', page.aiResult);
          return null;
        }
      })
    );

    const STRIP_HEIGHT = PANEL_SIZE + LABEL_HEIGHT + PADDING * 2;
    const STRIP_WIDTH =
      PADDING * 2 +
      pagesToRender.length * PANEL_SIZE +
      Math.max(0, pagesToRender.length - 1) * GAP;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(STRIP_WIDTH, 400);
      canvas.height = STRIP_HEIGHT;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < pagesToRender.length; i++) {
        const x = PADDING + i * (PANEL_SIZE + GAP);
        const y = PADDING;
        const dataURL = resolvedURLs[i];

        // Panel background
        ctx.fillStyle = '#1a1a1e';
        ctx.roundRect(x, y, PANEL_SIZE, PANEL_SIZE, 8);
        ctx.fill();

        if (dataURL) {
          // Draw from data URL — guaranteed same-origin, no CORS taint
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(x, y, PANEL_SIZE, PANEL_SIZE, 8);
              ctx.clip();
              ctx.drawImage(img, x, y, PANEL_SIZE, PANEL_SIZE);
              ctx.restore();
              resolve();
            };
            img.onerror = () => resolve();
            img.src = dataURL;
          });
        } else {
          // Failed to load — show "Expired" indicator
          ctx.fillStyle = 'rgba(255,50,50,0.15)';
          ctx.beginPath();
          ctx.roundRect(x, y, PANEL_SIZE, PANEL_SIZE, 8);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,100,100,0.6)';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('Image expired', x + PANEL_SIZE / 2, y + PANEL_SIZE / 2);
          ctx.textAlign = 'left';
        }

        // Panel border
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, PANEL_SIZE, PANEL_SIZE, 8);
        ctx.stroke();

        // Panel number label
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = 'bold 11px "SF Mono", "Fira Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(String(i + 1).padStart(2, '0'), x + 8, y + PANEL_SIZE + 20);
      }

      const dataURL = canvas.toDataURL('image/png');
      setPreviewURL(dataURL);
      return dataURL;
    } catch (err) {
      console.error('Strip render error:', err);
      return null;
    } finally {
      setIsRendering(false);
    }
  }, [exportPages, selectedPanels, PANEL_SIZE, GAP, PADDING, LABEL_HEIGHT]);

  // ZIP download helper (shared)
  const handleDownloadZip = useCallback(async () => {
    const pagesToExport = exportPages.filter((_, i) => selectedPanels.has(i));
    if (pagesToExport.length === 0) return;

    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('picaro-panels')!;

      for (let i = 0; i < pagesToExport.length; i++) {
        const page = pagesToExport[i];
        if (!page.aiResult) continue;
        try {
          const response = await fetch(page.aiResult);
          const blob = await response.blob();
          folder.file(`panel-${String(i + 1).padStart(2, '0')}.png`, blob);
        } catch {
          console.error(`Failed to fetch panel ${i + 1}`);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'picaro-panels.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  }, [exportPages, selectedPanels]);

  // FIX 2: Smart download — PNG if 1 selected, ZIP if multiple
  const handleSmartDownload = async () => {
    const pagesToExport = exportPages.filter((_, i) => selectedPanels.has(i));
    if (pagesToExport.length === 0) return;

    if (pagesToExport.length === 1) {
      const page = pagesToExport[0];
      if (!page.aiResult) return;
      setIsDownloading(true);
      try {
        const response = await fetch(page.aiResult);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'picaro-panel-01.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        console.error('Download failed');
      } finally {
        setIsDownloading(false);
      }
    } else {
      await handleDownloadZip();
    }
  };

  // FIX 2: Export strip — render then download
  const handleExportStrip = async () => {
    const dataURL = await renderStrip();
    if (!dataURL) return;
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'picaro-strip.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col rounded-2xl border border-white/[0.08] shadow-2xl"
        style={{ background: '#0a0a0c', width: 'min(90vw, 900px)', maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div>
            <h2 className="font-mono text-[13px] font-bold uppercase tracking-[0.16em] text-white/80">
              Export Strip
            </h2>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-white/30">
              {exportPages.length} panel{exportPages.length !== 1 ? 's' : ''} · PNG / ZIP
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-auto p-6">
          {exportPages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <p className="font-mono text-[12px] uppercase tracking-wider text-white/30">
                No generated panels yet
              </p>
              <p className="font-mono text-[10px] text-white/20">
                Generate images on your pages first
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Select all / none row */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setSelectedPanels(new Set(exportPages.map((_, i) => i))); setPreviewURL(null); }}
                  className="font-mono text-[10px] uppercase tracking-wider text-white/30 transition-colors hover:text-white/60"
                >
                  Select all
                </button>
                <span className="text-white/15">·</span>
                <button
                  type="button"
                  onClick={() => { setSelectedPanels(new Set()); setPreviewURL(null); }}
                  className="font-mono text-[10px] uppercase tracking-wider text-white/30 transition-colors hover:text-white/60"
                >
                  Select none
                </button>
                <span className="text-white/15">·</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/20">
                  {selectedPanels.size} of {exportPages.length} selected
                </span>
              </div>

              {/* FIX 4: Thumbnails via <img> tags — browser handles CORS fine for display */}
              <div className="flex flex-wrap gap-3">
                {exportPages.map((page, i) => (
                  <div
                    key={page.id}
                    className="group relative cursor-pointer"
                    onClick={() => togglePanel(i)}
                  >
                    <div
                      className={`relative h-32 w-32 overflow-hidden rounded-xl border-2 transition-all duration-150 ${
                        selectedPanels.has(i)
                          ? 'border-emerald-500 shadow-[0_0_12px_rgba(18,183,106,0.3)]'
                          : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      {/* FIX 4: Plain <img> — works in browser without CORS issues */}
                      <img
                        src={page.aiResult!}
                        alt={`Panel ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {!selectedPanels.has(i) && (
                        <div className="absolute inset-0 bg-black/50 transition-colors group-hover:bg-black/30" />
                      )}
                      {selectedPanels.has(i) && (
                        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                          <svg width="10" height="10" viewBox="0 0 10 10">
                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="mt-1.5 text-center font-mono text-[10px] uppercase tracking-wider text-white/30">
                      {String(i + 1).padStart(2, '0')}
                    </p>
                  </div>
                ))}
              </div>

              {/* FIX 4: Expiry notice */}
              <p className="px-1 font-mono text-[9px] uppercase tracking-wider text-white/20">
                Note: Replicate image URLs expire after 24h. Regenerate expired panels before exporting.
              </p>

              {/* Strip preview — only shown after Export Strip is clicked */}
              {isRendering && (
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] p-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-white/40">
                    Rendering strip...
                  </span>
                </div>
              )}
              {previewURL && !isRendering && (
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/30">Strip Preview</span>
                  <div className="overflow-hidden rounded-xl border border-white/[0.06]" style={{ background: '#0a0a0c' }}>
                    <img
                      src={previewURL}
                      alt="Strip preview"
                      className="h-auto w-full"
                      style={{ maxHeight: '28vh', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-white/[0.06] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg px-4 font-mono text-[11px] uppercase tracking-wider text-white/40 transition-colors hover:text-white/60"
          >
            Cancel
          </button>

          {/* FIX 2: Smart two-button footer */}
          <div className="flex items-center gap-2">
            {/* Smart download — PNG if 1, ZIP if multiple */}
            <button
              type="button"
              disabled={selectedPanels.size === 0 || isDownloading}
              onClick={handleSmartDownload}
              className="flex h-9 items-center gap-2 rounded-lg border border-white/10 px-4 font-mono text-[11px] uppercase tracking-wider text-white/50 transition-all hover:border-white/20 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isDownloading ? (
                <div className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-white/60" />
              ) : (
                <Download size={12} />
              )}
              {selectedPanels.size <= 1 ? 'Download PNG' : 'Download ZIP'}
            </button>

            {/* Export combined strip */}
            <button
              type="button"
              disabled={selectedPanels.size === 0 || isRendering}
              onClick={handleExportStrip}
              className="flex h-9 items-center gap-2 rounded-lg px-5 font-mono text-[11px] font-bold uppercase tracking-wider text-white transition-all disabled:cursor-not-allowed disabled:opacity-30"
              style={{
                background: selectedPanels.size > 0
                  ? 'linear-gradient(135deg, #12b76a 0%, #0ea5e9 100%)'
                  : '#333',
                boxShadow: selectedPanels.size > 0
                  ? '0 0 18px rgba(18,183,106,0.25)'
                  : 'none',
              }}
            >
              <Download size={13} />
              Export Strip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
