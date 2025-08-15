import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'

export default function MessagesLayout({ children }) {
  const { t, i18n } = useTranslation('common')
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
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
    setTimeout(() => setInitialLoad(false), 100)
  }

  const getUnreadCount = async (user) => {
    const { data, error } = await supabase
      .from('messages')
      .select('conversation_id')
      .eq('recipient_id', user.id)
      .eq('read', false)
    
    if (data && !error) {
      let uniqueConversations = [...new Set(data.map(m => m.conversation_id))]
      
      if (window.activeConversationId) {
        uniqueConversations = uniqueConversations.filter(id => id !== window.activeConversationId)
      }
      
      const newCount = uniqueConversations.length
      setUnreadCount(newCount)
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

  const refreshProfile = async () => {
    if (user) {
      await getUserProfile(user)
    }
  }

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

      const handleProfileUpdate = (event) => {
        setProfile(event.detail.profile)
      }
      
      const handleMessagesRead = () => {
        getUnreadCount(user)
      }
      
      const handleUnreadCountUpdate = (event) => {
        setUnreadCount(event.detail.count)
      }
      
      window.addEventListener('profileUpdated', handleProfileUpdate)
      window.addEventListener('messagesRead', handleMessagesRead)
      window.addEventListener('unreadCountUpdate', handleUnreadCountUpdate)

      const messageChannel = supabase
        .channel('global-message-updates')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${user.id}`
          },
          (payload) => {
            const newMessage = payload.new
            
            if (window.activeConversationId && newMessage.conversation_id === window.activeConversationId) {
              return
            }
            
            setTimeout(() => getUnreadCount(user), 500)
            
            window.dispatchEvent(new CustomEvent('messageReceived', {
              detail: { message: newMessage }
            }))
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

      const pollInterval = setInterval(() => {
        getUnreadCount(user)
      }, 3000)

      return () => {
        supabase.removeChannel(channel)
        supabase.removeChannel(messageChannel)
        clearInterval(pollInterval)
        window.removeEventListener('profileUpdated', handleProfileUpdate)
        window.removeEventListener('messagesRead', handleMessagesRead)
        window.removeEventListener('unreadCountUpdate', handleUnreadCountUpdate)
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
    <div className="h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-200/50 z-50 flex-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18">
            <div className="flex items-center">
              <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => router.push('/')}>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-800 opacity-50"></div>
                  <div className="absolute inset-0 bg-gradient-to-tl from-cyan-400/20 to-transparent"></div>
                  <div className="relative z-10 text-white font-black text-lg tracking-tight">
                    <span className="block transform -rotate-12 drop-shadow-lg">B</span>
                  </div>
                  <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-sm"></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-cyan-300 rounded-full opacity-70"></div>
                  <div className="absolute top-2 left-2 w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    Bashfield
                  </h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Premier Property Platform</p>
                </div>
              </div>
            </div>
            
            <div className={`hidden md:flex items-center space-x-2 transition-opacity duration-300 ${initialLoad ? 'opacity-0' : 'opacity-100'}`}>
              <button 
                onClick={() => router.push('/')} 
                className="px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </button>
            </div>
            
            <div className={`hidden lg:flex items-center space-x-2 transition-opacity duration-300 ${initialLoad ? 'opacity-0' : 'opacity-100'}`}>
              <div className="relative">
                <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-300">
                  <img 
                    src={`/flags/${i18n.language === 'en' ? 'us' : i18n.language === 'ku' ? 'kurdistan' : 'iraq'}.svg`}
                    alt="Flag"
                    className="w-6 h-4 object-cover rounded-sm shadow-sm"
                  />
                  <select 
                    value={i18n.language} 
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="bg-transparent border-none text-gray-700 font-semibold focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="ku">Kurdish</option>
                    <option value="ar">Arabic</option>
                  </select>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {loading ? (
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <div 
                    className="flex items-center space-x-3 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-xl cursor-pointer hover:from-purple-100 hover:to-pink-100 transition-all duration-300 border border-purple-200/50 group"
                    onClick={() => router.push('/profile')}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                      {profile?.profile_picture ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${profile.profile_picture}`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-bold">
                          {profile?.display_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="hidden lg:block">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {profile?.display_name || user.email.split('@')[0]}
                      </div>
                      <div className="text-xs text-gray-500">View Profile</div>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin} 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In</span>
                </button>
              )}
            </div>

            <div className="lg:hidden flex items-center space-x-2">
              <div className="relative">
                <div className="flex items-center space-x-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 px-3 py-2 rounded-xl">
                  <img 
                    src={`/flags/${i18n.language === 'en' ? 'us' : i18n.language === 'ku' ? 'kurdistan' : 'iraq'}.svg`}
                    alt="Flag"
                    className="w-4 h-3 object-cover rounded-sm"
                  />
                  <select 
                    value={i18n.language} 
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="bg-transparent border-none text-gray-700 text-xs font-semibold focus:outline-none appearance-none"
                  >
                    <option value="en">EN</option>
                    <option value="ku">KU</option>
                    <option value="ar">AR</option>
                  </select>
                </div>
              </div>
              <button
                onClick={(e) => {
                  setMobileMenuOpen(!mobileMenuOpen)
                  if (mobileMenuOpen) {
                    e.target.blur()
                  }
                }}
                className="text-gray-700 hover:text-blue-600 p-3 relative bg-gray-50 hover:bg-blue-50 rounded-xl transition-all duration-300 shadow-sm"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200/50 py-6 bg-gradient-to-b from-white to-gray-50">
              <div className="space-y-2 px-4">
                <button 
                  onClick={() => {
                    router.push('/')
                    setMobileMenuOpen(false)
                  }} 
                  className="flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Home</span>
                </button>
                <div className="border-t border-gray-200 pt-4 mt-4">
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
                      className="flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl font-semibold text-red-600 hover:bg-red-50 transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        handleLogin()
                        setMobileMenuOpen(false)
                      }} 
                      className="flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl font-semibold text-blue-600 hover:bg-blue-50 transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign In</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      
      <main className="flex-1 min-h-0">
        {children}
      </main>
    </div>
  )
}