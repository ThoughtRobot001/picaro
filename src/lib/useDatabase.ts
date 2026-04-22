import { useEffect, useRef } from 'react';
import { useStore, type CharacterSeed, type Page } from '../store/useStore';
import { useAuth } from './useAuth';
import {
  getOrCreateProject,
  savePage,
  loadPages,
  saveCharacterSeed,
  loadCharacterSeeds,
  deleteCharacterSeed,
} from '../services/database';

export function useDatabase() {
  const { user } = useAuth();
  const projectIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef<string | null>(null);
  const characterSeeds = useStore((state) => state.characterSeeds);

  useEffect(() => {
    if (!user) {
      projectIdRef.current = null;
      hasLoadedRef.current = null;
      return;
    }

    if (hasLoadedRef.current === user.id) return;
    hasLoadedRef.current = user.id;
    void loadUserData(user.id);
  }, [user]);

  const loadUserData = async (userId: string) => {
    const projectId = await getOrCreateProject(userId);
    if (!projectId) return;
    projectIdRef.current = projectId;

    const dbPages = await loadPages(projectId);
    if (dbPages.length > 0) {
      const restoredPages: Page[] = dbPages.map((dbPage) => ({
        id: dbPage.page_number,
        canvasDataURL: dbPage.canvas_data_url,
        prompt: '',
        aiResult: dbPage.ai_result_url,
        timestamp: Date.now(),
      }));

      useStore.setState((state) => ({
        ...state,
        pages: restoredPages,
        currentPageId: restoredPages[0]?.id ?? 1,
      }));
    }

    const dbSeeds = await loadCharacterSeeds(userId);
    if (dbSeeds.length > 0) {
      const restoredSeeds: CharacterSeed[] = dbSeeds.map((seed) => ({
        id: seed.id,
        name: seed.name,
        imageBase64: seed.image_url,
        thumbnail: seed.image_url,
        createdAt: Date.now(),
      }));

      useStore.setState((state) => ({
        ...state,
        characterSeeds: restoredSeeds,
        activeCharacterSeedId:
          restoredSeeds.find((seed) => seed.id === state.activeCharacterSeedId)?.id ??
          state.activeCharacterSeedId,
      }));
    }
  };

  const saveCurrentPage = async (
    pageNumber: number,
    canvasDataURL: string | null,
    aiResultURL: string | null
  ) => {
    if (!user || !projectIdRef.current) return;
    await savePage(
      projectIdRef.current,
      user.id,
      pageNumber,
      canvasDataURL,
      aiResultURL
    );
  };

  const saveSeedToDatabase = async (
    name: string,
    imageBase64: string
  ) => {
    if (!user) return null;
    return saveCharacterSeed(user.id, name, imageBase64);
  };

  const deleteSeedFromDatabase = async (seedId: string) => {
    if (!user) return;
    await deleteCharacterSeed(seedId);
  };

  return {
    projectId: projectIdRef.current,
    saveCurrentPage,
    saveSeedToDatabase,
    deleteSeedFromDatabase,
  };
}
