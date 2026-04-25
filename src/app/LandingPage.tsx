import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, ArrowRight, Loader2, Brush, Eraser, Minus, Plus, Check, Zap, Layers, Image as ImageIcon, Lock, UserPlus, Users, Palette, Github, Twitter
} from 'lucide-react';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../lib/useAuth';
import { motion } from 'motion/react';

// ─── GUEST TOKEN ──────────────────────────────────────
function getGuestToken(): string {
  const key = 'picaro_guest_token';
  let token = localStorage.getItem(key);
  if (!token) {
    token = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(key, token);
  }
  return token;
}

const GUEST_USED_KEY = 'picaro_guest_used';

// ─── MINI CANVAS ─────────────────────────────────────
function MiniCanvas({ 
  canvasRef,
  activeTool,
  brushSize,
  brushColor,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  activeTool: 'brush' | 'eraser';
  brushSize: number;
  brushColor: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { width, height } = container.getBoundingClientRect();
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    offscreenRef.current = document.createElement('canvas');
    offscreenRef.current.width = canvas.width;
    offscreenRef.current.height = canvas.height;
  }, []);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCoords(e);
    if (!coords) return;
    isDrawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!ctx || !canvas) return;

    if (activeTool === 'brush') {
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const off = offscreenRef.current;
      const offCtx = off?.getContext('2d');
      if (off && offCtx) {
        offCtx.clearRect(0, 0, off.width, off.height);
        offCtx.beginPath();
        offCtx.moveTo(coords.x, coords.y);
      }
    }

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const coords = getCoords(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!ctx || !canvas) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'eraser') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = brushSize * 3;
      ctx.globalAlpha = 1;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    } else {
      const off = offscreenRef.current;
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
      ctx.globalAlpha = 0.9;
      ctx.drawImage(off, 0, 0);
      ctx.globalAlpha = 1;
    }
  };

  const stopDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.beginPath();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-2xl overflow-hidden border border-white/5 shadow-inner"
      style={{ background: '#f8f8f8' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        onPointerDown={startDraw}
        onPointerMove={draw}
        onPointerUp={stopDraw}
        onPointerCancel={stopDraw}
      />
      <div className="absolute top-3 left-3 pointer-events-none">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-black/20 font-bold">
          Draw Canvas
        </span>
      </div>
    </div>
  );
}

