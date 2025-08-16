import { createContext, useContext, useState, useEffect } from 'react'

const TranslationContext = createContext()

export const useTranslation = () => {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}

export const TranslationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en')
  
  const languages = {
    en: { code: 'en', name: 'English', flag: 'us' },
    ku: { code: 'ku', name: 'کوردی', flag: 'kurdistan' },
    ar: { code: 'ar', name: 'العربية', flag: 'iraq' }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const savedLang = localStorage.getItem('translate-lang') || 'en'
    setCurrentLanguage(savedLang)
    
    const handleStorageChange = (e) => {
      if (e.key === 'translate-lang') {
        setCurrentLanguage(e.newValue || 'en')
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const translatePage = (targetLang) => {
    if (typeof window === 'undefined' || targetLang === currentLanguage) return
    
    setCurrentLanguage(targetLang)
    localStorage.setItem('translate-lang', targetLang)
    
    // Trigger storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'translate-lang',
      newValue: targetLang
    }))
  }

  return (
    <TranslationContext.Provider value={{
      currentLanguage,
      languages,
      translatePage
    }}>
      {children}
    </TranslationContext.Provider>
  )
}