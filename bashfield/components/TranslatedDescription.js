import { useState, useEffect } from 'react'

export default function TranslatedDescription({ listing }) {
  const [currentLang, setCurrentLang] = useState('en')

  useEffect(() => {
    const saved = localStorage.getItem('translate-lang') || 'en'
    setCurrentLang(saved)
    
    // Listen for language changes
    const handleStorageChange = () => {
      const newLang = localStorage.getItem('translate-lang') || 'en'
      setCurrentLang(newLang)
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const getDescription = () => {
    switch (currentLang) {
      case 'ku':
        return listing.description_ku || listing.description
      case 'ar':
        return listing.description_ar || listing.description
      default:
        return listing.description
    }
  }

  const getTextDirection = () => {
    return (currentLang === 'ar' || currentLang === 'ku') ? 'rtl' : 'ltr'
  }

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span>Property Description</span>
        {currentLang !== 'en' && (
          <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {currentLang === 'ku' ? '🟡 Kurdish' : '🇮🇶 Arabic'}
          </span>
        )}
      </h3>
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200/50">
        <p 
          className="text-gray-700 leading-relaxed text-lg whitespace-pre-line"
          dir={getTextDirection()}
        >
          {getDescription()}
        </p>
        {currentLang !== 'en' && !getDescription().includes(listing.description) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Original (English):</p>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}