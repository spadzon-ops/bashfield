// bashfield/pages/_app.js
import { useState, useEffect } from 'react'
import Head from 'next/head'
import { appWithTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import MessagesLayout from '../components/MessagesLayout'
import '../styles/globals.css'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { ModeProvider } from '../contexts/ModeContext'
import { TranslationProvider } from '../contexts/TranslationContext'
import AutoTranslate from '../components/AutoTranslate'
import i18n from '../lib/i18n-lite'

function MyApp({ Component, pageProps }) {
  const [supabaseClient] = useState(() => createPagesBrowserClient())
  const router = useRouter()
  
  const isMessagesRoute = router.pathname.startsWith('/messages') || router.pathname.startsWith('/chat/')
  const LayoutComponent = isMessagesRoute ? MessagesLayout : Layout

  useEffect(() => {
    const lang = i18n.getLang()
    i18n.applyDocumentDirection(lang)
  }, [])

  return (
    <>
      <Head>
        <title>Bashfield</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}>
        <TranslationProvider>
          <ModeProvider>
            <LayoutComponent>
              <AutoTranslate />
              <Component {...pageProps} />
            </LayoutComponent>
          </ModeProvider>
        </TranslationProvider>
      </SessionContextProvider>
    </>
  )
}

export default appWithTranslation(MyApp)
