import React, { createContext, useContext, useMemo, useEffect } from "react";
import {
  translate as tr,
  getDir,
  isRTL,
  applyDocumentDirection,
} from "../lib/i18n-lite";

export const TranslationContext = createContext({
  lang: "en",
  dir: "ltr",
  rtl: false,
  t: (key) => key,
});

/**
 * Provider. Pass a `lang` like "en", "ar", or "ku".
 */
export function TranslationProvider({ lang = "en", children }) {
  const value = useMemo(() => {
    const dir = getDir(lang);
    return {
      lang,
      dir,
      rtl: isRTL(lang),
      t: (key) => tr(lang, key),
    };
  }, [lang]);

  // Keep <html dir="..."> in sync on the client
  useEffect(() => {
    applyDocumentDirection(lang);
  }, [lang]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

/**
 * Original hook name we introduced earlier.
 * Returns the raw context { lang, dir, rtl, t }.
 */
export function useT() {
  return useContext(TranslationContext);
}

/**
 * Compatibility hook: shape matches typical `react-i18next` usage.
 * Many components do: `const { t, i18n } = useTranslation()`.
 */
export function useTranslation() {
  const ctx = useT();

  // Minimal i18n facade for callers that expect changeLanguage()
  const i18n = {
    language: ctx.lang,
    changeLanguage: (nextLang) => {
      // best-effort route prefix swap on the client
      if (typeof window === "undefined") return;
      try {
        const re = /^\/(en|ar|ku)(\/|$)/;
        const { pathname, search, hash } = window.location;
        const nextPath = re.test(pathname)
          ? pathname.replace(re, `/${nextLang}$2`)
          : `/${nextLang}${pathname}`;
        applyDocumentDirection(nextLang);
        window.location.assign(`${nextPath}${search || ""}${hash || ""}`);
      } catch {
        /* no-op */
      }
    },
  };

  return {
    t: ctx.t,
    i18n,
    // also expose these for convenience if any caller uses them
    lang: ctx.lang,
    dir: ctx.dir,
    rtl: ctx.rtl,
  };
}

// default export (optional)
export default { TranslationProvider, useT, useTranslation };
