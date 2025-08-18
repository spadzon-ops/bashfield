import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../../lib/supabase'
import ListingCard from '../../components/ListingCard'

export default function UserProfile({ profile: initialProfile, listings: initialListings }) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { userId } = router.query
  const [profile, setProfile] = useState(initialProfile)
  const [listings, setListings] = useState(initialListings || [])
  const [loading, setLoading] = useState(!initialProfile)
  const [currentUser, setCurrentUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [displayedListings, setDisplayedListings] = useState(12)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreListings, setHasMoreListings] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      
      if (user) {
        const { data: adminMatch } = await supabase
          .from('admin_emails')
          .select('email')
          .eq('email', user.email)
          .maybeSingle()
        setIsAdmin(!!adminMatch)
      }
    }
    getUser()
    
    if (initialListings) {
      setHasMoreListings(initialListings.length > 12)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMoreListings) return
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      if (scrollTop + windowHeight >= documentHeight - 100) {
        if (listings.length > displayedListings) {
          setLoadingMore(true)
          setTimeout(() => {
            setDisplayedListings(prev => {
              const newCount = prev + 12
              setHasMoreListings(listings.length > newCount)
              return newCount
            })
            setLoadingMore(false)
          }, 300)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadingMore, hasMoreListings, listings, displayedListings])

  const toggleVerification = async () => {
    if (!isAdmin) return
    const newStatus = !profile.is_verified
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_verified: newStatus })
      .eq('user_id', userId)

    if (!error) {
      setProfile({ ...profile, is_verified: newStatus })
      alert(`User ${newStatus ? 'verified' : 'unverified'} successfully!`)
    } else {
      alert('Error updating verification status')
    }
  }

  const startConversation = async () => {
    if (!currentUser) {
      alert('Please sign in to send messages')
      return
    }
    
    if (currentUser.id === userId) {
      alert('You cannot message yourself')
      return
    }

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant1.eq.${currentUser.id},participant2.eq.${userId}),and(participant1.eq.${userId},participant2.eq.${currentUser.id})`)
        .maybeSingle()

      if (existingConv) {
        router.push(`/messages?conversation=${existingConv.id}`)
        return
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant1: currentUser.id,
          participant2: userId,
          listing_id: null
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/messages?conversation=${data.id}`)
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Error starting conversation. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">This user profile doesn't exist or has been removed.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            ← Back to Homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 sm:p-12 mb-10 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
            <div className="relative">
              {profile.profile_picture ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${profile.profile_picture}`}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover shadow-xl ring-4 ring-blue-200"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-xl ring-4 ring-blue-200">
                  <span className="text-white text-4xl font-bold">
                    {profile.display_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  {profile.display_name || 'User Profile'}
                </h1>
                {profile.is_verified && (
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-semibold shadow-lg">
                    <span className="text-lg">✓</span>
                    <span>Verified</span>
                  </div>
                )}
              </div>
              {profile.bio && (
                <div className="mb-4">
                  <p className="text-gray-600 leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}
              <p className="text-gray-600 mb-4 text-lg">
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </p>
              
              {isAdmin && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm font-medium text-red-800 mb-2">🛡️ Admin View</div>
                  <p className="text-sm text-red-700 mb-3 font-mono bg-red-100 px-2 py-1 rounded">
                    📧 {profile.email}
                  </p>
                  <button
                    onClick={toggleVerification}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      profile.is_verified 
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {profile.is_verified ? '❌ Remove Verification' : '✅ Verify User'}
                  </button>
                </div>
              )}
              
              {currentUser && currentUser.id === userId && profile.is_verified && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-semibold">
                      <span className="text-lg">✓</span>
                      <span>Verified Account</span>
                    </div>
                    <span className="text-blue-700 text-sm">Your account is verified and trusted</span>
                  </div>
                </div>
              )}
              
              {currentUser && currentUser.id !== userId && (
                <button
                  onClick={startConversation}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 flex items-center space-x-3 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Send Message</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🏠</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Properties ({listings.length})
              </h2>
            </div>
          </div>

          <div className="p-8">
            {listings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🏠</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties listed</h3>
                <p className="text-gray-600">This user hasn't listed any properties yet.</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.slice(0, displayedListings).map(listing => (
                    <ListingCard 
                      key={listing.id} 
                      listing={listing} 
                      showActions={false}
                    />
                  ))}
                </div>
                {hasMoreListings && (
                  <div className="text-center mt-8">
                    {loadingMore ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600">Loading more properties...</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setLoadingMore(true)
                          setTimeout(() => {
                            setDisplayedListings(prev => {
                              const newCount = prev + 12
                              setHasMoreListings(listings.length > newCount)
                              return newCount
                            })
                            setLoadingMore(false)
                          }, 300)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                      >
                        Load More Properties
                      </button>
                    )}
                  </div>
                )}
                {!hasMoreListings && listings.length > 12 && (
                  <div className="text-center mt-8 text-gray-500">
                    You've reached the end of the listings
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ params, locale }) {
  const { userId } = params
  
  try {
    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, profile_picture, created_at, is_verified, email, bio')
      .eq('user_id', userId)
      .single()

    if (profileError || !profileData) {
      return {
        props: {
          profile: null,
          listings: [],
          ...(await serverSideTranslations(locale, ['common'])),
        },
      }
    }

    // Get user's approved and active listings
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Add profile data to listings
    const listingsWithProfile = (listingsData || []).map(listing => ({
      ...listing,
      user_profiles: profileData
    }))

    return {
      props: {
        profile: profileData,
        listings: listingsWithProfile,
        ...(await serverSideTranslations(locale, ['common'])),
      },
    }
  } catch (error) {
    console.error('Error in getServerSideProps:', error)
    return {
      props: {
        profile: null,
        listings: [],
        ...(await serverSideTranslations(locale, ['common'])),
      },
    }
  }
}