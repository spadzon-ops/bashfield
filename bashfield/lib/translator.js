// Free automatic translation using Google Translate API (via MyMemory)
const TRANSLATION_API = 'https://api.mymemory.translated.net/get'

// Language mappings
const LANG_CODES = {
  en: 'en',
  ku: 'ku', // Kurdish (Sorani)
  ar: 'ar'
}

// Cache for translations to avoid repeated API calls
const translationCache = new Map()

export async function translateText(text, fromLang, toLang) {
  if (!text || fromLang === toLang) return text
  
  const cacheKey = `${text}_${fromLang}_${toLang}`
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)
  }

  try {
    const response = await fetch(
      `${TRANSLATION_API}?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
    )
    const data = await response.json()
    
    if (data.responseStatus === 200) {
      const translated = data.responseData.translatedText
      translationCache.set(cacheKey, translated)
      return translated
    }
    
    return text // Return original if translation fails
  } catch (error) {
    console.error('Translation error:', error)
    return text
  }
}

export async function translateListingContent(listing, targetLang) {
  if (!listing || targetLang === 'en') return listing

  const translated = { ...listing }
  
  try {
    // Detect source language (assume English if not specified)
    const sourceLang = listing.language || 'en'
    
    if (sourceLang !== targetLang) {
      translated.title = await translateText(listing.title, sourceLang, targetLang)
      translated.description = await translateText(listing.description, sourceLang, targetLang)
      translated.city = await translateText(listing.city, sourceLang, targetLang)
    }
  } catch (error) {
    console.error('Listing translation error:', error)
  }
  
  return translated
}

export async function translateMessage(message, targetLang) {
  if (!message || !message.content) return message

  const translated = { ...message }
  
  try {
    // Detect source language (assume English if not specified)
    const sourceLang = message.language || 'en'
    
    if (sourceLang !== targetLang) {
      translated.content = await translateText(message.content, sourceLang, targetLang)
      translated.originalContent = message.content
      translated.originalLanguage = sourceLang
    }
  } catch (error) {
    console.error('Message translation error:', error)
  }
  
  return translated
}

// Detect language of text (simple heuristic)
export function detectLanguage(text) {
  if (!text) return 'en'
  
  // Arabic detection
  const arabicRegex = /[\u0600-\u06FF]/
  if (arabicRegex.test(text)) return 'ar'
  
  // Kurdish detection (basic - looks for Kurdish-specific characters)
  const kurdishRegex = /[ئەڕێۆوەیەکگ]/
  if (kurdishRegex.test(text)) return 'ku'
  
  // Default to English
  return 'en'
}