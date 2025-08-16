import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';

// ---- IMPORT YOUR DICTIONARIES HERE ----
// Adjust these paths to where your JSONs actually live.
// Each file should export a plain object of translation keys.
import en from '../locales/en.json';
import ar from '../locales/ar.json';
import ku from '../locales/ku.json';

const DICTS = { en, ar, ku };

function getDir(lang) {
  // Only Arabic is RTL; change if your Kurdish is RTL in your project.
  return lang === 'ar' ? 'rtl' : 'ltr';
}

function interpolate(str, vars) {
  if (!vars) return str;
  return Object.keys(vars).reduce(
    (s, k) => s.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(vars[k])),
    String(str)
  );
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
}

const Ctx = createContext(null);

export function TranslationProvider({ lang = 'en', children }) {
  const messages = useMemo(() => DICTS[lang] || DICTS.en || {}, [lang]);
  const dir = useMemo(() => getDir(lang), [lang]);

  // Keep <html> attributes in sync on the client
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('dir', dir);
    }
  }, [lang, dir]);

  const t = useMemo(() => {
    return (key, vars) => {
      const val = getByPath(messages, key);
      if (val == null) return key; // fallback to key when missing
      if (typeof val === 'string') return interpolate(val, vars);
      return String(val);
    };
  }, [messages]);

  const value = useMemo(() => {
    return {
      lang,
      dir,
      rtl: dir === 'rtl',
      t,
    };
  }, [lang, dir, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTranslation() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useTranslation must be used inside <TranslationProvider>');
  }
  const router = useRouter();
  // i18n adapter with a minimal API similar to i18next
  const i18n = useMemo(
    () => ({
      language: ctx.lang,
      changeLanguage: (nextLang) => {
        // keep the same path, only switch locale
        router.push(router.asPath, router.asPath, { locale: nextLang });
      },
    }),
    [ctx.lang, router]
  );

  return { t: ctx.t, i18n, lang: ctx.lang, dir: ctx.dir, rtl: ctx.rtl };
}
