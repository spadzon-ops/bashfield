import { useState, useEffect } from 'react'

export default function SimpleTranslate() {
  const [currentLang, setCurrentLang] = useState('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [originalContent, setOriginalContent] = useState(new Map())

  useEffect(() => {
    const saved = localStorage.getItem('translate-lang') || 'en'
    setCurrentLang(saved)
    
    // Store original content
    if (saved !== 'en') {
      setTimeout(() => translate(saved), 1000)
    }
  }, [])

  const translateText = async (text, targetLang) => {
    if (targetLang === 'en') return text
    
    try {
      const langCode = targetLang === 'ku' ? 'ku' : targetLang
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`)
      const data = await response.json()
      return data[0]?.[0]?.[0] || text
    } catch {
      return text
    }
  }

  const translate = async (targetLang) => {
    if (targetLang === currentLang) return
    
    setIsTranslating(true)
    setCurrentLang(targetLang)
    localStorage.setItem('translate-lang', targetLang)
    
    if (targetLang === 'en') {
      originalContent.forEach((original, element) => {
        if (element && element.parentNode) {
          element.textContent = original
        }
      })
      setIsTranslating(false)
      return
    }
    
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, button, label, option')
    const elementsToTranslate = []
    const textsToTranslate = []
    
    textElements.forEach(element => {
      if (element.classList.contains('notranslate')) return
      if (element.children.length === 0 && element.textContent.trim() && element.textContent.length < 200) {
        if (!originalContent.has(element)) {
          originalContent.set(element, element.textContent)
        }
        elementsToTranslate.push(element)
        textsToTranslate.push(element.textContent.trim())
      }
    })
    
    // Translate instantly
    const promises = elementsToTranslate.map(async (element, index) => {
      const originalText = textsToTranslate[index]
      if (originalText && originalText.length > 0) {
        const translated = await translateText(originalText, targetLang)
        if (element && element.parentNode) {
          element.textContent = translated
        }
      }
    })
    
    await Promise.all(promises)
    
    setOriginalContent(originalContent)
    setIsTranslating(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-1 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 p-1 hover:shadow-lg transition-all duration-300">
        <button 
          onClick={() => translate('en')} 
          disabled={isTranslating}
          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center space-x-1 ${
            currentLang === 'en' 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
              : 'text-gray-700 hover:bg-white hover:shadow-md'
          }`}
        >
          <span>🇺🇸</span>
          <span>EN</span>
        </button>
        <button 
          onClick={() => translate('ku')} 
          disabled={isTranslating}
          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center space-x-1 ${
            currentLang === 'ku' 
              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg transform scale-105' 
              : 'text-gray-700 hover:bg-white hover:shadow-md'
          }`}
        >
          <span>🟡</span>
          <span className="notranslate">کوردی</span>
        </button>
        <button 
          onClick={() => translate('ar')} 
          disabled={isTranslating}
          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center space-x-1 ${
            currentLang === 'ar' 
              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg transform scale-105' 
              : 'text-gray-700 hover:bg-white hover:shadow-md'
          }`}
        >
          <span>🇮🇶</span>
          <span className="notranslate">عربي</span>
        </button>
      </div>
      {isTranslating && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1">
          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Translating...</span>
        </div>
      )}
    </div>
  )
}
