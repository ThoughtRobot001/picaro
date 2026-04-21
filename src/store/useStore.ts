import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── TYPES ───────────────────────────────────────────

export interface CharacterSeed {
  id: string;
  name: string;
  imageBase64: string;  // Full base64 for generation
  thumbnail: string;    // Same as imageBase64 for now
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
  // Pages
  pages: Page[];
  currentPageId: number;

  // Drawing tools
  activeTool: 'brush' | 'eraser' | 'text' | 'move' |
              'picker' | 'paint' | 'hand' | 'shape';
  shapeType: 'rect' | 'ellipse' | 'line';
  brushSize: number;
  brushOpacity: number;
  brushColor: string;

  // Undo/redo triggers
  undoCounter: number;
  redoCounter: number;
  canUndo: boolean;
  canRedo: boolean;

  // UI state
  isGenerating: boolean;
  selectedStyle: string;
  generatedImageURL: string | null;

  // Character seeds
  characterSeeds: CharacterSeed[];
  activeCharacterSeedId: string | null;
  maxSeeds: number;

  // Actions - Pages
  addPage: () => void;
  removePage: (id: number) => void;
  switchPage: (id: number) => void;
  updatePageCanvas: (id: number, dataURL: string) => void;
  updatePageResult: (id: number, result: string) => void;

  // Actions - Tools
  setActiveTool: (tool: StoreState['activeTool']) => void;
  setShapeType: (shape: StoreState['shapeType']) => void;
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushColor: (color: string) => void;

  // Actions - Undo/Redo
  triggerUndo: () => void;
  triggerRedo: () => void;
  setCanUndo: (can: boolean) => void;
  setCanRedo: (can: boolean) => void;

  // Actions - UI
  setIsGenerating: (generating: boolean) => void;
  setSelectedStyle: (style: string) => void;
  setGeneratedImageURL: (url: string | null) => void;

  // Actions - Character Seeds
  addCharacterSeed: (
    name: string,
    imageBase64: string
  ) => { success: boolean; error?: string };
  removeCharacterSeed: (id: string) => void;
  setActiveCharacterSeed: (id: string | null) => void;
  renameCharacterSeed: (id: string, name: string) => void;
}

// ─── STORE ───────────────────────────────────────────

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
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

      activeTool: 'brush',
      shapeType: 'rect',
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

      characterSeeds: [],
      activeCharacterSeedId: null,
      maxSeeds: 10,

      // ── Page actions ──────────────────────────────
      addPage: () =>
        set((state) => {
          const newId =
            Math.max(...state.pages.map((p) => p.id), 0) + 1;
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
            state.currentPageId === id
              ? newPages[0].id
              : state.currentPageId;
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

      // ── Tool actions ──────────────────────────────
      setActiveTool: (tool) => set({ activeTool: tool }),
      setShapeType: (shape) => set({ shapeType: shape }),
      setBrushSize: (size) => set({ brushSize: size }),
      setBrushOpacity: (opacity) => set({ brushOpacity: opacity }),
      setBrushColor: (color) => set({ brushColor: color }),

      // ── Undo/Redo ─────────────────────────────────
      triggerUndo: () =>
        set((state) => ({ undoCounter: state.undoCounter + 1 })),
      triggerRedo: () =>
        set((state) => ({ redoCounter: state.redoCounter + 1 })),
      setCanUndo: (can) => set({ canUndo: can }),
      setCanRedo: (can) => set({ canRedo: can }),

      // ── UI ────────────────────────────────────────
      setIsGenerating: (generating) =>
        set({ isGenerating: generating }),
      setSelectedStyle: (style) => set({ selectedStyle: style }),
      setGeneratedImageURL: (url) =>
        set({ generatedImageURL: url }),

      // ── Character Seeds ───────────────────────────
      addCharacterSeed: (name, imageBase64) => {
        const state = get();
        if (state.characterSeeds.length >= state.maxSeeds) {
          return {
            success: false,
            error: `Maximum ${state.maxSeeds} character seeds reached. Delete one to add more.`,
          };
        }
        const newSeed: CharacterSeed = {
          id: `seed-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,
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
          characterSeeds: state.characterSeeds.filter(
            (s) => s.id !== id
          ),
          activeCharacterSeedId:
            state.activeCharacterSeedId === id
              ? null
              : state.activeCharacterSeedId,
        })),

      setActiveCharacterSeed: (id) =>
        set({ activeCharacterSeedId: id }),

      renameCharacterSeed: (id, name) =>
        set((state) => ({
          characterSeeds: state.characterSeeds.map((s) =>
            s.id === id ? { ...s, name } : s
          ),
        })),
    }),

    // ── Persist config ────────────────────────────
    {
      name: 'picaro-store',
      // Only persist these keys to localStorage
      // Do NOT persist canvas ImageData or
      // isGenerating state
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

// ─── SELECTORS ────────────────────────────────────────

export const useCurrentPage = () =>
  useStore((state) =>
    state.pages.find((p) => p.id === state.currentPageId)
  );

export const useActiveCharacterSeed = () =>
  useStore((state) =>
    state.characterSeeds.find(
      (s) => s.id === state.activeCharacterSeedId
    )
  );

export const useCanUndo = () =>
  useStore((state) => state.canUndo);

export const useCanRedo = () =>
  useStore((state) => state.canRedo);
