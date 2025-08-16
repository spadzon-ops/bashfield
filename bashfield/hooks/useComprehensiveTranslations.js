import { useState, useEffect } from 'react'
import { getComprehensiveTranslation, getCurrentLanguage } from '../lib/comprehensive-translations'

export default function useComprehensiveTranslations() {
  const [currentLang, setCurrentLang] = useState('en')

  useEffect(() => {
    const lang = getCurrentLanguage()
    setCurrentLang(lang)

    const handleStorageChange = () => {
      const newLang = getCurrentLanguage()
      setCurrentLang(newLang)
    }

    // Listen for language changes
    window.addEventListener('storage', handleStorageChange)
    
    // Listen for custom language change events
    const handleLanguageChange = (event) => {
      setCurrentLang(event.detail.language)
    }
    
    window.addEventListener('languageChanged', handleLanguageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('languageChanged', handleLanguageChange)
    }
  }, [])

  const t = (key) => getComprehensiveTranslation(key, currentLang)

  return { t, currentLang }
}