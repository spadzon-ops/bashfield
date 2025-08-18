import { useState } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import '../styles/globals.css'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { ModeProvider } from '../contexts/ModeContext'
import { TranslationProvider } from '../contexts/TranslationContext'

function MyApp({ Component, pageProps }) {
  const [supabaseClient] = useState(() => createPagesBrowserClient())
  return (
    <>
      <Head>
        <title>Bashfield - Premier Property Platform</title>
        <meta name="description" content="Find your perfect home with Bashfield - the premier property rental platform in Kurdistan Region and Iraq. Browse apartments, houses, and commercial properties with ease." />
        <meta name="keywords" content="property rental, house rental, apartment rental, Kurdistan, Iraq, Erbil, real estate, Bashfield" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bashfield" />
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Bashfield - Premier Property Platform" />
        <meta property="og:description" content="Find your perfect home with Bashfield - the premier property rental platform in Kurdistan Region and Iraq." />
        <meta property="og:image" content="/logo.svg" />
        <meta property="og:url" content="https://bashfield.com" />
        <meta property="og:site_name" content="Bashfield" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Bashfield - Premier Property Platform" />
        <meta name="twitter:description" content="Find your perfect home with Bashfield - the premier property rental platform in Kurdistan Region and Iraq." />
        <meta name="twitter:image" content="/logo.svg" />
      </Head>
      <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}>
        <TranslationProvider>
          <ModeProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </ModeProvider>
        </TranslationProvider>
      </SessionContextProvider>
    </>
  )
}

export default MyApp
