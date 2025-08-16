cat > contexts/TranslationContext.js <<'EOF'
// shim over to next-i18next + Next.js router
import React from 'react';
import { useRouter } from 'next/router';
import { useTranslation as useI18Next } from 'next-i18next';

export const TranslationContext = React.createContext(null);

// No-op provider to keep your existing <TranslationProvider> usage working
export function TranslationProvider({ children }) {
  return children;
}

/**
 * Matches your previous `useTranslation()` shape:
 * - returns { t, i18n, isTranslating }
 * - i18n.language  -> current Next.js locale
 * - i18n.changeLanguage(lang) -> switches locale via router
 */
export function useTranslation(ns = 'common') {
  const router = useRouter();
  const { t } = useI18Next(ns);

  const i18n = {
    language: router?.locale || 'en',
    changeLanguage: async (lang) => {
      if (!lang || lang === (router?.locale || 'en')) return;
      const asPath = router?.asPath || router?.pathname || '/';
      return router.push(asPath, asPath, { locale: lang });
    },
  };

  const isTranslating = false;
  return { t, i18n, isTranslating };
}
EOF
