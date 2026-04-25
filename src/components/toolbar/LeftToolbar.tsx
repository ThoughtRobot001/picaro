import React, { useState, useRef, useEffect } from 'react';
import {
  Brush,
  Eraser,
  Type,
  PaintBucket,
  Move,
  Hand,
  Shapes,
  Square,
  Circle,
  Minus,
  Layers,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import { useStore } from '../../store/useStore';

/* ─── Brush Settings Popover ─── */
const BrushSettingsPopover: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { brushSize, setBrushSize, brushOpacity, setBrushOpacity } = useStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-[56px] top-0 w-48 z-[200] flex flex-col gap-4 rounded-[12px] border border-white/[0.08] bg-[#0f0f11] p-3 shadow-2xl"
    >
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Size</label>
        <input
          type="range"
          min={1}
          max={50}
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
          className="w-full accent-teal-500"
        />
        <div className="text-[11px] text-white/80 font-mono text-right">{brushSize}px</div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">Opacity</label>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={brushOpacity}
          onChange={(e) => setBrushOpacity(parseFloat(e.target.value))}
          className="w-full accent-teal-500"
        />
        <div className="text-[11px] text-white/80 font-mono text-right">{Math.round(brushOpacity * 100)}%</div>
      </div>
    </div>
  );
};

