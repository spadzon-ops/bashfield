import { useState, useEffect } from 'react'
import { t, getCurrentLanguage } from '../lib/simple-translations'

export default function useSimpleTranslation() {
  const [currentLang, setCurrentLang] = useState('en')

  useEffect(() => {
    setCurrentLang(getCurrentLanguage())

    const handleLanguageChange = () => {
      setCurrentLang(getCurrentLanguage())
    }

    window.addEventListener('languageChanged', handleLanguageChange)
    return () => window.removeEventListener('languageChanged', handleLanguageChange)
  }, [])

  return {
    t: (key) => t(key, currentLang),
    currentLang
  }
}