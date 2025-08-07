import { useState, useEffect } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const { t } = useTranslation('common')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      
      // Extract name from email (before @)
      const emailName = user.email.split('@')[0]
      const defaultName = user.user_metadata?.full_name || emailName
      
      // Check if user has a profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setDisplayName(profileData.display_name)
      } else {
        // Create default profile
        const newProfile = {
          user_id: user.id,
          email: user.email,
          display_name: defaultName,
          created_at: new Date().toISOString()
        }
        
        const { data, error } = await supabase
          .from('user_profiles')
          .insert([newProfile])
          .select()
          .single()

        if (!error) {
          setProfile(data)
          setDisplayName(data.display_name)
        }
      }
    }
    setLoading(false)
  }

  const updateProfile = async (e) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('user_profiles')
      .update({ display_name: displayName })
      .eq('user_id', user.id)

    if (error) {
      alert('Error updating profile: ' + error.message)
    } else {
      setProfile(prev => ({ ...prev, display_name: displayName }))
      alert('Profile updated successfully!')
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
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <span className="text-3xl">👤</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{profile?.display_name}</h1>
                <p className="text-blue-100">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Settings</h2>
            
            <form onSubmit={updateProfile} className="space-y-6">
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
                <p className="text-sm text-gray-500 mt-1">
                  This name will be shown on your listings
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}
