import React, { useRef, useState } from 'react';
import { Plus, Trash2, Upload, Check, X, ChevronDown, ChevronRight, MoreVertical } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useStore } from '../../store/useStore';
import { useDatabase } from '../../lib/useDatabase';

interface CharacterSeedPanelProps {
  currentGeneratedImageURL: string | null;
}

async function imageURLToBase64(url: string): Promise<string> {
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const CharacterSeedPanel: React.FC<CharacterSeedPanelProps> = ({
  currentGeneratedImageURL,
}) => {
  const {
    characterSeeds,
    projectSeedIds,
    activeCharacterSeedId,
    maxSeeds,
    addCharacterSeed,
    removeCharacterSeed,
    addProjectSeed,
    removeProjectSeed,
    setActiveCharacterSeed,
  } = useStore();
  const { saveSeedToDatabase, deleteSeedFromDatabase } = useDatabase();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [namingState, setNamingState] = useState<{
    imageBase64: string;
    defaultName: string;
  } | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [seedToDelete, setSeedToDelete] = useState<string | null>(null);

  const atLimit = characterSeeds.length >= maxSeeds;
  const usedInProjectSeeds = characterSeeds.filter((seed) =>
    projectSeedIds.includes(seed.id)
  );
  const librarySeeds = characterSeeds.filter(
    (seed) => !projectSeedIds.includes(seed.id)
  );

  const handleSaveGenerated = async () => {
    if (!currentGeneratedImageURL) return;
    setSaving(true);
    setError(null);
    try {
      const base64 = await imageURLToBase64(currentGeneratedImageURL);
      setNamingState({
        imageBase64: base64,
        defaultName: 'Character',
      });
      setNameInput('');
    } catch {
      setError('Failed to save image. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const base64 = await fileToBase64(file);
      setNamingState({
        imageBase64: base64,
        defaultName: file.name.replace(/\.[^.]+$/, ''),
      });
      setNameInput('');
    } catch {
      setError('Failed to read file. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!namingState) return;
    const name = nameInput.trim() || namingState.defaultName;
    setSaving(true);
    setError(null);

    try {
      const savedSeed = await saveSeedToDatabase(name, namingState.imageBase64);

      if (savedSeed) {
        useStore.setState((state) => ({
          ...state,
          characterSeeds: [
            {
              id: savedSeed.id,
              name,
              imageBase64: savedSeed.imageURL,
              thumbnail: savedSeed.imageURL,
              createdAt: Date.now(),
              },
              ...state.characterSeeds.filter((seed) => seed.id !== savedSeed.id),
            ],
            projectSeedIds: state.projectSeedIds.includes(savedSeed.id)
              ? state.projectSeedIds
              : [...state.projectSeedIds, savedSeed.id],
            activeCharacterSeedId: savedSeed.id,
          }));
      } else {
        const result = addCharacterSeed(name, namingState.imageBase64);
        if (!result.success) {
          setError(result.error ?? 'Failed to save seed.');
          setSaving(false);
          return;
        }
      }

      setNamingState(null);
      setNameInput('');
    } catch {
      setError('Failed to save seed. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelNaming = () => {
    setNamingState(null);
    setNameInput('');
    setError(null);
  };

  const handleDeleteSeed = async (seedId: string) => {
    await deleteSeedFromDatabase(seedId);
    removeCharacterSeed(seedId);
  };

  const handleDeleteSeedConfirm = async () => {
    if (!seedToDelete) return;
    setSaving(true);
    await handleDeleteSeed(seedToDelete);
    setSaving(false);
    setSeedToDelete(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
          Character Seeds
        </span>
        <span className="text-[9px] font-mono tracking-widest text-white/30">
          {characterSeeds.length}/{maxSeeds}
        </span>
      </div>

      {error && (
        <div className="text-[11px] text-red-400 bg-red-400/10 rounded-md px-2 py-1.5">
          {error}
        </div>
      )}

      {namingState && (
        <div className="flex flex-col gap-2 p-2 rounded-lg border border-white/10 bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <img
              src={namingState.imageBase64}
              alt="New seed"
              className="w-10 h-10 rounded-md object-cover shrink-0"
            />
            <input
              autoFocus
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleConfirmSave();
                }
                if (e.key === 'Escape') handleCancelNaming();
              }}
              placeholder={namingState.defaultName}
              className="flex-1 bg-[#111] border border-white/10 rounded-md px-2 py-1 text-[12px] text-white placeholder-white/20 outline-none focus:border-white/25"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => void handleConfirmSave()}
              className="flex-1 flex items-center justify-center gap-1 h-7 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/30 transition-colors"
            >
              <Check size={11} />
              Save
            </button>
            <button
              type="button"
              onClick={handleCancelNaming}
              className="flex items-center justify-center w-7 h-7 rounded-md bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 transition-colors"
            >
              <X size={11} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">
            Used in this project
          </span>
          <span className="text-[9px] font-mono font-medium text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded-sm">
            {usedInProjectSeeds.length}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveCharacterSeed(null)}
            className={`flex flex-col items-center justify-center aspect-square rounded-[10px] border text-[10px] font-medium transition-all ${
              activeCharacterSeedId === null
                ? 'border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)]'
                : 'border-white/[0.06] bg-white/[0.01] text-white/40 hover:bg-white/[0.03] hover:text-white/60 hover:border-white/[0.15]'
            }`}
          >
            <span className="text-lg leading-none mb-1 opacity-80">✦</span>
            <span className="tracking-wide">None</span>
          </button>

          {usedInProjectSeeds.length === 0 && (
            <div className="col-span-2 flex min-h-[88px] items-center justify-center rounded-[10px] border border-dashed border-white/[0.08] bg-white/[0.01] px-3 text-center text-[10px] text-white/30">
              No seeds in use yet.
            </div>
          )}

          {usedInProjectSeeds.map((seed) => (
            <div
              key={seed.id}
              className={`relative aspect-square rounded-[12px] border overflow-hidden cursor-pointer transition-all group ${
                activeCharacterSeedId === seed.id
                  ? 'border-emerald-500/70 ring-2 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'border-white/10 hover:border-white/20 hover:shadow-lg'
              }`}
              onClick={() =>
                setActiveCharacterSeed(
                  activeCharacterSeedId === seed.id ? null : seed.id
                )
              }
            >
              <img
                src={seed.thumbnail}
                alt={seed.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-6 pb-2 px-2.5">
                <p className="text-[10px] font-medium text-white/90 truncate drop-shadow-md">
                  {seed.name}
                </p>
              </div>
              {activeCharacterSeedId === seed.id && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check size={9} className="text-white" />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeProjectSeed(seed.id);
                }}
                className="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-md bg-black/60 opacity-0 transition-opacity hover:bg-white/20 group-hover:opacity-100"
                title="Remove from this project"
              >
                <X size={9} className="text-white" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsLibraryOpen(!isLibraryOpen)}
          className="flex w-full items-center justify-between pt-4 pb-1 hover:opacity-80 transition-opacity group"
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              size={12}
              className={`text-white/30 transition-transform duration-200 ${
                isLibraryOpen ? '' : '-rotate-90'
              }`}
            />
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30 group-hover:text-white/50 transition-colors">
              Your Library
            </span>
          </div>
          <span className="text-[9px] font-mono font-medium text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded-sm">
            {librarySeeds.length}
          </span>
        </button>

        {isLibraryOpen && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {librarySeeds.map((seed) => (
                <div
                  key={seed.id}
                  className="relative aspect-square rounded-[12px] border border-white/10 overflow-hidden cursor-pointer transition-all group hover:border-white/30 hover:shadow-lg"
                  onClick={() => {
                    addProjectSeed(seed.id);
                    setActiveCharacterSeed(seed.id);
                  }}
                >
                  <img
                    src={seed.thumbnail}
                    alt={seed.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-70 group-hover:opacity-100"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-6 pb-2 px-2.5">
                    <p className="text-[10px] font-medium text-white/90 truncate drop-shadow-md">
                      {seed.name}
                    </p>
                  </div>
                  <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/45 to-transparent px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="inline-flex rounded bg-black/60 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.14em] text-white/80">
                      Use here
                    </span>
                  </div>
                  <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button
                          type="button"
                          className="flex h-5 w-5 items-center justify-center rounded-md bg-black/60 hover:bg-black/80 text-white/70 hover:text-white transition-colors"
                        >
                          <MoreVertical size={9} />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          align="start"
                          sideOffset={4}
                          className="z-[200] min-w-[140px] rounded-xl border border-white/[0.08] bg-[#0f0f13] p-1.5 shadow-2xl animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
                        >
                          <DropdownMenu.Item
                            onClick={(e) => {
                              e.stopPropagation();
                              setSeedToDelete(seed.id);
                            }}
                            className="flex cursor-pointer select-none items-center gap-2 rounded-[8px] px-2.5 py-2 text-[11px] font-medium font-mono text-red-400 outline-none transition-colors hover:bg-red-500/10"
                          >
                            <Trash2 size={12} />
                            Delete Seed
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>
              ))}
            </div>

            {librarySeeds.length === 0 && characterSeeds.length === 0 && (
              <p className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-center text-[10px] text-white/35">
                Your saved seeds will appear here.
              </p>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={seedToDelete !== null}
        title="Delete Character Seed?"
        description="Are you sure you want to delete this character seed? This action cannot be undone."
        confirmText="Delete Seed"
        onConfirm={() => void handleDeleteSeedConfirm()}
        onCancel={() => setSeedToDelete(null)}
      />

      <div className="flex gap-2.5 pt-3 border-t border-white/[0.02]">
        <button
          type="button"
          disabled={!currentGeneratedImageURL || saving || atLimit}
          onClick={handleSaveGenerated}
          className="flex-1 flex items-center justify-center gap-2 h-8 rounded-[8px] border border-white/[0.06] bg-white/[0.02] text-[11px] tracking-wide font-medium text-white/60 hover:bg-white/[0.06] hover:text-white/90 hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <Plus size={12} />
          {saving ? 'Saving...' : 'Save current'}
        </button>

        <button
          type="button"
          disabled={atLimit}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 h-8 rounded-[8px] border border-white/[0.06] bg-white/[0.02] text-[11px] tracking-wide font-medium text-white/60 hover:bg-white/[0.06] hover:text-white/90 hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <Upload size={12} />
          Upload
        </button>
      </div>

      {atLimit && (
        <p className="text-[10px] text-amber-400/70 text-center">
          Limit reached. Delete a seed to add more.
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
};