/* ─── Shape sub-picker popover ─── */
const ShapeSubPicker: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { shapeType, setShapeType, setActiveTool } = useStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const shapes: { id: 'rect' | 'ellipse' | 'line'; label: string; icon: React.ReactNode }[] = [
    { id: 'rect',    label: 'Rectangle', icon: <Square size={15} strokeWidth={1.8} /> },
    { id: 'ellipse', label: 'Ellipse',   icon: <Circle size={15} strokeWidth={1.8} /> },
    { id: 'line',    label: 'Line',      icon: <Minus  size={15} strokeWidth={2.5} /> },
  ];

  return (
    <div
      ref={ref}
      className="absolute left-[56px] top-0 z-[200] flex flex-col gap-1 rounded-[12px] border border-white/[0.08] bg-[#0f0f11] p-1.5 shadow-2xl"
    >
      {shapes.map(({ id, label, icon }) => (
        <button
          key={id}
          type="button"
          title={label}
          onClick={() => {
            setShapeType(id);
            setActiveTool('shape');
            onClose();
          }}
          className={`flex items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[11px] font-medium transition-colors whitespace-nowrap
            ${shapeType === id
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
            }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
};

/* ─── Full-height Left Sidebar with drawing tools ─── */
export const LeftToolbar: React.FC = () => {
  const {
    activeTool,
    setActiveTool,
    shapeType,
    brushColor,
    setBrushColor,
  } = useStore();

  const [shapePickerOpen, setShapePickerOpen] = useState(false);
  const [brushSettingsOpen, setBrushSettingsOpen] = useState(false);

  const toolBtn = (
    id: 'brush' | 'eraser' | 'text' | 'paint' | 'move' | 'hand',
    title: string,
    node: React.ReactNode
  ) => {
    const active = activeTool === id;
    return (
      <button
        key={id}
        type="button"
        title={title}
        aria-pressed={active}
        onClick={() => setActiveTool(id)}
        className={`picaro-tool-hit picaro-focus shrink-0 border-0 cursor-pointer ${
          active ? 'picaro-tool-hit--active' : 'picaro-tool-hit--inactive'
        }`}
      >
        {node}
      </button>
    );
  };

  const shapeIcon =
    shapeType === 'ellipse' ? <Circle size={18} strokeWidth={2} />
    : shapeType === 'line'  ? <Minus  size={18} strokeWidth={2.5} />
    :                          <Square size={18} strokeWidth={2} />;

  return (
    <div
      className="flex shrink-0 flex-col items-center bg-[#0a0a0c]"
      style={{
        width: 52,
        alignSelf: 'stretch',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.03)',
        position: 'relative',
      }}
    >
      {/* ── Tool buttons ── */}
      <div className="flex flex-col items-center gap-1 pt-3 relative">
        <div className="relative">
          <button
            type="button"
            title="Brush Settings"
            aria-pressed={activeTool === 'brush'}
            onClick={() => setActiveTool('brush')}
            onContextMenu={(e) => { e.preventDefault(); setBrushSettingsOpen((o) => !o); }}
            className={`picaro-tool-hit picaro-focus shrink-0 border-0 cursor-pointer ${
              activeTool === 'brush' ? 'picaro-tool-hit--active' : 'picaro-tool-hit--inactive'
            }`}
          >
            <Brush size={18} strokeWidth={2} />
          </button>
          <button 
            type="button"
            onClick={() => setBrushSettingsOpen((o) => !o)}
            className="absolute -right-2 -bottom-1 p-0.5 rounded-full bg-[#1c1c1f] text-white/50 hover:text-white transition-colors"
          >
            <SlidersHorizontal size={10} />
          </button>
          {brushSettingsOpen && (
            <BrushSettingsPopover onClose={() => setBrushSettingsOpen(false)} />
          )}
        </div>
        {toolBtn('eraser', 'Eraser',         <Eraser      size={18} strokeWidth={2} />)}
        {toolBtn('text',   'Text',           <Type        size={18} strokeWidth={2} />)}
        {toolBtn('paint',  'Paint bucket',   <PaintBucket size={18} strokeWidth={2} />)}
        {toolBtn('move',   'Move selection', <Move        size={18} strokeWidth={2} />)}
        {toolBtn('hand',   'Pan',            <Hand        size={18} strokeWidth={2} />)}

        {/* Shape tool with sub-picker */}
        <div className="relative">
          <button
            type="button"
            title="Shapes"
            aria-pressed={activeTool === 'shape'}
            onClick={() => {
              if (activeTool === 'shape') {
                setShapePickerOpen((o) => !o);
              } else {
                setActiveTool('shape');
                setShapePickerOpen(false);
              }
            }}
            onContextMenu={(e) => { e.preventDefault(); setShapePickerOpen((o) => !o); }}
            className={`picaro-tool-hit picaro-focus shrink-0 border-0 cursor-pointer relative ${
              activeTool === 'shape' ? 'picaro-tool-hit--active' : 'picaro-tool-hit--inactive'
            }`}
          >
            {shapeIcon}
            {/* tiny indicator dot */}
            <span className="absolute bottom-[5px] right-[5px] w-1 h-1 rounded-full bg-white/30" />
          </button>
          {shapePickerOpen && (
            <ShapeSubPicker onClose={() => setShapePickerOpen(false)} />
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="w-7 h-px bg-white/[0.07] my-2" />

      {/* ── Color swatch — right below tools ── */}
      <div className="flex flex-col items-center pb-1">
        <div className="picaro-swatch-hit flex items-center justify-center p-1 rounded-lg">
          <div
            className="relative rounded-full shrink-0 size-[26px] overflow-hidden shadow-[0_0_8px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: brushColor }}
          >
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="absolute inset-[-20px] w-[80px] h-[80px] cursor-pointer opacity-0"
            />
            <div
              aria-hidden
              className="absolute border-white/50 border-[1.5px] border-solid inset-0 pointer-events-none rounded-full"
            />
          </div>
        </div>
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Separator ── */}
      <div className="w-7 h-px bg-white/[0.07] mb-2" />

      {/* ── Layers + Settings (bottom reserved zone) ── */}
      <div className="flex flex-col items-center gap-1 pb-3">
        <button
          type="button"
          title="Layers"
          className="picaro-tool-hit picaro-focus shrink-0 border-0 picaro-tool-hit--inactive"
        >
          <Layers size={18} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          title="Settings"
          className="picaro-tool-hit picaro-focus shrink-0 border-0 picaro-tool-hit--inactive"
        >
          <Settings size={16} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
};
