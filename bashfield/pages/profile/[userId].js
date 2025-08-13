// bashfield/bashfield/pages/profile/[userId].js
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  const { userId } = router.query

  const [viewer, setViewer] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!router.isReady) return
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setViewer(user || null)

      if (user?.email) {
        const { data: adminRow } = await supabase
          .from('admin_emails')
          .select('email')
          .eq('email', user.email)
          .maybeSingle()
        setIsAdmin(!!adminRow)
      }

      await load(userId)
      setLoading(false)
    })()
  }, [router.isReady, userId, isAdmin])

  const load = async (uid) => {
    if (!uid) return

    // Profile
    const { data: prof } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, profile_picture, email')
      .eq('user_id', uid)
      .maybeSingle()
    setProfile(prof || null)

    // Listings (admin sees all; others see approved + active)
    let q = supabase
      .from('listings')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      q = q.eq('status', 'approved').eq('is_active', true)
    }

    const { data: ls } = await q
    setListings(ls || [])
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading profile…</div>
  }

  const avatar = profile?.profile_picture
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${profile.profile_picture}`
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
          {avatar ? (
            <img src={avatar} className="w-16 h-16 rounded-full object-cover" alt="Profile" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl">
              {(profile?.display_name?.[0] || '?').toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{profile?.display_name || 'Unknown User'}</h1>
            {isAdmin && profile?.email && (
              <div className="text-sm text-gray-600">{profile.email}</div>
            )}
          </div>
        </div>

        {/* Listings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {listings.length === 0 ? (
            <div className="text-gray-600">No public listings.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(l => {
                const thumb = l.images?.[0]
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${l.images[0]}`
                  : null
                return (
                  <div key={l.id} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="h-40 bg-gray-100">
                      {thumb ? (
                        <img src={thumb} alt={l.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">🏠</div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 pr-2">{l.title}</h3>
                        <div className="text-blue-600 text-sm font-mono">#{l.reference_code}</div>
                      </div>
                      <div className="text-sm text-gray-600">City: {l.city}</div>
                      <div className="text-sm text-gray-600">
                        Price: {Number(l.price || 0).toLocaleString()} {l.currency}
                      </div>
                      <div className="pt-2">
                        <Link
                          href={`/listing/${l.id}`}
                          className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm"
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
