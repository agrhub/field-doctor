import { createContext, useContext } from 'react';
import type { Localized } from '../knowledge';
import type { DictKey, Lang } from './dict';

export interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
  /** Pick the current language from any localized value. */
  l: <T>(v: Localized<T>) => T;
  /** Label for a symptom vocabulary value. */
  v: (id: string) => string;
}

export const I18nContext = createContext<I18n | null>(null);

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
