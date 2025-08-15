import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../../lib/supabase'
import ListingCard from '../../components/ListingCard'

export default function PublicProfile({ profile: initialProfile, listings: initialListings }) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [profile, setProfile] = useState(initialProfile)
  const [listings, setListings] = useState(initialListings || [])
  const [loading, setLoading] = useState(!initialProfile)

  useEffect(() => {
    if (!initialProfile && router.query.id) {
      fetchProfile()
    }
  }, [router.query.id, initialProfile])

  const fetchProfile = async () => {
    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', router.query.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        
        // Fetch user's listings
        const { data: listingsData } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', router.query.id)
          .eq('status', 'approved')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        const listingsWithProfile = listingsData?.map(listing => ({
          ...listing,
          user_profiles: profileData
        })) || []

        setListings(listingsWithProfile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center space-x-3 text-gray-600 hover:text-blue-600 transition-all duration-300 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105 border border-gray-200/50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold">Back</span>
        </button>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 sm:p-12 mb-10 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              {profile.profile_picture ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${profile.profile_picture}`}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-3xl font-bold">
                    {profile.display_name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.display_name}
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
              
              <p className="text-sm text-gray-500">
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Properties by {profile.display_name} ({listings.length})
            </h2>
          </div>

          <div className="p-6">
            {listings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🏠</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings yet</h3>
                <p className="text-gray-600">This user hasn't posted any properties yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map(listing => (
                  <ListingCard 
                    key={listing.id}
                    listing={listing} 
                    showActions={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ params, locale }) {
  const { id } = params
  
  try {
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', id)
      .single()

    if (!profileData) {
      return {
        notFound: true,
      }
    }

    const { data: listingsData } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', id)
      .eq('status', 'approved')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    const listingsWithProfile = listingsData?.map(listing => ({
      ...listing,
      user_profiles: profileData
    })) || []

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
      notFound: true,
    }
  }
}