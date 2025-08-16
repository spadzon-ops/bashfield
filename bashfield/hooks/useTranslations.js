import { useState, useEffect } from 'react'

const translations = {
  en: () => import('../public/locales/en/common.json'),
  ku: () => import('../public/locales/ku/common.json'),
  ar: () => import('../public/locales/ar/common.json')
}

export default function useTranslations() {
  const [currentLang, setCurrentLang] = useState('en')
  const [t, setT] = useState({})

  useEffect(() => {
    const loadTranslations = async () => {
      const savedLang = localStorage.getItem('translate-lang') || 'en'
      setCurrentLang(savedLang)
      
      try {
        const translationModule = await translations[savedLang]()
        setT(translationModule.default || translationModule)
      } catch (error) {
        console.error('Error loading translations:', error)
        const fallback = await translations.en()
        setT(fallback.default || fallback)
      }
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