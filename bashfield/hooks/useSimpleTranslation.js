// bashfield/hooks/useSimpleTranslation.js
import { useTranslation } from '../contexts/TranslationContext'
export default function useSimpleTranslation() {
  const { t, lang, setLang } = useTranslation()
  return { t, currentLang: lang, setLang }
}
