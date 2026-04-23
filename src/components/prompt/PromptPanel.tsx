import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  generateFromSketch,
  flux2GenerateWithSeed,
  type GenerateResult,
} from '../../services/aiGenerate';
import { CharacterSeedPanel } from '../seeds/CharacterSeedPanel';

async function urlToDataURL(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

interface PromptPanelProps {
  getCanvasDataURL: () => string | null;
  onGenerated: (url: string) => void;
  selectedStyle: string;
  currentGeneratedImageURL: string | null;
  currentProjectId: string | null;
}

const getProcessSteps = (hasSeed: boolean) =>
  hasSeed
    ? [
        'Analyzing sketch...',
        'Generating scene...',
        'Applying character seed...',
        'Finalizing...',
      ]
    : [
        'Analyzing sketch...',
        'Applying style...',
        'Rendering details...',
        'Finalizing...',
      ];

function ChatMessage({
  role,
  text,
}: {
  role: 'user' | 'ai';
  text: string;
}) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] rounded-[16px] px-3.5 py-2.5 text-[13px] leading-[1.4] shadow-sm ${
          role === 'user'
            ? 'rounded-br-[4px] border border-white/10 bg-white text-black font-medium'
            : 'rounded-bl-[4px] border border-white/[0.08] bg-white/[0.03] text-white/80'
        }`}
      >
        {text}
      </div>
    </div>
  );
}

export const PromptPanel: React.FC<PromptPanelProps> = ({
  getCanvasDataURL,
  onGenerated,
  selectedStyle,
  currentGeneratedImageURL,
  currentProjectId,
}) => {
  const {
    isGenerating,
    setIsGenerating,
    characterSeeds,
    activeCharacterSeedId,
  } = useStore();
  const [messages, setMessages] = useState<
    { id: string; role: 'user' | 'ai'; text: string }[]
  >([
    {
      id: '1',
      role: 'ai',
      text: 'Draw something on the canvas, then click Generate to render it.',
    },
  ]);
  const [text, setText] = useState('');
  const [procStep, setProcStep] = useState(0);
  const [lastGeneratedURL, setLastGeneratedURL] =
    useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeSeed =
    characterSeeds.find((s) => s.id === activeCharacterSeedId) ?? null;
  const processSteps = getProcessSteps(!!activeSeed);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        id: '1',
        role: 'ai',
        text: 'Draw something on the canvas, then click Generate to render it.',
      },
    ]);
    setText('');
    setProcStep(0);
    setLastGeneratedURL(null);
  }, [currentProjectId]);

  useEffect(() => {
    const handleGenerateShortcut = () => {
      if (isGenerating) return;
      void handleGenerate();
    };

    window.addEventListener(
      'picaro:generate-from-sketch',
      handleGenerateShortcut
    );

    return () => {
      window.removeEventListener(
        'picaro:generate-from-sketch',
        handleGenerateShortcut
      );
    };
  }, [isGenerating]);

  const runGeneration = async (
    userPrompt: string,
    mode: 'generate' | 'refine' = 'generate'
  ) => {
    // Auth is handled by Edge Function
    // No API key needed in frontend

    setIsGenerating(true);
    setProcStep(1);

    let promptOptions: {
      sketchDataURL: string;
      prompt: string;
      style: string;
      characterSeedBase64: string | null;
    };

    if (mode === 'refine' && lastGeneratedURL) {
      const inputDataURL = await urlToDataURL(lastGeneratedURL);
      promptOptions = {
        sketchDataURL: inputDataURL,
        prompt: userPrompt,
        style: selectedStyle,
        characterSeedBase64: null,
      };
    } else {
      const canvasURL = getCanvasDataURL();
      if (!canvasURL) {
        setIsGenerating(false);
        setProcStep(0);
        return;
      }
      promptOptions = {
        sketchDataURL: canvasURL,
        prompt: userPrompt,
        style: selectedStyle,
        characterSeedBase64: activeSeed?.imageBase64 ?? null,
      };
    }

    let result: GenerateResult;

    if (activeSeed && mode === 'generate') {
      const canvasURL = getCanvasDataURL();
      if (!canvasURL) {
        setIsGenerating(false);
        setProcStep(0);
        return;
      }
      result = await flux2GenerateWithSeed(
        canvasURL,
        activeSeed.imageBase64,
        selectedStyle,
        userPrompt
      );
    } else {
      result = await generateFromSketch(promptOptions);
    }

    setIsGenerating(false);
    setProcStep(0);

    if (result.success && result.imageURL) {
      onGenerated(result.imageURL);
      setLastGeneratedURL(result.imageURL);
      const { currentPageId, updatePageResult } = useStore.getState();
      updatePageResult(currentPageId, result.imageURL);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: 'ai' as const,
          text: `Done! Rendered as ${selectedStyle}. Use the prompt box to refine further.`,
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'ai' as const,
          text: result.error ?? 'Unknown error',
        },
      ]);
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setLastGeneratedURL(null);
    await runGeneration('', 'generate');
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isGenerating) return;
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-u`, role: 'user' as const, text: trimmed },
    ]);
    setText('');
    await runGeneration(trimmed, 'refine');
  };

  return (
    <div className="picaro-panel-right relative flex h-full w-[340px] shrink-0 flex-col rounded-t-[24px] rounded-b-none border border-b-0 border-white/[0.08] bg-[#0b0b0d] shadow-[var(--picaro-elev-2)] overflow-hidden">
      <div className="shrink-0 border-b border-white/[0.06] px-6 py-6 bg-[#0a0a0c]">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30 block mb-3.5">
          Main Command
        </span>
        <button
          type="button"
          disabled={isGenerating}
          onClick={handleGenerate}
          className="group relative flex h-[56px] w-full flex-col items-center justify-center rounded-[16px] bg-white text-black transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-black/80" />
              <span className="font-['Inter'] text-[13px] font-bold tracking-tight">Generating...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-black/70" />
                <span className="font-['Inter'] text-[13px] font-bold tracking-tight">
                  GENERATE FROM SKETCH
                </span>
              </div>
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-black/40">
                CMD + ENTER
              </span>
            </div>
          )}
        </button>

        {activeSeed && (
          <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
            <img
              src={activeSeed.thumbnail}
              alt={activeSeed.name}
              className="h-8 w-8 shrink-0 rounded-[6px] object-cover border border-white/10"
            />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 opacity-80">
                Using Seed
              </span>
              <span className="truncate text-[12px] font-medium text-white/90">
                {activeSeed.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => useStore.getState().setActiveCharacterSeed(null)}
              className="text-emerald-400/60 hover:text-emerald-400 transition-colors"
              aria-label="Clear active seed"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {procStep > 0 && (
        <div className="shrink-0 border-b border-white/[0.06] px-6 py-4 bg-[#0a0a0c]/50">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 font-bold">
              Process
            </span>
            <span className="font-mono text-[10px] font-bold text-[#3b82f6]">
              {procStep}/{processSteps.length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {processSteps.slice(0, procStep).map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-[11px] text-white/50 animate-in fade-in slide-in-from-left-2 duration-300"
              >
                <Loader2 size={10} className="animate-spin text-[#3b82f6]" />
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:thin]">
        <div className="shrink-0 px-6 py-6 bg-[#0a0a0c]/40">
          <CharacterSeedPanel
            currentGeneratedImageURL={currentGeneratedImageURL}
          />
        </div>

        <div className="mt-auto shrink-0 border-t border-white/[0.06] px-6 py-6 bg-[#0a0a0c]">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                Refinement Prompt
              </span>
              <span className="text-[10px] font-mono text-white/20">
                {text.length}/2000
              </span>
            </div>

            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleGenerate();
                    return;
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="E.g., Make it look like a pencil sketch..."
                rows={3}
                className="w-full resize-none rounded-[16px] border border-white/5 bg-white/[0.02] px-4 py-3.5 text-[13px] leading-relaxed text-white/90 placeholder-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all"
              />
              <button
                type="button"
                disabled={!text.trim() || isGenerating}
                onClick={handleSend}
                className="absolute bottom-2.5 right-2.5 rounded-[10px] bg-white/10 px-3.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <div className="flex flex-col shrink-0 gap-4 px-6 py-6 border-t border-white/[0.06] bg-[#0b0b0d]">
            {messages.map((m) => (
              <ChatMessage key={m.id} role={m.role} text={m.text} />
            ))}
            <div ref={messagesEndRef} className="h-2 shrink-0" />
          </div>
        )}
      </div>
    </div>
  );
};
