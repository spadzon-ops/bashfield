import { useEffect, useState } from 'react'

export default function SimpleTranslate() {
  const [currentLang, setCurrentLang] = useState('en')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let attempts = 0
    const maxAttempts = 10
    
    const initTranslate = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,ku,ar',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element')
        
        // Hide Google's UI
        setTimeout(() => {
          const style = document.createElement('style')
          style.innerHTML = `
            .goog-te-banner-frame { display: none !important; }
            .goog-te-menu-frame { display: none !important; }
            body { top: 0 !important; position: static !important; }
            #google_translate_element { display: none !important; }
          `
          document.head.appendChild(style)
          setIsLoaded(true)
        }, 1000)
      } else if (attempts < maxAttempts) {
        attempts++
        setTimeout(initTranslate, 500)
      }
    }
    
    // Load script if not already loaded
    if (!document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = initTranslate
      const script = document.createElement('script')
      script.id = 'google-translate-script'
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      document.head.appendChild(script)
    } else {
      initTranslate()
    }
  }, [])

  const translate = (lang) => {
    if (!isLoaded) return
    
    let attempts = 0
    const tryTranslate = () => {
      const select = document.querySelector('.goog-te-combo')
      if (select && select.options.length > 1) {
        select.value = lang
        select.dispatchEvent(new Event('change'))
        setCurrentLang(lang)
        localStorage.setItem('selected-language', lang)
      } else if (attempts < 20) {
        attempts++
        setTimeout(tryTranslate, 200)
      }
    }
    tryTranslate()
  }

  return (
    <div className="flex items-center space-x-2">
      <div id="google_translate_element"></div>
      <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-200 p-1">
        <button 
          onClick={() => translate('en')} 
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            currentLang === 'en' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
          disabled={!isLoaded}
        >
          🇺🇸 EN
        </button>
        <button 
          onClick={() => translate('ku')} 
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            currentLang === 'ku' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
          disabled={!isLoaded}
        >
          🏴 KU
        </button>
        <button 
          onClick={() => translate('ar')} 
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            currentLang === 'ar' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
          disabled={!isLoaded}
        >
          🇮🇶 AR
        </button>
      </div>
      {!isLoaded && (
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      )}
    </div>
  )
}