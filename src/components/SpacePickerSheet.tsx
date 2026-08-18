import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Heart, Palette } from 'lucide-react';
import { TbFileTextSpark } from 'react-icons/tb';
import { CgRowFirst } from 'react-icons/cg';
import {
  type CustomTheme,
  slugifyTheme,
  isReservedThemeId,
  saveCustomTheme,
} from '../utils/customThemes';
import { writeSpaceSelection } from '../utils/pickerStore';

export interface Space {
  id: string;
  label: string;
  description: string;
  placeholderTitle: string;
  placeholderBody: string;
  defaultTheme: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; // tailwind text color class for the icon
}

export const SPACES: Space[] = [
  {
    id: 'journal',
    label: 'Journal',
    description: 'Deep thoughts & reflection',
    placeholderTitle: "What I'm trying to understand",
    placeholderBody: 'Write your thoughts quietly...',
    defaultTheme: 'clarity',
    icon: BookOpen,
    color: 'text-[#6C4DCA]',
  },
  {
    id: 'note',
    label: 'Note',
    description: 'Quick capture & lists',
    placeholderTitle: 'Quick thought',
    placeholderBody: 'Capture it before it fades...',
    defaultTheme: 'discipline',
    icon: TbFileTextSpark,
    color: 'text-[#5E6B5E]',
  },
  {
    id: 'gratitude',
    label: 'Gratitude',
    description: 'Daily grounding',
    placeholderTitle: "Today I'm grateful for",
    placeholderBody: 'Even the smallest thing...',
    defaultTheme: 'purpose',
    icon: Heart,
    color: 'text-[#B85C38]',
  },
  {
    id: 'release',
    label: 'Release',
    description: 'Venting & catharsis',
    placeholderTitle: "What I'm holding in",
    placeholderBody: "Say it here so you don't have to out there...",
    defaultTheme: 'pressure',
    icon: CgRowFirst,
    color: 'text-[#4A7C8F]',
  },
];

export function getSpaceById(id: string): Space {
  return SPACES.find((s) => s.id === id) || SPACES[0];
}

/** Reverse-map a saved theme back to its Space; unknown themes → Journal. */
export function spaceForTheme(theme: string): Space {
  return (
    SPACES.find((s) => s.defaultTheme === theme) ||
    SPACES.find((s) => s.id === theme) ||
    SPACES[0]
  );
}

/** Sentinel space id used when a custom theme is active. */
export const CUSTOM_SPACE_ID = 'custom';

interface SpacePickerScreenProps {
  initialTab?: 'presets' | 'custom';
  initialSelectedId?: string;
  /** Seed for the create-your-own-theme form (active custom theme, if any). */
  initialCustom?: { name?: string; cTitle?: string; cBody?: string };
  onBack: () => void;
}

/**
 * Full-screen route for choosing the writing Space (and creating a custom
 * theme). Writes a one-shot selection to the transient picker store and returns
 * to the previous screen — the journal composer reads the selection on remount.
 */
