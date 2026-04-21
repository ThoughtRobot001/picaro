import React, { useState, createContext, useContext, useRef, useEffect, useCallback } from "react";
import { Mic, Scissors, ChevronDown, Image as ImageIcon, Sparkles, Brush, Eraser, Undo2, Redo2, Type, PaintBucket, Move, Hand, User, Layers, Loader2, Check, Plus, Home, Camera, Box, Smile, Palette, Pencil, Grid, Pen, Droplet } from "lucide-react";
import svgPaths from "./svg-ghrfpaixvr";
import imgImage5 from "figma:asset/119f87d170d717338767de92839f45e04991d8d0.png";
import { imgGridLines } from "./svg-rl35s";
import { generateFromSketch } from "../services/aiGenerate";

export const PicaroUiContext = createContext({
  isGenerating: false,
  setIsGenerating: (_v: boolean) => {},
  showToast: (_msg: string) => {},
});

export const EditorContext = createContext({
  activeTool: "brush",
  setActiveTool: (tool: string) => { },
  brushSize: 4,
  setBrushSize: (size: number) => { },
  brushOpacity: 1,
  setBrushOpacity: (opacity: number) => { },
  brushColor: "#000000",
  setBrushColor: (color: string) => { },
  canUndo: false,
  setCanUndo: (v: boolean) => { },
  canRedo: false,
  setCanRedo: (v: boolean) => { },
  undoCounter: 0,
  redoCounter: 0,
  triggerUndo: () => { },
  triggerRedo: () => { },
});

function HoriLines() {
  return (
    <div className="h-[1775.062px] relative w-[1533.008px]" data-name="hori lines">
      <div className="absolute inset-[0_-2.06%_0_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1564.53 1775.06">
          <g id="hori lines">
            <line id="Line 1" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="30.8875" x2="30.8874" y1="1.35014e-06" y2="1511.58" />
            <line id="Line 9" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="676.364" x2="676.364" y1="2.95648e-05" y2="1511.58" />
            <line id="Line 5" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="353.626" x2="353.626" y1="1.54575e-05" y2="1511.58" />
            <line id="Line 10" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="999.102" x2="999.102" y1="4.36721e-05" y2="1511.58" />
            <line id="Line 17" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="1321.84" x2="1321.84" y1="5.77796e-05" y2="1511.58" />
            <line id="Line 3" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="192.255" x2="192.255" y1="8.40375e-06" y2="1511.58" />
            <line id="Line 11" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="837.734" x2="837.734" y1="3.66185e-05" y2="1511.58" />
            <line id="Line 6" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="514.996" x2="514.996" y1="2.25112e-05" y2="1511.58" />
            <line id="Line 12" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="1160.47" x2="1160.47" y1="5.07258e-05" y2="1511.58" />
            <line id="Line 18" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="1483.21" x2="1483.21" y1="6.48332e-05" y2="1511.58" />
            <line id="Line 2" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="111.573" x2="111.573" y1="4.877e-06" y2="1511.58" />
            <line id="Line 13" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="757.049" x2="757.049" y1="3.30917e-05" y2="1511.58" />
            <line id="Line 7" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="434.311" x2="434.311" y1="1.89843e-05" y2="1511.58" />
            <line id="Line 14" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="1079.79" x2="1079.79" y1="4.7199e-05" y2="1511.58" />
            <line id="Line 19" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="1402.53" x2="1402.53" y1="6.13063e-05" y2="1511.58" />
            <line id="Line 4" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="272.941" x2="272.94" y1="1.19306e-05" y2="1511.58" />
            <line id="Line 15" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="918.419" x2="918.419" y1="4.01454e-05" y2="1511.58" />
            <line id="Line 8" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="595.679" x2="595.679" y1="2.60379e-05" y2="1511.58" />
            <line id="Line 16" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="1241.16" x2="1241.16" y1="5.42527e-05" y2="1511.58" />
            <line id="Line 20" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="1563.9" x2="1563.9" y1="6.836e-05" y2="1511.58" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function VertiLines() {
  return (
    <div className="absolute h-[1167.406px] left-[46.64px] top-[182.8px] w-[1533.008px]" data-name="verti lines">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1534.27 1167.41">
        <g id="verti lines">
          <line id="Line 1" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="0.6304" x2="0.630349" y1="0.000174668" y2="1167.41" />
          <line id="Line 9" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="646.111" x2="646.111" y1="0.000179725" y2="1167.41" />
          <line id="Line 5" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="323.371" x2="323.371" y1="2.75534e-08" y2="1167.41" />
          <line id="Line 10" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="968.847" x2="968.847" y1="0.000179725" y2="1167.41" />
          <line id="Line 17" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="1291.59" x2="1291.59" y1="0.000179725" y2="1167.41" />
          <line id="Line 3" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="162.001" x2="162.001" y1="0.000179725" y2="1167.41" />
          <line id="Line 11" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="807.477" x2="807.477" y1="0.000179725" y2="1167.41" />
          <line id="Line 6" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="484.741" x2="484.741" y1="0.000179725" y2="1167.41" />
          <line id="Line 12" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="1130.22" x2="1130.22" y1="2.75534e-08" y2="1167.41" />
          <line id="Line 18" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="1452.96" x2="1452.96" y1="0.000179725" y2="1167.41" />
          <line id="Line 2" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="81.3177" x2="81.3176" y1="0.000179725" y2="1167.41" />
          <line id="Line 13" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="726.794" x2="726.794" y1="2.75534e-08" y2="1167.41" />
          <line id="Line 7" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="404.054" x2="404.054" y1="0.000179725" y2="1167.41" />
          <line id="Line 14" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="1049.53" x2="1049.53" y1="0.000179725" y2="1167.41" />
          <line id="Line 19" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="1372.27" x2="1372.27" y1="0.000179725" y2="1167.41" />
          <line id="Line 4" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="242.688" x2="242.688" y1="0.000179725" y2="1167.41" />
          <line id="Line 15" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="888.164" x2="888.164" y1="0.000179725" y2="1167.41" />
          <line id="Line 8" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="565.424" x2="565.424" y1="0.000179725" y2="1167.41" />
          <line id="Line 16" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="1210.9" x2="1210.9" y1="0.000179725" y2="1167.41" />
          <line id="Line 20" stroke="var(--stroke-0, #808080)" strokeWidth="1.2607" x1="1533.64" x2="1533.64" y1="2.75534e-08" y2="1167.41" />
        </g>
      </svg>
    </div>
  );
}

function GridLines() {
  return (
    <div className="absolute h-[1533.008px] left-[-168px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[74.379px_247.096px] mask-size-[1270.783px_998.473px] opacity-[0.09] top-[-255px] w-[1775.062px]" data-name="grid lines" style={{ maskImage: `url('${imgGridLines}')` }}>
      <div className="absolute flex h-[1533.008px] items-center justify-center left-0 top-0 w-[1775.062px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "22" } as React.CSSProperties}>
        <div className="-rotate-90 flex-none">
          <HoriLines />
        </div>
      </div>
      <VertiLines />
    </div>
  );
}

function Top() {
  return (
    <div className="absolute h-[171.913px] left-[888.22px] top-0 w-[160.452px]" data-name="top">
      <div className="absolute bg-[#1b1b1b] left-[80.23px] size-[80.226px] top-[91.69px]" />
      <div className="absolute bg-[#1b1b1b] h-[79.506px] left-[-0.88px] top-[11px] w-[80.226px]" />
      <div className="absolute bg-[#1b1b1b] bottom-[0.63px] h-[80.029px] left-[-0.88px] w-[80.226px]" />
    </div>
  );
}

function TopLeft() {
  return (
    <div className="absolute h-[171.913px] left-[74.5px] top-[84.81px] w-[160.452px]" data-name="top left">
      <div className="absolute bg-[#0a0a0a] h-[82.518px] left-[87.1px] top-[85.96px] w-[81.372px]" />
      <div className="absolute bg-[#0a0a0a] h-[80.226px] left-[5.73px] top-[5.73px] w-[81.372px]" />
      <div className="absolute bg-[#0a0a0a] h-[80.226px] left-[-74.5px] top-[6.88px] w-[81.372px]" />
      <div className="absolute bg-[#0a0a0a] h-[82.518px] left-[5.73px] top-[85.96px] w-[81.372px]" />
      <div className="absolute bg-[#121212] h-[80.226px] left-[328.93px] top-[-74.5px] w-[81.372px]" />
      <div className="absolute bg-[#0a0a0a] h-[81.372px] left-[87.1px] top-[247.56px] w-[80.226px]" />
      <div className="absolute bg-[#1b1b1b] left-[1055.55px] size-[80.226px] top-[652.12px]" />
      <div className="absolute bg-[#1b1b1b] left-[1135.77px] size-[80.226px] top-[732.35px]" />
    </div>
  );
}

function GridBlocks() {
  return (
    <div className="absolute h-[978.76px] left-[-120.67px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[27.045px_46.302px] mask-size-[1270.783px_998.473px] opacity-50 top-[-54.21px] w-[1290.496px]" data-name="grid blocks" style={{ maskImage: `url('${imgGridLines}')` }}>
      <div className="absolute bg-[rgba(51,51,51,0.5)] left-[806.85px] size-[80.226px] top-[817.16px]" />
      <div className="absolute bg-[#0a0a0a] left-[403.42px] size-[80.226px] top-[817.16px]" />
      <div className="absolute bg-[#121212] h-[79.08px] left-[1130.04px] top-[253.29px] w-[80.226px]" />
      <div className="absolute bg-[#1b1b1b] h-[79.08px] left-[483.65px] top-[495.06px] w-[80.226px]" />
      <div className="absolute bg-[#121212] h-[79.08px] left-[1048.67px] top-[333.51px] w-[80.226px]" />
      <div className="absolute bg-[#1b1b1b] h-[79.08px] left-[403.28px] top-[253.29px] w-[80.226px]" />
      <div className="absolute bg-[#121212] h-[79.08px] left-[1048.67px] top-[253.29px] w-[80.226px]" />
      <div className="absolute bg-[#1b1b1b] h-[79.08px] left-[403.28px] top-[495.06px] w-[80.226px]" />
      <div className="absolute bg-[#0a0a0a] left-[323.2px] size-[80.226px] top-[817.16px]" />
      <div className="absolute bg-[#0a0a0a] h-[81.372px] left-[323.2px] top-[897.39px] w-[80.226px]" />
      <div className="absolute bg-[#0a0a0a] left-[161.6px] size-[80.226px] top-[736.94px]" />
      <Top />
      <TopLeft />
    </div>
  );
}

function GridLayersV() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.18]" data-name="Grid layers - v1">
      <GridLines />
      <GridBlocks />
    </div>
  );
}

