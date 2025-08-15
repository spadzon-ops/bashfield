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
    if (tab && ['profile', 'listings', 'account'].includes(tab)) {
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
          bio: bio,
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

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to permanently delete your account? This action cannot be undone and will delete all your listings, messages, and data.')) return
    if (!confirm('This will permanently delete ALL your data. Are you absolutely sure?')) return

    setSaving(true)
    
    try {
      // Call API endpoint to delete account
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account')
      }
      
      // Sign out and redirect
      await supabase.auth.signOut()
      alert('Account deleted successfully.')
      router.push('/')
      
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Error deleting account: ' + error.message)
    }
    
    setSaving(false)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 sm:p-12 mb-10 border border-gray-100">
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
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center group-hover:from-blue-700 group-hover:to-blue-800 transition-all duration-300 shadow-lg">
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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.display_name || displayName || 'User Profile'}
                </h1>
                {profile?.is_verified && (
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-semibold shadow-lg">
                    <span className="text-lg">✓</span>
                    <span>Verified</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-gray-600">{user?.email}</p>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Private - not visible to others</span>
              </div>
              <p className="text-sm text-gray-500">
                Member since {new Date(profile?.created_at || user?.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl mb-10 border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <nav className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-5 px-2 border-b-3 font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'profile'
                    ? 'border-blue-600 text-blue-700 bg-white/50 rounded-t-xl'
                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-white/30 rounded-t-xl'
                }`}
              >
                👤 Profile Settings
              </button>
              <button
                onClick={() => setActiveTab('listings')}
                className={`py-5 px-2 border-b-3 font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'listings'
                    ? 'border-blue-600 text-blue-700 bg-white/50 rounded-t-xl'
                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-white/30 rounded-t-xl'
                }`}
              >
                🏠 My Listings ({userListings.filter(listing => listing.status === 'approved' && listing.is_active !== false).length})
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`py-5 px-2 border-b-3 font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'account'
                    ? 'border-blue-600 text-blue-700 bg-white/50 rounded-t-xl'
                    : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-white/30 rounded-t-xl'
                }`}
              >
                ⚙️ Account Settings
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter your display name"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleSave}
                    disabled={saving || !displayName.trim()}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  
                  <button
                    onClick={() => router.push('/')}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="max-w-2xl space-y-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
                    ⚠️ Delete Account
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone and will:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
                    <li>Delete all your property listings</li>
                    <li>Remove all your messages and conversations</li>
                    <li>Delete your profile and uploaded images</li>
                    <li>Remove you from all favorites</li>
                  </ul>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={saving}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {saving ? 'Deleting Account...' : 'Delete My Account'}
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
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      🏠 Create Listing
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