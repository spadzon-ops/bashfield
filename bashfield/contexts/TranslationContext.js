// contexts/TranslationContext.js
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const TranslationContext = createContext({
  t: (k, f) => f ?? k,
  i18n: { language: "en", changeLanguage: () => {} },
  language: "en",
  changeLanguage: () => {},
});

const STORAGE_KEY = "lang";
const RTL_LANGS = new Set(["ar", "ku"]); // Arabic + Kurdish Sorani are RTL

async function loadMessages(lang) {
  try {
    const res = await fetch(`/locales/${lang}.json`, { cache: "no-store" });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export function TranslationProvider({ initialLanguage = "en", children }) {
  const [language, setLanguage] = useState(initialLanguage);
  const [messages, setMessages] = useState({});

  // pick up saved language (client)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== language) setLanguage(saved);
  }, []);

  // load JSON for current language + set dir/lang on <html>
  useEffect(() => {
    let alive = true;
    (async () => {
      const m = await loadMessages(language);
      if (alive) setMessages(m || {});
    })();

    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.documentElement.dir = RTL_LANGS.has(language) ? "rtl" : "ltr";
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, language);
    }
    return () => {
      alive = false;
    };
  }, [language]);

  // nested key lookup: "a.b.c"
  const t = useCallback(
    (key, fallback) => {
      const parts = String(key).split(".");
      let cur = messages;
      for (const p of parts) {
        if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
          cur = cur[p];
        } else {
          cur = undefined;
          break;
        }
      }
      return cur ?? (fallback ?? key);
    },
    [messages]
  );

  const changeLanguage = useCallback((lng) => setLanguage(lng), []);
  const value = useMemo(
    () => ({ t, i18n: { language, changeLanguage }, language, changeLanguage }),
    [t, language, changeLanguage]
  );

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  return useContext(TranslationContext);
}

export default TranslationContext;
