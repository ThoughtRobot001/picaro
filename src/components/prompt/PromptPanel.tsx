import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronUp, Loader2, Sparkles, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  detectSubject,
  flux2GenerateWithSeed,
  flux2RefineWithSeed,
  generateFromSketch,
  generateTwoStep,
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
    return await new Promise((resolve, reject) => {
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

interface Iteration {
  id: string;
  step: string;
  prompt: string;
  thumbnailUrl: string | null;
  isRefinement: boolean;
  isActive: boolean;
}

interface DetectionResult {
  detected_subject: string;
  detected_attributes: string;
}

const SEED_HINT_DISMISSED_KEY = 'picaro:seed-hint-dismissed';
const GENERATION_STEPS = [
  'Analyzing your sketch...',
  'Building structure with AI...',
  'Enhancing to photorealism...',
  'Done!',
];

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
  const iterationsLoadIdRef = useRef(0);
  const seedHintPageIdsRef = useRef<Set<number>>(new Set());
  const detectedCanvasRef = useRef<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSeedHint, setShowSeedHint] = useState(
    () => localStorage.getItem(SEED_HINT_DISMISSED_KEY) !== 'true'
  );
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(
    null
  );
  const [isCorrectingSubject, setIsCorrectingSubject] = useState(false);
  const [manualSubject, setManualSubject] = useState('');
  const [text, setText] = useState('');
  const [procStep, setProcStep] = useState(0);
  const [lastGeneratedURL, setLastGeneratedURL] = useState<string | null>(null);

  const activeSeed =
    characterSeeds.find((s) => s.id === activeCharacterSeedId) ?? null;

  useEffect(() => {
    if (!currentProjectId || !user) {
      iterationsLoadIdRef.current += 1;
      setIterations([]);
      setLastGeneratedURL(null);
      return;
    }

    const loadId = ++iterationsLoadIdRef.current;
    loadIterations(currentProjectId, currentPageId).then((dbIterations) => {
      if (loadId !== iterationsLoadIdRef.current) return;

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
        setLastGeneratedURL(active?.thumbnail_url ?? null);
      } else {
        setIterations([]);
        setLastGeneratedURL(null);
      }
    });

    return () => {
      if (loadId === iterationsLoadIdRef.current) {
        iterationsLoadIdRef.current += 1;
      }
    };
  }, [currentPageId, currentProjectId, user]);

  useEffect(() => {
    setErrorMsg(null);
    setText('');
    setProcStep(0);
    setDetectionResult(null);
    setIsCorrectingSubject(false);
    setManualSubject('');
    detectedCanvasRef.current = null;
  }, [currentProjectId, currentPageId]);

  useEffect(() => {
    if (activeSeed && showSeedHint) {
      setShowSeedHint(false);
    }
  }, [activeSeed, showSeedHint]);

  useEffect(() => {
    const hintDismissed =
      localStorage.getItem(SEED_HINT_DISMISSED_KEY) === 'true';
    const shouldShowForPage =
      !hintDismissed && seedHintPageIdsRef.current.has(currentPageId);
    setShowSeedHint(shouldShowForPage);
  }, [currentPageId]);

  const runGeneration = async (
    userPrompt: string,
    mode: 'generate' | 'refine' = 'generate',
    detectionOverride?: DetectionResult | null
  ) => {
    const targetPageId = currentPageId;
    const targetProjectId = currentProjectId;

    setIsGenerating(true);
    setProcStep(mode === 'generate' && detectionOverride ? 2 : 1);

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
      result = await flux2GenerateWithSeed(
        promptOptions.sketchDataURL,
        activeSeed.imageBase64,
        selectedStyle,
        userPrompt,
        detectionOverride ?? undefined
      );
    } else if (activeSeed && mode === 'refine') {
      if (!lastGeneratedURL) {
        setIsGenerating(false);
        setProcStep(0);
        return;
      }

      const acceptedImageDataURL = await urlToDataURL(lastGeneratedURL);
      result = await flux2RefineWithSeed(
        acceptedImageDataURL,
        activeSeed.imageBase64,
        selectedStyle,
        userPrompt
      );
    } else if (mode === 'generate' && detectionOverride) {
      result = await generateTwoStep(promptOptions, detectionOverride);
    } else {
      result = await generateFromSketch(promptOptions);
    }

    setErrorMsg(null);
    setIsGenerating(false);
    setProcStep(0);

    if (result.success && result.imageURL) {
      if (!activeSeed) {
        seedHintPageIdsRef.current.add(targetPageId);
        setShowSeedHint(
          targetPageId === currentPageId &&
            localStorage.getItem(SEED_HINT_DISMISSED_KEY) !== 'true'
        );
      } else {
        seedHintPageIdsRef.current.delete(targetPageId);
        if (targetPageId === currentPageId) {
          setShowSeedHint(false);
        }
      }

      onGenerated(result.imageURL);
      setLastGeneratedURL(result.imageURL);
      refreshUsage();
      useStore.getState().updatePageResult(targetPageId, result.imageURL);

      const isRefinement = mode === 'refine';
      let stepLabel = '';

      if (!isRefinement) {
        const freshCount = iterations.filter((i) => !i.isRefinement).length;
        stepLabel = `Step ${freshCount + 1}`;
      } else {
        const activeIter =
          activeIterationRef.current ?? iterations.find((i) => i.isActive);
        if (activeIter) {
          const parentStep = activeIter.step;
          const siblings = iterations.filter(
            (i) => i.isRefinement && i.step.startsWith(parentStep + '.')
          );
          stepLabel = `${parentStep}.${siblings.length + 1}`;
        } else {
          const freshCount = iterations.filter((i) => !i.isRefinement).length;
          const refCount = iterations.filter((i) => i.isRefinement).length;
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
        ...prev.map((i) => ({ ...i, isActive: false })),
        newIteration,
      ]);

      if (targetProjectId && user) {
        void saveIteration(
          user.id,
          targetProjectId,
          targetPageId,
          newIteration
        );
      }

      if (iterations.length > 0 && !isDrawerOpen) {
        setIsDrawerOpen(true);
      }
    } else if (result.error === 'LIMIT_REACHED') {
      setErrorMsg(
        'You have used all 10 free generations this month. Upgrade to Starter for unlimited.'
      );
    } else {
      setErrorMsg(`Generation failed: ${result.error ?? 'Unknown error'}`);
    }
  };

  const handleDetectBeforeGenerate = async () => {
    if (isGenerating || isDetecting) return;

    const canvasURL = getCanvasDataURL();
    if (!canvasURL) return;

    setErrorMsg(null);
    setDetectionResult(null);
    setIsCorrectingSubject(false);
    setManualSubject('');
    setIsDetecting(true);
    setProcStep(1);

    try {
      const detection = await detectSubject(canvasURL);
      detectedCanvasRef.current = canvasURL;
      setDetectionResult(detection);
      setManualSubject(detection?.detected_subject ?? '');
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Subject detection failed. Please try again.'
      );
    } finally {
      setIsDetecting(false);
      setProcStep(0);
    }
  };

  const handleConfirmDetection = async () => {
    if (!detectionResult) return;
    await runGeneration('', 'generate', detectionResult);
  };

  const handleUseManualSubject = async () => {
    const subject = manualSubject.trim();
    if (!subject) return;

    const correctedDetection: DetectionResult = {
      ...(detectionResult ?? {
        detected_attributes: 'as drawn in the sketch',
      }),
      detected_subject: subject,
    };

    setDetectionResult(correctedDetection);
    setIsCorrectingSubject(false);
    await runGeneration('', 'generate', correctedDetection);
  };

  const handleGenerate = async () => {
    activeIterationRef.current = null;
    setLastGeneratedURL(null);
    await handleDetectBeforeGenerate();
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isGenerating || isDetecting) return;
    setText('');
    await runGeneration(trimmed, 'refine');
  };

  const handleRevertToStep = async (iter: Iteration) => {
    if (iter.isActive || !iter.thumbnailUrl) return;

    activeIterationRef.current = iter;
    setIterations((prev) =>
      prev.map((i) => ({
        ...i,
        isActive: i.id === iter.id,
      }))
    );

    setLastGeneratedURL(iter.thumbnailUrl);
    onGenerated(iter.thumbnailUrl);
    useStore.getState().updatePageResult(currentPageId, iter.thumbnailUrl);

    if (currentProjectId && user) {
      await saveIteration(user.id, currentProjectId, currentPageId, {
        ...iter,
        isActive: true,
      });
    }
  };

  return (
    <div className="relative flex h-full w-[340px] shrink-0 flex-col overflow-hidden border-l border-white/[0.08] bg-[#0b0b0d] shadow-[var(--picaro-elev-2)]">
      <div className="shrink-0 border-b border-white/[0.04] bg-[#0a0a0c] px-5 py-5">
        <span className="mb-3 block font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">
          Main Command
        </span>
        <motion.button
          type="button"
          disabled={isGenerating || isDetecting}
          onClick={handleGenerate}
          whileHover={{ scale: isGenerating || isDetecting ? 1 : 1.02 }}
          whileTap={{ scale: isGenerating || isDetecting ? 1 : 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="group relative flex h-[44px] w-full items-center justify-center gap-2 rounded-[12px] bg-white text-black shadow-[0_4px_14px_rgba(255,255,255,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating || isDetecting ? (
            <div className="flex animate-pulse items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin text-black/60" />
              <span className="font-sans text-[13px] font-semibold tracking-tight">
                Neural Synthesis...
              </span>
            </div>
          ) : (
            <>
              <Sparkles size={14} className="text-black/60" />
              <span className="font-sans text-[13px] font-semibold tracking-tight">
                Generate from Sketch
              </span>
              <div className="ml-1 flex items-center justify-center rounded bg-black/5 px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-widest text-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                Ctrl+Enter
              </div>
            </>
          )}
        </motion.button>

        {(detectionResult || isCorrectingSubject) && (
          <div className="mt-4 rounded-[12px] border border-sky-500/20 bg-sky-500/10 px-3.5 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-400/12 text-sky-300">
                <Sparkles size={12} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium leading-5 text-sky-50">
                  Detected: {detectionResult?.detected_subject ?? 'Subject'}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-sky-100/70">
                  {detectionResult?.detected_attributes ?? 'As drawn in the sketch'}
                </p>

                {isCorrectingSubject ? (
                  <div className="mt-3 flex flex-col gap-2">
                    <input
                      value={manualSubject}
                      onChange={(e) => setManualSubject(e.target.value)}
                      placeholder="What did you draw?"
                      className="rounded-[10px] border border-white/10 bg-black/20 px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/35 focus:border-white/20"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleUseManualSubject}
                        disabled={!manualSubject.trim() || isGenerating}
                        className="rounded-[8px] border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-[11px] font-medium text-sky-100 transition-colors hover:border-sky-200/35 hover:bg-sky-200/15 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Generate
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCorrectingSubject(false)}
                        className="rounded-[8px] border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmDetection}
                      disabled={isGenerating}
                      className="rounded-[8px] border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-[11px] font-medium text-sky-100 transition-colors hover:border-sky-200/35 hover:bg-sky-200/15 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ✓ Looks right
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCorrectingSubject(true)}
                      className="rounded-[8px] border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/10"
                    >
                      ✗ Wrong
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setDetectionResult(null);
                  setIsCorrectingSubject(false);
                  setManualSubject('');
                  detectedCanvasRef.current = null;
                }}
                className="mt-0.5 shrink-0 text-sky-100/50 transition-colors hover:text-sky-50/90"
                aria-label="Dismiss detection"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {activeSeed && (
          <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
            <img
              src={activeSeed.thumbnail}
              alt={activeSeed.name}
              className="h-8 w-8 shrink-0 rounded-[6px] border border-white/10 object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-[9px] uppercase tracking-wider text-emerald-400 opacity-80">
                Identity Locked
              </span>
              <span className="truncate text-[12px] font-medium text-white/90">
                {activeSeed.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => useStore.getState().setActiveCharacterSeed(null)}
              className="text-emerald-400/60 transition-colors hover:text-emerald-400"
              aria-label="Clear active seed"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {!activeSeed && showSeedHint && (
        <div className="shrink-0 border-b border-amber-500/10 bg-amber-500/[0.06] px-5 py-3">
          <div className="flex items-start gap-3 rounded-[12px] border border-amber-500/15 bg-black/10 px-3.5 py-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/12 text-amber-300">
              <Sparkles size={12} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium leading-5 text-amber-50">
                Want more accurate results? Add a seed reference image.
              </p>
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new CustomEvent('picaro:open-seed-library'))
                }
                className="mt-2 inline-flex items-center rounded-[8px] border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[11px] font-medium text-amber-100 transition-colors hover:border-amber-200/35 hover:bg-amber-200/15"
              >
                Add Seed
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(SEED_HINT_DISMISSED_KEY, 'true');
                seedHintPageIdsRef.current.delete(currentPageId);
                setShowSeedHint(false);
              }}
              className="mt-0.5 shrink-0 text-amber-100/50 transition-colors hover:text-amber-50/90"
              aria-label="Dismiss seed hint"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {procStep > 0 && (
        <div className="shrink-0 border-b border-white/[0.06] bg-[#0a0a0c]/50 px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
              Process
            </span>
            <span className="font-mono text-[10px] font-bold text-[#3b82f6]">
              {procStep}/{GENERATION_STEPS.length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {GENERATION_STEPS.slice(0, procStep).map((step, i) => (
              <div
                key={step}
                className="animate-in fade-in slide-in-from-left-2 flex items-center gap-2 text-[11px] text-white/50 duration-300"
              >
                <Loader2 size={10} className="animate-spin text-[#3b82f6]" />
                <span>{step}</span>
                {i === 0 && detectionResult?.detected_subject && (
                  <span className="text-sky-300">
                    Detected: {detectionResult.detected_subject}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:thin]">
        <div className="shrink-0 bg-[#0a0a0c]/40 px-5 py-5">
          <CharacterSeedPanel
            currentGeneratedImageURL={currentGeneratedImageURL}
          />
        </div>
        <div className="relative mt-auto shrink-0 bg-[#0a0a0c]">
          <AnimatePresence initial={false}>
            {isDrawerOpen && (
              <motion.div
                className="absolute bottom-[100%] left-0 right-0 z-20 flex max-h-[35vh] flex-col overflow-hidden border-t border-white/[0.08] bg-[#0a0a0c]/80 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: '35vh', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6 [scrollbar-width:thin]">
                  {iterations.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center text-white/20">
                      <Sparkles size={24} className="mb-3 opacity-20" />
                      <span className="text-[12px] font-medium tracking-wide">
                        No iterations yet
                      </span>
                    </div>
                  ) : (
                    iterations.map((iter, idx) => (
                      <div
                        key={iter.id}
                        className={`group relative flex cursor-pointer gap-4 ${iter.isRefinement ? 'ml-8' : ''}`}
                        onClick={() => void handleRevertToStep(iter)}
                      >
                        {idx < iterations.length - 1 && (
                          <div className="absolute bottom-[-20px] left-[15px] top-[32px] w-[2px] bg-white/[0.05] transition-colors group-hover:bg-white/[0.1]" />
                        )}
                        {iter.isRefinement && (
                          <div className="absolute left-[-24px] top-[15px] h-[2px] w-[16px] bg-white/[0.05]" />
                        )}
                        <div
                          className={`relative z-10 h-8 w-8 shrink-0 overflow-hidden rounded-[8px] border bg-[#111] transition-all duration-300 hover:scale-110 hover:border-white/30 ${
                            iter.isActive
                              ? 'border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                              : 'border-white/10 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {iter.thumbnailUrl ? (
                            <img
                              src={iter.thumbnailUrl}
                              className="h-full w-full object-cover"
                              alt={iter.prompt}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Sparkles size={12} className="text-white/20" />
                            </div>
                          )}
                        </div>
                        <div
                          className={`flex min-w-0 flex-col justify-center transition-opacity duration-300 ${
                            iter.isActive
                              ? 'opacity-100'
                              : 'opacity-60 group-hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono uppercase tracking-wider ${
                                iter.isActive ? 'text-[#3b82f6]' : 'text-white/40'
                              }`}
                            >
                              {iter.step}
                            </span>
                            {iter.isActive && (
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                            )}
                          </div>
                          <span className="mt-0.5 truncate text-[13px] font-medium text-white/90">
                            {iter.prompt}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="group relative flex h-9 w-full items-center justify-center gap-2 border-t border-white/[0.04] bg-[#0a0a0c] transition-colors hover:bg-[#0d0d10]"
          >
            <ChevronUp
              size={12}
              className={`text-white/30 transition-all duration-300 group-hover:text-white/50 ${
                isDrawerOpen ? 'rotate-180' : ''
              }`}
            />
            <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-white/30 transition-colors group-hover:text-white/50">
              {iterations.length} iterations •{' '}
              {iterations.filter((i) => i.isRefinement).length > 0
                ? '1 branch'
                : '0 branches'}
            </span>
          </button>

          <div className="border-t border-white/[0.02] bg-[#0d0d10] px-5 py-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">
                  Refinement Prompt
                </span>
                <span className="text-[10px] font-mono text-white/20">
                  {text.length}/2000
                </span>
              </div>

              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="rounded-md border border-red-500/20 bg-red-400/10 px-3 py-2 text-[11px] text-red-400"
                  >
                    {errorMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      void handleGenerate();
                      return;
                    }
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="E.g., Make it look like a pencil sketch..."
                  rows={3}
                  className="w-full resize-none rounded-[16px] border border-white/5 bg-white/[0.02] px-4 py-3.5 text-[13px] leading-relaxed text-white/90 transition-all placeholder-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                />
                <button
                  type="button"
                  disabled={!text.trim() || isGenerating || isDetecting}
                  onClick={() => void handleSend()}
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
