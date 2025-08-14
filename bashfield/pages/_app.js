import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { appWithTranslation } from 'next-i18next'
import Layout from '../components/Layout'
import '../styles/globals.css'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { getLanguageDirection } from '../lib/translationConfig'

function MyApp({ Component, pageProps }) {
  const [supabaseClient] = useState(() => createPagesBrowserClient())
  const router = useRouter()
  
  useEffect(() => {
    // Set document direction based on current language
    const currentLang = router.locale || 'en'
    const direction = getLanguageDirection(currentLang)
    document.documentElement.dir = direction
    document.documentElement.lang = currentLang
  }, [router.locale])
  
  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionContextProvider>
  )
}

export default appWithTranslation(MyApp)
