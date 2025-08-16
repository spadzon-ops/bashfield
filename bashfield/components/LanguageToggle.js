import { useState } from 'react'
import { useTranslation } from '../contexts/TranslationContext'

export default function LanguageToggle({ isMobile = false }) {
  const { currentLanguage, languages, isTranslating, translatePage } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = (langCode) => {
    if (langCode !== currentLanguage) {
      translatePage(langCode)
    }
    setIsOpen(false)
  }

  const currentLang = languages[currentLanguage]

  if (isMobile) {
    return (
      <div className="relative">
        <div className="flex items-center space-x-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 px-3 py-2 rounded-xl">
          <img 
            src={`/flags/${currentLang.flag}.svg`}
            alt={currentLang.name}
            className="w-4 h-3 object-cover rounded-sm"
          />
          <select 
            value={currentLanguage} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-transparent border-none text-gray-700 text-xs font-semibold focus:outline-none appearance-none"
            disabled={isTranslating}
          >
            {Object.entries(languages).map(([code, lang]) => (
              <option key={code} value={code}>
                {code.toUpperCase()}
              </option>
            ))}
          </select>
          {isTranslating && (
            <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTranslating}
        className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-300 hover:from-blue-50 hover:to-blue-100 hover:border-blue-300 disabled:opacity-50"
      >
        <img 
          src={`/flags/${currentLang.flag}.svg`}
          alt={currentLang.name}
          className="w-6 h-4 object-cover rounded-sm shadow-sm"
        />
        <span className="text-gray-700 font-semibold text-sm">
          {currentLang.name}
        </span>
        {isTranslating ? (
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-4 h-4 text-gray-400 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 min-w-48 animate-in slide-in-from-top-2 duration-200">
          {Object.entries(languages).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code)}
              className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center space-x-3 ${
                currentLanguage === code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              <img 
                src={`/flags/${lang.flag}.svg`}
                alt={lang.name}
                className="w-6 h-4 object-cover rounded-sm shadow-sm"
              />
              <span className="font-medium">{lang.name}</span>
              {currentLanguage === code && (
                <svg className="w-4 h-4 ml-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}