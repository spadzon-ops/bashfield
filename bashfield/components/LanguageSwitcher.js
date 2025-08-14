import { useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

const languages = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    dir: 'ltr'
  },
  {
    code: 'ku',
    name: 'کوردی',
    flag: '🟡🔴🟢', // Kurdish colors as emoji
    dir: 'rtl'
  },
  {
    code: 'ar',
    name: 'العربية',
    flag: '🇮🇶',
    dir: 'rtl'
  }
]

export default function LanguageSwitcher() {
  const router = useRouter()
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const currentLang = languages.find(lang => lang.code === router.locale) || languages[0]

  const handleLanguageChange = (langCode) => {
    const { pathname, asPath, query } = router
    router.push({ pathname, query }, asPath, { locale: langCode })
    setIsOpen(false)
    
    // Update document direction
    const newLang = languages.find(lang => lang.code === langCode)
    if (newLang) {
      document.documentElement.dir = newLang.dir
      document.documentElement.lang = langCode
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="font-medium text-gray-700">{currentLang.name}</span>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px]">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  currentLang.code === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
                {currentLang.code === lang.code && (
                  <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}