import { useState, useEffect } from 'react'
import { setLanguage, getCurrentLanguage } from '../lib/simple-translations'

export default function SimpleLanguageToggle() {
  const [currentLang, setCurrentLang] = useState('en')

  useEffect(() => {
    setCurrentLang(getCurrentLanguage())
  }, [])

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setCurrentLang(lang)
  }

  return (
    <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm border p-1">
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          currentLang === 'en' 
            ? 'bg-blue-500 text-white' 
            : 'text-gray-600 hover:text-blue-500'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => handleLanguageChange('ku')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          currentLang === 'ku' 
            ? 'bg-blue-500 text-white' 
            : 'text-gray-600 hover:text-blue-500'
        }`}
      >
        کو
      </button>
      <button
        onClick={() => handleLanguageChange('ar')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          currentLang === 'ar' 
            ? 'bg-blue-500 text-white' 
            : 'text-gray-600 hover:text-blue-500'
        }`}
      >
        ع
      </button>
    </div>
  )
}