// contexts/TranslationContext.js
import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation as useI18Next } from 'react-i18next';

export const TranslationContext = React.createContext(null);

// No-op provider to keep old API shape
export function TranslationProvider({ children }) {
  return children;
}

/**
 * Our unified hook:
 * - useTranslation(ns) -> { t, i18n, isTranslating }
 * - i18n.language: current locale
 * - i18n.changeLanguage(lang): route switch
 */
export function useTranslation(ns = 'common') {
  const router = useRouter();
  const { t, i18n } = useI18Next(ns);

  // Bridge changeLanguage to Next.js locale routing
  const changeLanguage = async (lang) => {
    const current = router?.locale || 'en';
    if (!lang || lang === current) return;
    const asPath = router?.asPath || '/';
    await router.push(asPath, asPath, { locale: lang });
  };

  const wrappedI18n = {
    ...i18n,
    language: router?.locale || i18n.language || 'en',
    changeLanguage,
  };

  return { t, i18n: wrappedI18n, isTranslating: false };
}
