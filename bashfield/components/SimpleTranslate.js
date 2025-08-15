import { useState, useEffect } from 'react'

export default function SimpleTranslate() {
  const [currentLang, setCurrentLang] = useState('en')

  useEffect(() => {
    const saved = localStorage.getItem('translate-lang') || 'en'
    setCurrentLang(saved)
    
    // Hide Google Translate banner if present
    const hideGoogleBanner = () => {
      const style = document.createElement('style')
      style.innerHTML = `
        .goog-te-banner-frame,
        .goog-te-menu-frame,
        .skiptranslate,
        #goog-gt-tt,
        .goog-tooltip,
        .VIpgJd-ZVi9od-aZ2wEe-wOHMyf,
        .VIpgJd-ZVi9od-aZ2wEe-wOHMyf-ti6hGc,
        .translate-tooltip {
          display: none !important;
          visibility: hidden !important;
        }
        body {
          top: 0 !important;
          position: static !important;
        }
        html {
          margin-top: 0 !important;
        }
      `
      document.head.appendChild(style)
    }
    
    // Apply immediately and after page loads
    hideGoogleBanner()
    setTimeout(hideGoogleBanner, 1000)
    setTimeout(hideGoogleBanner, 3000)
  }, [])

  const translate = (targetLang) => {
    if (targetLang === 'en') {
      // Reset to original
      const originalUrl = window.location.href.replace(/^https:\/\/translate\.google\.com\/translate\?.*?&u=/, '')
      const decodedUrl = decodeURIComponent(originalUrl)
      window.location.href = decodedUrl || window.location.origin
      return
    }
    
    // Use Kurdish Sorani (ckb) instead of ku
    const langCode = targetLang === 'ku' ? 'ckb' : targetLang
    const currentUrl = window.location.href.includes('translate.google.com') 
      ? decodeURIComponent(window.location.href.split('&u=')[1] || window.location.origin)
      : window.location.href
    
    const translateUrl = `https://translate.google.com/translate?sl=en&tl=${langCode}&u=${encodeURIComponent(currentUrl)}&hl=en&ie=UTF-8&prev=_t&rurl=translate.google.com`
    
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
