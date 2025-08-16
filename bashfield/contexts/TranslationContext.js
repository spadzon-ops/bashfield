import React, { createContext, useContext, useMemo } from "react";
import { translate as tr, getDir, isRTL } from "../lib/i18n-lite";

const TranslationContext = createContext({
  lang: "en",
  dir: "ltr",
  rtl: false,
  t: (key) => key,
});

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

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useT() {
  return useContext(TranslationContext);
}
