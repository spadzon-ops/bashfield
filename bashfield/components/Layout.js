import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from '../contexts/TranslationContext'
import { supabase } from '../lib/supabase'

export default function Layout({ children }) {
  const { t, language, changeLanguage } = useTranslation()
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
    // Count conversations with unread messages, not total unread messages
    const { data, error } = await supabase
      .from('messages')
      .select('conversation_id')
      .eq('recipient_id', user.id)
      .eq('read', false)
    
    if (data && !error) {
      // Get unique conversation IDs
      let uniqueConversations = [...new Set(data.map(m => m.conversation_id))]
      
      // CRITICAL: Always exclude active conversation from notification count
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
        // Immediately update unread count
        getUnreadCount(user)
      }
      
      // Listen for direct unread count updates
      const handleUnreadCountUpdate = (event) => {
        setUnreadCount(event.detail.count)
      }
      
      window.addEventListener('profileUpdated', handleProfileUpdate)
      window.addEventListener('messagesRead', handleMessagesRead)
      window.addEventListener('unreadCountUpdate', handleUnreadCountUpdate)

      // Listen for new messages to update unread count
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
            
            // CRITICAL: Never show notifications for active conversation
            if (window.activeConversationId && newMessage.conversation_id === window.activeConversationId) {
              // Message is for active conversation - don't update global count
              return
            }
            
            // Update unread count for all other conversations
            setTimeout(() => getUnreadCount(user), 500)
            
            // Dispatch global event for message received
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

      // Also poll for unread count every 3 seconds
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



  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-200/50 fixed top-0 left-0 right-0 z-50">
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
            
            {/* Enhanced Desktop Navigation */}
            <div className={`hidden md:flex items-center space-x-2 transition-opacity duration-300 ${initialLoad ? 'opacity-0' : 'opacity-100'}`}>
              <button 
                onClick={() => router.push('/')} 
                className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                  router.pathname === '/' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </button>
              {user && (
                <>
                  <button 
                    onClick={() => router.push('/post')} 
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                      router.pathname === '/post' 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{t('addProperty')}</span>
                  </button>
                  <button 
                    onClick={() => router.push('/favorites')} 
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                      router.pathname === '/favorites' 
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg transform scale-105' 
                        : 'text-gray-700 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span>{t('favorites')}</span>
                  </button>
                </>
              )}
              {isAdmin && (
                <button 
                  onClick={() => router.push('/admin')} 
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    router.pathname === '/admin' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>{t('admin')}</span>
                </button>
              )}
            </div>
            
            {/* Enhanced Desktop Right Side */}
            <div className={`hidden lg:flex items-center space-x-2 transition-opacity duration-300 ${initialLoad ? 'opacity-0' : 'opacity-100'}`}>
              {user && (
                <button 
                  onClick={() => {
                    if (router.pathname !== '/messages') {
                      router.push('/messages')
                    }
                  }} 
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 relative ${
                    router.pathname === '/messages' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{t('messages')}</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}
              <div className="relative">
                <div className="flex items-center space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-300">
                  <img 
                    src={`/flags/${language === 'en' ? 'us' : language === 'ku' ? 'kurdistan' : 'iraq'}.svg`}
                    alt="Flag"
                    className="w-6 h-4 object-cover rounded-sm shadow-sm"
                  />
                  <select 
                    value={language} 
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="bg-transparent border-none text-gray-700 font-semibold focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="en">{t('english')}</option>
                    <option value="ku">{t('kurdish')}</option>
                    <option value="ar">{t('arabic')}</option>
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
                      <div className="text-xs text-gray-500">{t('viewProfile')}</div>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout} 
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{t('logout')}</span>
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
                  <span>{t('signIn')}</span>
                </button>
              )}
            </div>

            {/* Enhanced Mobile Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              <div className="relative">
                <div className="flex items-center space-x-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 px-3 py-2 rounded-xl">
                  <img 
                    src={`/flags/${language === 'en' ? 'us' : language === 'ku' ? 'kurdistan' : 'iraq'}.svg`}
                    alt="Flag"
                    className="w-4 h-3 object-cover rounded-sm"
                  />
                  <select 
                    value={language} 
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
                {user && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Enhanced Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200/50 py-6 bg-gradient-to-b from-white to-gray-50">
              <div className="space-y-2 px-4">
                <button 
                  onClick={() => {
                    router.push('/')
                    setMobileMenuOpen(false)
                  }} 
                  className={`flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    router.pathname === '/' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>{t('home')}</span>
                </button>
                {user && (
                  <>
                    <button 
                      onClick={() => {
                        router.push('/post')
                        setMobileMenuOpen(false)
                      }} 
                      className={`flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        router.pathname === '/post' 
                          ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg' 
                          : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>{t('addProperty')}</span>
                    </button>
                    <button 
                      onClick={() => {
                        router.push('/favorites')
                        setMobileMenuOpen(false)
                      }} 
                      className={`flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        router.pathname === '/favorites' 
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg' 
                          : 'text-gray-700 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <span>{t('favorites')}</span>
                    </button>
                    <button 
                      onClick={() => {
                        router.push('/messages')
                        setMobileMenuOpen(false)
                      }} 
                      className={`flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 relative ${
                        router.pathname === '/messages' 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{t('messages')}</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        router.push('/profile')
                        setMobileMenuOpen(false)
                      }} 
                      className={`flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        router.pathname === '/profile' 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                          : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{t('profile')}</span>
                    </button>
                  </>
                )}
                {isAdmin && (
                  <button 
                    onClick={() => {
                      router.push('/admin')
                      setMobileMenuOpen(false)
                    }} 
                    className={`flex items-center space-x-3 w-full text-left px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      router.pathname === '/admin' 
                        ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg' 
                        : 'text-gray-700 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>{t('admin')}</span>
                  </button>
                )}
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
                      <span>{t('logout')}</span>
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
                      <span>{t('signIn')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      
      <main className="relative pt-20">
        {children}
        {/* Floating Action Buttons */}
        {user && router.pathname === '/' && (
          <button
            onClick={() => router.push('/post')}
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 z-40 flex items-center justify-center"
            title={t('listYourProperty')}
          >
            <span className="text-2xl font-bold">+</span>
          </button>
        )}

      </main>
      
      {!router.pathname.startsWith('/chat') && !router.pathname.startsWith('/messages') && router.pathname !== '/' && (
      <footer className="bg-gradient-to-r from-gray-900 to-blue-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-800 opacity-50"></div>
                  <div className="absolute inset-0 bg-gradient-to-tl from-cyan-400/20 to-transparent"></div>
                  <div className="relative z-10 text-white font-black text-lg tracking-tight">
                    <span className="block transform -rotate-12 drop-shadow-lg">B</span>
                  </div>
                  <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full shadow-sm"></div>
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-cyan-300 rounded-full opacity-70"></div>
                  <div className="absolute top-2 left-2 w-0.5 h-0.5 bg-white rounded-full opacity-60"></div>
                </div>
                <h3 className="text-2xl font-bold text-white">Bashfield</h3>
              </div>
              <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                {t('footerDescription')}
              </p>
              <div className="flex space-x-6">
                <span className="text-3xl hover:scale-110 transition-transform cursor-pointer">🇮🇶</span>
                <span className="text-3xl hover:scale-110 transition-transform cursor-pointer">🏠</span>
                <span className="text-3xl hover:scale-110 transition-transform cursor-pointer">💼</span>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 text-lg">{t('quickLinks')}</h4>
              <ul className="space-y-3 text-gray-300">
                <li>
                  <button onClick={() => router.push('/')} className="hover:text-yellow-400 transition-colors duration-200 flex items-center space-x-2">
                    <span>🏠</span><span>{t('home')}</span>
                  </button>
                </li>
                <li>
                  <button onClick={() => router.push('/post')} className="hover:text-yellow-400 transition-colors duration-200 flex items-center space-x-2">
                    <span>📝</span><span>{t('addProperty')}</span>
                  </button>
                </li>
                {user && (
                  <li>
                    <button onClick={() => router.push('/profile')} className="hover:text-yellow-400 transition-colors duration-200 flex items-center space-x-2">
                      <span>👤</span><span>{t('profile')}</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6 text-lg">{t('contact')}</h4>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-center space-x-3 hover:text-yellow-400 transition-colors duration-200">
                  <span className="text-xl">📧</span>
                  <span>info@bashfield.com</span>
                </li>
                <li className="flex items-center space-x-3 hover:text-yellow-400 transition-colors duration-200">
                  <span className="text-xl">📱</span>
                  <span>+964 750 123 4567</span>
                </li>
                <li className="flex items-center space-x-3 hover:text-yellow-400 transition-colors duration-200">
                  <span className="text-xl">📍</span>
                  <span>Erbil, Kurdistan Region</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-300 text-lg">&copy; 2025 Bashfield. {t('allRightsReserved')}</p>
            <p className="text-yellow-400 mt-2 font-semibold">{t('madeWithLove')}</p>
          </div>
        </div>
      </footer>
      )}
    </div>
  )
}
