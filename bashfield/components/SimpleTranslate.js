import { useState, useEffect } from 'react'

export default function SimpleTranslate() {
  const [currentLang, setCurrentLang] = useState('en')

  useEffect(() => {
    const saved = localStorage.getItem('translate-lang') || 'en'
    setCurrentLang(saved)
  }, [])

  const translate = (targetLang) => {
    if (targetLang === currentLang) return
    
    setCurrentLang(targetLang)
    localStorage.setItem('translate-lang', targetLang)
    
    // Trigger storage event for other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'translate-lang',
      newValue: targetLang
    }))
    
    // Reload page to apply language change
    window.location.reload()
  }

  const languages = {
    en: { flag: '🇺🇸', name: 'English', code: 'EN' },
    ku: { flag: '🟡', name: 'کوردی', code: 'KU' },
    ar: { flag: '🇮🇶', name: 'العربية', code: 'AR' }
  }

  return (
    <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-1 shadow-lg">
      {Object.entries(languages).map(([langCode, lang]) => (
        <button 
          key={langCode}
          onClick={() => translate(langCode)} 
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
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
  )
}