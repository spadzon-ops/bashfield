// bashfield/hooks/useComprehensiveTranslations.js
import { useTranslation } from '../contexts/TranslationContext'
export default function useComprehensiveTranslations() {
  const { t, lang } = useTranslation()
  return { t, currentLang: lang }
}
