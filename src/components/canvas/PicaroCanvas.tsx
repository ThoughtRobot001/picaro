import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { ChevronDown } from 'lucide-react';

const CANVAS_RESOLUTION = 2048;
import { useStore } from '../../store/useStore';

interface BrushControlsProps {
  openPanel: 'size' | 'opacity' | null;
  setOpenPanel: (v: 'size' | 'opacity' | null) => void;
}

const BrushControls: React.FC<BrushControlsProps> = ({ openPanel, setOpenPanel }) => {
  const { brushSize, setBrushSize, brushOpacity, setBrushOpacity } = useStore();

  const sizePct = ((brushSize - 1) / 49) * 100;
  const opacityPct = brushOpacity * 100;

  if (!openPanel) {
    return (
      <div className="absolute bottom-4 left-4 z-50 flex items-center gap-2.5 px-3 py-2 rounded-[10px] bg-[#0a0a0c] border border-white/[0.1] shadow-xl">
        <button
          onClick={() => setOpenPanel('size')}
          className="w-2.5 h-2.5 rounded-full bg-white/70 hover:bg-white transition-colors shrink-0"
          title="Brush Size"
        />
        <button
          onClick={() => setOpenPanel('opacity')}
          className="w-2.5 h-2.5 rounded-full bg-white/30 hover:bg-white transition-colors shrink-0"
          title="Brush Opacity"
        />
        <div className="w-px h-3 bg-white/20 mx-1 shrink-0" />
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/70 pointer-events-none select-none">
          {brushSize}px · {Math.round(brushOpacity * 100)}%
        </span>
      </div>
    );
  }

  const isSize = openPanel === 'size';

  return (
    <div className="absolute bottom-4 left-4 z-50 flex items-center h-10 px-4 rounded-[12px] bg-[#0a0a0c] border border-white/[0.06] shadow-2xl gap-4">
      <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/40 shrink-0 w-[72px]">
        {isSize ? 'Brush Size' : 'Opacity'}
      </span>
      
      <div className="relative flex items-center w-28 shrink-0 h-full group">
        <input
          type="range"
          min={1}
          max={isSize ? 50 : 100}
          value={isSize ? brushSize : Math.round(brushOpacity * 100)}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (isSize) setBrushSize(val);
            else setBrushOpacity(val / 100);
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white" 
            style={{ width: `${isSize ? sizePct : opacityPct}%` }}
          />
        </div>
        <div 
          className="absolute w-3 h-3 bg-white rounded-full shadow pointer-events-none group-active:scale-110 transition-transform"
          style={{ left: `calc(${isSize ? sizePct : opacityPct}% - 6px)` }}
        />
      </div>

      <span className="font-mono text-[11px] text-white/80 shrink-0 w-8 text-right">
        {isSize ? `${brushSize}px` : `${Math.round(brushOpacity * 100)}%`}
      </span>

      <div className="w-px h-3 bg-white/10 shrink-0 mx-1" />

      <button
        type="button"
        onClick={() => setOpenPanel(isSize ? 'opacity' : 'size')}
        className={`w-2.5 h-2.5 rounded-full ${isSize ? 'bg-white/20' : 'bg-white/40'} hover:bg-white/60 transition-colors shrink-0`}
        title={isSize ? 'Switch to Opacity' : 'Switch to Size'}
      />

      <button
        type="button"
        onClick={() => setOpenPanel(null)}
        className="text-white/30 hover:text-white shrink-0 ml-1"
      >
        <ChevronDown size={14} />
      </button>
    </div>
  );
};


interface PicaroCanvasProps {
  onExport?: (dataURL: string) => void;
}

