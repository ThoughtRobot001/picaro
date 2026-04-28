import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../store/useStore';

interface OutputPanelProps {
  generatedImageURL: string | null;
  selectedStyle: string;
  onStyleChange: (id: string) => void;
}

const OUTPUT_STYLES = [
  { id: 'photorealistic', label: 'Photorealistic' },
  { id: 'manga', label: 'Manga' },
  { id: 'anime', label: 'Anime' },
  { id: 'watercolor', label: 'Watercolor' },
  { id: 'oilpainting', label: 'Oil Painting' },
  { id: 'sketch', label: 'Sketch' },
];

export const OutputPanel: React.FC<OutputPanelProps> = ({
  generatedImageURL,
  selectedStyle,
  onStyleChange,
}) => {
  const { isGenerating } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [gestureActive, setGestureActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const gestureSettleRef = useRef<number | null>(null);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef<{
    mouseX: number; mouseY: number;
    panX: number; panY: number;
  } | null>(null);

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [generatedImageURL]);

  const bumpGesture = useCallback(() => {
    setGestureActive(true);
    if (gestureSettleRef.current) {
      window.clearTimeout(gestureSettleRef.current);
    }
    gestureSettleRef.current = window.setTimeout(() => {
      setGestureActive(false);
    }, 140);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      bumpGesture();
      const zoomFactor = e.deltaY < 0 ? 1.06 : 0.94;
      const cz = zoomRef.current;
      const newZoom = Math.max(0.75, Math.min(2, cz * zoomFactor));
      const cp = panRef.current;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cx = (mx - cp.x) / cz;
      const cy = (my - cp.y) / cz;
      setZoom(newZoom);
      setPan({ x: mx - cx * newZoom, y: my - cy * newZoom });
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [bumpGesture]);

  useEffect(() => {
    if (!styleOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.style-dropdown-container')) return;
      setStyleOpen(false);
    };
    const t = window.setTimeout(
      () => document.addEventListener('mousedown', close), 0
    );
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('mousedown', close);
    };
  }, [styleOpen]);

  const currentStyleLabel =
    OUTPUT_STYLES.find((s) => s.id === selectedStyle)?.label
    ?? selectedStyle;

  return (
    <div
      ref={containerRef}
      className="relative h-full min-w-0 flex-1 overflow-hidden rounded-[24px] border border-white/[0.08] shadow-[var(--picaro-elev-2)]"
      style={{
        background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.06), rgba(8,8,8,0.98) 58%)',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={(e) => {
        dragStartRef.current = {
          mouseX: e.clientX, mouseY: e.clientY,
          panX: pan.x, panY: pan.y,
        };
        setIsDragging(true);
        bumpGesture();
        (e.currentTarget as HTMLDivElement)
          .setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!isDragging || !dragStartRef.current) return;
        bumpGesture();
        setPan({
          x: dragStartRef.current.panX +
             e.clientX - dragStartRef.current.mouseX,
          y: dragStartRef.current.panY +
             e.clientY - dragStartRef.current.mouseY,
        });
      }}
      onPointerUp={(e) => {
        setIsDragging(false);
        dragStartRef.current = null;
        (e.currentTarget as HTMLDivElement)
          .releasePointerCapture(e.pointerId);
      }}
      onPointerCancel={(e) => {
        setIsDragging(false);
        (e.currentTarget as HTMLDivElement)
          .releasePointerCapture(e.pointerId);
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div
        className={`picaro-canvas-stage absolute inset-0 flex items-center justify-center ${
          !gestureActive ? 'picaro-canvas-stage--smooth' : ''
        }`}
        style={{
          transformOrigin: '0 0',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {generatedImageURL ? (
          <img
            src={generatedImageURL}
            alt="AI generated result"
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '8px',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center pointer-events-none">
            <ImageIcon
              size={40}
              className="text-[#525252]"
              strokeWidth={1.25}
            />
            <p className="font-['Inter'] text-sm font-medium tracking-wide text-[#a3a3a3]">
              AI render output
            </p>
            <p className="font-['Inter'] text-[13px] leading-5 text-[#737373] max-w-[240px]">
              Click Generate from Sketch to render your drawing.
            </p>
          </div>
        )}
      </div>

      <div
        className="absolute top-3 right-3 z-50 flex items-center gap-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Engine label */}
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30 select-none pr-1">
          Flux Kontext
        </span>

        <div className="w-px h-3 bg-white/10" />

        <div className="relative style-dropdown-container">
          <button
            type="button"
            onClick={() => setStyleOpen((o) => !o)}
            className="flex items-center gap-2 rounded-[12px] border border-white/10 bg-black/60 px-3 h-8 text-[12px] font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-black/80"
          >
            {currentStyleLabel}
            <span className="text-white/40">v</span>
          </button>
          <AnimatePresence>
          {styleOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ ease: 'easeOut', duration: 0.2 }}
              className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-white/10 bg-[#111] shadow-xl"
            >
              {OUTPUT_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onStyleChange(s.id);
                    setStyleOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-[12px] transition-colors hover:bg-white/5 ${
                    selectedStyle === s.id
                      ? 'font-semibold text-white'
                      : 'text-white/60'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {/* Zoom HUD — bottom-left */}
      <div className="absolute bottom-3 left-3 z-50 flex items-center gap-2">
        <div className="picaro-zoom-hud pointer-events-none">
          <span className="text-[10px] font-medium uppercase tracking-wide text-white/35">
            Zoom
          </span>
          <span className="picaro-zoom-hud__pct">
            {Math.round(zoom * 100)}%
          </span>
        </div>
        {zoom !== 1 && (
          <button
            type="button"
            className="picaro-focus picaro-zoom-reset"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            Reset
          </button>
        )}
      </div>

      {isGenerating && (
        <div className="picaro-canvas-shimmer" aria-hidden />
      )}

      <div className="absolute inset-0 pointer-events-none rounded-[24px] border border-white/[0.06] z-50" />
    </div>
  );
};
