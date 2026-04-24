import React, { 
  useRef, useEffect, useState, useCallback 
} from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, ArrowRight, Loader2,
  Brush, Eraser, Minus, Plus,
  Check, Zap, Users, Layers
} from 'lucide-react';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../lib/useAuth';
import { motion } from 'motion/react';

// ─── GUEST TOKEN ──────────────────────────────────────
function getGuestToken(): string {
  const key = 'picaro_guest_token';
  let token = localStorage.getItem(key);
  if (!token) {
    token = `guest-${Date.now()}-${Math.random()
      .toString(36).slice(2, 12)}`;
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

    const ctx = canvas.getContext('2d', { 
      willReadFrequently: true 
    });
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    offscreenRef.current = document.createElement('canvas');
    offscreenRef.current.width = canvas.width;
    offscreenRef.current.height = canvas.height;
  }, []);

  const getCoords = (
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * 
        (canvas.width / rect.width),
      y: (e.clientY - rect.top) * 
        (canvas.height / rect.height),
    };
  };

  const startDraw = (
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const coords = getCoords(e);
    if (!coords) return;
    isDrawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { 
      willReadFrequently: true 
    });
    if (!ctx || !canvas) return;

    if (activeTool === 'brush') {
      snapshotRef.current = ctx.getImageData(
        0, 0, canvas.width, canvas.height
      );
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

  const draw = (
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing.current) return;
    const coords = getCoords(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { 
      willReadFrequently: true 
    });
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

  const stopDraw = (
    e: React.PointerEvent<HTMLCanvasElement>
  ) => {
    isDrawing.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.beginPath();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-2xl overflow-hidden"
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
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-black/20">
          Draw anything
        </span>
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
  comingSoon,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  onCTA: () => void;
  comingSoon?: string[];
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        highlighted
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-white/[0.08] bg-white/[0.02]'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-emerald-500 text-white">
            Most Popular
          </span>
        </div>
      )}
      <div className="mb-4">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/40 mb-1">
          {name}
        </h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">
            {price}
          </span>
          {price !== 'Free' && (
            <span className="text-white/30 text-sm">/mo</span>
          )}
        </div>
        <p className="text-white/40 text-[13px] mt-1">
          {description}
        </p>
      </div>

      <ul className="flex flex-col gap-2.5 mb-6 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check 
              size={13} 
              className="text-emerald-500 shrink-0 mt-0.5" 
            />
            <span className="text-white/60 text-[13px]">
              {f}
            </span>
          </li>
        ))}
        {comingSoon?.map((f, i) => (
          <li key={i} className="flex items-start gap-2 opacity-50">
            <Zap 
              size={13} 
              className="text-amber-400 shrink-0 mt-0.5" 
            />
            <span className="text-white/40 text-[13px]">
              {f} 
              <span className="text-amber-400 text-[10px] ml-1 font-mono">
                soon
              </span>
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCTA}
        className={`w-full h-10 rounded-xl font-mono text-[11px] uppercase tracking-wider font-bold transition-all ${
          highlighted
            ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
            : 'bg-white/[0.06] hover:bg-white/[0.10] text-white/70'
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
  const [activeTool, setActiveTool] = useState<
    'brush' | 'eraser'
  >('brush');
  const [brushSize, setBrushSize] = useState(6);
  const [brushColor, setBrushColor] = useState('#000000');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<
    string | null
  >(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [guestUsed, setGuestUsed] = useState(
    localStorage.getItem(GUEST_USED_KEY) === 'true'
  );
  const [error, setError] = useState<string | null>(null);

  // If user is already logged in, redirect to app
  useEffect(() => {
    if (user) navigate('/app');
  }, [user, navigate]);

  const handleGenerate = async () => {
    if (isGenerating) return;

    // If guest already used their free generation
    if (guestUsed) {
      setAuthOpen(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Export canvas with white background
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
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-guest`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sketchDataURL: dataURL,
            guestToken,
          }),
        }
      );

      const data = await response.json();

      if (data.success && data.imageURL) {
        setGeneratedImage(data.imageURL);
        localStorage.setItem(GUEST_USED_KEY, 'true');
        setGuestUsed(true);
      } else if (data.error === 'GUEST_LIMIT_REACHED') {
        setAuthOpen(true);
      } else {
        setError('Generation failed. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

  return (
    <div 
      className="min-h-screen bg-[#050506] text-white"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* ── NAV ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#050506]/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[15px] font-bold tracking-tight text-white">
            Picora
          </span>
          <span className="font-mono text-[15px] font-bold tracking-tight text-emerald-500">
            .art
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="px-4 h-8 rounded-lg font-mono text-[11px] uppercase tracking-wider text-white/50 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="px-4 h-8 rounded-lg font-mono text-[11px] uppercase tracking-wider font-bold transition-all"
            style={{
              background: 
                'linear-gradient(135deg, #12b76a 0%, #0ea5e9 100%)',
              color: '#fff',
            }}
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Headline */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-6">
              <Sparkles size={12} className="text-emerald-500" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                AI-powered sketch to art
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 leading-[1.1]">
              Turn rough sketches into
              <br />
              <span 
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 
                    'linear-gradient(135deg, #12b76a 0%, #0ea5e9 100%)',
                }}
              >
                stunning art
              </span>
            </h1>
            <p className="text-white/40 text-lg max-w-xl mx-auto leading-relaxed">
              Draw anything. Choose a style. Watch AI transform 
              your sketch into professional artwork in seconds. 
              No art skills required.
            </p>
          </motion.div>

          {/* Interactive Demo */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto"
          >
            
            {/* Left — Canvas */}
            <div className="flex flex-col gap-3">
              {/* Mini toolbar */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <button
                  type="button"
                  onClick={() => setActiveTool('brush')}
                  className={`flex items-center gap-1.5 px-2.5 h-7 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all ${
                    activeTool === 'brush'
                      ? 'bg-white/10 text-white'
                      : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  <Brush size={11} />
                  Brush
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool('eraser')}
                  className={`flex items-center gap-1.5 px-2.5 h-7 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all ${
                    activeTool === 'eraser'
                      ? 'bg-white/10 text-white'
                      : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  <Eraser size={11} />
                  Eraser
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                {/* Color swatches */}
                {['#000000', '#ef4444', '#3b82f6', '#22c55e'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setBrushColor(c);
                      setActiveTool('brush');
                    }}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      brushColor === c && activeTool === 'brush'
                        ? 'border-white scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ background: c }}
                  />
                ))}
                <div className="w-px h-4 bg-white/10 mx-1" />
                {/* Size */}
                <button
                  type="button"
                  onClick={() => setBrushSize(
                    Math.max(2, brushSize - 2)
                  )}
                  className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white transition-colors"
                >
                  <Minus size={10} />
                </button>
                <span className="font-mono text-[10px] text-white/30 w-6 text-center">
                  {brushSize}
                </span>
                <button
                  type="button"
                  onClick={() => setBrushSize(
                    Math.min(20, brushSize + 2)
                  )}
                  className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white transition-colors"
                >
                  <Plus size={10} />
                </button>
              </div>

              {/* Canvas */}
              <div className="h-72 md:h-80 rounded-2xl overflow-hidden border border-white/[0.08]">
                <MiniCanvas
                  canvasRef={canvasRef}
                  activeTool={activeTool}
                  brushSize={brushSize}
                  brushColor={brushColor}
                />
              </div>

              {/* Generate button */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerate}
                className="w-full h-12 rounded-xl font-mono text-[12px] uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: isGenerating
                    ? '#0d9756'
                    : 'linear-gradient(135deg, #12b76a 0%, #0ea5e9 100%)',
                  color: '#fff',
                  boxShadow: isGenerating
                    ? 'none'
                    : '0 0 24px rgba(18,183,106,0.3)',
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating...
                  </>
                ) : guestUsed ? (
                  <>
                    <Sparkles size={14} />
                    Sign Up to Keep Creating
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Generate from Sketch — Free
                  </>
                )}
              </button>

              {error && (
                <p className="text-red-400 text-[12px] font-mono text-center">
                  {error}
                </p>
              )}
            </div>

            {/* Right — Output */}
            <div className="h-72 md:h-full min-h-[20rem] rounded-2xl border border-white/[0.08] overflow-hidden relative"
              style={{ background: '#0c0c0c' }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              {generatedImage ? (
                <div className="absolute inset-0 flex flex-col">
                  <img
                    src={generatedImage}
                    alt="AI generated"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setAuthOpen(true)}
                      className="flex items-center gap-2 px-4 h-9 rounded-xl font-mono text-[11px] uppercase tracking-wider font-bold transition-all"
                      style={{
                        background: 
                          'linear-gradient(135deg, #12b76a 0%, #0ea5e9 100%)',
                        color: '#fff',
                        boxShadow: 
                          '0 0 20px rgba(18,183,106,0.4)',
                      }}
                    >
                      <ArrowRight size={13} />
                      Continue Creating Free
                    </button>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <div className="w-12 h-12 rounded-2xl border border-white/[0.06] flex items-center justify-center mb-2"
                    style={{ background: '#111' }}
                  >
                    <Sparkles size={20} className="text-white/20" />
                  </div>
                  <p className="font-mono text-[12px] text-white/30 uppercase tracking-wider">
                    Your art appears here
                  </p>
                  <p className="text-white/15 text-[11px] max-w-[200px]">
                    Draw something on the canvas and click Generate
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-3xl font-bold mb-3"
          >
            How it works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="text-white/30 mb-12 text-[15px]"
          >
            From rough sketch to finished art in three steps
          </motion.p>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.15 }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                step: '01',
                title: 'Draw',
                desc: 'Sketch anything on the canvas. It doesn\'t need to be perfect — just communicate the idea.',
                icon: Brush,
              },
              {
                step: '02',
                title: 'Generate',
                desc: 'Choose a style and click Generate. AI transforms your sketch into professional artwork in seconds.',
                icon: Sparkles,
              },
              {
                step: '03',
                title: 'Refine',
                desc: 'Not quite right? Use the prompt box to refine. "Make it blue" or "add rain" — iterate until perfect.',
                icon: Zap,
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="flex flex-col items-center text-center p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
              >
                <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center mb-4"
                  style={{ background: '#111' }}
                >
                  <item.icon size={18} className="text-emerald-500" />
                </div>
                <span className="font-mono text-[10px] text-white/20 uppercase tracking-wider mb-2">
                  Step {item.step}
                </span>
                <h3 className="text-lg font-bold mb-2">
                  {item.title}
                </h3>
                <p className="text-white/40 text-[13px] leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── COMING SOON — LAYERS ────────────────────── */}
      <section className="py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 md:p-12 overflow-hidden"
          >
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border border-amber-500/30 text-amber-400">
                Coming Soon
              </span>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={20} className="text-amber-400" />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-amber-400">
                    Layers + Multi-Character Seeds
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  Multiple characters.
                  <br />
                  One scene.
                </h2>
                <p className="text-white/40 text-[15px] leading-relaxed mb-6">
                  Assign a different character seed to each layer. 
                  Generate each element independently, then composite 
                  into a single scene. Place your hero and villain 
                  in the same panel — both perfectly consistent.
                </p>
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center gap-2 px-5 h-10 rounded-xl font-mono text-[11px] uppercase tracking-wider font-bold border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors"
                >
                  Get early access
                  <ArrowRight size={13} />
                </button>
              </div>
              {/* Visual mockup */}
              <div className="w-full md:w-64 flex flex-col gap-2">
                {[
                  { name: 'Hero', seed: 'Wang', color: '#3b82f6' },
                  { name: 'Villain', seed: 'Dark Knight', color: '#ef4444' },
                  { name: 'Background', seed: 'None', color: '#6b7280' },
                ].map((layer, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03]"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: layer.color }}
                    />
                    <span className="font-mono text-[11px] text-white/60 flex-1">
                      {layer.name}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-md border border-white/10 text-white/30">
                      {layer.seed}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-3xl font-bold mb-3"
          >
            Simple pricing
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="text-white/30 mb-12 text-[15px]"
          >
            Start free. Upgrade when you need more.
          </motion.p>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.15 }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <PricingCard
              name="Free"
              price="Free"
              description="Try it out"
              features={[
                '10 generations per month',
                '3 character seed slots',
                'All 6 art styles',
                'Export as PNG',
              ]}
              cta="Get Started Free"
              onCTA={() => setAuthOpen(true)}
              />
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <PricingCard
              name="Starter"
              price="$15"
              description="For regular creators"
              features={[
                '80 generations per month',
                'Unlimited refinements',
                '5 character seed slots',
                'No watermark',
                'HD export',
              ]}
              comingSoon={[
                'Layer system (multi-character)',
              ]}
              highlighted
              cta="Start Creating"
              onCTA={() => setAuthOpen(true)}
              />
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <PricingCard
              name="Creator"
              price="$35"
              description="For power users"
              features={[
                '250 generations per month',
                'Unlimited refinements',
                '25 character seed slots',
                'Commercial license',
                'Priority speed',
              ]}
              comingSoon={[
                'Layer system (multi-character)',
                'Seed strength control',
                'API access',
              ]}
              onCTA={() => setAuthOpen(true)}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer className="py-10 px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <span className="font-mono text-[13px] font-bold text-white/60">
              Picora
            </span>
            <span className="font-mono text-[13px] font-bold text-emerald-500/60">
              .art
            </span>
          </div>
          <p className="font-mono text-[11px] text-white/20 uppercase tracking-wider">
            © 2026 Picora.art · Turn sketches into art
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => navigate('/app')}
      />
    </div>
  );
}
