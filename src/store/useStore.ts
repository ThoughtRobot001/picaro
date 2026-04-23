import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CharacterSeed {
  id: string;
  name: string;
  imageBase64: string;  // Base64 for unsaved/local seeds, URL for persisted seeds
  thumbnail: string;
  createdAt: number;
}

export interface Page {
  id: number;
  canvasDataURL: string | null;
  prompt: string;
  aiResult: string | null;
  timestamp: number;
}

interface StoreState {
  pages: Page[];
  currentPageId: number;

  activeTool: 'brush' | 'eraser' | 'text' | 'move' | 'picker' | 'paint' | 'hand' | 'shape';
  shapeType: 'rect' | 'ellipse' | 'line';
  brushSize: number;
  brushOpacity: number;
  brushColor: string;

  undoCounter: number;
  redoCounter: number;
  canUndo: boolean;
  canRedo: boolean;

  isGenerating: boolean;
  selectedStyle: string;
  generatedImageURL: string | null;

  characterSeeds: CharacterSeed[];
  projectSeedIds: string[];
  activeCharacterSeedId: string | null;
  maxSeeds: number;

  addPage: () => void;
  removePage: (id: number) => void;
  switchPage: (id: number) => void;
  updatePageCanvas: (id: number, dataURL: string) => void;
  updatePageResult: (id: number, result: string) => void;

  setActiveTool: (tool: StoreState['activeTool']) => void;
  setShapeType: (shape: StoreState['shapeType']) => void;
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushColor: (color: string) => void;

  triggerUndo: () => void;
  triggerRedo: () => void;
  setCanUndo: (can: boolean) => void;
  setCanRedo: (can: boolean) => void;

  setIsGenerating: (generating: boolean) => void;
  setSelectedStyle: (style: string) => void;
  setGeneratedImageURL: (url: string | null) => void;

  addCharacterSeed: (name: string, imageBase64: string) => { success: boolean; error?: string };
  removeCharacterSeed: (id: string) => void;
  setProjectSeedIds: (ids: string[]) => void;
  addProjectSeed: (id: string) => void;
  removeProjectSeed: (id: string) => void;
  setActiveCharacterSeed: (id: string | null) => void;
  renameCharacterSeed: (id: string, name: string) => void;
  resetStore: () => void;
}

const createInitialState = () => ({
  pages: [
    {
      id: 1,
      canvasDataURL: null,
      prompt: '',
      aiResult: null,
      timestamp: Date.now(),
    },
  ],
  currentPageId: 1,

  activeTool: 'brush' as const,
  shapeType: 'rect' as const,
  brushSize: 4,
  brushOpacity: 1,
  brushColor: '#000000',

  undoCounter: 0,
  redoCounter: 0,
  canUndo: false,
  canRedo: false,

  isGenerating: false,
  selectedStyle: 'photorealistic',
  generatedImageURL: null,

  characterSeeds: [] as CharacterSeed[],
  projectSeedIds: [] as string[],
  activeCharacterSeedId: null as string | null,
  maxSeeds: 10,
});

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      addPage: () =>
        set((state) => {
          const newId = Math.max(...state.pages.map((p) => p.id), 0) + 1;
          return {
            pages: [
              ...state.pages,
              {
                id: newId,
                canvasDataURL: null,
                prompt: '',
                aiResult: null,
                timestamp: Date.now(),
              },
            ],
            currentPageId: newId,
          };
        }),

      removePage: (id) =>
        set((state) => {
          if (state.pages.length <= 1) return state;
          const newPages = state.pages.filter((p) => p.id !== id);
          const newCurrentId =
            state.currentPageId === id ? newPages[0].id : state.currentPageId;
          return { pages: newPages, currentPageId: newCurrentId };
        }),

      switchPage: (id) => set({ currentPageId: id }),

      updatePageCanvas: (id, dataURL) =>
        set((state) => ({
          pages: state.pages.map((p) =>
            p.id === id ? { ...p, canvasDataURL: dataURL } : p
          ),
        })),

      updatePageResult: (id, result) =>
        set((state) => ({
          pages: state.pages.map((p) =>
            p.id === id ? { ...p, aiResult: result } : p
          ),
        })),

      setActiveTool: (tool) => set({ activeTool: tool }),
      setShapeType: (shape) => set({ shapeType: shape }),
      setBrushSize: (size) => set({ brushSize: size }),
      setBrushOpacity: (opacity) => set({ brushOpacity: opacity }),
      setBrushColor: (color) => set({ brushColor: color }),

      triggerUndo: () => set((state) => ({ undoCounter: state.undoCounter + 1 })),
      triggerRedo: () => set((state) => ({ redoCounter: state.redoCounter + 1 })),
      setCanUndo: (can) => set({ canUndo: can }),
      setCanRedo: (can) => set({ canRedo: can }),

      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setSelectedStyle: (style) => set({ selectedStyle: style }),
      setGeneratedImageURL: (url) => set({ generatedImageURL: url }),

      addCharacterSeed: (name, imageBase64) => {
        const state = get();
        if (state.characterSeeds.length >= state.maxSeeds) {
          return {
            success: false,
            error: `Maximum ${state.maxSeeds} character seeds reached. Delete one to add more.`,
          };
        }

        const newSeed: CharacterSeed = {
          id: `seed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: name.trim() || 'Untitled Character',
          imageBase64,
          thumbnail: imageBase64,
          createdAt: Date.now(),
        };

        set((state) => ({
          characterSeeds: [...state.characterSeeds, newSeed],
          activeCharacterSeedId: newSeed.id,
        }));

        return { success: true };
      },

      removeCharacterSeed: (id) =>
        set((state) => ({
          characterSeeds: state.characterSeeds.filter((s) => s.id !== id),
          projectSeedIds: state.projectSeedIds.filter((seedId) => seedId !== id),
          activeCharacterSeedId:
            state.activeCharacterSeedId === id ? null : state.activeCharacterSeedId,
        })),

      setProjectSeedIds: (ids) => set({ projectSeedIds: ids }),

      addProjectSeed: (id) =>
        set((state) => ({
          projectSeedIds: state.projectSeedIds.includes(id)
            ? state.projectSeedIds
            : [...state.projectSeedIds, id],
        })),

      removeProjectSeed: (id) =>
        set((state) => ({
          projectSeedIds: state.projectSeedIds.filter((seedId) => seedId !== id),
          activeCharacterSeedId:
            state.activeCharacterSeedId === id ? null : state.activeCharacterSeedId,
        })),

      setActiveCharacterSeed: (id) => set({ activeCharacterSeedId: id }),

      renameCharacterSeed: (id, name) =>
        set((state) => ({
          characterSeeds: state.characterSeeds.map((s) =>
            s.id === id ? { ...s, name } : s
          ),
        })),

      resetStore: () => set(createInitialState()),
    }),
    {
      name: 'picaro-store',
      partialize: (state) => ({
        characterSeeds: state.characterSeeds,
        selectedStyle: state.selectedStyle,
        brushColor: state.brushColor,
        brushSize: state.brushSize,
        brushOpacity: state.brushOpacity,
        activeCharacterSeedId: state.activeCharacterSeedId,
      }),
    }
  )
);

export const useCurrentPage = () =>
  useStore((state) => state.pages.find((p) => p.id === state.currentPageId));

export const useActiveCharacterSeed = () =>
  useStore((state) =>
    state.characterSeeds.find((s) => s.id === state.activeCharacterSeedId)
  );

export const useCanUndo = () => useStore((state) => state.canUndo);

export const useCanRedo = () => useStore((state) => state.canRedo);