function EpBack() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="ep:back">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="ep:back">
          <path d={svgPaths.p3c7d5780} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p1e116c00} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex items-center justify-center p-[8px] relative shrink-0 size-[40px]">
      <EpBack />
    </div>
  );
}

function TopBarTools() {
  const { activeTool, setActiveTool, canUndo, canRedo, triggerUndo, triggerRedo } = useContext(EditorContext);
  const toolBtn = (id: string, title: string | undefined, node: React.ReactNode) => {
    const active = activeTool === id;
    return (
      <button
        type="button"
        title={title}
        aria-pressed={active}
        onClick={() => setActiveTool(id)}
        className={`picaro-tool-hit picaro-focus shrink-0 border-0 cursor-pointer ${active ? "picaro-tool-hit--active" : "picaro-tool-hit--inactive"}`}
      >
        {node}
      </button>
    );
  };
  return (
    <div className="relative flex shrink-0 items-center justify-start gap-1.5">
      {toolBtn("brush", "Brush", <Brush size={18} strokeWidth={2} />)}
      {toolBtn("eraser", "Eraser", <Eraser size={18} strokeWidth={2} />)}
      {toolBtn("text", "Text", <Type size={18} strokeWidth={2} />)}
      {toolBtn("paint", "Paint bucket", <PaintBucket size={18} strokeWidth={2} />)}
      {toolBtn("move", "Move selection", <Move size={18} strokeWidth={2} />)}
      {toolBtn("hand", "Pan (hand)", <Hand size={18} strokeWidth={2} />)}
      <div className="w-px h-[18px] bg-white/[0.12] mx-2 shrink-0" aria-hidden />

      <button
        type="button"
        title="Undo"
        disabled={!canUndo}
        onClick={() => canUndo && triggerUndo()}
        className={`picaro-tool-hit picaro-focus shrink-0 border-0 rounded-lg ${canUndo ? "picaro-tool-hit--inactive text-white" : "cursor-default text-[#525252] opacity-50"}`}
      >
        <Undo2 size={18} strokeWidth={2} />
      </button>

      <button
        type="button"
        title="Redo"
        disabled={!canRedo}
        onClick={() => canRedo && triggerRedo()}
        className={`picaro-tool-hit picaro-focus shrink-0 border-0 rounded-lg ${canRedo ? "picaro-tool-hit--inactive text-white" : "cursor-default text-[#525252] opacity-50"}`}
      >
        <Redo2 size={18} strokeWidth={2} />
      </button>

      <div className="w-px h-[18px] bg-white/[0.12] mx-2 shrink-0" aria-hidden />
      <div className="picaro-swatch-hit flex items-center justify-center p-1 rounded-lg">
        <Frame19 />
      </div>
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <Frame7 />
    </div>
  );
}

function DotsThreeOutline() {
  return (
    <div className="relative shrink-0 size-[18.667px]" data-name="DotsThreeOutline">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.6667 18.6667">
        <g id="DotsThreeOutline">
          <path d={svgPaths.p25e6eec0} fill="var(--fill-0, #4D4D4D)" id="Vector" opacity="0.2" />
          <path d={svgPaths.p2c85ee80} fill="var(--fill-0, #4D4D4D)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex items-center justify-center p-[10.667px] relative shrink-0">
      <DotsThreeOutline />
    </div>
  );
}

function ListBullets() {
  return (
    <div className="relative shrink-0 size-[18.667px]" data-name="ListBullets">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.6667 18.6667">
        <g id="ListBullets">
          <path d={svgPaths.p86694d0} fill="var(--fill-0, #4D4D4D)" id="Vector" opacity="0.2" />
          <path d={svgPaths.p164028f0} fill="var(--fill-0, #4D4D4D)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex items-center justify-center p-[10.667px] relative shrink-0">
      <ListBullets />
    </div>
  );
}

function FolderSimple() {
  return (
    <div className="relative shrink-0 size-[18.667px]" data-name="FolderSimple">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.6667 18.6667">
        <g id="FolderSimple">
          <path d={svgPaths.p1a0a9e80} fill="var(--fill-0, #4D4D4D)" id="Vector" opacity="0.2" />
          <path d={svgPaths.p2dc68400} fill="var(--fill-0, #4D4D4D)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex items-center justify-center p-[10.667px] relative shrink-0">
      <FolderSimple />
    </div>
  );
}

function CardsThree() {
  return (
    <div className="relative shrink-0 size-[18.667px]" data-name="CardsThree">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.6667 18.6667">
        <g id="CardsThree">
          <path d={svgPaths.p222e7000} fill="var(--fill-0, #4D4D4D)" id="Vector" opacity="0.2" />
          <path d={svgPaths.p2b294300} fill="var(--fill-0, #4D4D4D)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex items-center justify-center p-[10.667px] relative shrink-0">
      <CardsThree />
    </div>
  );
}

function FolderSimplePlus() {
  return (
    <div className="relative shrink-0 size-[18.667px]" data-name="FolderSimplePlus">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.6667 18.6667">
        <g id="FolderSimplePlus">
          <path d={svgPaths.p1a0a9e80} fill="var(--fill-0, #4D4D4D)" id="Vector" opacity="0.2" />
          <path d={svgPaths.p321f8800} fill="var(--fill-0, #4D4D4D)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex items-center justify-center p-[10.667px] relative shrink-0">
      <FolderSimplePlus />
    </div>
  );
}

function PlusCircle() {
  return (
    <div className="relative shrink-0 size-[18.667px]" data-name="PlusCircle">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.6667 18.6667">
        <g id="PlusCircle">
          <path d={svgPaths.p89049c0} fill="var(--fill-0, #4D4D4D)" id="Vector" opacity="0.2" />
          <path d={svgPaths.p2bd41000} fill="var(--fill-0, #4D4D4D)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex items-center justify-center p-[10.667px] relative shrink-0">
      <PlusCircle />
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex items-center p-2 relative shrink-0 gap-1.5">
      <Frame2 />
      <Frame3 />
      <Frame9 />
      <Frame5 />
      <Frame10 />
      <Frame11 />
    </div>
  );
}

function Frame47() {
  const [title, setTitle] = useState("Untitled Art");
  const [isEditing, setIsEditing] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      setIsEditing(false);
    }
  };

  return (
    <div className="flex w-full shrink-0 flex-col gap-2 relative">
      <div className="mb-1 grid min-h-11 w-full shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-x-2 gap-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <Frame6 />
          <div className="min-h-10 min-w-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:thin]">
            <div className="flex w-max items-center pr-1">
              <TopBarTools />
            </div>
          </div>
        </div>
        <div 
          className="flex items-center justify-center gap-1.5 cursor-pointer max-w-[min(40vw,240px)] px-2 py-1 text-center hover:bg-white/[0.04] rounded transition-colors"
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
              className="w-full min-w-[20px] max-w-full bg-transparent outline-none text-center font-['Inter',sans-serif] text-[13px] font-medium leading-4 text-[#e5e5e5] border-b border-white/[0.2]"
            />
          ) : (
            <>
              <p className="truncate font-['Inter',sans-serif] text-[13px] font-medium leading-4 text-[#a3a3a3]">
                {title || "Untitled Art"}
              </p>
              <Pencil size={12} className="text-[#a3a3a3] shrink-0" aria-hidden />
            </>
          )}
        </div>
        <div className="flex justify-end">
          <Frame8 />
        </div>
      </div>
    </div>
  );
}

function Frame45() {
  return (
    <button
      type="button"
      title="Home"
      className="picaro-focus flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-[#111] text-[#a3a3a3] transition-[background-color,color,border-color] duration-150 ease-out hover:border-white/[0.14] hover:bg-[#161616] hover:text-[#e5e5e5] active:scale-[0.98]"
    >
      <Home size={18} strokeWidth={2} aria-hidden />
    </button>
  );
}

