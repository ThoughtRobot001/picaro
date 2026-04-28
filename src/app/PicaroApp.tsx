import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/useAuth';
import { useStore } from '../store/useStore';
import { useDatabase } from '../lib/useDatabase';
import { PicaroCanvas } from '../components/canvas/PicaroCanvas';
import { OutputPanel } from '../components/output/OutputPanel';
import { PromptPanel } from '../components/prompt/PromptPanel';
import { TopBar } from '../components/toolbar/TopBar';
import { LeftToolbar } from '../components/toolbar/LeftToolbar';
import { Filmstrip } from '../components/filmstrip/Filmstrip';

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function PicaroApp() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // ── All hooks must be declared before any early return ──────────────────
  const canvasExportRef = useRef<Record<number, string>>({});
  const saveTimeoutRef = useRef<number | null>(null);
  const temporaryToolRef = useRef<null | 'brush' | 'eraser' | 'text' | 'move' | 'picker' | 'paint' | 'hand' | 'shape'>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const {
    selectedStyle,
    setSelectedStyle,
    setGeneratedImageURL,
    generatedImageURL,
    currentPageId,
    pages,
    addPage,
    switchPage,
    activeTool,
    setActiveTool,
    setShapeType,
    brushSize,
    brushOpacity,
    setBrushSize,
    setBrushOpacity,
    characterSeeds,
    projectSeedIds,
    setActiveCharacterSeed,
    canUndo,
    canRedo,
    triggerUndo,
    triggerRedo,
    isLeftPanelOpen,
    isRightPanelOpen,
    isBottomPanelOpen,
  } = useStore();
  const {
    currentProjectId,
    currentProjectTitle,
    projects,
    saveCurrentPage,
    createNewProject,
    switchProject,
    renameProject,
    deletePageFromDatabase,
    deleteProjectFromDatabase,
  } = useDatabase();

  const orderedPageIds = useMemo(
    () => [...pages].sort((a, b) => a.id - b.id).map((page) => page.id),
    [pages]
  );
  const usedProjectSeeds = useMemo(
    () => characterSeeds.filter((seed) => projectSeedIds.includes(seed.id)),
    [characterSeeds, projectSeedIds]
  );

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    canvasExportRef.current = {};
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, [currentProjectId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const editableTarget = isEditableTarget(event.target);
      const key = event.key.toLowerCase();
      const isPrimaryModifier = event.ctrlKey || event.metaKey;

      if (event.key === 'Escape') {
        if (shortcutsOpen) {
          setShortcutsOpen(false);
          event.preventDefault();
          return;
        }
        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLElement) {
          activeElement.blur();
          event.preventDefault();
        }
        return;
      }

      if (isPrimaryModifier && key === 'enter') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('picaro:generate-from-sketch'));
        return;
      }

      if (editableTarget) return;

      if (key === ' ') {
        if (temporaryToolRef.current === null && activeTool !== 'hand') {
          temporaryToolRef.current = activeTool;
          setActiveTool('hand');
        }
        event.preventDefault();
        return;
      }

      if (event.altKey) {
        if (key >= '1' && key <= '9') {
          const seed = usedProjectSeeds[Number(key) - 1];
          if (seed) {
            setActiveCharacterSeed(seed.id);
            event.preventDefault();
          }
          return;
        }

        if (key === '0') {
          setActiveCharacterSeed(null);
          event.preventDefault();
          return;
        }
      }

      if (!isPrimaryModifier) {
        if (key === 'n') {
          addPage();
          event.preventDefault();
          return;
        }

        if (key === '?') {
          setShortcutsOpen(true);
          event.preventDefault();
          return;
        }

        if (event.shiftKey) {
          if (key === '{') {
            setBrushOpacity(
              clamp(Number((brushOpacity - 0.05).toFixed(2)), 0.05, 1)
            );
            event.preventDefault();
            return;
          }

          if (key === '}') {
            setBrushOpacity(
              clamp(Number((brushOpacity + 0.05).toFixed(2)), 0.05, 1)
            );
            event.preventDefault();
            return;
          }
        }

        switch (key) {
          case 'b':
            setActiveTool('brush');
            event.preventDefault();
            return;
          case 'e':
            setActiveTool('eraser');
            event.preventDefault();
            return;
          case 't':
            setActiveTool('text');
            event.preventDefault();
            return;
          case 'v':
            setActiveTool('move');
            event.preventDefault();
            return;
          case 'h':
            setActiveTool('hand');
            event.preventDefault();
            return;
          case 'i':
            setActiveTool('picker');
            event.preventDefault();
            return;
          case 'g':
            setActiveTool('paint');
            event.preventDefault();
            return;
          case 'r':
            setShapeType('rect');
            setActiveTool('shape');
            event.preventDefault();
            return;
          case 'o':
            setShapeType('ellipse');
            setActiveTool('shape');
            event.preventDefault();
            return;
          case 'l':
            setShapeType('line');
            setActiveTool('shape');
            event.preventDefault();
            return;
          case '[':
            setBrushSize(clamp(brushSize - 1, 1, 50));
            event.preventDefault();
            return;
          case ']':
            setBrushSize(clamp(brushSize + 1, 1, 50));
            event.preventDefault();
            return;
          default:
            return;
        }
      }

      if (event.shiftKey && (key === 's')) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('picaro:open-export'));
        return;
      }

      if (event.shiftKey && (key === ']' || key === '}')) {
        const currentIndex = orderedPageIds.indexOf(currentPageId);
        const nextPageId =
          currentIndex >= 0
            ? orderedPageIds[Math.min(currentIndex + 1, orderedPageIds.length - 1)]
            : null;
        if (nextPageId && nextPageId !== currentPageId) {
          switchPage(nextPageId);
        }
        event.preventDefault();
        return;
      }

      if (event.shiftKey && (key === '[' || key === '{')) {
        const currentIndex = orderedPageIds.indexOf(currentPageId);
        const previousPageId =
          currentIndex >= 0
            ? orderedPageIds[Math.max(currentIndex - 1, 0)]
            : null;
        if (previousPageId && previousPageId !== currentPageId) {
          switchPage(previousPageId);
        }
        event.preventDefault();
        return;
      }

      if (key === '0') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('picaro:zoom-reset'));
        return;
      }

      if (key === '=' || key === '+') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('picaro:zoom-in'));
        return;
      }

      if (key === '-') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('picaro:zoom-out'));
        return;
      }

      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          if (canRedo) triggerRedo();
          return;
        }
        if (canUndo) triggerUndo();
        return;
      }

      if (key === 'y') {
        event.preventDefault();
        if (canRedo) triggerRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTool,
    addPage,
    brushOpacity,
    brushSize,
    canRedo,
    canUndo,
    currentPageId,
    orderedPageIds,
    projectSeedIds,
    setBrushOpacity,
    setBrushSize,
    setActiveCharacterSeed,
    setActiveTool,
    setShapeType,
    shortcutsOpen,
    switchPage,
    triggerRedo,
    triggerUndo,
    usedProjectSeeds,
  ]);

  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== ' ') return;
      if (temporaryToolRef.current === null) return;

      setActiveTool(temporaryToolRef.current);
      temporaryToolRef.current = null;
      event.preventDefault();
    };

    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [setActiveTool]);

  const queuePageSave = useCallback(
    (pageNumber: number, canvasDataURL: string | null, aiResultURL: string | null) => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = window.setTimeout(() => {
        // Guard against race condition: don't save if the page was just deleted locally
        const pageStillExists = useStore.getState().pages.some((p) => p.id === pageNumber);
        if (pageStillExists) {
          void saveCurrentPage(pageNumber, canvasDataURL, aiResultURL);
        }
        saveTimeoutRef.current = null;
      }, 600);
    },
    [saveCurrentPage]
  );

  const handleCanvasExport = useCallback(
    (dataURL: string) => {
      canvasExportRef.current[currentPageId] = dataURL;
      const page = pages.find((p) => p.id === currentPageId);
      queuePageSave(
        currentPageId,
        dataURL,
        page?.aiResult ?? null
      );
    },
    [currentPageId, pages, queuePageSave]
  );

  const handleGenerated = useCallback(
    (url: string) => {
      setGeneratedImageURL(url);
      const page = pages.find((p) => p.id === currentPageId);
      queuePageSave(
        currentPageId,
        page?.canvasDataURL ?? null,
        url
      );
    },
    [setGeneratedImageURL, currentPageId, pages, queuePageSave]
  );

  const getCanvasDataURL = useCallback(() => {
    const cached = canvasExportRef.current[currentPageId];
    if (cached) return cached;

    const page = pages.find((p) => p.id === currentPageId);
    return page?.canvasDataURL ?? null;
  }, [currentPageId, pages]);

  const currentPage = pages.find((p) => p.id === currentPageId);

  // Guard: render nothing while auth is resolving or user is not signed in
  if (loading || !user) return null;

  return (
    <div 
      className="flex h-screen w-full flex-col overflow-hidden bg-[#050505] relative z-0"
      style={{ boxShadow: 'inset 0 0 120px 0 rgba(0, 210, 255, 0.1)' }}
    >
      <TopBar
        projectTitle={currentProjectTitle}
        projects={projects}
        currentProjectId={currentProjectId}
        onCreateProject={createNewProject}
        onProjectRename={renameProject}
        onProjectSwitch={switchProject}
        onProjectDelete={deleteProjectFromDatabase}
      />

      <div className="flex flex-row flex-1 min-h-0 overflow-hidden">
        <AnimatePresence initial={false}>
          {isLeftPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 52, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="shrink-0 flex overflow-hidden"
            >
              <LeftToolbar />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden">
          {/* Small Canvas Toolbar */}
          <div className="flex h-10 shrink-0 items-center border-b border-white/[0.04] bg-[#0a0a0c] px-4 shadow-sm">
            {/* Reserved for future canvas-specific tools or breadcrumbs */}
          </div>

          <div className="flex min-h-0 flex-1 flex-row gap-3 p-3">
            <PicaroCanvas onExport={handleCanvasExport} />
            <OutputPanel
              generatedImageURL={currentPage?.aiResult ?? generatedImageURL}
              selectedStyle={selectedStyle}
              onStyleChange={setSelectedStyle}
            />
          </div>

          <AnimatePresence initial={false}>
            {isBottomPanelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="shrink-0 flex flex-col overflow-hidden"
              >
                <Filmstrip deletePageFromDatabase={deletePageFromDatabase} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          {isRightPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="shrink-0 flex self-stretch overflow-hidden"
            >
              <PromptPanel
                getCanvasDataURL={getCanvasDataURL}
                onGenerated={handleGenerated}
                selectedStyle={selectedStyle}
                currentGeneratedImageURL={currentPage?.aiResult ?? generatedImageURL}
                currentProjectId={currentProjectId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {shortcutsOpen && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-[560px] rounded-[20px] border border-white/10 bg-[#0b0b0d] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-semibold text-white">
                  Keyboard Shortcuts
                </h2>
                <p className="mt-1 text-[12px] text-white/45">
                  Press Esc to close
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShortcutsOpen(false)}
                className="rounded-md border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/55 transition-colors hover:border-white/20 hover:text-white/80"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Ctrl/Cmd + Z', 'Undo'],
                ['Ctrl/Cmd + Y', 'Redo'],
                ['Ctrl/Cmd + Shift + Z', 'Redo'],
                ['Cmd/Ctrl + Enter', 'Generate from sketch'],
                ['B / E / T / V / H / I / G', 'Switch drawing tools'],
                ['R / O / L', 'Rectangle / ellipse / line'],
                ['Space (hold)', 'Temporary hand tool'],
                ['[ / ]', 'Decrease / increase brush size'],
                ['Shift + [ / ]', 'Decrease / increase opacity'],
                ['Ctrl/Cmd + + / -', 'Zoom in / out'],
                ['Ctrl/Cmd + 0', 'Reset zoom'],
                ['N', 'New page'],
                ['Ctrl/Cmd + Shift + [ / ]', 'Previous / next page'],
                ['Alt + 1..9', 'Select character seed'],
                ['Alt + 0', 'Clear active seed'],
                ['Ctrl/Cmd + Shift + S', 'Open export'],
                ['?', 'Open shortcut help'],
                ['Esc', 'Close overlays / blur active input'],
              ].map(([combo, action]) => (
                <div
                  key={combo}
                  className="flex items-center justify-between rounded-[12px] border border-white/6 bg-white/[0.02] px-3 py-2.5"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/55">
                    {combo}
                  </span>
                  <span className="text-[12px] text-white/80">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
