// bashfield/pages/_app.js
import Head from 'next/head'
import { useState } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { ModeProvider } from '../contexts/ModeContext'
import { TranslationProvider } from '../contexts/TranslationContext'
import Layout from '../components/Layout'
import MessagesLayout from '../components/MessagesLayout'
import { useRouter } from 'next/router'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  const [supabaseClient] = useState(() => createPagesBrowserClient())
  const router = useRouter()
  const isMessagesRoute = router.pathname.startsWith('/messages') || router.pathname.startsWith('/chat/')
  const LayoutComponent = isMessagesRoute ? MessagesLayout : Layout

  return (
    <>
      <Head>
        <title>Bashfield</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}>
        <TranslationProvider initialLang="en">
          <ModeProvider>
            <LayoutComponent>
              <Component {...pageProps} />
            </LayoutComponent>
          </ModeProvider>
        </TranslationProvider>
      </SessionContextProvider>
    </>
  )
}

export default MyApp
