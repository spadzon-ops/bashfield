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
    if (typeof window === 'undefined') return
    
    const savedLang = localStorage.getItem('bashfield-language') || 'en'
    setCurrentLanguage(savedLang)
    
    const initTranslate = () => {
      if (!document.getElementById('google_translate_element')) {
        const div = document.createElement('div')
        div.id = 'google_translate_element'
        div.style.display = 'none'
        document.body.appendChild(div)
      }
      
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,ku,ar',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false
        }, 'google_translate_element')
        hideGoogleTranslateUI()
      }
      
      if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script')
        script.id = 'google-translate-script'
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
        script.async = true
        document.head.appendChild(script)
      }
    }
    
    setTimeout(initTranslate, 1000)
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
    setCurrentLanguage(targetLang)
    localStorage.setItem('bashfield-language', targetLang)
    
    const doTranslate = () => {
      const select = document.querySelector('.goog-te-combo')
      if (select) {
        select.value = targetLang
        select.dispatchEvent(new Event('change'))
        setTimeout(() => setIsTranslating(false), 1500)
      } else {
        setTimeout(doTranslate, 300)
      }
    }
    
    setTimeout(doTranslate, 100)
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