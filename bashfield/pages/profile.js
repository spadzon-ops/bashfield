import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'
import ListingCard from '../components/ListingCard'

export default function Profile() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [profilePicture, setProfilePicture] = useState(null)
  const [userListings, setUserListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)

      await fetchProfile(user)
      await fetchUserListings(user)

      setLoading(false)
    }
    init()
  }, [])

  const fetchProfile = async (user) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data && !error) {
      setProfile(data)
      setDisplayName(data.display_name)
      setProfilePicture(data.profile_picture)
    }
  }

  const fetchUserListings = async (user) => {
    const { data: listingsData, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (listingsData) {
      // Get current profile data
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('display_name, profile_picture')
        .eq('user_id', user.id)
        .single()
      
      // Add profile data to listings
      const listingsWithProfile = listingsData.map(listing => ({
        ...listing,
        user_profiles: profileData || null
      }))
      
      setUserListings(listingsWithProfile)
    }
  }

  const handleSave = async () => {
    if (!user || !displayName.trim()) return

    setSaving(true)
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          display_name: displayName,
          profile_picture: profilePicture
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        alert('Failed to update profile.')
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Profile update error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please sign in</h2>
          <p className="text-gray-600">You need to sign in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Profile header */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center space-x-4">
          {profile?.profile_picture ? (
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${profile.profile_picture}`}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 font-semibold flex items-center justify-center">
              {(profile?.display_name?.[0] || '?').toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="text-2xl font-semibold text-gray-900 w-full border-b border-transparent focus:border-blue-300 outline-none"
            />
            <div className="text-sm text-gray-600">
              {profile?.email}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* My Listings (only active ones) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Listings</h3>
          {userListings.length === 0 ? (
            <div className="text-gray-600">No active listings.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} isOwner />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ locale }) {
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } }
}
