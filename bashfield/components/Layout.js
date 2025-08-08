import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'

export default function Layout({ children }) {
  const { t, i18n } = useTranslation('common')
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        getUserProfile(session.user)
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      await getUserProfile(user)
      await getUnreadCount(user)
    }
    setLoading(false)
    setAuthChecked(true)
  }

  const getUnreadCount = async (user) => {
    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .eq('recipient_id', user.id)
      .eq('read', false)
    
    if (data && !error) {
      setUnreadCount(data.length)
    }
  }

  const getUserProfile = async (user) => {
    try {
      const { data: profileData, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileData && !fetchError) {
        setProfile(profileData)
      } else {
        // Create default profile with Google full name or email fallback
        const defaultName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0]
        
        const { data, error } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            display_name: defaultName
          })
          .select()
          .single()

        if (!error && data) {
          setProfile(data)
        }
      }
    } catch (error) {
      console.error('Error with user profile:', error)
    }
  }

  // Function to refresh profile data
  const refreshProfile = async () => {
    if (user) {
      await getUserProfile(user)
    }
  }

  // Listen for profile updates
  useEffect(() => {
    if (user) {
      const channel = supabase
        .channel('profile-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'user_profiles',
            filter: `user_id=eq.${user.id}`
          }, 
          () => {
            refreshProfile()
          }
        )
        .subscribe()

      // Listen for custom profile update events
      const handleProfileUpdate = (event) => {
        setProfile(event.detail.profile)
      }
      
      // Listen for messages read events
      const handleMessagesRead = () => {
        getUnreadCount(user)
      }
      
      window.addEventListener('profileUpdated', handleProfileUpdate)
      window.addEventListener('messagesRead', handleMessagesRead)

      // Listen for new messages to update unread count
      const messageChannel = supabase
        .channel('message-updates')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${user.id}`
          },
          () => {
            getUnreadCount(user)
          }
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${user.id}`
          },
          () => {
            getUnreadCount(user)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
        supabase.removeChannel(messageChannel)
        window.removeEventListener('profileUpdated', handleProfileUpdate)
        window.removeEventListener('messagesRead', handleMessagesRead)
      }
    }
  }, [user])

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/')}>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🏠</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Bashfield
                </h1>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => router.push('/')} 
                className={`text-sm font-medium transition-colors ${
                  router.pathname === '/' 
                    ? 'text-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Home
              </button>
              {user && (
                <>
                  <button 
                    onClick={() => router.push('/post')} 
                    className={`text-sm font-medium transition-colors ${
                      router.pathname === '/post' 
                        ? 'text-blue-600' 
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    List Property
                  </button>
                </>
              )}
              {isAdmin && (
                <button 
                  onClick={() => router.push('/admin')} 
                  className={`text-sm font-medium transition-colors ${
                    router.pathname === '/admin' 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Admin
                </button>
              )}
            </div>
            
            {/* Desktop Right Side */}
            <div className="hidden md:flex items-center space-x-4">
              {user && (
                <button 
                  onClick={() => router.push('/messages')} 
                  className={`text-sm font-medium transition-colors relative ${
                    router.pathname === '/messages' 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}
              <div className="relative">
                <div className="flex items-center space-x-2 bg-white border border-gray-300 px-3 py-2 rounded-lg">
                  <img 
                    src={`/flags/${i18n.language === 'en' ? 'us' : i18n.language === 'ku' ? 'kurdistan' : 'iraq'}.svg`}
                    alt="Flag"
                    className="w-5 h-3 object-cover rounded-sm"
                  />
                  <select 
                    value={i18n.language} 
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="bg-transparent border-none text-gray-700 text-sm focus:outline-none appearance-none"
                  >
                    <option value="en">English</option>
                    <option value="ku">Kurdish</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>
              
              {loading ? (
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <div 
                    className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => router.push('/profile')}
                  >
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                      {profile?.profile_picture ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${profile.profile_picture}`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xs font-semibold">
                          {profile?.display_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {profile?.display_name || user.email.split('@')[0]}
                    </span>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <div className="relative">
                <div className="flex items-center space-x-1 bg-white border border-gray-300 px-2 py-1 rounded">
                  <img 
                    src={`/flags/${i18n.language === 'en' ? 'us' : i18n.language === 'ku' ? 'kurdistan' : 'iraq'}.svg`}
                    alt="Flag"
                    className="w-4 h-2.5 object-cover rounded-sm"
                  />
                  <select 
                    value={i18n.language} 
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="bg-transparent border-none text-gray-700 text-xs focus:outline-none appearance-none"
                  >
                    <option value="en">EN</option>
                    <option value="ku">KU</option>
                    <option value="ar">AR</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-blue-600 p-2 relative"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {user && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    router.push('/')
                    setMobileMenuOpen(false)
                  }} 
                  className={`block w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                    router.pathname === '/' 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  🏠 Home
                </button>
                {user && (
                  <>
                    <button 
                      onClick={() => {
                        router.push('/post')
                        setMobileMenuOpen(false)
                      }} 
                      className={`block w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                        router.pathname === '/post' 
                          ? 'text-blue-600 bg-blue-50' 
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      📝 List Property
                    </button>
                    <button 
                      onClick={() => {
                        router.push('/messages')
                        setMobileMenuOpen(false)
                      }} 
                      className={`block w-full text-left px-4 py-2 text-sm font-medium transition-colors relative ${
                        router.pathname === '/messages' 
                          ? 'text-blue-600 bg-blue-50' 
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      💬 Messages
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        router.push('/profile')
                        setMobileMenuOpen(false)
                      }} 
                      className={`block w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                        router.pathname === '/profile' 
                          ? 'text-blue-600 bg-blue-50' 
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      👤 Profile
                    </button>
                  </>
                )}
                {isAdmin && (
                  <button 
                    onClick={() => {
                      router.push('/admin')
                      setMobileMenuOpen(false)
                    }} 
                    className={`block w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                      router.pathname === '/admin' 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    🛡️ Admin
                  </button>
                )}
                <div className="border-t border-gray-200 pt-3">
                  {loading ? (
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : user ? (
                    <button 
                      onClick={() => {
                        handleLogout()
                        setMobileMenuOpen(false)
                      }} 
                      className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      🚪 Logout
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        handleLogin()
                        setMobileMenuOpen(false)
                      }} 
                      className="block w-full text-left px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      🔐 Sign In
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      
      <main>{children}</main>
      
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🏠</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Bashfield</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Iraq's premier house rental platform. Find your perfect home across Iraq's major cities.
              </p>
              <div className="flex space-x-4">
                <span className="text-2xl">🇮🇶</span>
                <span className="text-2xl">🏠</span>
                <span className="text-2xl">💼</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <button onClick={() => router.push('/')} className="hover:text-blue-600 transition-colors">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => router.push('/post')} className="hover:text-blue-600 transition-colors">
                    List Property
                  </button>
                </li>
                {user && (
                  <li>
                    <button onClick={() => router.push('/profile')} className="hover:text-blue-600 transition-colors">
                      Profile
                    </button>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-600 text-sm">
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
