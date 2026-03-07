'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LOCALE_STORAGE_KEY, type Locale, t as translate } from '@/lib/i18n';

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(LOCALE_STORAGE_KEY) : null;
    if (stored === 'en' || stored === 'am') {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      document.documentElement.lang = locale === 'am' ? 'am' : 'en';
    }
  }, [locale]);

  const value = useMemo<LocaleContextType>(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: (key: string) => translate(locale, key),
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}
