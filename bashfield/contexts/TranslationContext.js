import { createContext, useContext, useState, useEffect } from 'react'
import useNoTranslate from '../hooks/useNoTranslate'

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
  const [isTranslating, setIsTranslating] = useState(false)
  
  useNoTranslate()

  const languages = {
    en: { code: 'en', name: 'English', flag: 'us' },
    ku: { code: 'ku', name: 'کوردی', flag: 'kurdistan' },
    ar: { code: 'ar', name: 'العربية', flag: 'iraq' }
  }

  useEffect(() => {
    const savedLang = localStorage.getItem('bashfield-language') || 'en'
    setCurrentLanguage(savedLang)
    
    setTimeout(() => {
      hideGoogleTranslateUI()
      if (savedLang !== 'en') {
        translatePage(savedLang)
      }
    }, 2000)
  }, [])

  const hideGoogleTranslateUI = () => {
    const style = document.createElement('style')
    style.innerHTML = `
      #google_translate_element,
      .goog-te-banner-frame,
      .goog-te-menu-frame,
      .skiptranslate,
      .goog-te-gadget,
      .goog-te-combo,
      .goog-logo-link,
      .goog-te-gadget-simple,
      .goog-te-menu-value,
      .goog-te-menu-value span,
      .goog-te-menu-value span:first-child {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
      }
      
      body {
        top: 0 !important;
        position: static !important;
      }
      
      .goog-te-banner-frame.skiptranslate {
        display: none !important;
      }
      
      body.goog-te-hl-en #google_translate_element {
        display: none !important;
      }
      
      .notranslate {
        translate: no !important;
      }
    `
    document.head.appendChild(style)
  }

  const translatePage = (targetLang) => {
    if (typeof window === 'undefined' || targetLang === currentLanguage) return

    setIsTranslating(true)
    
    const attemptTranslation = (attempts = 0) => {
      const selectElement = document.querySelector('.goog-te-combo')
      
      if (selectElement && selectElement.options.length > 1) {
        selectElement.value = targetLang
        selectElement.dispatchEvent(new Event('change'))
        
        setCurrentLanguage(targetLang)
        localStorage.setItem('bashfield-language', targetLang)
        
        setTimeout(() => setIsTranslating(false), 2000)
      } else if (attempts < 20) {
        setTimeout(() => attemptTranslation(attempts + 1), 500)
      } else {
        setIsTranslating(false)
        console.log('Translation failed: Google Translate not ready')
      }
    }
    
    attemptTranslation()
  }



  return (
    <TranslationContext.Provider value={{
      currentLanguage,
      languages,
      isTranslating,
      translatePage
    }}>
      {children}
    </TranslationContext.Provider>
  )
}