import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'

export default function Layout({ children }) {
  const { t, i18n } = useTranslation('common')
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}` }
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const changeLanguage = (lng) => {
    router.push(router.asPath, router.asPath, { locale: lng })
  }

  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-blue-400 cursor-pointer" onClick={() => router.push('/')}>
                Bashfield
              </h1>
              <button onClick={() => router.push('/')} className="text-gray-300 hover:text-white">
                {t('nav.home')}
              </button>
              {user && (
                <button onClick={() => router.push('/post')} className="text-gray-300 hover:text-white">
                  {t('nav.post')}
                </button>
              )}
              {isAdmin && (
                <button onClick={() => router.push('/admin')} className="text-gray-300 hover:text-white">
                  {t('nav.admin')}
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <select 
                value={i18n.language} 
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-gray-700 text-white px-2 py-1 rounded"
              >
                <option value="en">English</option>
                <option value="ku">کوردی</option>
                <option value="ar">العربية</option>
              </select>
              
              {loading ? (
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-300">{user.email}</span>
                  <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
                  {t('nav.login')}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <main>{children}</main>
    </div>
  )
}