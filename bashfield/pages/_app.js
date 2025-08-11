import { useState } from 'react'
import { appWithTranslation } from 'next-i18next'
import Layout from '../components/Layout'
import '../styles/globals.css'
import { createBrowserClient } from '@supabase/ssr'

function MyApp({ Component, pageProps }) {
  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  )

  return (
    <Layout>
      <Component {...pageProps} supabase={supabase} />
    </Layout>
  )
}

export default appWithTranslation(MyApp)
