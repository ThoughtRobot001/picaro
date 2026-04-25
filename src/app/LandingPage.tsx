import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, ArrowRight, Loader2, Brush, Eraser, Minus, Plus, Check, Zap, Layers, Image as ImageIcon, Lock, UserPlus, Users, Palette, Github, Twitter, Instagram, ArrowUpRight
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
  yearlyPrice,
  isYearly,
  description,
  features,
  highlighted,
  cta,
  onCTA,
}: {
  name: string;
  price: string;
  yearlyPrice: string;
  isYearly: boolean;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  onCTA: () => void;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-[32px] border p-8 transition-all duration-500 ${
        highlighted
          ? 'border-teal-500 bg-[#050505] shadow-[0_0_40px_rgba(20,184,166,0.1)] scale-105 z-10'
          : 'border-white/5 bg-[#050505] hover:border-white/10'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-4 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-black">
          Most Popular
        </div>
      )}
      
      <div className="mb-8">
        <h3 className="font-outfit text-2xl font-bold text-white mb-2">{name}</h3>
        <p className="text-white/40 text-sm leading-relaxed">{description}</p>
      </div>

      <div className="mb-8 flex items-baseline gap-1">
        <span className="font-outfit text-4xl font-bold text-white">
          {isYearly ? yearlyPrice : price}
        </span>
        <span className="text-white/30 text-sm">/mo</span>
      </div>

      <div className="flex-1 flex flex-col gap-4 mb-10">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <Check size={16} className="text-teal-500 mt-0.5 shrink-0" />
            <span className="text-sm text-white/70 leading-snug">{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onCTA}
        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 ${
          highlighted
            ? 'bg-teal-500 text-black hover:shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:scale-[1.02] active:scale-[0.98]'
            : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]'
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
  const [isYearly, setIsYearly] = useState(false);
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
              {[
                { name: 'Features', href: '#features' },
                { name: 'Try Demo', href: '#demo' },
                { name: 'Pricing', href: '#pricing' },
                { name: 'Changelog', href: '#changelog' }
              ].map(link => (
                <a key={link.name} href={link.href} className="text-[13px] font-medium text-white/50 hover:text-white transition-colors">
                  {link.name}
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
              className="px-5 h-10 rounded-full font-bold text-[13px] transition-all bg-white text-black hover:bg-white/90 hover:scale-[1.02] flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              Launch App <ArrowRight size={16} />
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
        <section id="demo" className="py-10 px-6 w-full max-w-6xl mx-auto relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full flex flex-col items-center"
          >
            <h2 className="font-outfit text-4xl md:text-5xl font-extrabold mb-4 leading-[0.9] tracking-tight">
              The Magic in Your <span className="text-teal-400">Hands</span>
            </h2>
            <p className="text-lg md:text-xl text-white/60 text-center max-w-3xl mb-10 leading-relaxed font-inter">
              Draw a rough sketch, define your character, and let Picora do the rest. Your creations stay consistent, scene after scene.
            </p>
            
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
              <h2 className="font-outfit text-5xl md:text-6xl font-extrabold mb-6 leading-[0.85] tracking-tight">
                Keep the same <br /> character. <br />
                <span className="text-white/40">Every single time.</span>
              </h2>
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
              className="bg-[#0A0A0A] rounded-3xl border border-white/[0.08] p-7 flex flex-row gap-5 overflow-hidden"
              style={{ minHeight: '220px' }}
            >
              {/* Left: text */}
              <div className="flex flex-col w-40 flex-shrink-0">
                <div className="w-9 h-9 bg-teal-500/10 rounded-xl flex items-center justify-center mb-4 border border-teal-500/20">
                  <Lock size={16} className="text-teal-400" />
                </div>
                <h3 className="font-outfit text-lg font-bold mb-2">Character Lock</h3>
                <p className="text-white/40 text-[12px] leading-relaxed flex-1">
                  Save a character once. Draw them in any pose, any scene — Picora keeps them exactly who they are.
                </p>
              </div>
              {/* Right: 3 square images + badge centered below */}
              <div className="flex-1 flex flex-col justify-center items-center gap-4 min-w-0">
                <div className="flex gap-2 w-full justify-center">
                  <img src="/landing/Character lock 1.png" alt="Character 1" className="w-24 h-24 rounded-xl object-cover border border-white/10" />
                  <img src="/landing/Character lock 2.png" alt="Character 2" className="w-24 h-24 rounded-xl object-cover border border-white/10" />
                  <img src="/landing/Character lock 3.png" alt="Character 3" className="w-24 h-24 rounded-xl object-cover border border-white/10" />
                </div>
                <div className="flex items-center gap-2">
                  <Check size={13} className="text-teal-400" />
                  <span className="text-[12px] text-teal-400 font-medium">Identity preserved</span>
                </div>
              </div>
            </motion.div>

            {/* 2. Seed Strength Control */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="bg-[#0A0A0A] rounded-3xl border border-white/[0.08] p-7 flex flex-row gap-5 overflow-hidden"
              style={{ minHeight: '220px' }}
            >
              {/* Left: text */}
              <div className="flex flex-col w-40 flex-shrink-0">
                <div className="w-9 h-9 bg-teal-500/10 rounded-xl flex items-center justify-center mb-4 border border-teal-500/20">
                  <Zap size={16} className="text-teal-400" />
                </div>
                <h3 className="font-outfit text-lg font-bold mb-2">Seed Strength Control</h3>
                <p className="text-white/40 text-[12px] leading-relaxed">
                  Add more reference images to sharpen your character's identity. The more you add, the harder it holds across every generation.
                </p>
              </div>
              {/* Right: Y-branch tree + badge */}
              <div className="flex-1 flex items-center justify-center gap-0 min-w-0 relative">
                {/* Images column */}
                <div className="flex flex-col gap-3 z-10">
                  <img src="/landing/Seed strength control 1.png" alt="Seed 1" className="w-14 h-14 rounded-xl object-cover border border-white/10" />
                  <img src="/landing/Seed strength contol 2.png" alt="Seed 2" className="w-14 h-14 rounded-xl object-cover border border-white/10" />
                  <img src="/landing/Seed strength 3.png" alt="Seed 3" className="w-14 h-14 rounded-xl object-cover border border-white/10" />
                </div>
                {/* SVG branch connector */}
                <svg width="60" height="160" viewBox="0 0 60 160" fill="none" className="flex-shrink-0">
                  {/* Horizontal lines from each image */}
                  <line x1="0" y1="28" x2="30" y2="28" stroke="#14b8a6" strokeWidth="1.5" strokeOpacity="0.7"/>
                  <line x1="0" y1="80" x2="30" y2="80" stroke="#14b8a6" strokeWidth="1.5" strokeOpacity="0.7"/>
                  <line x1="0" y1="132" x2="30" y2="132" stroke="#14b8a6" strokeWidth="1.5" strokeOpacity="0.7"/>
                  {/* Vertical spine */}
                  <line x1="30" y1="28" x2="30" y2="132" stroke="#14b8a6" strokeWidth="1.5" strokeOpacity="0.7"/>
                  {/* Horizontal line to circle */}
                  <line x1="30" y1="80" x2="60" y2="80" stroke="#14b8a6" strokeWidth="1.5" strokeOpacity="0.7"/>
                </svg>
                {/* 60% badge */}
                <div className="w-16 h-16 rounded-full bg-teal-500 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.4)] flex-shrink-0 z-10">
                  <span className="font-mono text-[15px] font-bold text-white leading-none">60%</span>
                  <span className="font-mono text-[7px] text-white/70 uppercase tracking-wide mt-0.5">Seed Score</span>
                </div>
              </div>
            </motion.div>

            {/* 3. Style Picker */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="bg-[#0A0A0A] rounded-3xl border border-white/[0.08] p-7 flex flex-row gap-5 overflow-hidden"
              style={{ minHeight: '220px' }}
            >
              {/* Left: text */}
              <div className="flex flex-col w-40 flex-shrink-0">
                <div className="w-9 h-9 bg-teal-500/10 rounded-xl flex items-center justify-center mb-4 border border-teal-500/20">
                  <Palette size={16} className="text-teal-400" />
                </div>
                <h3 className="font-outfit text-lg font-bold mb-2">Style Picker</h3>
                <p className="text-white/40 text-[12px] leading-relaxed">
                  Choose your visual world before you generate. Photorealistic, Anime, Manga, Oil Painting — your sketch, your style.
                </p>
              </div>
              {/* Right: style images + labels + dots */}
              <div className="flex-1 flex flex-col gap-2 min-w-0 justify-center">
                <div className="flex gap-2">
                  {[
                    { src: '/landing/Style picker 1.png', label: 'Photorealistic', active: true },
                    { src: '/landing/Style picker 2.png', label: 'Anime', active: false },
                    { src: '/landing/Style picker 3.png', label: 'Manga', active: false },
                    { src: '/landing/Style picker 4.png', label: 'Oil Painting', active: false },
                  ].map((s, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-1.5">
                      <div className={`rounded-xl overflow-hidden border-2 ${s.active ? 'border-teal-500' : 'border-transparent'}`}>
                        <img src={s.src} alt={s.label} className="w-full h-24 object-cover" />
                      </div>
                      <span className={`text-[10px] text-center font-medium leading-tight ${s.active ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5 justify-center mt-1">
                  {[0,1,2,3].map(i => (
                    <div key={i} className={`rounded-full transition-all ${i === 0 ? 'w-4 h-1.5 bg-teal-400' : 'w-1.5 h-1.5 bg-white/20'}`} />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* 4. Layer System */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="bg-[#0A0A0A] rounded-3xl border border-white/[0.08] p-7 flex flex-row gap-5 overflow-hidden"
              style={{ minHeight: '220px' }}
            >
              {/* Left: text */}
              <div className="flex flex-col w-40 flex-shrink-0">
                <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 border border-purple-500/20">
                  <Layers size={16} className="text-purple-400" />
                </div>
                <h3 className="font-outfit text-lg font-bold mb-2">Layer System</h3>
                <p className="text-white/40 text-[12px] leading-relaxed">
                  Build scenes with multiple characters and objects without losing what makes each one unique.
                </p>
              </div>
              {/* Right: fanned layer images */}
              <div className="flex-1 relative flex items-center justify-center min-w-0 pl-8">
                <div className="relative w-full h-[120px]">
                  <img src="/landing/Layer 1.png" alt="Layer 1"
                    className="absolute rounded-xl border border-white/10 shadow-xl object-cover w-full h-full"
                    style={{ left: '-30px', transform: 'rotate(-4deg)', zIndex: 1, transformOrigin: 'bottom left' }} />
                  <img src="/landing/Layer 2.png" alt="Layer 2"
                    className="absolute rounded-xl border border-white/10 shadow-xl object-cover w-full h-full"
                    style={{ left: '-10px', transform: 'rotate(-2deg)', zIndex: 2, transformOrigin: 'bottom left' }} />
                  <img src="/landing/Layer 3.png" alt="Layer 3"
                    className="absolute rounded-xl border border-white/10 shadow-xl object-cover w-full h-full"
                    style={{ left: '10px', transform: 'rotate(0deg)', zIndex: 3, transformOrigin: 'bottom left' }} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ── BUILD IN PUBLIC ─────────────────────────── */}

        <section className="py-12 px-6 w-full max-w-4xl mx-auto">
          <div className="rounded-[32px] border border-white/5 bg-gradient-to-br from-[#0f0f11] to-[#050505] p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex-1">
              <h2 className="font-outfit text-3xl md:text-4xl font-extrabold mb-4 leading-[0.9] tracking-tight">Build in Public.</h2>
              <p className="text-[#888888] text-[15px] max-w-[480px] leading-relaxed mb-6">
                Picora is evolving every day. We're transparent about our progress and dedicated to building the ultimate tool for storytellers.
              </p>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-500 text-[10px] font-bold uppercase tracking-wider">New</span>
                  <span className="text-[14px] text-white/70">Seed strength control for granular consistency.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase tracking-wider">Soon</span>
                  <span className="text-[14px] text-white/70">Video generation: Animate your sketches and characters.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto">
              <button className="flex items-center justify-center gap-2 px-6 h-12 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all font-bold text-sm">
                <Github size={18} /> GitHub
              </button>
              <button className="flex items-center justify-center gap-2 px-6 h-12 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all font-bold text-sm">
                <Twitter size={18} /> Twitter
              </button>
            </div>
          </div>
        </section>

        {/* ── PRICING ─────────────────────────────────── */}
        <section id="pricing" className="py-24 px-6 w-full max-w-6xl mx-auto relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="text-center mb-16 relative z-10">
            <h2 className="font-outfit text-4xl md:text-5xl font-extrabold mb-8 leading-[0.9] tracking-tight">
              Simple, outcome-focused <span className="text-teal-400">pricing.</span>
            </h2>
            
            {/* Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-white' : 'text-white/40'}`}>Monthly</span>
              <button 
                onClick={() => setIsYearly(!isYearly)}
                className="w-12 h-6 rounded-full bg-white/10 relative p-1 transition-colors hover:bg-white/20"
              >
                <div className={`w-4 h-4 rounded-full bg-teal-500 transition-all duration-300 ${isYearly ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-white' : 'text-white/40'}`}>Yearly</span>
                <span className="bg-teal-500/10 text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-500/20">
                  -20%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 pt-4">
            <PricingCard
              name="Free"
              price="$0"
              yearlyPrice="$0"
              isYearly={isYearly}
              description="Perfect for exploring the magic of sketching."
              features={[
                '5 high-quality generations/mo',
                'Basic Character Lock',
                'Standard style library',
                'Personal use only'
              ]}
              cta="Try it out →"
              onCTA={() => setAuthOpen(true)}
            />
            <PricingCard
              name="Starter"
              price="$19"
              yearlyPrice="$15"
              isYearly={isYearly}
              description="For creators building their first consistent world."
              features={[
                '100 high-quality generations/mo',
                'Advanced Character Lock',
                'Full style system',
                'Commercial license (up to 5k)',
                'Priority queue'
              ]}
              highlighted
              cta="Go Pro →"
              onCTA={() => setAuthOpen(true)}
            />
            <PricingCard
              name="Creator"
              price="$49"
              yearlyPrice="$39"
              isYearly={isYearly}
              description="The ultimate tool for studio-grade production."
              features={[
                'Unlimited generations',
                'Multi-Character Scene Sync',
                'Early access: Sketch-to-Video',
                'Commercial license (Unlimited)',
                'dedicated support'
              ]}
              cta="Unleash Power →"
              onCTA={() => setAuthOpen(true)}
            />
          </div>
        </section>
        {/* ── CHANGELOG ───────────────────────────────── */}
        <section id="changelog" className="py-24 px-6 w-full max-w-6xl mx-auto relative overflow-hidden">
          <div className="text-center mb-16 relative z-10">
            <h2 className="font-outfit text-4xl md:text-5xl font-extrabold mb-4 leading-[0.9] tracking-tight">
              The road to <span className="text-teal-400">excellence.</span>
            </h2>
            <p className="text-white/40 text-lg">See our latest updates and what's coming next.</p>
          </div>

          <div className="max-w-3xl mx-auto flex flex-col gap-8 relative z-10">
            {[
              { date: 'Oct 24, 2026', title: 'v1.2.0 - Seed-Sync™ 2.0', desc: 'Improved facial consistency and added high-resolution upscaling for all generations.' },
              { date: 'Oct 12, 2026', title: 'v1.1.5 - Multi-Character Scene Sync', desc: 'Maintain multiple identities within a single prompt for complex storyboarding.' },
              { date: 'Sep 28, 2026', title: 'v1.1.0 - Advanced Style System', desc: 'New style blending engine allowing for more unique and varied outputs.' }
            ].map((update, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="pt-1.5 flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                  {i !== 2 && <div className="w-px h-full bg-white/5 my-2" />}
                </div>
                <div className="flex flex-col gap-1 pb-8 border-b border-white/5 w-full">
                  <span className="font-mono text-[11px] text-teal-400 uppercase tracking-widest">{update.date}</span>
                  <h4 className="font-outfit text-xl font-bold text-white">{update.title}</h4>
                  <p className="text-white/40 text-[14px] leading-relaxed">{update.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] bg-[#050505] py-16 px-6 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-6 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
                <div className="w-4 h-4 border-[2.5px] border-white rounded-sm transform rotate-45" />
              </div>
              <span className="font-outfit text-[22px] font-bold tracking-tight text-white">Picora</span>
            </div>
            <p className="text-[#888888] text-[15px] max-w-[340px] leading-[1.6]">
              Empowering the next generation of storytellers through AI-driven consistency.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <a href="#" className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center text-white/50 hover:bg-white/5 hover:border-white/20 hover:text-white transition-all"><Twitter size={16} strokeWidth={1.5} /></a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center text-white/50 hover:bg-white/5 hover:border-white/20 hover:text-white transition-all"><Github size={16} strokeWidth={1.5} /></a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center text-white/50 hover:bg-white/5 hover:border-white/20 hover:text-white transition-all"><Instagram size={16} strokeWidth={1.5} /></a>
            </div>
          </div>
          
          {/* Product Column */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <h4 className="font-outfit text-[11px] font-extrabold text-white/40 uppercase tracking-[0.15em] mb-2">Product</h4>
            <a href="#" className="text-[14px] text-[#888888] hover:text-teal-400 transition-colors">Character Lock</a>
            <a href="#" className="text-[14px] text-[#888888] hover:text-teal-400 transition-colors">Style System</a>
            <a href="#" className="text-[14px] text-[#888888] hover:text-teal-400 transition-colors">Scene Sync</a>
            <a href="#" className="text-[14px] text-[#888888] hover:text-teal-400 transition-colors flex items-center gap-1.5">API <ArrowUpRight size={14} className="text-teal-500" /></a>
          </div>
          
          {/* Company Column */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <h4 className="font-outfit text-[11px] font-extrabold text-white/40 uppercase tracking-[0.15em] mb-2">Company</h4>
            <a href="#" className="text-[14px] text-[#888888] hover:text-teal-400 transition-colors">About Us</a>
            <a href="#" className="text-[14px] text-[#888888] hover:text-teal-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-[14px] text-[#888888] hover:text-teal-400 transition-colors">Terms of Service</a>
            <a href="#" className="text-[14px] text-[#888888] hover:text-teal-400 transition-colors">Contact</a>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="max-w-6xl mx-auto pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[#555555]">
            © 2026 Picora AI Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[12px] text-[#555555]">
            <a href="#" className="hover:text-white transition-colors">Security</a>
            <a href="#" className="hover:text-white transition-colors">Status</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => navigate('/app')} />
    </div>
  );
}
