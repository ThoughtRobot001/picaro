import React, { useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useDatabase } from '../lib/useDatabase';
import { PicaroCanvas } from '../components/canvas/PicaroCanvas';
import { OutputPanel } from '../components/output/OutputPanel';
import { PromptPanel } from '../components/prompt/PromptPanel';
import { TopBar } from '../components/toolbar/TopBar';
import { LeftToolbar } from '../components/toolbar/LeftToolbar';
import { Filmstrip } from '../components/filmstrip/Filmstrip';

export default function PicaroApp() {
  const {
    selectedStyle,
    setSelectedStyle,
    setGeneratedImageURL,
    generatedImageURL,
    currentPageId,
    pages,
  } = useStore();
  const { saveCurrentPage } = useDatabase();

  const canvasExportRef = useRef<Record<number, string>>({});

  const handleCanvasExport = useCallback(
    (dataURL: string) => {
      canvasExportRef.current[currentPageId] = dataURL;
      const page = pages.find((p) => p.id === currentPageId);
      void saveCurrentPage(
        currentPageId,
        dataURL,
        page?.aiResult ?? null
      );
    },
    [currentPageId, pages, saveCurrentPage]
  );

  const handleGenerated = useCallback(
    (url: string) => {
      setGeneratedImageURL(url);
      const page = pages.find((p) => p.id === currentPageId);
      void saveCurrentPage(
        currentPageId,
        page?.canvasDataURL ?? null,
        url
      );
    },
    [setGeneratedImageURL, currentPageId, pages, saveCurrentPage]
  );

  const getCanvasDataURL = useCallback(() => {
    const cached = canvasExportRef.current[currentPageId];
    if (cached) return cached;

    const page = pages.find((p) => p.id === currentPageId);
    return page?.canvasDataURL ?? null;
  }, [currentPageId, pages]);

  const currentPage = pages.find((p) => p.id === currentPageId);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#050506]">
      <TopBar />

      <div className="flex flex-row flex-1 min-h-0 overflow-hidden">
        <LeftToolbar />

        <div className="flex min-w-0 flex-1 flex-col min-h-0 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-row gap-3 p-3">
            <PicaroCanvas onExport={handleCanvasExport} />
            <OutputPanel
              generatedImageURL={currentPage?.aiResult ?? generatedImageURL}
              selectedStyle={selectedStyle}
              onStyleChange={setSelectedStyle}
            />
          </div>

          <Filmstrip />
        </div>

        <div className="shrink-0 flex self-stretch pt-3 pb-0 pr-3">
          <PromptPanel
            getCanvasDataURL={getCanvasDataURL}
            onGenerated={handleGenerated}
            selectedStyle={selectedStyle}
            currentGeneratedImageURL={currentPage?.aiResult ?? generatedImageURL}
          />
        </div>
      </div>
    </div>
  );
}
