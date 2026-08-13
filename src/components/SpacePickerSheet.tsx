import React, { useId, useRef, useState } from 'react';
import { BookOpen, Heart, Palette, X } from 'lucide-react';
import { TbFileTextSpark } from 'react-icons/tb';
import { CgRowFirst } from 'react-icons/cg';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import {
  type CustomTheme,
  slugifyTheme,
  isReservedThemeId,
} from '../lib/supabaseCustomThemes';

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

interface SpacePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpaceId: string;
  onSelectSpace: (space: Space) => void;
  /** Active custom theme (when selectedSpaceId === CUSTOM_SPACE_ID). */
  customTheme?: CustomTheme | null;
  /** Called with a created/edited custom theme. */
  onCreateCustomTheme: (theme: CustomTheme) => void;
}

export const SpacePickerSheet: React.FC<SpacePickerSheetProps> = ({
  isOpen,
  onClose,
  selectedSpaceId,
  onSelectSpace,
  customTheme = null,
  onCreateCustomTheme,
}) => {
  const sheetId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap({ id: sheetId, active: isOpen, onClose, containerRef: sheetRef });
  useEscapeKey(onClose, isOpen);

  // --- Inline "create your own theme" form --------------------------------
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [cTitle, setCTitle] = useState('');
  const [cBody, setCBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset/seed the form whenever the sheet reopens so a stale partial edit
  // never leaks into a fresh pick.
  React.useEffect(() => {
    if (isOpen) {
      setCreating(false);
      setError(null);
      setName(customTheme?.label ?? '');
      setCTitle(customTheme?.placeholderTitle ?? '');
      setCBody(customTheme?.placeholderBody ?? '');
    }
  }, [isOpen, customTheme]);

  const openCreateForm = () => {
    setError(null);
    setName(customTheme?.label ?? '');
    setCTitle(customTheme?.placeholderTitle ?? '');
    setCBody(customTheme?.placeholderBody ?? '');
    setCreating(true);
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
    onCreateCustomTheme({
      id,
      label,
      placeholderTitle: cTitle.trim(),
      placeholderBody: cBody.trim(),
    });
    setCreating(false);
    setError(null);
  };

  // Exit-safe: the sheet stays mounted through its 300ms exit transition so it
  // never disappears instantly (that instant unmount is what caused flicker).
  const { present, closing, entered } = useAnimatedPresence(isOpen, 300);
  if (!present) return null;

  const customActive = selectedSpaceId === CUSTOM_SPACE_ID && customTheme !== null;

  const backdropClass = closing
    ? 'gpu-layer backdrop-exit backdrop-exit-active transition-exit'
    : entered
      ? 'gpu-layer backdrop-enter backdrop-enter-active transition-enter'
      : 'gpu-layer backdrop-enter transition-enter';

  const panelClass = closing
    ? 'sheet-exit sheet-exit-active transition-exit gpu-layer'
    : entered
      ? 'sheet-enter-active transition-enter gpu-layer'
      : 'sheet-enter transition-enter gpu-layer';

  return (
    <div
      ref={sheetRef}
      className="absolute inset-0 z-50 flex items-end justify-center"
    >
      <div
        className={`absolute inset-0 bg-primaryText/30 ${backdropClass}`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal={!closing}
        aria-label={creating ? 'Create your own theme' : 'Choose a space'}
        className={`relative w-full max-w-[430px] bg-surface rounded-t-[28px] px-6 pt-4 pb-8 ${panelClass}`}
      >
        <div className="w-9 h-1 rounded-full bg-borderSubtle mx-auto mb-4" />

        {creating ? (
          /* ── Custom theme creation form ─────────────────────────────── */
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-serif font-medium text-[20px] text-primaryText">
                  Create your own theme
                </h2>
                <p className="font-sans text-[13px] text-muted mt-0.5">
                  Set the tone and placeholders for this space
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-base flex items-center justify-center text-secondaryText hover:bg-borderSubtle transition-all duration-150 active:scale-95 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
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
          </div>
        ) : (
          /* ── Space list ─────────────────────────────────────────────── */
          <>
            <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif font-medium text-[20px] text-primaryText">
                Spaces
              </h2>
              <p className="font-sans text-[13px] text-muted mt-0.5">
                Each space sets the tone for your writing
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-base flex items-center justify-center text-secondaryText hover:bg-borderSubtle transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {SPACES.map((space) => {
              const Icon = space.icon;
              const selected = selectedSpaceId === space.id;
              return (
                <button
                  key={space.id}
                  type="button"
                  onClick={() => onSelectSpace(space)}
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
              onClick={openCreateForm}
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
                  {customTheme ? customTheme.label : 'Create your own theme'}
                </p>
                <p className="font-sans text-[12px] text-muted">
                  {customTheme
                    ? 'Your custom space — tap to edit'
                    : 'Set your own tone & placeholders'}
                </p>
              </div>
              {customActive && (
                <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0" />
              )}
            </button>
          </div>
          </>
        )}
      </div>
    </div>
  );
};
