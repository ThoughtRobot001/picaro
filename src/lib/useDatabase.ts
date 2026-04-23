import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore, type CharacterSeed, type Page } from '../store/useStore';
import { useAuth } from './useAuth';
import {
  createProject,
  deleteCharacterSeed,
  getOrCreateProject,
  listProjects,
  loadCharacterSeeds,
  loadPages,
  saveCharacterSeed,
  savePage,
  updateProjectTitle,
  deletePage,
  deletePageIterations,
  type ProjectSummary,
} from '../services/database';

const DEFAULT_PROJECT_TITLE = 'Untitled Art';

function getLastProjectKey(userId: string) {
  return `picaro:last-project:${userId}`;
}

function getProjectSeedsKey(userId: string, projectId: string) {
  return `picaro:project-seeds:${userId}:${projectId}`;
}

function createBlankPages(): Page[] {
  return [
    {
      id: 1,
      canvasDataURL: null,
      prompt: '',
      aiResult: null,
      timestamp: Date.now(),
    },
  ];
}

function applyPagesToStore(
  dbPages: Array<{
    page_number: number;
    canvas_data_url: string | null;
    ai_result_url: string | null;
  }>
) {
  const restoredPages: Page[] =
    dbPages.length > 0
      ? dbPages.map((dbPage) => ({
          id: dbPage.page_number,
          canvasDataURL: dbPage.canvas_data_url,
          prompt: '',
          aiResult: dbPage.ai_result_url,
          timestamp: Date.now(),
        }))
      : createBlankPages();

  useStore.setState((state) => ({
    ...state,
    pages: restoredPages,
    currentPageId: restoredPages[0]?.id ?? 1,
    generatedImageURL: restoredPages[0]?.aiResult ?? null,
  }));
}

function applySeedsToStore(
  dbSeeds: Array<{
    id: string;
    name: string;
    image_url: string;
  }>
) {
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
      null,
  }));
}

export function useDatabase() {
  const { user } = useAuth();
  const projectIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef<string | null>(null);
  const resetStore = useStore((state) => state.resetStore);
  const setProjectSeedIds = useStore((state) => state.setProjectSeedIds);
  const projectSeedIds = useStore((state) => state.projectSeedIds);

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [currentProjectTitle, setCurrentProjectTitle] = useState(
    DEFAULT_PROJECT_TITLE
  );

  const persistCurrentProjectId = useCallback(
    (userId: string, projectId: string) => {
      localStorage.setItem(getLastProjectKey(userId), projectId);
    },
    []
  );

  const refreshProjects = useCallback(
    async (userId: string, preferredProjectId: string | null = null) => {
      const loadedProjects = await listProjects(userId);
      setProjects(loadedProjects);

      const activeProject =
        loadedProjects.find((project) => project.id === preferredProjectId) ??
        loadedProjects[0] ??
        null;

      if (activeProject) {
        setCurrentProjectTitle(activeProject.title || DEFAULT_PROJECT_TITLE);
      }
    },
    []
  );

  const loadProjectWorkspace = useCallback(
    async (userId: string, project: ProjectSummary) => {
      projectIdRef.current = project.id;
      setCurrentProjectTitle(project.title || DEFAULT_PROJECT_TITLE);
      persistCurrentProjectId(userId, project.id);
      const storedProjectSeeds = localStorage.getItem(
        getProjectSeedsKey(userId, project.id)
      );
      const parsedProjectSeeds = storedProjectSeeds
        ? (JSON.parse(storedProjectSeeds) as string[])
        : [];
      setProjectSeedIds(parsedProjectSeeds);
      useStore.getState().setActiveCharacterSeed(null);

      const dbPages = await loadPages(project.id);
      applyPagesToStore(dbPages);
      await refreshProjects(userId, project.id);
    },
    [persistCurrentProjectId, refreshProjects, setProjectSeedIds]
  );

  const loadUserData = useCallback(
    async (userId: string) => {
      const savedProjectId = localStorage.getItem(getLastProjectKey(userId));
      const project = await getOrCreateProject(
        userId,
        savedProjectId,
        DEFAULT_PROJECT_TITLE
      );
      if (!project) return;

      await loadProjectWorkspace(userId, project);

      const dbSeeds = await loadCharacterSeeds(userId);
      applySeedsToStore(dbSeeds);
    },
    [loadProjectWorkspace]
  );

  useEffect(() => {
    if (!user) {
      projectIdRef.current = null;
      hasLoadedRef.current = null;
      setProjects([]);
      setCurrentProjectTitle(DEFAULT_PROJECT_TITLE);
      resetStore();
      localStorage.removeItem('picaro-store');
      return;
    }

    if (hasLoadedRef.current && hasLoadedRef.current !== user.id) {
      resetStore();
      localStorage.removeItem('picaro-store');
      setProjects([]);
      setCurrentProjectTitle(DEFAULT_PROJECT_TITLE);
    }

    if (hasLoadedRef.current === user.id) return;
    hasLoadedRef.current = user.id;
    void loadUserData(user.id);
  }, [loadUserData, resetStore, user]);

  useEffect(() => {
    if (!user || !projectIdRef.current) return;
    localStorage.setItem(
      getProjectSeedsKey(user.id, projectIdRef.current),
      JSON.stringify(projectSeedIds)
    );
  }, [projectSeedIds, user]);

  const saveCurrentPage = useCallback(
    async (
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
    },
    [user]
  );

  const deletePageFromDatabase = useCallback(
    async (pageNumber: number) => {
      if (!user || !projectIdRef.current) return;
      await deletePageIterations(projectIdRef.current, pageNumber);
      await deletePage(projectIdRef.current, pageNumber);
    },
    [user]
  );

  const createNewProject = useCallback(async (title?: string) => {
    if (!user) return;

    const project = await createProject(
      user.id,
      title?.trim() || DEFAULT_PROJECT_TITLE
    );
    if (!project) return;

    await loadProjectWorkspace(user.id, project);
  }, [loadProjectWorkspace, user]);

  const switchProject = useCallback(
    async (projectId: string) => {
      if (!user || !projectId) return;
      if (projectIdRef.current === projectId) return;

      const project = projects.find((entry) => entry.id === projectId);
      if (!project) return;

      await loadProjectWorkspace(user.id, project);
    },
    [loadProjectWorkspace, projects, user]
  );

  const renameProject = useCallback(
    async (title: string) => {
      if (!user || !projectIdRef.current) return;
      const trimmedTitle = title.trim() || DEFAULT_PROJECT_TITLE;
      setCurrentProjectTitle(trimmedTitle);
      await updateProjectTitle(projectIdRef.current, trimmedTitle);
      await refreshProjects(user.id, projectIdRef.current);
    },
    [refreshProjects, user]
  );

  const saveSeedToDatabase = useCallback(
    async (name: string, imageBase64: string) => {
      if (!user) return null;
      return saveCharacterSeed(user.id, name, imageBase64);
    },
    [user]
  );

  const deleteSeedFromDatabase = useCallback(
    async (seedId: string) => {
      if (!user) return;
      await deleteCharacterSeed(seedId);
    },
    [user]
  );

  return {
    currentProjectId: projectIdRef.current,
    currentProjectTitle,
    projects,
    saveCurrentPage,
    deletePageFromDatabase,
    saveSeedToDatabase,
    deleteSeedFromDatabase,
    createNewProject,
    switchProject,
    renameProject,
  };
}
