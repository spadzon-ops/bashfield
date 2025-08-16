import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';

// Load dictionaries (statically at build time)
import en from '../public/locales/en/common.json';
import ar from '../public/locales/ar/common.json';
import ku from '../public/locales/ku/common.json';

// Helper: safely read a dotted path from an object
function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
}

const DICTS = { en, ar, ku };

const TranslationContext = createContext(null);

export function TranslationProvider({ children }) {
  const router = useRouter();

  // Derive initial language from next/router locale or from pathname prefix
  const detectInitial = () => {
    const l = router?.locale;
    if (l && DICTS[l]) return l;
    if (typeof window !== 'undefined') {
      const seg = window.location.pathname.split('/').filter(Boolean)[0];
      if (seg && DICTS[seg]) return seg;
    }
    return 'en';
  };

  const [language, setLanguage] = useState(detectInitial);
  const [isTranslating, setIsTranslating] = useState(false);

  // Keep state in sync if the router.locale changes
  useEffect(() => {
    const l = router?.locale;
    if (l && DICTS[l] && l !== language) setLanguage(l);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router?.locale]);

  const changeLanguage = useCallback(
    async (lng) => {
      if (!DICTS[lng]) return;
      setIsTranslating(true);
      try {
        if (router && router.asPath) {
          await router.push(router.asPath, router.asPath, { locale: lng, scroll: false });
        }
        setLanguage(lng);
      } finally {
        setIsTranslating(false);
      }
    },
    [router]
  );

  const t = useCallback(
    (key, fallback) => {
      const dict = DICTS[language] || en;
      const value = getByPath(dict, key);
      if (value != null) return value;
      const enValue = getByPath(en, key);
      return enValue != null ? enValue : (fallback != null ? fallback : key);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      t,
      i18n: {
        language,
        changeLanguage,
      },
      isTranslating,
      setIsTranslating,
    }),
    [t, language, changeLanguage, isTranslating]
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useTranslation must be used within a TranslationProvider');
  return ctx;
}

export default TranslationContext;