// ─── COMPARISON SLIDER ────────────────────────────────
function ComparisonSlider() {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current || !isDragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    handleMove(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden cursor-ew-resize select-none border border-white/10 bg-[#0A0A0A]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Before Image - rough sketch */}
      <img src="/landing/From sketch.png" alt="Rough Sketch" className="absolute inset-0 w-full h-full object-contain bg-white" draggable={false} />
      
      {/* After Image - finished art */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
      >
        <img src="/landing/Finished Art.png" alt="Finished Art" className="absolute inset-0 w-full h-full object-contain bg-white" draggable={false} />
      </div>

      {/* Handle */}
      <div 
        className="absolute top-0 bottom-0 w-[3px] bg-gradient-to-b from-teal-400 to-emerald-500 shadow-[0_0_15px_rgba(20,184,166,0.8)]"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#111] flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/20">
          <div className="flex gap-1.5">
            <div className="w-0.5 h-4 bg-white/40 rounded-full" />
            <div className="w-0.5 h-4 bg-white/40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PRICING CARD ─────────────────────────────────────
function PricingCard({
  name,
  price,
  description,
  features,
  highlighted,
  cta,
  onCTA,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  onCTA: () => void;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-8 transition-all duration-300 ${
        highlighted
          ? 'border-teal-500/30 bg-[#0A0A0A]/80 hover:border-teal-500/50'
          : 'border-white/[0.08] bg-[#0A0A0A]/50 hover:bg-[#0A0A0A]/80'
      } backdrop-blur-xl`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-[0_0_20px_rgba(20,184,166,0.3)]">
            Most Popular
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="font-mono text-[13px] uppercase tracking-[0.1em] text-white/50 mb-3">
          {name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white font-outfit tracking-tight">
            {price}
          </span>
          {price !== 'Free' && (
            <span className="text-white/40 text-sm font-medium">/mo</span>
          )}
        </div>
        <p className="text-white/40 text-[14px] mt-3">
          {description}
        </p>
      </div>

      <ul className="flex flex-col gap-3.5 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check size={16} className="text-teal-500 shrink-0 mt-0.5" />
            <span className="text-white/70 text-[14px] leading-snug">
              {f}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCTA}
        className={`w-full h-12 rounded-xl font-mono text-[12px] uppercase tracking-wider font-bold transition-all ${
          highlighted
            ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:scale-[1.02] active:scale-[0.98]'
            : 'border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]'
        }`}
      >
        {cta}
      </button>
    </div>
  );
}

// ─── MAIN LANDING PAGE ────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState(6);
  const [brushColor, setBrushColor] = useState('#000000');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [guestUsed, setGuestUsed] = useState(
    localStorage.getItem(GUEST_USED_KEY) === 'true'
  );

  useEffect(() => {
    if (user) navigate('/app');
  }, [user, navigate]);

  const handleGenerate = async () => {
    if (isGenerating) return;
    if (guestUsed) {
      setAuthOpen(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas, 0, 0);
    const dataURL = exportCanvas.toDataURL('image/png');

    const guestToken = getGuestToken();
    setIsGenerating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-guest`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sketchDataURL: dataURL, guestToken }),
        }
      );

      const data = await response.json();
      if (data.success && data.imageURL) {
        setGeneratedImage(data.imageURL);
        localStorage.setItem(GUEST_USED_KEY, 'true');
        setGuestUsed(true);
      } else if (data.error === 'GUEST_LIMIT_REACHED') {
        setAuthOpen(true);
      }
    } catch {
      // silently fail on landing
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#050505] text-white font-inter selection:bg-teal-500/30 overflow-x-hidden relative"
    >
      {/* GLOBAL GLOWS */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none z-0" />

      {/* ── NAV ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-white/[0.04] bg-[#050505]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-1.5 cursor-pointer">
              <span className="font-outfit text-xl font-bold tracking-tight text-white">
                Picora
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              {['Features', 'Use Cases', 'Pricing'].map(link => (
                <a key={link} href={`#${link.toLowerCase().replace(' ', '-')}`} className="text-[13px] font-medium text-white/50 hover:text-white transition-colors">
                  {link}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="text-[13px] font-medium text-white/60 hover:text-white transition-colors"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="px-4 h-9 rounded-xl font-mono text-[11px] uppercase tracking-wider font-bold transition-all bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-[0_0_15px_rgba(20,184,166,0.15)] hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:scale-[1.02]"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center w-full">
        
        {/* ── HERO ────────────────────────────────────── */}
        <section className="pt-40 pb-20 px-6 w-full max-w-7xl mx-auto text-center flex flex-col items-center relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/20 bg-teal-500/10 mb-8">
              <Sparkles size={12} className="text-teal-400" />
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-teal-400 font-medium">
                AI-Powered Sketch To Art
              </span>
            </div>
            <h1 className="font-outfit text-6xl md:text-8xl font-bold tracking-tight mb-6 leading-[1.05]">
              Keep the same identity.<br/>
              <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Across every scene.
              </span>
            </h1>
            <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
              Draw anything. Choose a style. Watch AI transform your sketch into professional artwork in seconds. No art skills required.
            </p>
            <div className="flex items-center gap-4">
              <button onClick={() => setAuthOpen(true)} className="px-8 h-14 rounded-2xl font-outfit text-[16px] font-bold transition-all bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-[0_0_30px_rgba(20,184,166,0.2)] hover:shadow-[0_0_40px_rgba(20,184,166,0.4)] hover:scale-[1.02]">
                Try Picora for Free
              </button>
              <button className="px-8 h-14 rounded-2xl font-outfit text-[16px] font-bold transition-all border border-white/10 bg-white/[0.02] text-white hover:bg-white/[0.06]">
                See Pricing
              </button>
            </div>
          </motion.div>
        </section>

        {/* ── INTERACTIVE DEMO ──────────────────────── */}
        <section className="py-10 px-6 w-full max-w-6xl mx-auto relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full flex flex-col items-center"
          >
            <h2 className="font-outfit text-3xl font-bold mb-10">
              The Magic in Your <span className="text-teal-400">Hands</span>
            </h2>
            
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0A0A0A] p-4 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
              {/* Left pane: Canvas */}
              <div className="flex flex-col gap-4">
                {/* Toolbar */}
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/[0.08] bg-[#111]">
                  <div className="flex bg-white/5 p-1 rounded-xl">
                    <button onClick={() => setActiveTool('brush')} className={`p-2 rounded-lg transition-all ${activeTool === 'brush' ? 'bg-white/10 text-white' : 'text-white/40'}`}><Brush size={14} /></button>
                    <button onClick={() => setActiveTool('eraser')} className={`p-2 rounded-lg transition-all ${activeTool === 'eraser' ? 'bg-white/10 text-white' : 'text-white/40'}`}><Eraser size={14} /></button>
                  </div>
                  <div className="w-px h-6 bg-white/10 mx-2" />
                  <div className="flex gap-1.5">
                    {['#000000', '#ef4444', '#3b82f6', '#22c55e'].map(c => (
                      <button key={c} onClick={() => { setBrushColor(c); setActiveTool('brush'); }} className={`w-6 h-6 rounded-full border-2 transition-all ${brushColor === c && activeTool === 'brush' ? 'border-white scale-110' : 'border-transparent'}`} style={{ background: c }} />
                    ))}
                  </div>
                </div>

                {/* Canvas Container */}
                <div className="h-[300px] md:h-[400px]">
                  <MiniCanvas canvasRef={canvasRef} activeTool={activeTool} brushSize={brushSize} brushColor={brushColor} />
                </div>

                {/* Prompt & Generate */}
                <div className="flex flex-col gap-2 relative">
                  <div className="absolute top-2 right-3 font-mono text-[10px] text-teal-500 uppercase tracking-wider bg-teal-500/10 px-2 py-0.5 rounded">Prompt</div>
                  <textarea 
                    className="w-full bg-[#111] border border-white/10 rounded-2xl p-4 text-[14px] text-white resize-none outline-none focus:border-teal-500/50 transition-colors"
                    rows={2}
                    defaultValue="a young boy with red hair looking up at the stars"
                    readOnly
                  />
                  <button 
                    onClick={handleGenerate} disabled={isGenerating}
                    className="w-full h-12 rounded-xl font-mono text-[12px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-50"
                  >
                    {isGenerating ? <><Loader2 size={16} className="animate-spin"/> Generating...</> : guestUsed ? "Sign up to keep generating" : "Generate with Picora"}
                  </button>
                </div>
              </div>

              {/* Right pane: Output */}
              <div className="h-full min-h-[400px] bg-[#111] border border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden">
                {generatedImage ? (
                  <img src={generatedImage} alt="Generated Art" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-white/30">
                    <ImageIcon size={32} />
                    <p className="font-mono text-[12px] uppercase tracking-wider">Your art appears here</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050505] bg-teal-900" />)}
              </div>
              <p className="font-mono text-[11px] text-white/40 uppercase tracking-wider">Joined by 10,000+ creators</p>
            </div>
          </motion.div>
        </section>

        {/* ── SLIDER SECTION ──────────────────────────── */}
        <section id="features" className="py-24 px-6 w-full max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
            <h2 className="font-outfit text-4xl md:text-5xl font-bold mb-4">
              From rough sketch → <span className="text-emerald-400">finished art.</span>
            </h2>
            <p className="text-white/40 text-lg">High-fidelity rendering powered by advanced AI models.</p>
          </motion.div>
          <ComparisonSlider />
        </section>

        {/* ── CHARACTER LOCK ──────────────────────────── */}
        <section className="py-24 px-6 w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full font-mono text-[10px] text-teal-400 uppercase tracking-widest mb-6">
                CONSISTENCY IS CORE
              </div>
              <h2 className="font-outfit text-5xl md:text-6xl font-bold mb-4 leading-tight">
                Keep the same character.
              </h2>
              <h3 className="font-outfit text-5xl md:text-6xl font-bold mb-6 leading-tight text-white/40">
                Every single time.
              </h3>
              <p className="text-white/50 text-base leading-relaxed max-w-md">
                While basic AI art tools generate random beautiful images, Picora is built for storytellers. Our Seed-Sync™ technology matches facial features and silhouettes across generations.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} className="relative">
              <div className="grid grid-cols-2 gap-3 p-4 bg-[#0A0A0A] rounded-3xl border border-white/10">
                <div className="relative">
                  <span className="absolute top-2 left-2 z-10 font-mono text-[9px] uppercase tracking-wider text-white/40 bg-black/60 px-2 py-0.5 rounded">SEED</span>
                  <img src="/landing/Consistent character 1.png" alt="Character Seed" className="rounded-2xl w-full object-cover aspect-square" />
                </div>
                <div className="relative">
                  <span className="absolute top-2 left-2 z-10 font-mono text-[9px] uppercase tracking-wider text-white/40 bg-black/60 px-2 py-0.5 rounded">FRAME 1</span>
                  <img src="/landing/Consistent character 2.png" alt="Frame 1" className="rounded-2xl w-full object-cover aspect-square" />
                </div>
                <div className="relative">
                  <span className="absolute top-2 left-2 z-10 font-mono text-[9px] uppercase tracking-wider text-white/40 bg-black/60 px-2 py-0.5 rounded">FRAME 2</span>
                  <img src="/landing/Consistent character 3.png" alt="Frame 2" className="rounded-2xl w-full object-cover aspect-square" />
                </div>
                <div className="relative">
                  <span className="absolute top-2 left-2 z-10 font-mono text-[9px] uppercase tracking-wider text-white/40 bg-black/60 px-2 py-0.5 rounded">FRAME 3</span>
                  <img src="/landing/Seed.png" alt="Frame 3" className="rounded-2xl w-full object-cover aspect-square" />
                </div>
              </div>
              {/* Lock icon overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#111] border border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.6)] z-20">
                <Lock size={22} className="text-teal-400" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FEATURES GRID ─────────────────────────── */}
        <section id="use-cases" className="py-24 px-6 w-full max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* 1. Character Lock */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="bg-[#0A0A0A] rounded-3xl border border-white/[0.08] p-7 flex flex-row gap-6 overflow-hidden min-h-[200px]"
            >
              {/* Left: text */}
              <div className="flex flex-col flex-shrink-0 w-44">
                <div className="w-9 h-9 bg-teal-500/10 rounded-xl flex items-center justify-center mb-4 border border-teal-500/20">
                  <Lock size={16} className="text-teal-400" />
                </div>
                <h3 className="font-outfit text-lg font-bold mb-2">Character Lock</h3>
                <p className="text-white/40 text-[12px] leading-relaxed flex-1">
                  Save a character once. Draw them in any pose, any scene — Picora keeps them exactly who they are.
                </p>
                <div className="flex items-center gap-1.5 mt-4">
                  <Check size={12} className="text-teal-400" />
                  <span className="font-mono text-[10px] text-teal-400 uppercase tracking-wider">Identity preserved</span>
                </div>
              </div>
              {/* Right: images */}
              <div className="flex-1 flex gap-2 items-center min-w-0">
                <img src="/landing/Character lock 1.png" alt="Character 1" className="flex-1 h-full max-h-36 rounded-xl object-cover border border-white/10" />
                <img src="/landing/Character lock 2.png" alt="Character 2" className="flex-1 h-full max-h-36 rounded-xl object-cover border border-white/10" />
                <img src="/landing/Character lock 3.png" alt="Character 3" className="flex-1 h-full max-h-36 rounded-xl object-cover border border-white/10" />
              </div>
            </motion.div>

            {/* 2. Seed Strength Control */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="bg-[#0A0A0A] rounded-3xl border border-white/[0.08] p-7 flex flex-row gap-6 overflow-hidden min-h-[200px]"
            >
              {/* Left: text */}
              <div className="flex flex-col flex-shrink-0 w-44">
                <div className="w-9 h-9 bg-teal-500/10 rounded-xl flex items-center justify-center mb-4 border border-teal-500/20">
                  <Zap size={16} className="text-teal-400" />
                </div>
                <h3 className="font-outfit text-lg font-bold mb-2">Seed Strength Control</h3>
                <p className="text-white/40 text-[12px] leading-relaxed">
                  Add more reference images to sharpen your character's identity. The more you add, the harder it holds across every generation.
                </p>
              </div>
              {/* Right: tree connector UI */}
              <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
                {/* Stacked seed images */}
                <div className="flex flex-col gap-2">
                  <img src="/landing/Seed strength control 1.png" alt="Seed 1" className="w-14 h-14 rounded-xl object-cover border border-white/10" />
                  <img src="/landing/Seed strength contol 2.png" alt="Seed 2" className="w-14 h-14 rounded-xl object-cover border border-white/10" />
                  <img src="/landing/Seed strength 3.png" alt="Seed 3" className="w-14 h-14 rounded-xl object-cover border border-white/10" />
                </div>
                {/* Connector lines */}
                <div className="flex flex-col justify-around h-full py-2 gap-1">
                  <div className="flex items-center">
                    <div className="w-6 h-px bg-teal-500/60" />
                    <div className="w-px h-8 bg-teal-500/60" style={{ marginLeft: '-1px', alignSelf: 'flex-start', marginTop: '-1px' }} />
                  </div>
                  <div className="w-8 h-px bg-teal-500/60 ml-0" />
                  <div className="flex items-center">
                    <div className="w-6 h-px bg-teal-500/60" />
                    <div className="w-px h-8 bg-teal-500/60" style={{ marginLeft: '-1px', alignSelf: 'flex-end', marginBottom: '-1px' }} />
                  </div>
                </div>
                {/* Badge */}
                <div className="w-16 h-16 rounded-full bg-teal-500 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.3)] flex-shrink-0">
                  <span className="font-mono text-base font-bold text-white leading-none">60%</span>
                  <span className="font-mono text-[8px] text-white/70 uppercase tracking-wide mt-0.5">lock str.</span>
                </div>
              </div>
            </motion.div>

            {/* 3. Style Picker */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="bg-[#0A0A0A] rounded-3xl border border-white/[0.08] p-7 flex flex-row gap-6 overflow-hidden min-h-[200px]"
            >
              {/* Left: text */}
              <div className="flex flex-col flex-shrink-0 w-44">
                <div className="w-9 h-9 bg-teal-500/10 rounded-xl flex items-center justify-center mb-4 border border-teal-500/20">
                  <Palette size={16} className="text-teal-400" />
                </div>
                <h3 className="font-outfit text-lg font-bold mb-2">Style Picker</h3>
                <p className="text-white/40 text-[12px] leading-relaxed">
                  Choose your visual world before you generate. Photorealistic, Anime, Manga, Oil Painting — your sketch, your style.
                </p>
              </div>
              {/* Right: style grid */}
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div className="flex gap-2 flex-1">
                  {[
                    { src: '/landing/Style picker 1.png', label: 'Photorealistic', active: true },
                    { src: '/landing/Style picker 2.png', label: 'Anime', active: false },
                    { src: '/landing/Style picker 3.png', label: 'Manga', active: false },
                    { src: '/landing/Style picker 4.png', label: 'Oil Painting', active: false },
                  ].map((s, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-1">
                      <div className={`rounded-xl overflow-hidden border ${s.active ? 'border-teal-500' : 'border-white/10'}`}>
                        <img src={s.src} alt={s.label} className="w-full h-20 object-cover" />
                      </div>
                      <span className={`font-mono text-[8px] text-center uppercase tracking-wider ${s.active ? 'text-teal-400' : 'text-white/30'}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
                {/* Dot indicators */}
                <div className="flex gap-1.5 justify-center">
                  {[0,1,2,3].map(i => (
                    <div key={i} className={`rounded-full ${i === 0 ? 'w-3 h-1.5 bg-teal-400' : 'w-1.5 h-1.5 bg-white/20'}`} />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* 4. Layer System */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="bg-[#0A0A0A] rounded-3xl border border-white/[0.08] p-7 flex flex-row gap-6 overflow-hidden min-h-[200px]"
            >
              {/* Left: text */}
              <div className="flex flex-col flex-shrink-0 w-44">
                <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 border border-purple-500/20">
                  <Layers size={16} className="text-purple-400" />
                </div>
                <h3 className="font-outfit text-lg font-bold mb-2">Layer System</h3>
                <p className="text-white/40 text-[12px] leading-relaxed">
                  Build scenes with multiple characters and objects without losing what makes each one unique.
                </p>
              </div>
              {/* Right: fanned layers */}
              <div className="flex-1 relative flex items-center justify-center min-w-0">
                <img src="/landing/Layer system 1.png" alt="Layer 1" className="absolute w-4/5 h-36 rounded-xl object-cover border border-white/10 shadow-xl" style={{ transform: 'rotate(8deg) translateX(16px)', zIndex: 1 }} />
                <img src="/landing/Layer system 2.png" alt="Layer 2" className="absolute w-4/5 h-36 rounded-xl object-cover border border-white/10 shadow-xl" style={{ transform: 'rotate(4deg) translateX(8px)', zIndex: 2 }} />
                <img src="/landing/Layer system 3.png" alt="Layer 3" className="absolute w-4/5 h-36 rounded-xl object-cover border border-white/10 shadow-xl" style={{ transform: 'rotate(0deg)', zIndex: 3 }} />
              </div>
            </motion.div>
          </motion.div>
        </section>



        {/* ── BUILD IN PUBLIC ─────────────────────────── */}

        <section className="py-12 px-6 w-full max-w-4xl mx-auto">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111] to-[#0A0A0A] p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <h2 className="font-outfit text-3xl font-bold mb-2">Build in Public.</h2>
              <p className="text-white/40">Join our community to shape the future of AI artistry.</p>
            </div>
            <div className="flex gap-4 relative z-10">
              <button className="flex items-center gap-2 px-5 h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors font-medium">
                <Github size={18} /> GitHub
              </button>
              <button className="flex items-center gap-2 px-5 h-12 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors font-medium">
                <Twitter size={18} /> Twitter
              </button>
            </div>
          </div>
        </section>

        {/* ── PRICING ─────────────────────────────────── */}
        <section id="pricing" className="py-24 px-6 w-full max-w-6xl mx-auto relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="text-center mb-16 relative z-10">
            <h2 className="font-outfit text-4xl md:text-5xl font-bold mb-4">
              Simple, outcome-focused <span className="text-teal-400">pricing.</span>
            </h2>
            <p className="text-white/40 text-lg">Start free. Upgrade when you need more power.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <PricingCard
              name="Free"
              price="$0"
              description="For exploring"
              features={['10 generations per month', '3 character seed slots', 'Standard export']}
              cta="Get Started"
              onCTA={() => setAuthOpen(true)}
            />
            <PricingCard
              name="Starter"
              price="$19"
              description="For regular creators"
              features={['80 generations per month', 'Unlimited refinements', '5 character seed slots', 'No watermark', 'HD export']}
              highlighted
              cta="Go Pro"
              onCTA={() => setAuthOpen(true)}
            />
            <PricingCard
              name="Creator"
              price="$49"
              description="For power users"
              features={['250 generations per month', 'Unlimited refinements', '25 character seed slots', 'Commercial license', 'Priority speed']}
              cta="Contact Sales"
              onCTA={() => setAuthOpen(true)}
            />
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] bg-[#050505] py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-1.5 mb-4">
              <span className="font-outfit text-xl font-bold tracking-tight text-white">Picora</span>
            </div>
            <p className="text-white/30 text-sm max-w-xs">
              AI-powered art generation with perfect identity retention across any style.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-mono text-[11px] text-white/50 uppercase tracking-wider mb-2">Product</h4>
            <a href="#" className="text-[13px] text-white/40 hover:text-teal-400 transition-colors">Features</a>
            <a href="#" className="text-[13px] text-white/40 hover:text-teal-400 transition-colors">Use Cases</a>
            <a href="#" className="text-[13px] text-white/40 hover:text-teal-400 transition-colors">Pricing</a>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-mono text-[11px] text-white/50 uppercase tracking-wider mb-2">Company</h4>
            <a href="#" className="text-[13px] text-white/40 hover:text-teal-400 transition-colors">Twitter</a>
            <a href="#" className="text-[13px] text-white/40 hover:text-teal-400 transition-colors">Discord</a>
            <a href="#" className="text-[13px] text-white/40 hover:text-teal-400 transition-colors">GitHub</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[11px] text-white/20 uppercase tracking-wider">
            © 2026 Picora.art
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => navigate('/app')} />
    </div>
  );
}
