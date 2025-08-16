// bashfield/contexts/TranslationContext.js
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { translate as tr, getDir, isRTL } from '../lib/i18n-lite'

// cookie helpers
function readCookie(name) {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[2]) : null
}
function writeCookie(name, value) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`
}

const TranslationContext = createContext(null)

export function TranslationProvider({ children, initialLang = 'en' }) {
  const [lang, setLang] = useState(initialLang)

  // hydrate from cookie/localStorage on client
  useEffect(() => {
    const fromCookie = readCookie('bf_lang')
    const fromStorage = typeof window !== 'undefined' ? localStorage.getItem('bf_lang') : null
    const l = fromCookie || fromStorage || initialLang || 'en'
    if (l !== lang) setLang(l)
  }, [])

  // keep cookie + localStorage + <html dir/lang> in sync
  useEffect(() => {
    if (typeof window === 'undefined') return
    writeCookie('bf_lang', lang)
    localStorage.setItem('bf_lang', lang)
    document.documentElement.setAttribute('lang', lang)
    document.documentElement.setAttribute('dir', getDir(lang))
  }, [lang])

  const value = useMemo(() => ({
    lang,
    dir: getDir(lang),
    rtl: isRTL(lang),
    setLang,
    t: (key) => tr(lang, key)
  }), [lang])

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
}

export function useTranslation() {
  const ctx = useContext(TranslationContext)
  if (!ctx) throw new Error('useTranslation must be used within <TranslationProvider>')
  return ctx
}
