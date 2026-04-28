import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Sparkles, X, ChevronUp } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  generateFromSketch,
  flux2GenerateWithSeed,
  type GenerateResult,
} from '../../services/aiGenerate';
import { CharacterSeedPanel } from '../seeds/CharacterSeedPanel';
import { useUsage } from '../../lib/useUsage';
import { saveIteration, loadIterations } from '../../services/database';
import { useAuth } from '../../lib/useAuth';

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

interface Iteration {
  id: string;
  step: string;
  prompt: string;
  thumbnailUrl: string | null;
  isRefinement: boolean;
  isActive: boolean;
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
    currentPageId,
  } = useStore();
  const { user } = useAuth();
  const { refresh: refreshUsage } = useUsage();
  const [iterations, setIterations] = useState<Iteration[]>([]);
  const activeIterationRef = useRef<Iteration | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [text, setText] = useState('');
  const [procStep, setProcStep] = useState(0);
  const [lastGeneratedURL, setLastGeneratedURL] = useState<string | null>(null);
  const activeSeed =
    characterSeeds.find((s) => s.id === activeCharacterSeedId) ?? null;
  const processSteps = getProcessSteps(!!activeSeed);

  useEffect(() => {
    if (!currentProjectId || !user) return;
    loadIterations(currentProjectId, currentPageId)
      .then((dbIterations) => {
        if (dbIterations.length > 0) {
          setIterations(
            dbIterations.map((i) => ({
              id: i.id,
              step: i.step,
              prompt: i.prompt,
              thumbnailUrl: i.thumbnail_url,
              isRefinement: i.is_refinement,
              isActive: i.is_active,
            }))
          );
          const active = dbIterations.find((i) => i.is_active);
          if (active?.thumbnail_url) {
            setLastGeneratedURL(active.thumbnail_url);
          }
        } else {
          setIterations([]);
          setLastGeneratedURL(null);
        }
      });
  }, [currentPageId, currentProjectId, user]);

  useEffect(() => {
    setErrorMsg(null);
    setText('');
    setProcStep(0);
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
    setIsGenerating(true);
    setProcStep(1);

    let promptOptions: {
      sketchDataURL: string;
      prompt: string;
      style: string;
      characterSeedBase64: string | null;
      isRefinement?: boolean;
    };

    if (mode === 'refine' && lastGeneratedURL) {
      const inputDataURL = await urlToDataURL(lastGeneratedURL);
      promptOptions = {
        sketchDataURL: inputDataURL,
        prompt: userPrompt,
        style: selectedStyle,
        characterSeedBase64: null,
        isRefinement: true,
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

    setErrorMsg(null);
    setIsGenerating(false);
    setProcStep(0);

    if (result.success && result.imageURL) {
      onGenerated(result.imageURL);
      setLastGeneratedURL(result.imageURL);
      refreshUsage();
      const { currentPageId, updatePageResult } = useStore.getState();
      updatePageResult(currentPageId, result.imageURL);
      
      const isRefinement = mode === 'refine';
      let stepLabel = '';
      
      if (!isRefinement) {
        const freshCount = iterations.filter(i => !i.isRefinement).length;
        stepLabel = `Step ${freshCount + 1}`;
      } else {
        const activeIter = activeIterationRef.current ?? iterations.find(i => i.isActive);
        if (activeIter) {
          const parentStep = activeIter.step;
          const siblings = iterations.filter(i => i.isRefinement && i.step.startsWith(parentStep + '.'));
          stepLabel = `${parentStep}.${siblings.length + 1}`;
        } else {
          const freshCount = iterations.filter(i => !i.isRefinement).length;
          const refCount = iterations.filter(i => i.isRefinement).length;
          stepLabel = `Step ${freshCount}.${refCount + 1}`;
        }
      }

      const newIteration = {
        id: Date.now().toString(),
        step: stepLabel,
        prompt: userPrompt || (isRefinement ? 'Refinement' : 'Initial Generation'),
        thumbnailUrl: result.imageURL ?? null,
        isRefinement,
        isActive: true,
      };

      setIterations((prev) => [
        ...prev.map(i => ({ ...i, isActive: false })),
        newIteration
      ]);

      if (currentProjectId && user) {
        saveIteration(
          user.id,
          currentProjectId,
          currentPageId,
          newIteration
        );
      }

      if (iterations.length > 0 && !isDrawerOpen) {
         setIsDrawerOpen(true);
      }
    } else if (result.error === 'LIMIT_REACHED') {
      setErrorMsg('You have used all 10 free generations this month. Upgrade to Starter for unlimited.');
    } else {
      setErrorMsg(`Generation failed: ${result.error ?? 'Unknown error'}`);
    }
  };

  const handleRevertToStep = async (iter: Iteration) => {
    if (iter.isActive) return;
    if (!iter.thumbnailUrl) return;

    activeIterationRef.current = iter;

    setIterations((prev) =>
      prev.map((i) => ({
        ...i,
        isActive: i.id === iter.id,
      }))
    );

    setLastGeneratedURL(iter.thumbnailUrl);
    onGenerated(iter.thumbnailUrl);

    const { currentPageId, updatePageResult } = useStore.getState();
    updatePageResult(currentPageId, iter.thumbnailUrl);

    if (currentProjectId && user) {
      await saveIteration(
        user.id,
        currentProjectId,
        currentPageId,
        { ...iter, isActive: true }
      );
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    activeIterationRef.current = null;
    setLastGeneratedURL(null);
    await runGeneration('', 'generate');
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isGenerating) return;
    setText('');
    await runGeneration(trimmed, 'refine');
  };

  return (
    <div className="picaro-panel-right relative flex h-full w-[340px] shrink-0 flex-col border-l border-white/[0.08] bg-[#0b0b0d] shadow-[var(--picaro-elev-2)] overflow-hidden">
      <div className="shrink-0 border-b border-white/[0.04] px-5 py-5 bg-[#0a0a0c]">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30 block mb-3">
          Main Command
        </span>
        <button
          type="button"
          disabled={isGenerating}
          onClick={handleGenerate}
          className="group relative flex h-[44px] w-full items-center justify-center gap-2 rounded-[12px] bg-white text-black transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-100 shadow-[0_4px_14px_rgba(255,255,255,0.12)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.18)]"
        >
          {isGenerating ? (
            <>
              <Loader2 size={14} className="animate-spin text-black/60" />
              <span className="font-sans text-[13px] font-semibold tracking-tight">Generating...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} className="text-black/60" />
              <span className="font-sans text-[13px] font-semibold tracking-tight">Generate from Sketch</span>
              <div className="ml-1 flex items-center justify-center rounded px-1.5 py-0.5 bg-black/5 text-[9px] font-mono font-bold tracking-widest text-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                ⌘↵
              </div>
            </>
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
        <div className="shrink-0 px-5 py-5 bg-[#0a0a0c]/40">
          <CharacterSeedPanel
            currentGeneratedImageURL={currentGeneratedImageURL}
          />
        </div>
        <div className="mt-auto shrink-0 relative bg-[#0a0a0c]">
          <div 
            className={`absolute bottom-[100%] left-0 right-0 bg-[#0a0a0c]/80 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-20px_40px_rgba(0,0,0,0.5)] transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col overflow-hidden z-20`}
            style={{ 
              height: isDrawerOpen ? '35vh' : '0px', 
              opacity: isDrawerOpen ? 1 : 0,
              visibility: isDrawerOpen ? 'visible' : 'hidden',
            }}
          >
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 [scrollbar-width:thin]">
              {iterations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                  <Sparkles size={24} className="mb-3 opacity-20" />
                  <span className="text-[12px] font-medium tracking-wide">No iterations yet</span>
                  <span className="text-[11px] mt-1 text-center max-w-[200px] opacity-70">Generate an image to start your timeline history.</span>
                </div>
              ) : (
                iterations.map((iter, idx) => (
                  <div 
                    key={iter.id} 
                    className={`flex gap-4 relative group cursor-pointer ${iter.isRefinement ? 'ml-8' : ''}`}
                    onClick={() => handleRevertToStep(iter)}
                  >
                    {(() => {
                      if (idx >= iterations.length - 1) return null;
                      const next = iterations[idx + 1];
                      const isParentOfNext = next.isRefinement && next.step.startsWith(iter.step.split('.')[0]);
                      const isSameLevel = !next.isRefinement && !iter.isRefinement;
                      if (!isParentOfNext && !isSameLevel) return null;
                      return (
                        <div className="absolute left-[15px] top-[32px] bottom-[-20px] w-[2px] bg-white/[0.05] group-hover:bg-white/[0.1] transition-colors" />
                      );
                    })()}
                    {iter.isRefinement && (
                       <div className="absolute left-[-24px] top-[15px] w-[16px] h-[2px] bg-white/[0.05]" />
                    )}
                    <div className={`w-8 h-8 rounded-[8px] shrink-0 border relative z-10 overflow-hidden bg-[#111] transition-all duration-300 hover:scale-110 hover:border-white/30
                      ${iter.isActive ? 'border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.25)]' : 'border-white/10 opacity-60 hover:opacity-100'}`}>
                      {iter.thumbnailUrl ? (
                        <img src={iter.thumbnailUrl} className="w-full h-full object-cover" alt={iter.prompt} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles size={12} className="text-white/20"/>
                        </div>
                      )}
                    </div>
                    <div className={`flex flex-col justify-center min-w-0 transition-opacity duration-300 ${iter.isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono tracking-wider uppercase ${iter.isActive ? 'text-[#3b82f6]' : 'text-white/40'}`}>
                          {iter.step}
                        </span>
                        {iter.isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                        )}
                        {!iter.isActive && (
                          <span className="text-[9px] text-white/20 group-hover:text-white/50 transition-colors font-mono uppercase tracking-wider">
                            click to revert
                          </span>
                        )}
                      </div>
                      <span className="text-[13px] text-white/90 truncate font-medium mt-0.5">
                        {iter.prompt}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="relative w-full h-9 flex items-center justify-center gap-2 border-t border-white/[0.04] bg-[#0a0a0c] hover:bg-[#0d0d10] transition-colors cursor-pointer group"
          >
             <ChevronUp size={12} className={`text-white/30 group-hover:text-white/50 transition-all duration-300 ${isDrawerOpen ? 'rotate-180' : ''}`} />
             <span className="text-[9px] text-white/30 group-hover:text-white/50 font-mono tracking-[0.15em] uppercase font-medium transition-colors">
                {iterations.length} iterations • {iterations.filter(i => i.isRefinement).length > 0 ? '1 branch' : '0 branches'}
             </span>
          </button>
          <div className="px-5 py-5 bg-[#0d0d10] border-t border-white/[0.02]">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">
                  Refinement Prompt
                </span>
                <span className="text-[10px] font-mono text-white/20">
                  {text.length}/2000
                </span>
              </div>
              {errorMsg && (
                <div className="text-[11px] text-red-400 bg-red-400/10 rounded-md px-3 py-2 border border-red-500/20">
                  {errorMsg}
                </div>
              )}
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
        </div>
      </div>
    </div>
  );
};
