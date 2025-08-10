import { useState } from 'react'
import { appWithTranslation } from 'next-i18next'
import Layout from '../components/Layout'
import '../styles/globals.css'
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'


import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  const router = useRouter()
  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange(async (_event, session) => {
      const email = session?.user?.email || ''
      // Enforce Gmail-only login (signs out others)
      if (session && !email.endsWith('@gmail.com')) {
        await supabase.auth.signOut()
        alert('Please sign in with a Gmail account.')
        router.push('/')
      }
    })
    return () => sub?.data?.subscription?.unsubscribe()
  }, [router])

  const [supabaseClient] = useState(() => createBrowserSupabaseClient())

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionContextProvider>
  )
}

export default appWithTranslation(MyApp)
