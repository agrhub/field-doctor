import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { I18nContext, type I18n } from './context';
import { dict, vocab, type Lang } from './dict';

const STORAGE_KEY = 'field-doctor.lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'vi' || saved === 'en') return saved;
  } catch {
    // Storage can be blocked; fall back to the browser language.
  }
  return navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.documentElement.lang = l;
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // Ignore: the choice just won't persist.
    }
  }, []);
  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      t: (key) => dict[key][lang],
      l: (v) => v[lang],
      v: (id) => vocab[id]?.[lang] ?? id,
    }),
    [lang, setLang],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
