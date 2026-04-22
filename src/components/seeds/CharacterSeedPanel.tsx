import React, { useRef, useState } from 'react';
import { Plus, Trash2, Upload, Check, X } from 'lucide-react';
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
    activeCharacterSeedId,
    maxSeeds,
    addCharacterSeed,
    removeCharacterSeed,
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

  const atLimit = characterSeeds.length >= maxSeeds;

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
      const remoteSeedId = await saveSeedToDatabase(name, namingState.imageBase64);

      if (remoteSeedId) {
        useStore.setState((state) => ({
          ...state,
          characterSeeds: [
            {
              id: remoteSeedId,
              name,
              imageBase64: namingState.imageBase64,
              thumbnail: namingState.imageBase64,
              createdAt: Date.now(),
            },
            ...state.characterSeeds.filter((seed) => seed.id !== remoteSeedId),
          ],
          activeCharacterSeedId: remoteSeedId,
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
          Character Seeds
        </span>
        <span className="text-[10px] text-neutral-600">
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

      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveCharacterSeed(null)}
          className={`flex flex-col items-center justify-center aspect-square rounded-lg border text-[10px] transition-all ${
            activeCharacterSeedId === null
              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
              : 'border-white/10 bg-white/[0.02] text-neutral-500 hover:bg-white/[0.04]'
          }`}
        >
          <span className="text-lg leading-none mb-0.5">*</span>
          <span>None</span>
        </button>

        {characterSeeds.map((seed) => (
          <div
            key={seed.id}
            className={`relative aspect-square rounded-lg border overflow-hidden cursor-pointer transition-all group ${
              activeCharacterSeedId === seed.id
                ? 'border-emerald-500/70 ring-1 ring-emerald-500/40'
                : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => setActiveCharacterSeed(activeCharacterSeedId === seed.id ? null : seed.id)}
          >
            <img
              src={seed.thumbnail}
              alt={seed.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
              <p className="text-[9px] text-white/80 truncate leading-tight">
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
                void handleDeleteSeed(seed.id);
              }}
              className="absolute top-1 left-1 w-5 h-5 rounded-md bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/60"
            >
              <Trash2 size={9} className="text-white" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={!currentGeneratedImageURL || saving || atLimit}
          onClick={handleSaveGenerated}
          className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-md border border-white/10 bg-white/[0.03] text-[11px] text-white/50 hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Plus size={11} />
          {saving ? 'Saving...' : 'Save current'}
        </button>

        <button
          type="button"
          disabled={atLimit}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-md border border-white/10 bg-white/[0.03] text-[11px] text-white/50 hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Upload size={11} />
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