export const SpacePickerScreen: React.FC<SpacePickerScreenProps> = ({
  initialTab = 'presets',
  initialSelectedId = '',
  initialCustom,
  onBack,
}) => {
  // --- Inline "create your own theme" form --------------------------------
  const [creating, setCreating] = useState(initialTab === 'custom');
  const [name, setName] = useState(initialCustom?.name ?? '');
  const [cTitle, setCTitle] = useState(initialCustom?.cTitle ?? '');
  const [cBody, setCBody] = useState(initialCustom?.cBody ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (space: Space) => {
    writeSpaceSelection({ spaceId: space.id, customThemeId: null });
    onBack();
  };

  const handleCreate = () => {
    const label = name.trim();
    if (!label) {
      setError('Give your theme a name');
      return;
    }
    const id = slugifyTheme(label);
    if (!id) {
      setError('Give your theme a name');
      return;
    }
    if (isReservedThemeId(id)) {
      setError('Pick a different name');
      return;
    }
    const theme: CustomTheme = {
      id,
      label,
      placeholderTitle: cTitle.trim(),
      placeholderBody: cBody.trim(),
    };
    saveCustomTheme(theme);
    writeSpaceSelection({ spaceId: CUSTOM_SPACE_ID, customThemeId: theme.id });
    onBack();
  };

  const customActive = initialSelectedId === CUSTOM_SPACE_ID && !!initialCustom?.name;

  return (
    <div className="flex flex-col w-full flex-1 min-h-0 bg-base">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 rounded-full bg-base flex items-center justify-center text-secondaryText hover:bg-borderSubtle transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-serif font-medium text-[18px] text-primaryText">
          {creating ? 'Create your own theme' : 'Spaces'}
        </h1>
        <div className="w-9 h-9" aria-hidden="true" />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-none px-6 pb-4 pb-safe">
        {creating ? (
          /* ── Custom theme creation form ─────────────────────────────── */
          <div className="flex flex-col gap-4 mt-4">
            <p className="font-sans text-[13px] text-muted">
              Set the tone and placeholders for this space
            </p>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="custom-theme-name"
                className="font-sans text-[13px] font-medium text-primaryText"
              >
                Theme name
              </label>
              <input
                id="custom-theme-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Morning Pages"
                className="w-full bg-base border border-borderSubtle rounded-[12px] px-3.5 py-2.5 text-[14px] font-sans text-primaryText placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="custom-theme-title"
                className="font-sans text-[13px] font-medium text-primaryText"
              >
                Title placeholder
              </label>
              <input
                id="custom-theme-title"
                type="text"
                value={cTitle}
                onChange={(e) => setCTitle(e.target.value)}
                placeholder="Where your thoughts begin..."
                className="w-full bg-base border border-borderSubtle rounded-[12px] px-3.5 py-2.5 text-[14px] font-sans text-primaryText placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="custom-theme-body"
                className="font-sans text-[13px] font-medium text-primaryText"
              >
                Body placeholder
              </label>
              <input
                id="custom-theme-body"
                type="text"
                value={cBody}
                onChange={(e) => setCBody(e.target.value)}
                placeholder="Let the words come..."
                className="w-full bg-base border border-borderSubtle rounded-[12px] px-3.5 py-2.5 text-[14px] font-sans text-primaryText placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            {error && (
              <p className="font-sans text-[12.5px] text-error" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="flex-1 bg-base hover:bg-borderSubtle border border-borderSubtle text-primaryText font-sans font-medium text-[14px] px-5 py-2.5 rounded-[14px] transition-all duration-150 active:scale-[0.97] cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="flex-1 bg-accent hover:bg-accentHover active:bg-accentActive text-white font-sans font-medium text-[14px] px-5 py-2.5 rounded-[14px] transition-all duration-150 active:scale-[0.97] shadow-xs cursor-pointer focus:outline-none"
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          /* ── Space list ─────────────────────────────────────────────── */
          <div className="flex flex-col gap-2 mt-4">
            {SPACES.map((space) => {
              const Icon = space.icon;
              const selected = initialSelectedId === space.id;
              return (
                <button
                  key={space.id}
                  type="button"
                  onClick={() => handleSelect(space)}
                  aria-pressed={selected}
                  className={`flex items-center gap-3.5 w-full text-left rounded-[14px] px-4 py-3.5 transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer ${
                    selected ? 'bg-accentSoft' : 'bg-base hover:bg-accentSoft'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      selected ? 'bg-accent text-white' : 'bg-base text-secondaryText'
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] stroke-[1.8] ${selected ? 'text-white' : space.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[14px] font-medium text-primaryText">
                      {space.label}
                    </p>
                    <p className="font-sans text-[12px] text-muted">{space.description}</p>
                  </div>
                  {selected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0" />
                  )}
                </button>
              );
            })}

            {/* Create your own theme — doubles as the active custom theme's row */}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setCreating(true);
              }}
              aria-pressed={customActive}
              className={`flex items-center gap-3.5 w-full text-left rounded-[14px] px-4 py-3.5 transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer ${
                customActive ? 'bg-accentSoft' : 'bg-base hover:bg-accentSoft'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  customActive ? 'bg-accent text-white' : 'bg-accentSoft text-accent'
                }`}
              >
                <Palette className="w-[18px] h-[18px] stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-[14px] font-medium text-primaryText">
                  {customActive ? initialCustom?.name : 'Create your own theme'}
                </p>
                <p className="font-sans text-[12px] text-muted">
                  {customActive
                    ? 'Your custom space — tap to edit'
                    : 'Set your own tone & placeholders'}
                </p>
              </div>
              {customActive && (
                <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
