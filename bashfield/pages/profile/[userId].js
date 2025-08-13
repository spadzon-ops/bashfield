import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../../lib/supabase'
import ListingCard from '../../components/ListingCard'

export default function PublicUserProfile() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { userId } = router.query

  const [me, setMe] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!router.isReady || !userId) return
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setMe(user || null)
      const admin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
      setIsAdmin(!!admin)

      const { data: prof } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, email, profile_picture, created_at')
        .eq('user_id', userId)
        .maybeSingle()
      setProfile(prof || null)

      if (!prof) {
        setLoading(false)
        return
      }

      // Admin or owner: show all of user's listings, else only approved
      if (admin || user?.id === userId) {
        const { data: ls } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        setListings(ls || [])
      } else {
        const { data: ls } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
        setListings(ls || [])
      }

      setLoading(false)
    }
    load()
  }, [router.isReady, userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile…</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold">Profile not found</p>
          <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">Go home</Link>
        </div>
      </div>
    )
  }

  const avatarUrl = profile.profile_picture
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${profile.profile_picture}`
    : null

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover ring-1 ring-gray-200" />
            ) : (
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {profile.display_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{profile.display_name || 'User Profile'}</h1>
              {/* EMAIL: only admins can see */}
              {isAdmin && <p className="text-gray-600 mb-1">{profile.email}</p>}
              <p className="text-sm text-gray-500">
                Member since {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
              </p>
              {isAdmin && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    🛡️ Admin View
                  </span>
                </div>
              )}
            </div>

            <div className="sm:ml-auto">
              {/* Optional: general Message button (non property) */}
              {me?.id && me.id !== profile.user_id && (
                <Link
                  href={`/messages`}
                  onClick={async (e) => {
                    e.preventDefault()
                    // ensure/create non-listing conversation (listing_id = null)
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) { router.push('/'); return }
                    if (user.id === profile.user_id) return
                    const { data: existing } = await supabase
                      .from('conversations')
                      .select('id')
                      .or(
                        `and(listing_id.is.null,participant1.eq.${user.id},participant2.eq.${profile.user_id}),` +
                        `and(listing_id.is.null,participant1.eq.${profile.user_id},participant2.eq.${user.id})`
                      )
                      .maybeSingle()
                    let cid = existing?.id
                    if (!cid) {
                      const { data: created } = await supabase
                        .from('conversations')
                        .insert({
                          listing_id: null,
                          participant1: user.id,
                          participant2: profile.user_id
                        })
                        .select('id')
                        .single()
                      cid = created?.id
                    }
                    router.push(`/messages?conversation=${cid}`)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Message
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Listings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Listings</h2>
          {listings.length === 0 ? (
            <p className="text-gray-600">No listings yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={{ ...l, user_profiles: profile }}
                  showActions={false /* regular users cannot moderate */}
                  isAdmin={false}
                  isOwner={me?.id === profile.user_id}
                />
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