export const PicaroCanvas: React.FC<PicaroCanvasProps> = ({
  onExport,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);
  const isDrawing = useRef(false);
  const history = useRef<ImageData[]>([]);
  const historyStep = useRef(-1);

  const [isHovering, setIsHovering] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [gestureActive, setGestureActive] = useState(false);
  const [brushPanelOpen, setBrushPanelOpen] = useState<'size' | 'opacity' | null>(null);
  const gestureSettleRef = useRef<number | null>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panStartRef = useRef<{
    mouseX: number; mouseY: number;
    panX: number; panY: number;
  } | null>(null);

  // Text tool
  const [textTarget, setTextTarget] = useState<{
    x: number; y: number
  } | null>(null);
  const [textValue, setTextValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textTargetRef = useRef<{ x: number; y: number } | null>(null);
  const textValueRef = useRef('');
  useEffect(() => { textTargetRef.current = textTarget; }, [textTarget]);
  useEffect(() => { textValueRef.current = textValue; }, [textValue]);

  // Move tool
  type MoveOverlay = {
    x: number; y: number; w: number; h: number; dataURL: string
  };
  const [moveOverlay, setMoveOverlay] = useState<MoveOverlay | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    x: number; y: number; w: number; h: number
  } | null>(null);
  const movePhaseRef = useRef<'idle' | 'selecting' | 'moving'>('idle');
  const moveStartRef = useRef<{ x: number; y: number } | null>(null);
  const moveAnchorRef = useRef<{
    mouseX: number; mouseY: number; boxX: number; boxY: number
  } | null>(null);
  const moveImageDataRef = useRef<ImageData | null>(null);
  const moveOverlayRef = useRef<MoveOverlay | null>(null);
  useEffect(() => {
    moveOverlayRef.current = moveOverlay;
  }, [moveOverlay]);

  // Zustand store
  const {
    activeTool, setActiveTool,
    brushSize, brushOpacity, brushColor, setBrushColor,
    shapeType,
    setCanUndo, setCanRedo,
    undoCounter, redoCounter,
    currentPageId, updatePageCanvas,
  } = useStore();

  // Shape tool
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);

  // ── WHITE BACKGROUND HELPER ──────────────────────────
  const paintWhiteBackground = useCallback((
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number
  ) => {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }, []);

  // ── EXPORT with guaranteed white background ──────────
  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = CANVAS_RESOLUTION;
    offscreen.height = CANVAS_RESOLUTION;
    const ctx = offscreen.getContext('2d', { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0);
    const dataURL = offscreen.toDataURL('image/png');
    updatePageCanvas(currentPageId, dataURL);
    onExport?.(dataURL);
  }, [currentPageId, updatePageCanvas, onExport]);

  // ── HISTORY ──────────────────────────────────────────
  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const newHistory = history.current.slice(0, historyStep.current + 1);
    newHistory.push(ctx.getImageData(0, 0, CANVAS_RESOLUTION, CANVAS_RESOLUTION));
    history.current = newHistory;
    historyStep.current = newHistory.length - 1;
    setCanUndo(historyStep.current > 0);
    setCanRedo(false);
    exportCanvas();
  }, [setCanUndo, setCanRedo, exportCanvas]);

  const restoreHistoryState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    ctx.putImageData(
      history.current[historyStep.current], 0, 0
    );
    setCanUndo(historyStep.current > 0);
    setCanRedo(historyStep.current < history.current.length - 1);
    exportCanvas();
  }, [setCanUndo, setCanRedo, exportCanvas]);

  // Undo/redo triggered by store counter
  const lastUndoRef = useRef(undoCounter);
  useEffect(() => {
    if (undoCounter > lastUndoRef.current) {
      lastUndoRef.current = undoCounter;
      if (historyStep.current > 0) {
        historyStep.current -= 1;
        restoreHistoryState();
      }
    }
  }, [undoCounter, restoreHistoryState]);

  const lastRedoRef = useRef(redoCounter);
  useEffect(() => {
    if (redoCounter > lastRedoRef.current) {
      lastRedoRef.current = redoCounter;
      if (historyStep.current < history.current.length - 1) {
        historyStep.current += 1;
        restoreHistoryState();
      }
    }
  }, [redoCounter, restoreHistoryState]);

  // ── CANVAS RESIZE ────────────────────────────────────
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      // Only set resolution once on first init
      // After that, CSS handles display scaling
      if (canvas.width === CANVAS_RESOLUTION && canvas.height === CANVAS_RESOLUTION) {
        return;
      }

      // Save current content before resize
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (tempCtx) tempCtx.imageSmoothingEnabled = false;
      if (canvas.width > 0 && canvas.height > 0) {
        tempCtx?.drawImage(canvas, 0, 0);
      }

      // Set fixed high resolution
      canvas.width = CANVAS_RESOLUTION;
      canvas.height = CANVAS_RESOLUTION;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;

      // Paint white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_RESOLUTION, CANVAS_RESOLUTION);

      // Restore previous content scaled to new resolution
      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.drawImage(
          tempCanvas,
          0, 0,
          CANVAS_RESOLUTION,
          CANVAS_RESOLUTION
        );
      }

      // Initialize offscreen canvas at same resolution
      if (!offscreenRef.current) {
        offscreenRef.current = document.createElement('canvas');
      }
      offscreenRef.current.width = CANVAS_RESOLUTION;
      offscreenRef.current.height = CANVAS_RESOLUTION;

      // Save initial history state
      if (history.current.length === 0) {
        const initialData = ctx.getImageData(
          0, 0, CANVAS_RESOLUTION, CANVAS_RESOLUTION
        );
        history.current = [initialData];
        historyStep.current = 0;
        setCanUndo(false);
        setCanRedo(false);
      }
    };

    const observer = new ResizeObserver(resizeCanvas);
    if (containerRef.current) {
      observer.observe(containerRef.current);
      resizeCanvas();
    }
    return () => observer.disconnect();
  }, [setCanUndo, setCanRedo]);

  // ── PAGE SWITCHING ───────────────────────────────────
  // When page changes, restore that page's canvas or clear to white
  const { pages } = useStore();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    const currentPage = pages.find((p) => p.id === currentPageId);

    // Clear history for new page
    history.current = [];
    historyStep.current = -1;

    if (currentPage?.canvasDataURL) {
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_RESOLUTION, CANVAS_RESOLUTION);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, CANVAS_RESOLUTION, CANVAS_RESOLUTION);
        const imageData = ctx.getImageData(0, 0, CANVAS_RESOLUTION, CANVAS_RESOLUTION);
        history.current = [imageData];
        historyStep.current = 0;
        setCanUndo(false);
        setCanRedo(false);
      };
      img.src = currentPage.canvasDataURL;
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_RESOLUTION, CANVAS_RESOLUTION);
      const imageData = ctx.getImageData(0, 0, CANVAS_RESOLUTION, CANVAS_RESOLUTION);
      history.current = [imageData];
      historyStep.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [currentPageId]);

  // ── GESTURE / ZOOM ───────────────────────────────────
  const bumpGesture = useCallback(() => {
    setGestureActive(true);
    if (gestureSettleRef.current) {
      window.clearTimeout(gestureSettleRef.current);
    }
    gestureSettleRef.current = window.setTimeout(() => {
      setGestureActive(false);
      gestureSettleRef.current = null;
    }, 140);
  }, []);

  useEffect(() => {
    return () => {
      if (gestureSettleRef.current) {
        window.clearTimeout(gestureSettleRef.current);
      }
    };
  }, []);

  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      bumpGesture();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.9;
      const currentZoom = zoomRef.current;
      const newZoom = Math.max(0.1, Math.min(8, currentZoom * zoomFactor));
      const currentPan = panRef.current;
      const rect = el.getBoundingClientRect();
      const parentScale = rect.width / el.offsetWidth;
      const mouseX = (e.clientX - rect.left) / parentScale;
      const mouseY = (e.clientY - rect.top) / parentScale;
      const canvasX = (mouseX - currentPan.x) / currentZoom;
      const canvasY = (mouseY - currentPan.y) / currentZoom;
      setZoom(newZoom);
      setPan({
        x: mouseX - canvasX * newZoom,
        y: mouseY - canvasY * newZoom,
      });
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [bumpGesture]);

  // ── HELPERS ──────────────────────────────────────────
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const getOffscreen = () => {
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas');
    }
    const off = offscreenRef.current;
    if (
      off.width !== CANVAS_RESOLUTION ||
      off.height !== CANVAS_RESOLUTION
    ) {
      off.width = CANVAS_RESOLUTION;
      off.height = CANVAS_RESOLUTION;
    }
    return off;
  };

  const sampleColor = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const pixel = ctx.getImageData(
      Math.round(x), Math.round(y), 1, 1
    ).data;
    if (pixel[3] < 10) {
      setBrushColor('#ffffff');
    } else {
      const hex = [pixel[0], pixel[1], pixel[2]]
        .map((v) => v.toString(16).padStart(2, '0'))
        .join('');
      setBrushColor(`#${hex}`);
    }
  };

  const floodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const sx = Math.round(startX);
    const sy = Math.round(startY);
    const idx = (sy * width + sx) * 4;
    const tR = data[idx], tG = data[idx+1],
          tB = data[idx+2], tA = data[idx+3];
    const hex = brushColor.replace('#', '');
    const fR = parseInt(hex.slice(0,2), 16);
    const fG = parseInt(hex.slice(2,4), 16);
    const fB = parseInt(hex.slice(4,6), 16);
    const fA = Math.round(brushOpacity * 255);
    if (tR===fR && tG===fG && tB===fB && tA===fA) return;
    const tolerance = 30;
    const matches = (i: number) =>
      Math.abs(data[i]-tR) <= tolerance &&
      Math.abs(data[i+1]-tG) <= tolerance &&
      Math.abs(data[i+2]-tB) <= tolerance &&
      Math.abs(data[i+3]-tA) <= tolerance;
    const stack = [[sx, sy]];
    const visited = new Uint8Array(width * height);
    visited[sy * width + sx] = 1;
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const i = (y * width + x) * 4;
      data[i]=fR; data[i+1]=fG;
      data[i+2]=fB; data[i+3]=fA;
      for (const [nx, ny] of [
        [x+1,y],[x-1,y],[x,y+1],[x,y-1]
      ]) {
        if (nx<0||ny<0||nx>=width||ny>=height) continue;
        const ni = ny*width+nx;
        if (!visited[ni] && matches(ni*4)) {
          visited[ni]=1; stack.push([nx,ny]);
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    saveHistory();
  };

  // ── TEXT TOOL ────────────────────────────────────────
  const textFontSize = Math.max(12, brushSize * 3);

  const commitText = useCallback(() => {
    const value = textValueRef.current.trim();
    const target = textTargetRef.current;
    textTargetRef.current = null;
    if (value && target && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.font = `${textFontSize}px Inter, sans-serif`;
        ctx.fillStyle = brushColor;
        ctx.globalAlpha = brushOpacity;
        ctx.textBaseline = 'top';
        value.split('\n').forEach((line, i) => {
          ctx.fillText(
            line, target.x,
            target.y + i * textFontSize * 1.25
          );
        });
        ctx.globalAlpha = 1;
        saveHistory();
      }
    }
    setTextTarget(null);
    setTextValue('');
  }, [brushColor, brushOpacity, textFontSize, saveHistory]);

  useEffect(() => {
    if (activeTool !== 'text' && textTargetRef.current) {
      commitText();
    }
  }, [activeTool, commitText]);

  // ── MOVE TOOL ────────────────────────────────────────
  const stampMoveSelection = useCallback(() => {
    const canvas = canvasRef.current;
    const overlay = moveOverlayRef.current;
    const imageData = moveImageDataRef.current;
    if (!canvas || !overlay || !imageData) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    ctx.putImageData(imageData, Math.round(overlay.x), Math.round(overlay.y));
    saveHistory();
    setMoveOverlay(null);
    moveImageDataRef.current = null;
    moveOverlayRef.current = null;
  }, [saveHistory]);

  const captureSelection = useCallback((box: {
    x: number; y: number; w: number; h: number
  }) => {
    const canvas = canvasRef.current;
    if (!canvas || box.w < 2 || box.h < 2) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const sx = Math.round(box.x), sy = Math.round(box.y);
    const sw = Math.round(box.w), sh = Math.round(box.h);
    const imageData = ctx.getImageData(sx, sy, sw, sh);
    moveImageDataRef.current = imageData;
    // ✅ Erase with white not transparent
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx, sy, sw, sh);
    saveHistory();
    const off = document.createElement('canvas');
    off.width = sw; off.height = sh;
    off.getContext('2d')!.putImageData(imageData, 0, 0);
    setMoveOverlay({
      x: sx, y: sy, w: sw, h: sh,
      dataURL: off.toDataURL(),
    });
  }, [saveHistory]);

  useEffect(() => {
    if (activeTool !== 'move' && moveOverlayRef.current) {
      stampMoveSelection();
      setSelectionBox(null);
      movePhaseRef.current = 'idle';
    }
  }, [activeTool, stampMoveSelection]);

  // ── DRAWING ──────────────────────────────────────────
  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (
      !isDrawing.current || !canvasRef.current ||
      ['none','text','picker','paint','move','hand']
        .includes(activeTool)
    ) return;

    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    const coords = getCoordinates(e);
    if (!ctx || !coords) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'eraser') {
      // ✅ Always erase to WHITE
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = brushSize * 4;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    } else {
      // Offscreen compositing for opacity
      const off = getOffscreen();
      const offCtx = off?.getContext('2d');
      if (!off || !offCtx) return;
      offCtx.lineCap = 'round';
      offCtx.lineJoin = 'round';
      offCtx.strokeStyle = brushColor;
      offCtx.lineWidth = brushSize;
      offCtx.globalAlpha = 1;
      offCtx.lineTo(coords.x, coords.y);
      offCtx.stroke();
      offCtx.beginPath();
      offCtx.moveTo(coords.x, coords.y);
      if (snapshotRef.current) {
        ctx.putImageData(snapshotRef.current, 0, 0);
      }
      ctx.globalAlpha = brushOpacity;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0);
      ctx.globalAlpha = 1;
    }
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    // Collapse brush panel whenever the user starts any drawing interaction
    setBrushPanelOpen(null);

    if (activeTool === 'shape') {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (ctx && canvas) {
        snapshotRef.current = ctx.getImageData(0, 0, CANVAS_RESOLUTION, CANVAS_RESOLUTION);
        shapeStartRef.current = { x: coords.x, y: coords.y };
        isDrawing.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      return;
    }

    if (activeTool === 'text') {
      if (textTargetRef.current) commitText();
      setTextTarget({ x: coords.x, y: coords.y });
      setTextValue('');
      return;
    }

    if (activeTool === 'hand') {
      panStartRef.current = {
        mouseX: e.clientX, mouseY: e.clientY,
        panX: pan.x, panY: pan.y,
      };
      isDrawing.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (activeTool === 'move') {
      const ov = moveOverlayRef.current;
      if (
        ov &&
        coords.x >= ov.x && coords.x <= ov.x + ov.w &&
        coords.y >= ov.y && coords.y <= ov.y + ov.h
      ) {
        movePhaseRef.current = 'moving';
        moveAnchorRef.current = {
          mouseX: coords.x, mouseY: coords.y,
          boxX: ov.x, boxY: ov.y,
        };
      } else {
        if (ov) stampMoveSelection();
        movePhaseRef.current = 'selecting';
        moveStartRef.current = { x: coords.x, y: coords.y };
        setSelectionBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
        setMoveOverlay(null);
      }
      isDrawing.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    isDrawing.current = true;

    if (activeTool === 'picker') {
      sampleColor(coords.x, coords.y);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (activeTool === 'paint') {
      floodFill(coords.x, coords.y);
      isDrawing.current = false;
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!ctx || !canvas) return;

    if (activeTool === 'brush') {
      snapshotRef.current = ctx.getImageData(0, 0, CANVAS_RESOLUTION, CANVAS_RESOLUTION);
      const off = getOffscreen();
      const offCtx = off?.getContext('2d');
      if (off && offCtx) {
        offCtx.clearRect(0, 0, off.width, off.height);
        offCtx.beginPath();
        offCtx.moveTo(coords.x, coords.y);
      }
    }

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    draw(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const drawShapePreview = useCallback((coords: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    const start = shapeStartRef.current;
    if (!ctx || !canvas || !start || !snapshotRef.current) return;
    ctx.putImageData(snapshotRef.current, 0, 0);
    ctx.save();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.globalAlpha = brushOpacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (shapeType === 'rect') {
      ctx.strokeRect(
        start.x, start.y,
        coords.x - start.x, coords.y - start.y
      );
    } else if (shapeType === 'ellipse') {
      const rx = Math.abs(coords.x - start.x) / 2;
      const ry = Math.abs(coords.y - start.y) / 2;
      const cx = start.x + (coords.x - start.x) / 2;
      const cy = start.y + (coords.y - start.y) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (shapeType === 'line') {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }, [brushColor, brushSize, brushOpacity, shapeType]);

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (activeTool === 'picker') {
      setActiveTool('brush');
      return;
    }
    if (activeTool === 'hand') {
      panStartRef.current = null;
      return;
    }
    if (activeTool === 'move') {
      if (movePhaseRef.current === 'selecting') {
        const box = selectionBox;
        if (box && box.w > 2 && box.h > 2) captureSelection(box);
        setSelectionBox(null);
      }
      movePhaseRef.current = 'idle';
      return;
    }

    if (activeTool === 'shape') {
      const coords = getCoordinates(e);
      if (coords) drawShapePreview(coords);
      shapeStartRef.current = null;
      snapshotRef.current = null;
      saveHistory();
      return;
    }

    const ctx = canvasRef.current?.getContext('2d', { willReadFrequently: true });
    if (ctx) ctx.beginPath();
    snapshotRef.current = null;
    saveHistory();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (
      cursorRef.current &&
      activeTool !== 'none' &&
      containerRef.current &&
      canvasRef.current
    ) {
      const rect = containerRef.current.getBoundingClientRect();
      const parentScale = rect.width / containerRef.current.offsetWidth;
      const x = (e.clientX - rect.left) / parentScale;
      const y = (e.clientY - rect.top) / parentScale;
      cursorRef.current.style.transform =
        `translate(${x}px, ${y}px) translate(-50%, -50%)`;

      // Dynamically update cursor size to perfectly match the canvas stroke visual size
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const canvasLineWidth = activeTool === 'eraser' ? brushSize * 4 : brushSize;
      const visualCursorSize = canvasLineWidth * (canvasRect.width / CANVAS_RESOLUTION);
      cursorRef.current.style.width = `${visualCursorSize}px`;
      cursorRef.current.style.height = `${visualCursorSize}px`;
    }

    if (isDrawing.current && activeTool === 'hand' && panStartRef.current) {
      bumpGesture();
      setPan({
        x: panStartRef.current.panX + e.clientX - panStartRef.current.mouseX,
        y: panStartRef.current.panY + e.clientY - panStartRef.current.mouseY,
      });
      return;
    }

    if (isDrawing.current && activeTool === 'picker') {
      const coords = getCoordinates(e);
      if (coords) sampleColor(coords.x, coords.y);
      return;
    }

    if (isDrawing.current && activeTool === 'move') {
      const coords = getCoordinates(e);
      if (!coords) return;
      if (
        movePhaseRef.current === 'selecting' &&
        moveStartRef.current
      ) {
        const sx = Math.min(coords.x, moveStartRef.current.x);
        const sy = Math.min(coords.y, moveStartRef.current.y);
        setSelectionBox({
          x: sx, y: sy,
          w: Math.abs(coords.x - moveStartRef.current.x),
          h: Math.abs(coords.y - moveStartRef.current.y),
        });
      } else if (
        movePhaseRef.current === 'moving' &&
        moveAnchorRef.current
      ) {
        const dx = coords.x - moveAnchorRef.current.mouseX;
        const dy = coords.y - moveAnchorRef.current.mouseY;
        setMoveOverlay((prev) =>
          prev
            ? {
                ...prev,
                x: moveAnchorRef.current!.boxX + dx,
                y: moveAnchorRef.current!.boxY + dy,
              }
            : prev
        );
      }
      return;
    }

    if (isDrawing.current && activeTool === 'shape') {
      const coords = getCoordinates(e);
      if (coords) drawShapePreview(coords);
      return;
    }

    draw(e);
  };

  // ── TEXT TEXTAREA RESIZE ─────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = '0px';
    ta.style.width = '0px';
    ta.style.width = `${Math.max(20, ta.scrollWidth)}px`;
    ta.style.height = `${ta.scrollHeight}px`;
  }, [textValue]);

  // ── DYNAMIC CURSOR RESIZE ────────────────────────────
  useEffect(() => {
    if (cursorRef.current && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const canvasLineWidth = activeTool === 'eraser' ? brushSize * 4 : brushSize;
      const visualCursorSize = canvasLineWidth * (canvasRect.width / CANVAS_RESOLUTION);
      cursorRef.current.style.width = `${visualCursorSize}px`;
      cursorRef.current.style.height = `${visualCursorSize}px`;
    }
  }, [brushSize, activeTool, zoom]);

  // ── RENDER ───────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative h-full min-w-0 flex-1 rounded-[24px] border border-white/[0.08] touch-none shadow-[var(--picaro-elev-2)]"
      style={{
        background: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.04), rgba(10,10,10,0.98) 58%)',
        overflow: 'clip',
      }}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Transform layer */}
      <div
        className={`picaro-canvas-stage absolute left-0 top-0 w-full h-full ${
          !gestureActive ? 'picaro-canvas-stage--smooth' : ''
        }`}
        style={{
          transformOrigin: '0 0',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* White canvas background */}
        <div
          className="absolute inset-0 w-full h-full touch-none pointer-events-none"
          style={{
            background: '#ffffff',
            boxShadow:
              '0 0 0 1px rgba(255,255,255,0.08), 0 24px 80px rgba(0,0,0,0.48)',
          }}
        />

        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full touch-none ${
            activeTool === 'text'
              ? 'cursor-text'
              : activeTool === 'picker' || activeTool === 'paint'
              ? 'cursor-crosshair'
              : activeTool === 'move'
              ? 'cursor-default'
              : activeTool === 'hand'
              ? 'cursor-grab active:cursor-grabbing'
              : 'cursor-none'
          }`}
          onPointerDown={startDrawing}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerOut={(e) => {
            setIsHovering(false);
            stopDrawing(e);
          }}
          onPointerEnter={() => setIsHovering(true)}
        />

        {/* Text overlay */}
        {textTarget && (
          <textarea
            ref={textareaRef}
            autoFocus
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commitText();
              } else if (e.key === 'Escape') {
                setTextTarget(null);
                setTextValue('');
              }
            }}
            onBlur={commitText}
            rows={1}
            className="absolute pointer-events-auto z-50"
            style={{
              left: textTarget.x,
              top: textTarget.y,
              color: brushColor,
              fontSize: `${textFontSize}px`,
              fontFamily: 'Inter, sans-serif',
              lineHeight: '1.25',
              opacity: brushOpacity,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: 0,
              margin: 0,
              resize: 'none',
              overflow: 'hidden',
              minWidth: '2ch',
              width: 'auto',
              caretColor: brushColor,
              boxShadow: '0 0 0 1px rgba(128,128,128,0.4)',
              borderRadius: '2px',
              whiteSpace: 'pre',
            }}
          />
        )}

        {/* Selection box */}
        {activeTool === 'move' &&
          selectionBox &&
          selectionBox.w > 0 && (
            <div
              className="absolute pointer-events-none z-40"
              style={{
                left: selectionBox.x,
                top: selectionBox.y,
                width: selectionBox.w,
                height: selectionBox.h,
                border: '2px dashed rgba(255,255,255,0.85)',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
              }}
            />
          )}

        {/* Move overlay */}
        {moveOverlay && (
          <img
            src={moveOverlay.dataURL}
            alt=""
            draggable={false}
            className="absolute pointer-events-none z-40"
            style={{
              left: moveOverlay.x,
              top: moveOverlay.y,
              width: moveOverlay.w,
              height: moveOverlay.h,
              outline: '2px dashed rgba(255,255,255,0.75)',
              outlineOffset: '1px',
            }}
          />
        )}
      </div>

      {/* Custom cursor */}
      <div
        ref={cursorRef}
        className="absolute top-0 left-0 rounded-full pointer-events-none z-50 border-[1.5px] border-white mix-blend-difference"
        style={{
          opacity:
            isHovering &&
            !['none','text','picker','paint','move','hand']
              .includes(activeTool)
              ? 1
              : 0,
        }}
      />

      {/* Zoom HUD — bottom-right to avoid overlap with BrushControls */}
      <div className="absolute bottom-3 right-3 z-[100] flex items-center gap-2">
        <div
          className="picaro-zoom-hud pointer-events-none"
          aria-live="polite"
        >
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
              bumpGesture();
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* BrushControls — bottom-left (label is inline in collapsed state) */}
      <BrushControls openPanel={brushPanelOpen} setOpenPanel={setBrushPanelOpen} />

      {/* INPUT SKETCH label — top-left */}
      <div className="absolute top-4 left-5 z-[100] pointer-events-none mix-blend-difference">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-white/60">
          Input Sketch
        </span>
      </div>

      {/* Canvas border */}
      <div className="absolute inset-0 pointer-events-none rounded-[24px] border border-white/[0.06] z-50" />
    </div>
  );
};




