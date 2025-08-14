import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../../../lib/supabase'
import ListingCard from '../../../components/ListingCard'

export default function AdminUserProfile() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { userId } = router.query
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [userListings, setUserListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      checkAdminAuth()
    }
  }, [userId])

  const checkAdminAuth = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser || currentUser.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      router.push('/admin')
      return
    }

    setUser(currentUser)
    await fetchUserProfile()
    await fetchUserListings()
  }

  const fetchUserProfile = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (data) {
      setProfile(data)
    }
  }

  const fetchUserListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (data) {
      // Add profile data to listings
      const listingsWithProfile = data.map(listing => ({
        ...listing,
        user_profiles: profile
      }))
      setUserListings(listingsWithProfile)
    }
    setLoading(false)
  }

  const deleteUserListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing?')) return
    
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)

    if (!error) {
      alert('Listing deleted successfully!')
      await fetchUserListings()
    }
  }

  const updateListingStatus = async (listingId, status) => {
    const { error } = await supabase
      .from('listings')
      .update({ status })
      .eq('id', listingId)

    if (!error) {
      await fetchUserListings()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push('/admin')}
          className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span>←</span>
          <span>Back to Admin Dashboard</span>
        </button>

        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              {profile?.profile_picture ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${profile.profile_picture}`}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {profile?.display_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {profile?.display_name || 'User Profile'}
              </h1>
              <p className="text-gray-600 mb-2">{profile?.email}</p>
              <p className="text-sm text-gray-500">
                Member since {new Date(profile?.created_at).toLocaleDateString()}
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  🛡️ Admin View
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">
              🏠 User Listings ({userListings.length})
            </h2>
          </div>

          <div className="p-6">
            {userListings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🏠</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings</h3>
                <p className="text-gray-600">This user hasn't posted any properties yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userListings.map(listing => (
                  <div key={listing.id} className="relative">
                    <ListingCard 
                      listing={listing} 
                      showActions={true}
                      isAdmin={true}
                      onApprove={() => updateListingStatus(listing.id, 'approved')}
                      onReject={() => updateListingStatus(listing.id, 'rejected')}
                      onDelete={() => deleteUserListing(listing.id)}
                    />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        listing.status === 'approved' ? 'bg-green-100 text-green-800' :
                        listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {listing.status}
                      </span>
                    </div>
                    <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}