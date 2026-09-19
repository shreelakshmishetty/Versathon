import { useState } from 'react';
import { Globe, Check, Loader2 } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'zh', name: 'Mandarin', native: '中文' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
];

export default function LanguageSelector({ currentLang = 'en', onLanguageChange, isTranslating = false }) {
  const [open, setOpen] = useState(false);

  const selected = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={isTranslating}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-xs transition-all disabled:opacity-50"
      >
        {isTranslating ? (
          <Loader2 size={14} className="animate-spin text-teal-600" />
        ) : (
          <Globe size={14} className="text-teal-600" />
        )}
        <span>{selected.name} ({selected.native})</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
              Select Language
            </div>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onLanguageChange(lang.code, lang.name);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                  lang.code === currentLang
                    ? 'bg-teal-50 text-teal-800 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{lang.name} <span className="text-slate-400 font-normal">({lang.native})</span></span>
                {lang.code === currentLang && <Check size={13} className="text-teal-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
