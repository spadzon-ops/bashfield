import { useRouter } from 'next/router';
import { createContext, useContext } from 'react';

/**
 * Minimal shim so existing components keep working while we use next-i18next.
 * - No provider state is required; we rely on Next.js locale.
 * - `isTranslating` is always false (no spinner).
 */
const DummyCtx = createContext({ isTranslating: false });

export function TranslationProvider({ children }) {
  return <DummyCtx.Provider value={{ isTranslating: false }}>{children}</DummyCtx.Provider>;
}

// Keep the same API shape that callers expect:
export function useTranslation() {
  const { locale } = useRouter();
  const ctx = useContext(DummyCtx);
  return { ...ctx, currentLang: locale };
}

// Older named export some files might import:
export const isTranslating = false;
