// Shim so existing "import { useTranslation } from 'next-i18next'" continues to work.
import { useTranslation as useCtx } from '../contexts/TranslationContext';

export function useTranslation(/* ns */) {
  const { t, i18n } = useCtx();
  return { t, i18n };
}
