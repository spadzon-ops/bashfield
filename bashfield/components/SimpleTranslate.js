import { useState, useEffect } from 'react'

export default function SimpleTranslate() {
  const [currentLang, setCurrentLang] = useState('en')

  useEffect(() => {
    const saved = localStorage.getItem('translate-lang') || 'en'
    setCurrentLang(saved)
  }, [])

  const translate = (targetLang) => {
    if (targetLang === 'en') {
      // Reset to original
      window.location.reload()
      return
    }
    
    const currentUrl = window.location.href
    const translateUrl = `https://translate.google.com/translate?sl=en&tl=${targetLang}&u=${encodeURIComponent(currentUrl)}`
    
    setCurrentLang(targetLang)
    localStorage.setItem('translate-lang', targetLang)
    
    window.location.href = translateUrl
  }

  return (
    <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-200 p-1">
      <button 
        onClick={() => translate('en')} 
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          currentLang === 'en' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        🇺🇸 EN
      </button>
      <button 
        onClick={() => translate('ku')} 
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          currentLang === 'ku' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        🏴 KU
      </button>
      <button 
        onClick={() => translate('ar')} 
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          currentLang === 'ar' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        🇮🇶 AR
      </button>
    </div>
  )
}
