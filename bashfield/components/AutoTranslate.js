// bashfield/components/AutoTranslate.js
import { useEffect } from 'react'
import i18n from '../lib/i18n-lite'

export default function AutoTranslate() {
  useEffect(() => {
    const l = i18n.getLang()
    i18n.applyDocumentDirection(l)
    i18n.translatePage(l)
    const onChange = (e) => {
      const lang = e?.detail?.language || i18n.getLang()
      i18n.applyDocumentDirection(lang)
      i18n.translatePage(lang)
    }
    window.addEventListener('languageChanged', onChange)
    return () => window.removeEventListener('languageChanged', onChange)
  }, [])
  return null
}