function Frame49() {
  return (
    <div className="h-12 relative rounded-lg shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-2 py-2 relative size-full justify-center">
          <Frame45 />
        </div>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[9.37%_9.37%_12.5%_3.13%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.9245 14.2188">
        <g id="Group">
          <path d={svgPaths.pc8a4500} fill="var(--fill-0, white)" id="Vector" opacity="0.2" />
          <path d={svgPaths.p36030dc0} fill="var(--fill-0, white)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function PhPaintBrushDuotone() {
  return (
    <div className="overflow-clip relative shrink-0 size-[18.2px]" data-name="ph:paint-brush-duotone">
      <Group />
    </div>
  );
}

function Frame4() {
  return (
    <div className="bg-black content-stretch flex items-center justify-center p-[10.4px] relative rounded-[5.2px] shrink-0">
      <PhPaintBrushDuotone />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[12.49%_9.36%_12.5%_9.37%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.7916 13.6521">
        <g id="Group">
          <path d={svgPaths.pe519500} fill="var(--fill-0, #4D4D4D)" id="Vector" opacity="0.2" />
          <path d={svgPaths.p955d780} fill="var(--fill-0, #4D4D4D)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function PhEraserDuotone() {
  return (
    <div className="overflow-clip relative shrink-0 size-[18.2px]" data-name="ph:eraser-duotone">
      <Group1 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex items-center justify-center p-[10.4px] relative shrink-0">
      <PhEraserDuotone />
    </div>
  );
}

function Frame15() {
  return (
    <div className="relative shrink-0 size-[39px]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 39 39">
        <g id="Frame 1171281205">
          <line id="Line 88" stroke="var(--stroke-0, #4D4D4D)" strokeWidth="0.65" x2="39" y1="19.1749" y2="19.1749" />
        </g>
      </svg>
    </div>
  );
}

function ShareFat() {
  return (
    <div className="relative size-[18.2px]" data-name="ShareFat">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.2 18.2">
        <g id="ShareFat">
          <path d={svgPaths.p387a9c80} fill="var(--fill-0, #8F8F8F)" id="Vector" opacity="0.2" />
          <path d={svgPaths.p36876400} fill="var(--fill-0, #8F8F8F)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex items-center justify-center p-[10.4px] relative shrink-0">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="-scale-y-100 flex-none rotate-180">
          <ShareFat />
        </div>
      </div>
    </div>
  );
}

function ShareFat1() {
  return (
    <div className="relative size-[18.2px]" data-name="ShareFat">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.2 18.2">
        <g id="ShareFat">
          <path d={svgPaths.p258b9100} fill="var(--fill-0, #4D4D4D)" id="Vector" opacity="0.2" />
          <path d={svgPaths.p36876400} fill="var(--fill-0, #4D4D4D)" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex items-center justify-center p-[10.4px] relative">
      <div className="flex items-center justify-center relative shrink-0">
        <div className="-scale-y-100 flex-none rotate-180">
          <ShareFat1 />
        </div>
      </div>
    </div>
  );
}

function Frame18() {
  return (
    <div className="relative shrink-0 size-[39px]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 39 39">
        <g id="Frame 1171281205">
          <line id="Line 88" stroke="var(--stroke-0, #4D4D4D)" strokeWidth="0.65" x2="39" y1="19.1749" y2="19.1749" />
        </g>
      </svg>
    </div>
  );
}

function Frame19() {
  const { brushColor, setBrushColor } = useContext(EditorContext);
  return (
    <div className="relative rounded-[130px] shrink-0 size-[26px] overflow-hidden shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: brushColor }}>
      <input
        type="color"
        value={brushColor}
        onChange={e => setBrushColor(e.target.value)}
        className="absolute inset-[-20px] w-[80px] h-[80px] cursor-pointer opacity-0"
      />
      <div aria-hidden="true" className="absolute border-white/50 border-[1.5px] border-solid inset-0 pointer-events-none rounded-[130.65px]" />
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center p-[15.6px] relative shrink-0 gap-1 w-full">
      <div className="picaro-swatch-hit flex items-center justify-center p-1 rounded-lg">
        <Frame19 />
      </div>
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex items-center justify-center overflow-clip relative rounded-[7.8px] shrink-0 w-full">
      <Frame12 />
    </div>
  );
}

function ThicknessSlider() {
  const { brushSize, setBrushSize } = useContext(EditorContext);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const setFromClientY = (clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const t = rect.height > 0 ? 1 - y / rect.height : 0;
    setBrushSize(Math.max(1, Math.min(50, Math.round(1 + t * 49))));
  };

  const fillPct = ((brushSize - 1) / 49) * 100;
  const thumbBottom = `clamp(0px, calc(${fillPct}% - 8px), calc(100% - 16px))`;

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {/* Value badge */}
      <div className="picaro-slider-badge" aria-live="polite">
        <span className="picaro-slider-badge__value">{brushSize}</span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        role="slider"
        aria-valuemin={1}
        aria-valuemax={50}
        aria-valuenow={brushSize}
        aria-label="Brush size"
        className={`picaro-vslider picaro-focus picaro-vslider--size relative shrink-0 cursor-ns-resize select-none${isDragging ? " picaro-vslider--dragging" : ""}`}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          setIsDragging(true);
          setFromClientY(e.clientY);
        }}
        onPointerMove={(e) => {
          if ((e.currentTarget as HTMLDivElement).hasPointerCapture(e.pointerId)) setFromClientY(e.clientY);
        }}
        onPointerUp={(e) => { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); setIsDragging(false); }}
        onPointerCancel={(e) => { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); setIsDragging(false); }}
      >
        {/* Groove */}
        <div className="picaro-vslider__groove" />
        {/* Fill: white → subtle grey, thickness vibe */}
        <div
          className="picaro-vslider__fill picaro-vslider__fill--size"
          style={{ height: `${fillPct}%` }}
        />
        {/* Thumb */}
        <div
          className="picaro-vslider__thumb"
          style={{ bottom: thumbBottom }}
        >
          <div className="picaro-vslider__thumb-grip" />
        </div>
      </div>

      {/* Label */}
      <span className="picaro-slider-label">Size</span>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute inset-[8.33%_11.41%_11.4%_8.33%]" data-name="Group">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.6077 14.6092">
        <g id="Group">
          <path d={svgPaths.p3c236740} fill="var(--fill-0, #4D4D4D)" id="Vector" />
          <path clipRule="evenodd" d={svgPaths.p35e03c00} fill="var(--fill-0, #4D4D4D)" fillRule="evenodd" id="Vector_2" />
        </g>
      </svg>
    </div>
  );
}

function GgColorPicker() {
  return (
    <div className="overflow-clip relative shrink-0 size-[18.2px]" data-name="gg:color-picker">
      <Group2 />
    </div>
  );
}

function Frame22() {
  const { brushColor, setBrushColor, activeTool, setActiveTool } = useContext(EditorContext);

  const handlePickColor = (e: React.MouseEvent) => {
    setActiveTool(activeTool === "picker" ? "brush" : "picker");
  };

  return (
    <div className="flex flex-row items-center justify-center w-full py-1 shrink-0">
      <div className="flex items-center justify-center w-8 shrink-0">
        <div
          onClick={handlePickColor}
          className={`picaro-swatch-hit cursor-pointer relative flex items-center justify-center p-1 rounded-full border border-transparent transition-colors duration-150 ${activeTool === "picker" ? "bg-white/20 ring-2 ring-[var(--picaro-accent-ring)]" : "hover:bg-white/5"}`}
        >
          <GgColorPicker />
        </div>
      </div>
    </div>
  );
}

function OpacitySlider() {
  const { brushOpacity, setBrushOpacity } = useContext(EditorContext);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const setFromClientY = (clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const t = rect.height > 0 ? 1 - y / rect.height : 0;
    setBrushOpacity(Math.max(0.01, Math.min(1, Math.round(t * 100) / 100)));
  };

  const fillPct = brushOpacity * 100;
  const pctLabel = Math.round(brushOpacity * 100);
  const thumbBottom = `clamp(0px, calc(${fillPct}% - 8px), calc(100% - 16px))`;

  return (
    <div className="flex w-full flex-col items-center gap-2">
      {/* Value badge */}
      <div className="picaro-slider-badge" aria-live="polite">
        <span className="picaro-slider-badge__value">{pctLabel}<span className="picaro-slider-badge__unit">%</span></span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        role="slider"
        aria-valuemin={1}
        aria-valuemax={100}
        aria-valuenow={pctLabel}
        aria-label="Brush opacity"
        className={`picaro-vslider picaro-focus picaro-vslider--opacity relative shrink-0 cursor-ns-resize select-none${isDragging ? " picaro-vslider--dragging" : ""}`}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          setIsDragging(true);
          setFromClientY(e.clientY);
        }}
        onPointerMove={(e) => {
          if ((e.currentTarget as HTMLDivElement).hasPointerCapture(e.pointerId)) setFromClientY(e.clientY);
        }}
        onPointerUp={(e) => { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); setIsDragging(false); }}
        onPointerCancel={(e) => { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); setIsDragging(false); }}
      >
        {/* Groove */}
        <div className="picaro-vslider__groove" />
        {/* Checkerboard pattern for opacity illusion */}
        <div className="picaro-vslider__checker" />
        {/* Fill: white at current opacity */}
        <div
          className="picaro-vslider__fill picaro-vslider__fill--opacity"
          style={{ height: `${fillPct}%`, opacity: Math.max(0.15, brushOpacity) }}
        />
        {/* Thumb */}
        <div
          className="picaro-vslider__thumb"
          style={{ bottom: thumbBottom }}
        >
          <div className="picaro-vslider__thumb-grip" />
        </div>
      </div>

      {/* Label */}
      <span className="picaro-slider-label">Opacity</span>
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex flex-col gap-2 items-center px-2 py-2 relative shrink-0 w-full">
      <ThicknessSlider />
      <OpacitySlider />
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex items-center justify-center overflow-clip relative rounded-[7.8px] shrink-0 w-full">
      <Frame21 />
    </div>
  );
}

