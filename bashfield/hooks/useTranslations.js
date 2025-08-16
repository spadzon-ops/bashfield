import { useState, useEffect } from 'react'

// Import translations directly
import enTranslations from '../public/locales/en/common.json'
import kuTranslations from '../public/locales/ku/common.json'
import arTranslations from '../public/locales/ar/common.json'

const translations = {
  en: enTranslations,
  ku: kuTranslations,
  ar: arTranslations
}

export default function useTranslations() {
  const [currentLang, setCurrentLang] = useState('en')
  const [t, setT] = useState(enTranslations)

  useEffect(() => {
    const loadTranslations = () => {
      const savedLang = localStorage.getItem('translate-lang') || 'en'
      setCurrentLang(savedLang)
      setT(translations[savedLang] || enTranslations)
    }

    loadTranslations()

    const handleStorageChange = (e) => {
      if (e.key === 'translate-lang') {
        loadTranslations()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const getText = (path) => {
    const keys = path.split('.')
    let result = t
    
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key]
      } else {
        return path // Return the path if translation not found
      }
    }
    
    return result || path
  }

  return { t: getText, currentLang }
}