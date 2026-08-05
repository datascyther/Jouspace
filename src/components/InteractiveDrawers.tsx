import React, { useState } from 'react';
import { Entry } from './EntryRow';
import { X, Sparkles, Send, Check } from 'lucide-react';

interface WriteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTitle?: string;
  initialContent?: string;
}

export const WriteDrawer: React.FC<WriteDrawerProps> = ({
  isOpen,
  onClose,
  initialTitle = '',
  initialContent = '',
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-[#FFFEFC] rounded-t-[28px] sm:rounded-[28px] border border-[#E7E1EF] shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E9E4E0]">
          <span className="font-serif text-lg text-[#0D102B]">
            {initialTitle ? 'Continue writing' : 'New journal entry'}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8B8998] hover:text-[#0D102B] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-serif text-xl text-[#0D102B] bg-transparent border-b border-[#E9E4E0] pb-2 focus:outline-none focus:border-[#6D4FD7] placeholder:text-[#8B8998]/60 placeholder:font-serif"
          />
          <textarea
            rows={8}
            placeholder="Write your thoughts quietly..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full font-sans text-[15px] leading-relaxed text-[#0D102B] bg-transparent resize-none focus:outline-none placeholder:text-[#8B8998]/60"
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E9E4E0]">
          <span className="text-xs text-[#8B8998] font-sans">
            ✦ Auto-saved to private memory
          </span>
          <button
            onClick={handleSave}
            disabled={saved}
            className="inline-flex items-center gap-2 bg-[#6D4FD7] hover:bg-[#5C3EC5] text-white font-sans text-sm font-medium px-5 py-2.5 rounded-[14px] transition-all cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              'Save Entry'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface AIReflectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIReflectDrawer: React.FC<AIReflectDrawerProps> = ({ isOpen, onClose }) => {
  const [reflectionInput, setReflectionInput] = useState('');
  const [reflections, setReflections] = useState<string[]>([
    'Looking at your last 4 entries, returning after a gap allows you to process thoughts with higher clarity rather than emotional momentum.',
  ]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!reflectionInput.trim()) return;
    setReflections((prev) => [
      ...prev,
      `You mentioned: "${reflectionInput}". Jouspace connects this to your recurring theme of rebuild and discipline.`,
    ]);
    setReflectionInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-[#FFFEFC] rounded-t-[28px] sm:rounded-[28px] border border-[#E7E1EF] shadow-2xl p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E9E4E0]">
          <div className="flex items-center gap-2 text-[#6D4FD7]">
            <Sparkles className="w-4 h-4 stroke-[2]" />
            <span className="font-serif text-lg text-[#0D102B]">AI Reflection</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8B8998] hover:text-[#0D102B] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Context quote */}
        <div className="p-4 bg-[#F0ECFF]/60 rounded-[16px] border border-[#E7E1EF]/50 text-sm text-[#0D102B] font-serif leading-relaxed">
          "You often return to consistency when you write after a gap."
        </div>

        {/* AI Responses */}
        <div className="flex flex-col gap-3 my-2">
          {reflections.map((res, i) => (
            <div key={i} className="p-4 bg-[#FBF9F5] rounded-[16px] border border-[#E9E4E0] text-[14.5px] text-[#0D102B] font-sans leading-relaxed">
              {res}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#E9E4E0]">
          <input
            type="text"
            placeholder="Add your thought..."
            value={reflectionInput}
            onChange={(e) => setReflectionInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-[#FBF9F5] border border-[#E7E1EF] rounded-[14px] px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-[#6D4FD7]"
          />
          <button
            onClick={handleSend}
            className="p-2.5 bg-[#6D4FD7] text-white rounded-[14px] hover:bg-[#5C3EC5] transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface EntryDetailDrawerProps {
  entry: Entry | null;
  onClose: () => void;
}

export const EntryDetailDrawer: React.FC<EntryDetailDrawerProps> = ({ entry, onClose }) => {
  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-[#FFFEFC] rounded-t-[28px] sm:rounded-[28px] border border-[#E7E1EF] shadow-2xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-[#E9E4E0]">
          <span className="text-xs text-[#8B8998] font-sans">{entry.date}</span>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8B8998] hover:text-[#0D102B] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="font-serif text-xl text-[#0D102B] font-medium leading-snug">
          {entry.title}
        </h3>

        <div className="flex items-center gap-2">
          <span className="bg-[#F0ECFF] text-[#68677E] text-xs px-3 py-1 rounded-full font-sans font-medium">
            {entry.theme}
          </span>
        </div>

        <p className="font-sans text-[15px] leading-relaxed text-[#68677E] pt-2">
          {entry.content || 'No additional details available for this entry.'}
        </p>
      </div>
    </div>
  );
};
