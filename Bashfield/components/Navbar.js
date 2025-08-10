
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const langs = ['en','ku','ar']

export default function Navbar() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub?.subscription?.unsubscribe()
  }, [])

  const switchLang = (lng) => {
    const { pathname, asPath, query } = router
    router.push({ pathname, query }, asPath, { locale: lng })
  }

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-black/70 backdrop-blur">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold">Bashfield</Link>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex gap-4">
            <Link href="/post" className="hover:underline">Post</Link>
            <Link href="/messages" className="hover:underline">Messages</Link>
            <Link href="/profile" className="hover:underline">Profile</Link>
          </div>
          <div className="relative">
            <button onClick={() => setOpen(!open)} className="px-3 py-1 rounded-xl border">
              {router.locale?.toUpperCase() || 'EN'}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-28 rounded-xl border bg-black shadow-lg">
                {langs.map(l => (
                  <button key={l} onClick={() => {switchLang(l); setOpen(false)}} className="w-full px-3 py-2 text-left hover:bg-neutral-900">{l.toUpperCase()}</button>
                ))}
              </div>
            )}
          </div>
          {!session ? (
            <button onClick={signIn} className="px-3 py-1 rounded-xl bg-white text-black">Sign in</button>
          ) : (
            <button onClick={signOut} className="px-3 py-1 rounded-xl border">Sign out</button>
          )}
        </div>
      </nav>
    </header>
  )
}
