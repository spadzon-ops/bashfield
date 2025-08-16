// Import comprehensive translations
import comprehensiveTranslations, { getComprehensiveTranslation } from './comprehensive-translations'

// Legacy translations for backward compatibility
const translations = comprehensiveTranslations

export function getTranslation(key, lang = 'en') {
  return getComprehensiveTranslation(key, lang)
}

export function getCurrentLanguage() {
  if (typeof window === 'undefined') return 'en'
  return localStorage.getItem('translate-lang') || 'en'
}

export default translations