function Frame44() {
  return (
    <div className="content-stretch flex flex-col flex-1 items-center relative shrink-0 w-full py-3 gap-5">
      <Frame20 />
    </div>
  );
}

function Frame51() {
  return (
    <div className="bg-[#0a0a0a] content-stretch flex flex-col h-full items-center relative rounded-lg shrink-0 w-20 py-3 border border-white/[0.08] shadow-[var(--picaro-elev-1)]">
      <Frame49 />
      <Frame44 />
    </div>
  );
}

function Frame41({
  canvasRef
}: {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const { activeTool, setActiveTool, brushSize, brushOpacity, brushColor, setBrushColor, setCanUndo, setCanRedo, undoCounter, redoCounter } = useContext(EditorContext);
  const isDrawing = useRef(false);
  // Offscreen compositing refs — prevents opacity accumulation within a stroke
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  // --- Text tool state ---
  const [textTarget, setTextTarget] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textFontSize = Math.max(12, brushSize * 3);
  const textTargetRef = useRef<{ x: number; y: number } | null>(null);
  const textValueRef = useRef('');
  useEffect(() => { textTargetRef.current = textTarget; }, [textTarget]);
  useEffect(() => { textValueRef.current = textValue; }, [textValue]);

  const commitText = () => {
    const value = textValueRef.current.trim();
    const target = textTargetRef.current;

    // Eagerly clear to prevent race conditions with onBlur + pointerDown
    textTargetRef.current = null;

    if (value && target && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.font = `${textFontSize}px Inter, sans-serif`;
        ctx.fillStyle = brushColor;
        ctx.globalAlpha = brushOpacity;
        ctx.textBaseline = 'top';
        // Draw each line respecting Shift+Enter newlines
        const lines = value.split('\n');
        const lineHeight = textFontSize * 1.25;
        lines.forEach((line, i) => {
          ctx.fillText(line, target.x, target.y + i * lineHeight);
        });
        ctx.globalAlpha = 1;
        saveHistory();
      }
    }
    setTextTarget(null);
    setTextValue('');
  };

  // Commit text back when user switches away from text tool
  useEffect(() => {
    if (activeTool !== 'text' && textTargetRef.current) {
      commitText();
    }
  }, [activeTool]);

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitText();
    } else if (e.key === 'Escape') {
      setTextTarget(null);
      setTextValue('');
    }
  };

  // --- Zoom / Pan state ---
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [gestureActive, setGestureActive] = useState(false);
  const gestureSettleRef = useRef<number | null>(null);
  const bumpGesture = useCallback(() => {
    setGestureActive(true);
    if (gestureSettleRef.current) window.clearTimeout(gestureSettleRef.current);
    gestureSettleRef.current = window.setTimeout(() => {
      setGestureActive(false);
      gestureSettleRef.current = null;
    }, 140);
  }, []);
  useEffect(() => () => {
    if (gestureSettleRef.current) window.clearTimeout(gestureSettleRef.current);
  }, []);

  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  const panStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number } | null>(null);

  // --- Move tool state ---
  type MoveOverlay = { x: number; y: number; w: number; h: number; dataURL: string };
  const [moveOverlay, setMoveOverlay] = useState<MoveOverlay | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const movePhaseRef = useRef<'idle' | 'selecting' | 'moving'>('idle');
  const moveStartRef = useRef<{ x: number; y: number } | null>(null);
  const moveAnchorRef = useRef<{ mouseX: number; mouseY: number; boxX: number; boxY: number } | null>(null);
  const moveImageDataRef = useRef<ImageData | null>(null);
  const moveOverlayRef = useRef<MoveOverlay | null>(null);
  // keep ref in sync with state so stamp fn always has latest position
  useEffect(() => { moveOverlayRef.current = moveOverlay; }, [moveOverlay]);

  const history = useRef<ImageData[]>([]);
  const historyStep = useRef(-1);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newHistory = history.current.slice(0, historyStep.current + 1);
    newHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    history.current = newHistory;
    historyStep.current = newHistory.length - 1;

    setCanUndo(historyStep.current > 0);
    setCanRedo(false);
  };

  useEffect(() => {
    if (undoCounter > 0 && historyStep.current > 0) {
      historyStep.current -= 1;
      restoreHistoryState();
    }
  }, [undoCounter]);

  useEffect(() => {
    if (redoCounter > 0 && historyStep.current < history.current.length - 1) {
      historyStep.current += 1;
      restoreHistoryState();
    }
  }, [redoCounter]);

  const restoreHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(history.current[historyStep.current], 0, 0);
    setCanUndo(historyStep.current > 0);
    setCanRedo(historyStep.current < history.current.length - 1);
  };

  useEffect(() => {
    const resizeCanvas = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const canvas = canvasRef.current;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      if (canvas.width > 0 && canvas.height > 0) {
        tempCanvas.getContext('2d')?.drawImage(canvas, 0, 0);
      }

      // Canvas internal resolution = container size (zoom is purely a CSS visual effect)
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);

      const ctx = canvas.getContext('2d');
      if (ctx && tempCanvas.width > 0) {
        ctx.drawImage(tempCanvas, 0, 0);
      }

      if (history.current.length === 0) {
        saveHistory();
      }
    };

    const observer = new ResizeObserver(resizeCanvas);
    if (containerRef.current) {
      observer.observe(containerRef.current);
      resizeCanvas();
    }

    return () => observer.disconnect();
  }, []);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.offsetWidth;
    const scaleY = rect.height / canvas.offsetHeight;
    return {
      x: (e.clientX - rect.left) / scaleX,
      y: (e.clientY - rect.top) / scaleY,
    };
  };

  /** Returns (and lazily creates) an offscreen canvas matching the main canvas size. */
  const getOffscreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas');
    }
    const off = offscreenRef.current;
    if (off.width !== canvas.width || off.height !== canvas.height) {
      off.width = canvas.width;
      off.height = canvas.height;
    }
    return off;
  };

  // Attach wheel listener as non-passive so preventDefault() works for trackpad pinch
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      bumpGesture();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.9;
      const currentZoom = zoomRef.current;
      const newZoom = Math.max(0.1, Math.min(8, currentZoom * zoomFactor));
      const currentPan = panRef.current;
      const rect = el.getBoundingClientRect();
      const parentScale = rect.width / el.offsetWidth;
      // Keep the canvas pixel under the mouse pointer fixed
      const mouseX = (e.clientX - rect.left) / parentScale;
      const mouseY = (e.clientY - rect.top) / parentScale;
      const canvasX = (mouseX - currentPan.x) / currentZoom;
      const canvasY = (mouseY - currentPan.y) / currentZoom;
      const newPanX = mouseX - canvasX * newZoom;
      const newPanY = mouseY - canvasY * newZoom;
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, [bumpGesture]);

  const sampleColorFromCanvas = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pixelData = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    if (pixelData[3] < 10) {
      setBrushColor("#d3d3d3");
    } else {
      const r = pixelData[0].toString(16).padStart(2, '0');
      const g = pixelData[1].toString(16).padStart(2, '0');
      const b = pixelData[2].toString(16).padStart(2, '0');
      setBrushColor(`#${r}${g}${b}`);
    }
  };

  // --- Move tool helpers ---
  const stampMoveSelection = () => {
    const canvas = canvasRef.current;
    const overlay = moveOverlayRef.current;
    const imageData = moveImageDataRef.current;
    if (!canvas || !overlay || !imageData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Clamp to canvas bounds
    const dx = Math.round(overlay.x);
    const dy = Math.round(overlay.y);
    ctx.putImageData(imageData, dx, dy);
    saveHistory();
    setMoveOverlay(null);
    moveImageDataRef.current = null;
    moveOverlayRef.current = null;
  };

  const captureSelection = (box: { x: number; y: number; w: number; h: number }) => {
    const canvas = canvasRef.current;
    if (!canvas || box.w < 2 || box.h < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sx = Math.round(box.x);
    const sy = Math.round(box.y);
    const sw = Math.round(box.w);
    const sh = Math.round(box.h);
    const imageData = ctx.getImageData(sx, sy, sw, sh);
    moveImageDataRef.current = imageData;
    // Erase region from canvas (fill with background)
    ctx.fillStyle = '#D3D3D3';
    ctx.fillRect(sx, sy, sw, sh);
    saveHistory();
    // Convert to dataURL for the floating overlay
    const off = document.createElement('canvas');
    off.width = sw; off.height = sh;
    off.getContext('2d')!.putImageData(imageData, 0, 0);
    setMoveOverlay({ x: sx, y: sy, w: sw, h: sh, dataURL: off.toDataURL() });
  };

  const floodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const sx = Math.round(startX);
    const sy = Math.round(startY);
    const idx = (sy * width + sx) * 4;

    const targetR = data[idx];
    const targetG = data[idx + 1];
    const targetB = data[idx + 2];
    const targetA = data[idx + 3];

    // Parse fill color
    const fillHex = brushColor.replace('#', '');
    const fillR = parseInt(fillHex.substring(0, 2), 16);
    const fillG = parseInt(fillHex.substring(2, 4), 16);
    const fillB = parseInt(fillHex.substring(4, 6), 16);
    const fillA = Math.round(brushOpacity * 255);

    // Don't fill if same color
    if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === fillA) return;

    const tolerance = 30;
    const matches = (i: number) => {
      return (
        Math.abs(data[i] - targetR) <= tolerance &&
        Math.abs(data[i + 1] - targetG) <= tolerance &&
        Math.abs(data[i + 2] - targetB) <= tolerance &&
        Math.abs(data[i + 3] - targetA) <= tolerance
      );
    };

    const stack = [[sx, sy]];
    const visited = new Uint8Array(width * height);
    visited[sy * width + sx] = 1;

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const i = (y * width + x) * 4;
      data[i] = fillR;
      data[i + 1] = fillG;
      data[i + 2] = fillB;
      data[i + 3] = fillA;

      const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const ni = ny * width + nx;
        if (!visited[ni] && matches(ni * 4)) {
          visited[ni] = 1;
          stack.push([nx, ny]);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    saveHistory();
  };

  // Stamp move selection back when user switches away from move tool
  useEffect(() => {
    if (activeTool !== 'move' && moveOverlayRef.current) {
      stampMoveSelection();
      setSelectionBox(null);
      movePhaseRef.current = 'idle';
    }
  }, [activeTool]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    if (activeTool === "text") {
      // If there's already an active text box, commit it first
      if (textTargetRef.current) commitText();
      setTextTarget({ x: coords.x, y: coords.y });
      setTextValue('');
      return;
    }

    // --- Hand (pan) tool ---
    if (activeTool === "hand") {
      panStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, panX: pan.x, panY: pan.y };
      isDrawing.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    // --- Move tool ---
    if (activeTool === "move") {
      const ov = moveOverlayRef.current;
      // If clicking inside an existing overlay → start moving it
      if (ov && coords.x >= ov.x && coords.x <= ov.x + ov.w && coords.y >= ov.y && coords.y <= ov.y + ov.h) {
        movePhaseRef.current = 'moving';
        moveAnchorRef.current = { mouseX: coords.x, mouseY: coords.y, boxX: ov.x, boxY: ov.y };
      } else {
        // Stamp existing selection first if any
        if (ov) stampMoveSelection();
        // Start new selection
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

    if (activeTool === "picker") {
      sampleColorFromCanvas(coords.x, coords.y);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (activeTool === "paint") {
      floodFill(coords.x, coords.y);
      isDrawing.current = false;
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    if (activeTool === "brush") {
      // Snapshot the canvas before this stroke so we can re-composite each frame
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const off = getOffscreen();
      const offCtx = off?.getContext("2d");
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

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (activeTool === "picker") {
      setActiveTool("brush");
      return;
    }

    // --- Hand tool stop ---
    if (activeTool === "hand") {
      isDrawing.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
      panStartRef.current = null;
      return;
    }

    // --- Move tool stop ---
    if (activeTool === "move") {
      if (movePhaseRef.current === 'selecting') {
        const box = selectionBox;
        if (box && box.w > 2 && box.h > 2) {
          captureSelection(box);
        }
        setSelectionBox(null);
      }
      // If moving, keep overlay around for further drags
      movePhaseRef.current = 'idle';
      return;
    }

    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.beginPath();
    snapshotRef.current = null; // release snapshot memory after stroke is committed
    saveHistory();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Cursor circle is in screen-space (not transformed), so use container rect
    if (cursorRef.current && activeTool !== "none" && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const parentScale = rect.width / containerRef.current.offsetWidth;
      const x = (e.clientX - rect.left) / parentScale;
      const y = (e.clientY - rect.top) / parentScale;
      cursorRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    }

    // --- Hand tool pan ---
    if (isDrawing.current && activeTool === "hand" && panStartRef.current) {
      bumpGesture();
      const dx = e.clientX - panStartRef.current.mouseX;
      const dy = e.clientY - panStartRef.current.mouseY;
      setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
      return;
    }

    if (isDrawing.current && activeTool === "picker") {
      const coords = getCoordinates(e);
      if (coords) sampleColorFromCanvas(coords.x, coords.y);
      return;
    }

    // --- Move tool pointer move ---
    if (isDrawing.current && activeTool === "move") {
      const coords = getCoordinates(e);
      if (!coords) return;

      if (movePhaseRef.current === 'selecting' && moveStartRef.current) {
        const sx = Math.min(coords.x, moveStartRef.current.x);
        const sy = Math.min(coords.y, moveStartRef.current.y);
        const sw = Math.abs(coords.x - moveStartRef.current.x);
        const sh = Math.abs(coords.y - moveStartRef.current.y);
        setSelectionBox({ x: sx, y: sy, w: sw, h: sh });
      } else if (movePhaseRef.current === 'moving' && moveAnchorRef.current) {
        const dx = coords.x - moveAnchorRef.current.mouseX;
        const dy = coords.y - moveAnchorRef.current.mouseY;
        const newX = moveAnchorRef.current.boxX + dx;
        const newY = moveAnchorRef.current.boxY + dy;
        setMoveOverlay(prev => prev ? { ...prev, x: newX, y: newY } : prev);
      }
      return;
    }

    draw(e);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !canvasRef.current || activeTool === "none" || activeTool === "text" || activeTool === "picker" || activeTool === "paint" || activeTool === "move" || activeTool === "hand") return;

    const ctx = canvasRef.current.getContext("2d");
    const coords = getCoordinates(e);
    if (!ctx || !coords) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (activeTool === "eraser") {
      // Eraser draws directly — no opacity accumulation issue here
      ctx.strokeStyle = "#D3D3D3";
      ctx.lineWidth = brushSize * 4;
      ctx.globalAlpha = 1;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    } else {
      // ── Offscreen compositing ──────────────────────────────────────────────
      // Draw the full stroke at opacity=1 on an offscreen canvas, then
      // composite it onto the pre-stroke snapshot at brushOpacity.
      // This prevents individual dots from stacking within a single stroke.
      const off = getOffscreen();
      const offCtx = off?.getContext("2d");
      if (!off || !offCtx) return;

      offCtx.lineCap = "round";
      offCtx.lineJoin = "round";
      offCtx.strokeStyle = brushColor;
      offCtx.lineWidth = brushSize;
      offCtx.globalAlpha = 1;
      offCtx.lineTo(coords.x, coords.y);
      offCtx.stroke();
      offCtx.beginPath();
      offCtx.moveTo(coords.x, coords.y);

      // Restore the pre-stroke state, then overlay the stroke at target opacity
      if (snapshotRef.current) {
        ctx.putImageData(snapshotRef.current, 0, 0);
      }
      ctx.globalAlpha = brushOpacity;
      ctx.drawImage(off, 0, 0);
      ctx.globalAlpha = 1;
    }
  };

  // Scale cursor circle by zoom so it represents true brush size on screen
  const cursorSize = (activeTool === "eraser" ? brushSize * 4 : brushSize) * zoom;

  // Auto-grow textarea height and width dynamically
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = '0px';
    ta.style.width = '0px';
    ta.style.width = `${Math.max(20, ta.scrollWidth)}px`; // Allow intrinsic width to calculate without boundaries
    ta.style.height = `${ta.scrollHeight}px`;
  }, [textValue]);

  return (
    <div
      ref={containerRef}
      className="h-full relative shrink-0 flex-1 min-w-0 overflow-hidden rounded-lg touch-none border border-white/[0.06]"
      style={{ background: '#181818' }}
    >
      {/* Subtle dot-grid background visible when zoomed out / panned */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* ── Transform layer: everything inside scales/pans together ── */}
      <div
        className={`picaro-canvas-stage absolute left-0 top-0 w-full h-full ${!gestureActive ? "picaro-canvas-stage--smooth" : ""}`}
        style={{
          transformOrigin: '0 0',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* Static Canvas background and shadow - separated from canvas so it doesn't re-render on strokes! */}
        <div className="absolute inset-0 w-full h-full touch-none pointer-events-none" style={{ background: '#D3D3D3', boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 12px 40px rgba(0,0,0,0.35)' }} />

        {/* White/grey canvas layer */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full touch-none ${activeTool === 'text' ? 'cursor-text' :
              (activeTool === 'picker' || activeTool === 'paint') ? 'cursor-crosshair' :
                activeTool === 'move' ? 'cursor-default' :
                  activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' :
                    'cursor-none'
            }`}
          onPointerDown={startDrawing}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerOut={(e) => { setIsHovering(false); stopDrawing(e); }}
          onPointerEnter={() => setIsHovering(true)}
        />

        {/* Text editor — transparent overlay matching exact canvas render position */}
        {textTarget && (
          <textarea
            ref={textareaRef}
            autoFocus
            value={textValue}
            onChange={e => setTextValue(e.target.value)}
            onKeyDown={handleTextKeyDown}
            onBlur={commitText}
            rows={1}
            placeholder="Type… (Enter to place, Shift+Enter for new line, Esc to cancel)"
            className="absolute pointer-events-auto z-50"
            style={{
              left: textTarget.x,
              top: textTarget.y,
              color: brushColor,
              fontSize: `${textFontSize}px`,
              fontFamily: 'Inter, sans-serif',
              lineHeight: '1.25',
              opacity: brushOpacity,
              // Completely transparent — matches raw canvas rendering
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: 0,
              margin: 0,
              resize: 'none',
              overflow: 'hidden',
              // Auto-width: grow with content but have a sensible minimum
              minWidth: '2ch',
              width: 'auto',
              // Caret colour matches brush colour
              caretColor: brushColor,
              // Just enough indicator so user knows where they're typing
              boxShadow: `0 0 0 1px rgba(128,128,128,0.4), 0 1px 8px rgba(0,0,0,0.2)`,
              borderRadius: '2px',
              // Matches canvas wrap: let browser figure out newlines from Shift+Enter
              whiteSpace: 'pre',
            }}
          />
        )}

        {/* Selection rectangle — canvas-space */}
        {activeTool === 'move' && selectionBox && selectionBox.w > 0 && selectionBox.h > 0 && (
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

        {/* Floating move overlay — canvas-space */}
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
              userSelect: 'none',
            }}
          />
        )}
      </div>
      {/* ── End transform layer ── */}

      {/* Custom cursor circle — screen-space, tracks mouse exactly */}
      <div
        ref={cursorRef}
        className="absolute top-0 left-0 rounded-full pointer-events-none z-50 border-[1.5px] border-white mix-blend-difference"
        style={{
          width: `${cursorSize}px`,
          height: `${cursorSize}px`,
          opacity: isHovering && !['none', 'text', 'picker', 'paint', 'move', 'hand'].includes(activeTool) ? 1 : 0,
        }}
      />

      {/* Zoom HUD */}
      <div className="absolute bottom-3 left-3 z-50 flex items-center gap-2">
        <div className="picaro-zoom-hud pointer-events-none" aria-live="polite">
          <span className="text-[10px] font-medium uppercase tracking-wide text-white/35">Zoom</span>
          <span className="picaro-zoom-hud__pct">{Math.round(zoom * 100)}%</span>
        </div>
        {zoom !== 1 && (
          <button
            type="button"
            className="picaro-focus picaro-zoom-reset"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); bumpGesture(); }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Canvas border */}
      <div className="absolute inset-0 pointer-events-none border border-white/[0.06] rounded-lg z-50" />
    </div>
  );
}

function AiOutputSaveBar() {
  const { showToast } = useContext(PicaroUiContext);
  return (
    <div className="absolute right-3 bottom-3 z-20 flex gap-2 pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
      <button type="button" onClick={() => showToast("Saved to character seed")} className="picaro-focus picaro-btn-ghost">
        <User size={14} className="text-neutral-400" strokeWidth={2} aria-hidden />
        Save to character seed
      </button>
      <button type="button" onClick={() => showToast("Saved to strip")} className="picaro-focus picaro-btn-ghost picaro-btn-ghost--accent">
        <Layers size={14} className="text-emerald-400/80" strokeWidth={2} aria-hidden />
        Save to strip
      </button>
    </div>
  );
}

function Frame42({
  selectedStyle,
  onStyleChange,
  generatedImageURL,
}: {
  selectedStyle: string;
  onStyleChange: (id: string) => void;
  generatedImageURL: string | null;
}) {
  const { isGenerating } = useContext(PicaroUiContext);
  console.log('Frame42 generatedImageURL:', generatedImageURL);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [gestureActive, setGestureActive] = useState(false);
  const gestureSettleRef = useRef<number | null>(null);
  const bumpGesture = useCallback(() => {
    setGestureActive(true);
    if (gestureSettleRef.current) window.clearTimeout(gestureSettleRef.current);
    gestureSettleRef.current = window.setTimeout(() => {
      setGestureActive(false);
      gestureSettleRef.current = null;
    }, 140);
  }, []);
  useEffect(() => () => {
    if (gestureSettleRef.current) window.clearTimeout(gestureSettleRef.current);
  }, []);

  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number } | null>(null);

  // Style HUD
  const [panelHovered, setPanelHovered] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  useEffect(() => {
    if (!styleOpen) return;
    const close = () => setStyleOpen(false);
    const t = window.setTimeout(() => document.addEventListener("mousedown", close), 0);
    return () => { window.clearTimeout(t); document.removeEventListener("mousedown", close); };
  }, [styleOpen]);

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  /** Reset preview transform on load so a prior session never leaves the pane at e.g. 371%. */
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      bumpGesture();
      const zoomFactor = e.deltaY < 0 ? 1.06 : 0.94;
      const cz = zoomRef.current;
      const newZoom = Math.max(0.75, Math.min(2, cz * zoomFactor));
      const cp = panRef.current;
      const rect = el.getBoundingClientRect();
      const parentScale = rect.width / el.offsetWidth;
      const mx = (e.clientX - rect.left) / parentScale;
      const my = (e.clientY - rect.top) / parentScale;
      const cx = (mx - cp.x) / cz;
      const cy = (my - cp.y) / cz;
      setZoom(newZoom);
      setPan({ x: mx - cx * newZoom, y: my - cy * newZoom });
    };
    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, [bumpGesture]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, panX: pan.x, panY: pan.y };
    setIsDragging(true);
    bumpGesture();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    bumpGesture();
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    setPan({ x: dragStartRef.current.panX + dx, y: dragStartRef.current.panY + dy });
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    dragStartRef.current = null;
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={containerRef}
      className="h-full relative shrink-0 flex-1 min-w-0 rounded-lg overflow-hidden border border-white/[0.08] shadow-[var(--picaro-elev-1)]"
      style={{ background: "#0c0c0c", cursor: isDragging ? "grabbing" : "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setPanelHovered(true)}
      onMouseLeave={() => { setPanelHovered(false); setStyleOpen(false); }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
      />

      <div
        className={`picaro-canvas-stage absolute inset-0 ${!gestureActive ? "picaro-canvas-stage--smooth" : ""}`}
        style={{ transformOrigin: "0 0", transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        {generatedImageURL ? (
          <img
            src={generatedImageURL}
            alt="AI generated result"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center pointer-events-none">
            <ImageIcon size={40} className="text-[#525252]" strokeWidth={1.25} aria-hidden />
            <p className="font-['Inter'] text-sm font-medium tracking-wide text-[#a3a3a3]">AI render output</p>
            <p className="font-['Inter'] text-[13px] leading-5 text-[#737373] max-w-[240px]">Send a prompt to generate a panel. Output appears here.</p>
          </div>
        )}
      </div>

      {isGenerating && <div className="picaro-canvas-shimmer" aria-hidden />}

      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <div className="picaro-zoom-hud" aria-live="polite">
          <span className="text-[10px] font-medium uppercase tracking-wide text-white/35">Zoom</span>
          <span className="picaro-zoom-hud__pct">{Math.round(zoom * 100)}%</span>
        </div>
        {zoom !== 1 && (
          <button
            type="button"
            className="pointer-events-auto picaro-focus picaro-zoom-reset"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setZoom(1);
              setPan({ x: 0, y: 0 });
              bumpGesture();
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* ── Output style HUD — top-right, fades in on canvas hover ─── */}
      <div
        className="absolute top-3 right-3 z-30 pointer-events-auto"
        style={{ opacity: panelHovered ? 1 : 0, transition: 'opacity 180ms var(--picaro-ease-out)' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="relative" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            id="btn-style-selector"
            onClick={() => setStyleOpen(v => !v)}
            className="picaro-focus flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-white/[0.12] font-['Inter',sans-serif] text-[11px] font-medium text-neutral-300 hover:text-white hover:border-white/[0.2] transition-colors duration-150"
            style={{ background: 'rgba(10,10,10,0.72)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          >
            {(() => { const s = OUTPUT_STYLES.find(o => o.id === selectedStyle); return s ? <s.icon size={12} strokeWidth={1.5} className="shrink-0" /> : null; })()}
            <span>{OUTPUT_STYLES.find(o => o.id === selectedStyle)?.label ?? 'Style'}</span>
            <ChevronDown
              size={11}
              strokeWidth={2}
              style={{ transition: 'transform 150ms ease', transform: styleOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          {styleOpen && (
            <div
              className="absolute top-[calc(100%+6px)] right-0 w-[176px] rounded-lg overflow-hidden z-50 py-1"
              style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'var(--picaro-elev-2)' }}
            >
              {OUTPUT_STYLES.map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => { onStyleChange(st.id); setStyleOpen(false); }}
                  className={`picaro-focus w-full text-left flex items-center gap-2.5 px-3 py-2 font-['Inter',sans-serif] text-[12px] transition-colors duration-100 border-none cursor-pointer ${
                    st.id === selectedStyle
                      ? 'bg-white/[0.08] text-white'
                      : 'bg-transparent text-[#d4d4d4] hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <st.icon size={13} strokeWidth={1.5} className={`shrink-0 ${st.id === selectedStyle ? 'text-[#34d399]' : 'text-neutral-500'}`} />
                  <span className="flex-1">{st.label}</span>
                  {st.id === selectedStyle && <Check size={10} className="text-[#34d399] shrink-0" strokeWidth={3} aria-hidden />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AiOutputSaveBar />
      <div aria-hidden="true" className="absolute border border-white/[0.08] inset-0 pointer-events-none rounded-lg" />
    </div>
  );
}

function Frame50({
  selectedStyle,
  onStyleChange,
  canvasRef,
  generatedImageURL,
}: {
  selectedStyle: string;
  onStyleChange: (id: string) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  generatedImageURL: string | null;
}) {
  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <div className="relative flex min-h-0 flex-1 flex-row gap-4 px-0.5">
        <Frame41 canvasRef={canvasRef} />
        <Frame42
          selectedStyle={selectedStyle}
          onStyleChange={onStyleChange}
          generatedImageURL={generatedImageURL}
        />
      </div>
    </div>
  );
}

function ChatMessage({ role, text }: { role: "user" | "ai"; text: string }) {
  if (role === "ai") {
    return (
      <div className="flex w-full justify-start mt-2">
        <div className="bg-[#141414] rounded-2xl rounded-tl-md px-4 py-3 max-w-[92%] text-[13px] text-[#d4d4d4] font-['Inter'] leading-5 shadow-[var(--picaro-elev-1)] border border-white/[0.06]">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex w-full justify-end mt-2">
      <div className="rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[92%] text-[13px] text-white font-['Inter'] font-medium leading-[18px] shadow-[var(--picaro-elev-1)] border border-white/[0.12] bg-[#12b76a]">
        {text}
      </div>
    </div>
  );
}

function AiProcessFeed({ doneCount }: { doneCount: number }) {
  const labels = ["Analyzing sketch", "Line art extraction", "Model inference", "Compositing output"];
  return (
    <div className="w-full shrink-0 border-b border-white/[0.06] px-4 py-3 space-y-0.5">
      {labels.map((label, i) => {
        const done = i < doneCount;
        const active = i === doneCount && doneCount < labels.length;
        return (
          <div
            key={label}
            className="picaro-process-row text-[#a3a3a3]"
            style={{ ["--step-i" as string]: i } as React.CSSProperties}
          >
            {done ? (
              <Check size={14} className="shrink-0 text-[#34d399]" strokeWidth={2.5} aria-hidden />
            ) : active ? (
              <Loader2 size={14} className="shrink-0 animate-spin text-[#e5e5e5]" strokeWidth={2} aria-hidden />
            ) : (
              <span className="inline-block size-[14px] shrink-0 rounded-full border border-white/20" aria-hidden />
            )}
            <span className={done || active ? "text-[#e5e5e5]" : "text-[#525252]"}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ChatInput({
  text,
  setText,
  isTyping,
  handleSend,
}: {
  text: string;
  setText: (v: string) => void;
  isTyping: boolean;
  handleSend: () => void;
}) {
  const [modelDropdown, setModelDropdown] = useState(false);
  const [model, setModel] = useState("Picaro v1");
  const models = ["Picaro v1", "Stable Diffusion", "DALL-E 3", "Midjourney P-Tuning"];
  const maxLen = 2000;

  useEffect(() => {
    if (!modelDropdown) return;
    const close = () => setModelDropdown(false);
    const t = window.setTimeout(() => document.addEventListener("mousedown", close), 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", close);
    };
  }, [modelDropdown]);

  return (
    <div className="bg-[#101010] flex flex-col items-stretch relative rounded-t-xl shrink-0 w-full z-20 border-t border-white/[0.08] shadow-[0_-12px_32px_rgba(0,0,0,0.45)] pt-3 px-3 pb-4 gap-2">
      <div className="flex flex-col w-full gap-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Prompt</span>
          {!isTyping && (
            <div className="relative text-neutral-500 flex items-center justify-center shrink-0" title="Refine selection">
              <Scissors size={14} strokeWidth={1.5} />
              <Sparkles size={9} className="absolute -bottom-0.5 -right-0.5" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <textarea
          value={text}
          maxLength={maxLen}
          rows={2}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Optional: refine after generation (e.g. make it blue, add rain...)"
          className="picaro-input-well min-h-[52px] max-h-[120px] w-full resize-none rounded-lg px-3 py-2.5 font-['Inter'] text-[13px] font-normal leading-5 text-neutral-200 placeholder:text-neutral-600"
        />
      </div>
      <div className="flex flex-row items-center justify-between w-full gap-3">
        <span className="font-['Inter'] text-[11px] tabular-nums text-neutral-500">
          {text.length}/{maxLen}
        </span>
        <div className="flex items-center gap-3">
          <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setModelDropdown((v) => !v);
              }}
              className="picaro-focus font-['Inter'] flex items-center gap-1.5 font-medium text-neutral-400 text-[13px] hover:text-neutral-200 transition-colors duration-150 whitespace-nowrap bg-transparent border-none cursor-pointer rounded-md px-1 py-1"
            >
              {model} <ChevronDown size={16} strokeWidth={1.5} />
            </button>
            {modelDropdown && (
              <div
                className="absolute bottom-[calc(100%+8px)] right-0 w-[200px] bg-[#141414] border border-white/[0.1] rounded-lg shadow-[var(--picaro-elev-2)] overflow-hidden z-50 py-1"
                onClick={(e) => e.stopPropagation()}
                role="listbox"
              >
                {models.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="option"
                    aria-selected={m === model}
                    onClick={() => {
                      setModel(m);
                      setModelDropdown(false);
                    }}
                    className={`picaro-focus w-full text-left px-3 py-2.5 font-['Inter'] text-[13px] transition-colors duration-150 border-none cursor-pointer block rounded-md mx-1 w-[calc(100%-8px)] ${m === model ? "bg-white/[0.08] text-white" : "text-[#d4d4d4] hover:bg-white/[0.06]"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            title={isTyping ? "Send" : "Voice input"}
            className="picaro-focus flex items-center justify-center rounded-full border-0 bg-transparent cursor-pointer p-1.5 transition-transform duration-100 active:scale-[0.97]"
            onClick={() => isTyping && handleSend()}
          >
            {isTyping ? (
              <span className="flex items-center justify-center bg-white rounded-full w-8 h-8 hover:bg-neutral-200 transition-colors duration-150 shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 19V5" />
                  <path d="m5 12 7-7 7 7" />
                </svg>
              </span>
            ) : (
              <Mic size={18} strokeWidth={1.5} className="text-[#737373]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Output style definitions ────────────────────────────────────────────
type OutputStyle = { id: string; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> };
const OUTPUT_STYLES: OutputStyle[] = [
  { id: "photorealistic", label: "Photorealistic", icon: Camera },
  { id: "anime",          label: "Anime",          icon: Sparkles },
  { id: "3d",             label: "3D Render",       icon: Box },
  { id: "cartoon",        label: "Cartoon",         icon: Smile },
  { id: "illustration",   label: "Illustration",    icon: Palette },
  { id: "sketch",         label: "Sketch",          icon: Pencil },
  { id: "pixel-art",      label: "Pixel art",       icon: Grid },
  { id: "oil-painting",   label: "Oil painting",    icon: Brush },
  { id: "vector-art",     label: "Vector art",      icon: Pen },
  { id: "watercolor",     label: "Watercolor",      icon: Droplet },
];

function StylePicker({ selected, onChange }: { selected: string; onChange: (id: string) => void }) {
  return (
    <div className="w-full px-4 pt-4 pb-3 border-b border-white/[0.06] shrink-0">
      <div className="flex items-center justify-between mb-3">
        <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Output Style</span>
        <span className="font-['Inter'] text-[11px] text-neutral-600">
          {OUTPUT_STYLES.find(s => s.id === selected)?.label ?? ""}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {OUTPUT_STYLES.map((style) => {
          const isSelected = selected === style.id;
          return (
            <button
              key={style.id}
              id={`style-${style.id}`}
              type="button"
              onClick={() => onChange(style.id)}
              aria-pressed={isSelected}
              className={`picaro-focus flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all duration-150 ease-out cursor-pointer ${
                isSelected
                  ? "bg-[#12b76a]/10 border-[#12b76a]/30 text-[#34d399] shadow-[0_0_0_1px_rgba(18,183,106,0.12)]"
                  : "bg-white/[0.03] border-white/[0.07] text-neutral-500 hover:bg-white/[0.06] hover:border-white/[0.12] hover:text-neutral-300"
              }`}
            >
              <span className="text-[13px] shrink-0 leading-none">{style.emoji}</span>
              <span className="font-['Inter'] text-[11.5px] font-medium truncate flex-1">{style.label}</span>
              {isSelected && (
                <Check size={10} className="ml-auto shrink-0 text-[#34d399]" strokeWidth={3} aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Frame52({
  selectedStyle,
  canvasRef,
  setGeneratedImageURL,
}: {
  selectedStyle: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  setGeneratedImageURL: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const { setIsGenerating, isGenerating } = useContext(PicaroUiContext);
  const [messages, setMessages] = useState<{ id: string; role: "user" | "ai"; text: string }[]>([
    { id: "1", role: "ai", text: "Generate a render from your sketch, then use this chat to refine it with prompts." },
  ]);
  const [text, setText] = useState("");
  const [procStep, setProcStep] = useState(0);
  const isTyping = text.length > 0;

  /** Generate: sketch → rendered art using the selected style */
  const handleGenerate = async () => {
    if (isGenerating) return;

    // Get sketch from canvas
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not available');
      return;
    }
    const sketchDataURL = canvas.toDataURL('image/png');

    // Get API key
    const apiKey = import.meta.env.VITE_REPLICATE_API_KEY;
    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'ai' as const,
          text: 'API key not configured. Add VITE_REPLICATE_API_KEY to .env.local and restart the dev server.',
        },
      ]);
      return;
    }

    const userPrompt = text.trim();
    // Empty string is fine — ControlNet reads the sketch

    // Show user message if they typed one
    if (text.trim()) {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-u`, role: 'user' as const, text: text.trim() },
      ]);
      setText('');
    }

    setIsGenerating(true);
    setProcStep(1);

    const result = await generateFromSketch(
      {
        sketchDataURL: canvas.toDataURL('image/png'),
        prompt: userPrompt,
        style: selectedStyle,
      },
      apiKey
    );
    console.log('Generate result:', result);
    console.log('Setting imageURL to:', result.imageURL);

    setIsGenerating(false);
    setProcStep(0);

    if (result.success && result.imageURL) {
      // Store result URL so the output panel can display it
      setGeneratedImageURL(result.imageURL);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: 'ai' as const,
          text: `Done! Rendered your sketch as ${
            OUTPUT_STYLES.find((s) => s.id === selectedStyle)?.label ?? selectedStyle
          }. Use the chat below to refine it further.`,
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'ai' as const,
          text: `Generation failed: ${result.error ?? 'Unknown error'}`,
        },
      ]);
    }
  };

  /** Send: post-generation prompt edit */
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isGenerating) return;

    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-u`, role: 'user' as const, text: trimmed },
    ]);
    setText("");

    const canvas = canvasRef.current;
    const apiKey = import.meta.env.VITE_REPLICATE_API_KEY;
    if (!canvas) return;
    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'ai' as const,
          text: 'API key not configured. Add VITE_REPLICATE_API_KEY to .env.local and restart the dev server.',
        },
      ]);
      return;
    }

    setIsGenerating(true);
    setProcStep(1);

    const result = await generateFromSketch(
      {
        sketchDataURL: canvas.toDataURL('image/png'),
        prompt: trimmed,
        style: selectedStyle,
      },
      apiKey
    );

    setIsGenerating(false);
    setProcStep(0);

    if (result.success && result.imageURL) {
      setGeneratedImageURL(result.imageURL);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: 'ai' as const,
          text: 'Applied your changes. Let me know if you want further refinements.',
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'ai' as const,
          text: `Failed: ${result.error ?? 'Unknown error'}`,
        },
      ]);
    }
  };

  const showProcess = procStep > 0 || isGenerating;
  const doneCount = Math.min(Math.max(procStep - 1, 0), 4);

  return (
    <div className="picaro-panel-right bg-[#0a0a0a] h-full relative rounded-lg shrink-0 w-[320px] min-w-[280px] flex flex-col cursor-default border border-white/[0.08] shadow-[var(--picaro-elev-1)]">

      {/* ── Generate button ────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
        <button
          id="btn-generate-sketch"
          type="button"
          disabled={isGenerating}
          onClick={handleGenerate}
          className="picaro-focus w-full flex items-center justify-center gap-2 h-9 rounded-lg font-['Inter'] text-[13px] font-semibold transition-all duration-150 ease-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: isGenerating ? "#0d9756" : "linear-gradient(135deg, #12b76a 0%, #0ea5e9 100%)",
            color: "#fff",
            boxShadow: isGenerating ? "none" : "0 0 18px rgba(18,183,106,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          {isGenerating ? (
            <Loader2 size={14} className="animate-spin" aria-hidden />
          ) : (
            <Sparkles size={14} aria-hidden />
          )}
          {isGenerating ? "Generating…" : "Generate from Sketch"}
        </button>
      </div>

      {/* ── Post-generation chat edit ───────────────────────────────────── */}
      <div className="flex flex-col flex-1 w-full min-h-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
          <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Edit with Prompt</span>
          <span className="font-['Inter'] text-[10px] text-neutral-600 italic">post-generation</span>
        </div>
        {showProcess && <AiProcessFeed doneCount={doneCount} />}
        <div className="flex flex-col flex-1 w-full overflow-y-auto px-4 gap-2 pb-4">
          {messages.map((m) => (
            <ChatMessage key={m.id} role={m.role} text={m.text} />
          ))}
        </div>
      </div>

      <ChatInput text={text} setText={setText} isTyping={isTyping} handleSend={handleSend} />
    </div>
  );
}


function PageThumbCard({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={selected ? "page" : undefined}
      onClick={onSelect}
      className={`picaro-focus picaro-thumb-card bg-[#111] text-left shrink-0 w-[108px] flex flex-col border-0 cursor-pointer rounded-lg ${selected ? "picaro-thumb-card--selected" : ""}`}
    >
      <div className="h-16 w-full rounded-md overflow-hidden bg-[#1a1a1a] relative">
        <img alt="" className="absolute h-[179.46%] left-[0.07%] max-w-none top-[-16.18%] w-[99.85%]" src={imgImage5} />
      </div>
      <p className="mt-1.5 px-0.5 font-['Inter'] text-[10px] font-semibold leading-3 text-neutral-400 text-left">{label}</p>
    </button>
  );
}

function PageFilmstrip() {
  const [selected, setSelected] = useState(1);
  return (
    <div className="picaro-filmstrip relative rounded-lg shrink-0 w-full overflow-x-auto overflow-y-hidden border border-white/[0.08] bg-[#0c0c0c]">
      <div className="flex gap-2 items-end px-3 py-2 min-h-0">
        <PageThumbCard label="Page 1" selected={selected === 1} onSelect={() => setSelected(1)} />
        <PageThumbCard label="Page 2" selected={selected === 2} onSelect={() => setSelected(2)} />
        <button
          type="button"
          className="picaro-focus flex flex-col items-center justify-center shrink-0 w-[108px] h-[88px] self-end rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] text-neutral-500 hover:text-neutral-400 hover:border-white/[0.18] hover:bg-white/[0.04] transition-all duration-150 ease-out gap-1.5 active:scale-[0.99]"
        >
          <Plus size={20} strokeWidth={1.5} aria-hidden />
          <span className="font-['Inter'] text-[10px] font-medium">New page</span>
        </button>
      </div>
    </div>
  );
}

function Frame58() {
  const [selectedStyle, setSelectedStyle] = useState("photorealistic");
  const [generatedImageURL, setGeneratedImageURL] = useState<string | null>(null);
  const sharedCanvasRef = useRef<HTMLCanvasElement>(null);
  return (
    <div className="content-stretch flex-1 flex flex-row overflow-hidden gap-4 w-full h-full relative min-h-0">
      <Frame51 />
      <Frame50
        selectedStyle={selectedStyle}
        onStyleChange={setSelectedStyle}
        canvasRef={sharedCanvasRef}
        generatedImageURL={generatedImageURL}
      />
      <Frame52
        selectedStyle={selectedStyle}
        canvasRef={sharedCanvasRef}
        setGeneratedImageURL={setGeneratedImageURL}
      />
    </div>
  );
}

function Frame60() {
  return (
    <div className="flex-1 flex flex-col gap-2 items-start relative w-full overflow-hidden min-h-0">
      <Frame58 />
      <PageFilmstrip />
    </div>
  );
}

function Frame59() {
  return (
    <div className="flex flex-col gap-4 pt-2 pb-4 px-4 relative w-full h-full z-10 overflow-hidden min-h-0">
      <Frame47 />
      <Frame60 />
    </div>
  );
}

export default function PicaroAi() {
  const [activeTool, setActiveTool] = useState("brush");
  const [brushSize, setBrushSize] = useState(4);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushColor, setBrushColor] = useState("#000000");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoCounter, setUndoCounter] = useState(0);
  const [redoCounter, setRedoCounter] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const triggerUndo = () => setUndoCounter(c => c + 1);
  const triggerRedo = () => setRedoCounter(c => c + 1);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  return (
    <EditorContext.Provider value={{ activeTool, setActiveTool, brushSize, setBrushSize, brushOpacity, setBrushOpacity, brushColor, setBrushColor, canUndo, setCanUndo, canRedo, setCanRedo, undoCounter, redoCounter, triggerUndo, triggerRedo }}>
      <PicaroUiContext.Provider value={{ isGenerating, setIsGenerating, showToast }}>
        <div className="bg-[#0f0f0f] relative flex flex-col w-full h-full min-h-0 overflow-hidden" data-name="Picaro AI">
          <GridLayersV />
          <Frame59 />
          {toast && (
            <div
              role="status"
              className="picaro-toast fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-lg border border-white/[0.1] bg-[#141414] px-4 py-2.5 font-['Inter'] text-sm font-medium text-[#e5e5e5] shadow-[var(--picaro-elev-2)]"
            >
              {toast}
            </div>
          )}
        </div>
      </PicaroUiContext.Provider>
    </EditorContext.Provider>
  );
}

