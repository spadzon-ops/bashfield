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
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    checkAuth()
    
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab && ['profile', 'listings'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/')
      return
    }

    setUser(user)
    await initializeProfile(user)
    await fetchUserListings(user)
  }

  const initializeProfile = async (user) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data && !error) {
        setProfile(data)
        setDisplayName(data.display_name)
        setProfilePicture(data.profile_picture)
      } else {
        await createProfileDirectly(user)
      }
    } catch (err) {
      console.error('Profile initialization error:', err)
      await createProfileDirectly(user)
    }
    setLoading(false)
  }

  const createProfileDirectly = async (user) => {
    const defaultName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0]
    
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        email: user.email,
        display_name: defaultName
      }, { onConflict: 'user_id' })
      .select()
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
        .upsert({
          user_id: user.id,
          email: user.email,
          display_name: displayName.trim(),
          profile_picture: profilePicture
        }, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) {
        throw error
      }
      
      setProfile(data)
      
      // Trigger a custom event to notify Layout component
      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: { profile: data } 
      }))
      
      // Refresh user listings to show updated profile
      await fetchUserListings(user)
      
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile: ' + error.message)
    }
    
    setSaving(false)
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    
    try {
      if (profilePicture) {
        await supabase.storage
          .from('house-images')
          .remove([profilePicture])
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `profiles/${user.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('house-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      setProfilePicture(fileName)
      
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          email: user.email,
          display_name: displayName,
          profile_picture: fileName
        }, { onConflict: 'user_id' })
        .select()
        .single()

      if (updateError) throw updateError

      setProfile(data)
      
      // Trigger a custom event to notify Layout component
      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: { profile: data } 
      }))
      
      // Refresh user listings to show updated profile picture
      await fetchUserListings(user)
      
      alert('Profile picture updated successfully!')
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error uploading image: ' + error.message)
    }
    
    setUploading(false)
  }

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)
      .eq('user_id', user.id)

    if (error) {
      alert('Error deleting listing: ' + error.message)
    } else {
      alert('Listing deleted successfully!')
      await fetchUserListings(user)
    }
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your profile</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative group">
              <label className="cursor-pointer block">
                {profilePicture ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${profilePicture}`}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover group-hover:opacity-75 transition-opacity"
                  />
                ) : (
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                    <span className="text-white text-2xl font-bold">
                      {(profile?.display_name || displayName)?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">📷 Change</span>
                </div>
                {/* Edit Icon */}
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                  </svg>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {profile?.display_name || displayName || 'User Profile'}
              </h1>
              <p className="text-gray-600 mb-2">{user?.email}</p>
              <p className="text-sm text-gray-500">
                Member since {new Date(profile?.created_at || user?.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                👤 Profile Settings
              </button>
              <button
                onClick={() => setActiveTab('listings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'listings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🏠 My Listings ({userListings.filter(listing => listing.status === 'approved' && listing.is_active !== false).length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="max-w-md space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your display name"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleSave}
                    disabled={saving || !displayName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  
                  <button
                    onClick={() => router.push('/')}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'listings' && (
              <div>
                {userListings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🏠</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings yet</h3>
                    <p className="text-gray-600 mb-6">Start by creating your first property listing!</p>
                    <button
                      onClick={() => router.push('/post')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Create Listing
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userListings.filter(listing => listing.status === 'approved' && listing.is_active !== false).map(listing => (
                      <div key={listing.id} className="relative">
                        <ListingCard 
                          listing={listing} 
                          showActions={false}
                          isOwner={true}
                        />
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            listing.status === 'approved' ? 'bg-green-100 text-green-800' :
                            listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {listing.status}
                          </span>
                          <button
                            onClick={() => handleDeleteListing(listing.id)}
                            className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs transition-colors"
                            title="Delete listing"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
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

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}
