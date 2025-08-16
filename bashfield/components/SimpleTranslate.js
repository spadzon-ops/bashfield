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
      window.location.reload()
      return
    }
    
    const currentUrl = window.location.href
    const translateUrl = `https://translate.google.com/translate?sl=en&tl=${targetLang}&u=${encodeURIComponent(currentUrl)}`
    
    setTimeout(() => {
      window.location.href = translateUrl
    }, 300)
  }

  return (
    <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-1.5 shadow-sm">
      <button 
        onClick={() => translate('en')} 
        disabled={isTranslating}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
          currentLang === 'en' 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
        } ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        🇺🇸 EN
      </button>
      <button 
        onClick={() => translate('ku')} 
        disabled={isTranslating}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
          currentLang === 'ku' 
            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
            : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
        } ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        🟥🟨🟩 KU
      </button>
      <button 
        onClick={() => translate('ar')} 
        disabled={isTranslating}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
          currentLang === 'ar' 
            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md' 
            : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
        } ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        🇮🇶 AR
      </button>
      {isTranslating && (
        <div className="ml-2 flex items-center text-xs text-gray-500">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-1"></div>
          Translating...
        </div>
      )}
    </div>
  )
}
