import { useState, useEffect } from 'react'

export default function SimpleTranslate() {
  const [currentLang, setCurrentLang] = useState('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [originalContent, setOriginalContent] = useState(new Map())

  useEffect(() => {
    const saved = localStorage.getItem('translate-lang') || 'en'
    setCurrentLang(saved)
    
    // Auto-translate new content when it loads
    const observer = new MutationObserver(() => {
      if (saved !== 'en') {
        setTimeout(() => translateNewContent(saved), 100)
      }
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    })
    
    // Initial translation
    if (saved !== 'en') {
      setTimeout(() => translate(saved), 1000)
    }
    
    return () => observer.disconnect()
  }, [])

  const translateText = async (text, targetLang) => {
    if (targetLang === 'en') return text
    
    try {
      const langCode = targetLang === 'ku' ? 'ckb' : targetLang
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
    
    const { elementsToTranslate, textsToTranslate } = getAllTranslatableElements()
    
    // Translate instantly
    await translateElements(elementsToTranslate, textsToTranslate, targetLang)
    
    setOriginalContent(originalContent)
    setIsTranslating(false)
  }
  
  const getAllTranslatableElements = () => {
    const textElements = document.querySelectorAll('*')
    const elementsToTranslate = []
    const textsToTranslate = []
    
    textElements.forEach(element => {
      if (element.classList.contains('notranslate')) return
      if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return
      
      // Handle text content
      if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
        const text = element.textContent.trim()
        if (text && text.length > 0 && text.length < 1000) {
          if (!originalContent.has(element)) {
            originalContent.set(element, text)
          }
          elementsToTranslate.push(element)
          textsToTranslate.push(text)
        }
      }
      
      // Handle all attributes that might contain text
      const attributes = ['placeholder', 'title', 'alt', 'aria-label', 'data-tooltip']
      attributes.forEach(attr => {
        if (element.hasAttribute(attr)) {
          const value = element.getAttribute(attr)
          if (value && value.trim()) {
            if (!originalContent.has(`${element}-${attr}`)) {
              originalContent.set(`${element}-${attr}`, value)
            }
            elementsToTranslate.push({ element, type: attr })
            textsToTranslate.push(value.trim())
          }
        }
      })
    })
    
    return { elementsToTranslate, textsToTranslate }
  }
  
  const translateElements = async (elementsToTranslate, textsToTranslate, targetLang) => {
    // Batch translate for speed
    const batchSize = 20
    const translations = new Map()
    
    // Get all translations first
    for (let i = 0; i < textsToTranslate.length; i += batchSize) {
      const batch = textsToTranslate.slice(i, i + batchSize)
      const promises = batch.map(text => translateText(text, targetLang))
      const results = await Promise.all(promises)
      
      batch.forEach((text, index) => {
        translations.set(text, results[index])
      })
    }
    
    // Apply all translations at once
    elementsToTranslate.forEach((item, index) => {
      const originalText = textsToTranslate[index]
      const translated = translations.get(originalText)
      
      if (translated && originalText !== translated) {
        if (typeof item === 'object' && item.type) {
          item.element.setAttribute(item.type, translated)
        } else if (item && item.parentNode) {
          item.textContent = translated
        }
      }
    })
  }
  
  const translateNewContent = async (targetLang) => {
    if (targetLang === 'en') return
    
    const { elementsToTranslate, textsToTranslate } = getAllTranslatableElements()
    const newElements = elementsToTranslate.filter(item => {
      if (typeof item === 'object' && item.type) {
        return !originalContent.has(`${item.element}-${item.type}`)
      }
      return !originalContent.has(item)
    })
    
    if (newElements.length > 0) {
      const newTexts = newElements.map((item, index) => {
        const fullIndex = elementsToTranslate.indexOf(item)
        return textsToTranslate[fullIndex]
      })
      
      // Hide new content during translation
      newElements.forEach(item => {
        const element = typeof item === 'object' ? item.element : item
        if (element) element.style.opacity = '0'
      })
      
      await translateElements(newElements, newTexts, targetLang)
      
      // Show translated content
      newElements.forEach(item => {
        const element = typeof item === 'object' ? item.element : item
        if (element) element.style.opacity = '1'
      })
    }
  }
  
  const translate = async (targetLang) => {
    if (targetLang === currentLang) return
    
    setIsTranslating(true)
    setCurrentLang(targetLang)
    localStorage.setItem('translate-lang', targetLang)
    
    // Hide content during translation
    document.body.style.opacity = '0.3'
    document.body.style.pointerEvents = 'none'
    
    if (targetLang === 'en') {
      originalContent.forEach((original, key) => {
        if (typeof key === 'string' && key.includes('-')) {
          const [element, attr] = key.split('-')
          if (element && element.setAttribute) {
            element.setAttribute(attr, original)
          }
        } else if (key && key.parentNode) {
          key.textContent = original
        }
      })
      
      // Show content
      document.body.style.opacity = '1'
      document.body.style.pointerEvents = 'auto'
      setIsTranslating(false)
      return
    }
    
    const { elementsToTranslate, textsToTranslate } = getAllTranslatableElements()
    
    // Translate all at once
    await translateElements(elementsToTranslate, textsToTranslate, targetLang)
    
    // Show content
    document.body.style.opacity = '1'
    document.body.style.pointerEvents = 'auto'
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
