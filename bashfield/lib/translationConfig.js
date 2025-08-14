// Translation configuration for Bashfield
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr'
  },
  ku: {
    code: 'ku',
    name: 'Kurdish',
    nativeName: 'کوردی',
    flag: '🟡🔴🟢', // Kurdish colors
    dir: 'rtl'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇮🇶',
    dir: 'rtl'
  }
}

export const DEFAULT_LANGUAGE = 'en'

// Fields that should NOT be translated
export const NON_TRANSLATABLE_FIELDS = [
  'email',
  'phone',
  'user_id',
  'id',
  'created_at',
  'updated_at',
  'price',
  'rooms',
  'size_sqm',
  'latitude',
  'longitude',
  'images',
  'reference_code',
  'display_name', // usernames should not be translated
  'profile_picture'
]

// Translation API configuration
export const TRANSLATION_CONFIG = {
  apiUrl: 'https://api.mymemory.translated.net/get',
  maxRetries: 3,
  retryDelay: 1000,
  cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours
  batchSize: 10 // Maximum texts to translate in one batch
}

// Language detection patterns
export const LANGUAGE_PATTERNS = {
  ar: /[\u0600-\u06FF]/,
  ku: /[ئەڕێۆوەیەکگ]/,
  en: /[a-zA-Z]/
}

export function getLanguageDirection(langCode) {
  return SUPPORTED_LANGUAGES[langCode]?.dir || 'ltr'
}

export function isRTLLanguage(langCode) {
  return getLanguageDirection(langCode) === 'rtl'
}