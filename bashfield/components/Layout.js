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
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🏠</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Bashfield
                </h1>
              </div>
              <div className="hidden md:flex space-x-6">
                <button onClick={() => router.push('/')} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  {t('nav.home')}
                </button>
                {user && (
                  <button onClick={() => router.push('/post')} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                    {t('nav.post')}
                  </button>
                )}
                {user && (
                  <button onClick={() => router.push('/profile')} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                    Profile
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => router.push('/admin')} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                    {t('nav.admin')}
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select 
                value={i18n.language} 
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en">🇺🇸 English</option>
                <option value="ku">🏴󠁩󠁱󠁫󠁲󠁿 کوردی</option>
                <option value="ar">🇮🇶 العربية</option>
              </select>
              
              {loading ? (
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">{user.email[0].toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.email.split('@')[0]}</span>
                  </div>
                  <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <button onClick={handleLogin} className="btn-primary">
                  {t('nav.login')}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <main className="min-h-screen">{children}</main>
      
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🏠</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Bashfield</h3>
              </div>
              <p className="text-gray-600 mb-4">Iraq's premier house rental platform. Find your perfect home in Erbil, Baghdad, and across Iraq.</p>
              <div className="flex space-x-4">
                <span className="text-2xl">🇮🇶</span>
                <span className="text-2xl">🏠</span>
                <span className="text-2xl">💼</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-600">
                <li><button onClick={() => router.push('/')} className="hover:text-blue-600">Home</button></li>
                <li><button onClick={() => router.push('/post')} className="hover:text-blue-600">Post Property</button></li>
                <li><button onClick={() => router.push('/about')} className="hover:text-blue-600">About Us</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-600">
                <li>📧 info@bashfield.com</li>
                <li>📱 +964 750 123 4567</li>
                <li>📍 Erbil, Kurdistan Region</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
            <p>&copy; 2024 Bashfield. All rights reserved. Made with ❤️ for Iraq.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
