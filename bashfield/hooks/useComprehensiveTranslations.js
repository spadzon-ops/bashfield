// bashfield/hooks/useComprehensiveTranslations.js
import { useState, useEffect } from 'react'
import i18n from '../lib/i18n-lite'

export default function useComprehensiveTranslations() {
  const [currentLang, setCurrentLang] = useState('en')

  useEffect(() => {
    const lang = i18n.getLang()
    setCurrentLang(lang)
    i18n.applyDocumentDirection(lang)
    i18n.translatePage(lang)

    const onChange = (e) => {
      const l = e?.detail?.language || i18n.getLang()
      setCurrentLang(l)
      i18n.applyDocumentDirection(l)
      i18n.translatePage(l)
    }
    window.addEventListener('languageChanged', onChange)
    return () => window.removeEventListener('languageChanged', onChange)
  }, [])

  return { t: (key) => i18n.t(key, currentLang), currentLang }
}
