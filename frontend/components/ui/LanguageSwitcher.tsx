'use client';

import { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'es', label: 'Espa\u00f1ol', flag: 'ES' },
  { code: 'zh-CN', label: '\u7b80\u4f53\u4e2d\u6587', flag: 'CN' },
  { code: 'zh-TW', label: '\u7e41\u9ad4\u4e2d\u6587', flag: 'TW' },
] as const;

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState('en');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('verscienta_lang');
    if (stored) setCurrentLang(stored);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  const selectLang = (code: string) => {
    setCurrentLang(code);
    localStorage.setItem('verscienta_lang', code);
    setOpen(false);
    // When i18n is fully configured, this would trigger a route change
    // e.g., router.push(pathname, { locale: code })
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
      >
        <span>{current.flag}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 12 12" strokeWidth={2}>
          <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute top-full right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-earth-100 overflow-hidden z-50 dark:bg-earth-900 dark:border-earth-700"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              role="option"
              aria-selected={lang.code === currentLang}
              onClick={() => selectLang(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                lang.code === currentLang
                  ? 'bg-earth-50 text-gray-800 font-semibold dark:bg-earth-800 dark:text-earth-100'
                  : 'text-earth-600 hover:bg-earth-50 dark:text-earth-300 dark:hover:bg-earth-800'
              }`}
            >
              <span className="font-mono text-xs bg-earth-100 rounded px-1.5 py-0.5 dark:bg-earth-700 dark:text-earth-200">{lang.flag}</span>
              <span>{lang.label}</span>
              {lang.code === currentLang && (
                <svg className="w-4 h-4 ml-auto text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
