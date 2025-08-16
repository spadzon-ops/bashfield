import { useState, useEffect } from 'react'
import { getTranslation, getCurrentLanguage } from '../lib/translations'

export default function useTranslations() {
  const [currentLang, setCurrentLang] = useState('en')

  useEffect(() => {
    const lang = getCurrentLanguage()
    setCurrentLang(lang)

    const handleStorageChange = () => {
      const newLang = getCurrentLanguage()
      setCurrentLang(newLang)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const t = (key) => getTranslation(key, currentLang)

  return { t, currentLang }
}