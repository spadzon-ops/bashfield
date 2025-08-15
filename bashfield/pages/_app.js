import { useState } from 'react'
import { appWithTranslation } from 'next-i18next'
import Layout from '../components/Layout'
import '../styles/globals.css'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { ModeProvider } from '../contexts/ModeContext'

function MyApp({ Component, pageProps }) {
  const [supabaseClient] = useState(() => createPagesBrowserClient())
  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}>
      <ModeProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ModeProvider>
    </SessionContextProvider>
  )
}

export default appWithTranslation(MyApp)
