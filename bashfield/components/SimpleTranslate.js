import { useState, useEffect } from 'react'

export default function SimpleTranslate() {
  const [currentLang, setCurrentLang] = useState('en')
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('translate-lang') || 'en'
    setCurrentLang(saved)
  }, [])

  const translate = (targetLang) => {
    if (targetLang === currentLang) return
    
    setIsTranslating(true)
    setCurrentLang(targetLang)
    localStorage.setItem('translate-lang', targetLang)
    
    if (targetLang === 'en') {
      // Reset to original
      setTimeout(() => {
        window.location.reload()
      }, 300)
      return
    }
    
    const currentUrl = window.location.href
    const translateUrl = `https://translate.google.com/translate?sl=en&tl=${targetLang}&u=${encodeURIComponent(currentUrl)}`
    
    setTimeout(() => {
      window.location.href = translateUrl
    }, 300)
  }

  const languages = {
    en: { flag: '🇺🇸', name: 'English', code: 'EN' },
    ku: { flag: '🟡', name: 'کوردی', code: 'KU' },
    ar: { flag: '🇮🇶', name: 'العربية', code: 'AR' }
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-1 shadow-lg">
        {Object.entries(languages).map(([langCode, lang]) => (
          <button 
            key={langCode}
            onClick={() => translate(langCode)} 
            disabled={isTranslating}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              currentLang === langCode 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.code}</span>
            </div>
          </button>
        ))}
      </div>
      
      {isTranslating && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Translating...</span>
          </div>
        </div>
      )}
    </div>
  )
}