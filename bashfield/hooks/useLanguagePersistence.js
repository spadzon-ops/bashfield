import { useEffect } from 'react'
import { useRouter } from 'next/router'

export function useLanguagePersistence() {
  const router = useRouter()

  useEffect(() => {
    // Save current language to localStorage whenever it changes
    if (typeof window !== 'undefined' && router.locale) {
      localStorage.setItem('preferred-language', router.locale)
    }
  }, [router.locale])

  useEffect(() => {
    // On initial load, check for saved language preference
    if (typeof window !== 'undefined' && router.isReady) {
      const savedLang = localStorage.getItem('preferred-language')
      if (savedLang && savedLang !== router.locale && ['en', 'ku', 'ar'].includes(savedLang)) {
        const { pathname, asPath, query } = router
        router.replace({ pathname, query }, asPath, { locale: savedLang })
      }
    }
  }, [router.isReady])
}