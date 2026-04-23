import { supabase } from '../lib/supabase';

export interface ProjectSummary {
  id: string;
  title: string;
  updated_at: string;
}

export async function getProjectById(
  userId: string,
  projectId: string
): Promise<ProjectSummary | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, updated_at')
    .eq('user_id', userId)
    .eq('id', projectId)
    .maybeSingle();

  if (error) {
    console.error('Error loading project:', error);
    return null;
  }

  return data;
}

export async function listProjects(
  userId: string
): Promise<ProjectSummary[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error loading projects:', error);
    return [];
  }

  return data ?? [];
}

export async function createProject(
  userId: string,
  title: string = 'Untitled Art'
): Promise<ProjectSummary | null> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: userId, title })
    .select('id, title, updated_at')
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return null;
  }

  return data;
}

export async function getOrCreateProject(
  userId: string,
  preferredProjectId: string | null = null,
  title: string = 'Untitled Art'
): Promise<ProjectSummary | null> {
  if (preferredProjectId) {
    const preferredProject = await getProjectById(
      userId,
      preferredProjectId
    );
    if (preferredProject) {
      return preferredProject;
    }
  }

  const existingProjects = await listProjects(userId);
  if (existingProjects.length > 0) {
    return existingProjects[0];
  }

  return createProject(userId, title);
}

export async function updateProjectTitle(
  projectId: string,
  title: string
): Promise<void> {
  await supabase
    .from('projects')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', projectId);
}

export async function savePage(
  projectId: string,
  userId: string,
  pageNumber: number,
  canvasDataURL: string | null,
  aiResultURL: string | null
): Promise<void> {
  const { error } = await supabase
    .from('pages')
    .upsert(
      {
        project_id: projectId,
        user_id: userId,
        page_number: pageNumber,
        canvas_data_url: canvasDataURL,
        ai_result_url: aiResultURL,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id,page_number' }
    );

  if (error) {
    console.error('Error saving page:', error);
  }
}

export async function loadPages(
  projectId: string
): Promise<Array<{
  page_number: number;
  canvas_data_url: string | null;
  ai_result_url: string | null;
}>> {
  const { data, error } = await supabase
    .from('pages')
    .select('page_number, canvas_data_url, ai_result_url')
    .eq('project_id', projectId)
    .order('page_number', { ascending: true });

  if (error) {
    console.error('Error loading pages:', error);
    return [];
  }

  return data ?? [];
}

export async function deletePage(
  projectId: string,
  pageNumber: number
): Promise<void> {
  await supabase
    .from('pages')
    .delete()
    .eq('project_id', projectId)
    .eq('page_number', pageNumber);
}

export async function saveCharacterSeed(
  userId: string,
  name: string,
  imageBase64: string
): Promise<{ id: string; imageURL: string } | null> {
  const filename = `${userId}/seeds/${Date.now()}.png`;

  const base64Data = imageBase64.split(',')[1];
  if (!base64Data) {
    console.error('Seed upload error: invalid base64 data');
    return null;
  }

  const byteCharacters = atob(base64Data);
  const byteArray = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }
  const blob = new Blob([byteArray], { type: 'image/png' });

  const { error: uploadError } = await supabase.storage
    .from('picaro-images')
    .upload(filename, blob, {
      contentType: 'image/png',
      upsert: false,
    });

  if (uploadError) {
    console.error('Seed upload error:', uploadError);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('picaro-images')
    .getPublicUrl(filename);

  const imageURL = urlData.publicUrl;

  const { data, error } = await supabase
    .from('character_seeds')
    .insert({
      user_id: userId,
      name,
      image_url: imageURL,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving seed:', error);
    return null;
  }

  return {
    id: data.id,
    imageURL,
  };
}

export async function loadCharacterSeeds(
  userId: string
): Promise<Array<{
  id: string;
  name: string;
  image_url: string;
}>> {
  const { data, error } = await supabase
    .from('character_seeds')
    .select('id, name, image_url')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading seeds:', error);
    return [];
  }

  return data ?? [];
}

export async function deleteCharacterSeed(seedId: string): Promise<void> {
  const { error } = await supabase
    .from('character_seeds')
    .delete()
    .eq('id', seedId);

  if (error) {
    console.error('Error deleting seed:', error);
  }
}

export async function saveIteration(
  userId: string,
  projectId: string,
  pageNumber: number,
  iteration: {
    id: string;
    step: string;
    prompt: string;
    thumbnailUrl: string | null;
    isRefinement: boolean;
    isActive: boolean;
  }
): Promise<void> {
  if (iteration.isActive) {
    await supabase
      .from('iterations')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .eq('page_number', pageNumber);
  }

  await supabase.from('iterations').upsert({
    id: iteration.id,
    user_id: userId,
    project_id: projectId,
    page_number: pageNumber,
    step: iteration.step,
    prompt: iteration.prompt,
    thumbnail_url: iteration.thumbnailUrl,
    is_refinement: iteration.isRefinement,
    is_active: iteration.isActive,
  });
}

export async function loadIterations(
  projectId: string,
  pageNumber: number
): Promise<Array<{
  id: string;
  step: string;
  prompt: string;
  thumbnail_url: string | null;
  is_refinement: boolean;
  is_active: boolean;
}>> {
  const { data, error } = await supabase
    .from('iterations')
    .select(
      'id, step, prompt, thumbnail_url, ' +
      'is_refinement, is_active'
    )
    .eq('project_id', projectId)
    .eq('page_number', pageNumber)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading iterations:', error);
    return [];
  }
  return data ?? [];
}

export async function deletePageIterations(
  projectId: string,
  pageNumber: number
): Promise<void> {
  await supabase
    .from('iterations')
    .delete()
    .eq('project_id', projectId)
    .eq('page_number', pageNumber);
}
