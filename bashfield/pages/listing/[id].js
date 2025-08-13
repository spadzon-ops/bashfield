import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function ListingDetails() {
  const router = useRouter()
  const { id, admin } = router.query
  const [me, setMe] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [listing, setListing] = useState(null)
  const [poster, setPoster] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!router.isReady) return
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setMe(user || null)
      if (user?.email) {
        const { data: adminRow } = await supabase.from('admin_emails').select('email').eq('email', user.email).maybeSingle()
        setIsAdmin(!!adminRow)
      }
      await loadListing(id, !!admin)
      setLoading(false)
    })()
  }, [router.isReady, id, admin])

  const loadListing = async (lid, forceAdmin) => {
    if (!lid) return
    let q = supabase.from('listings').select('*').eq('id', lid).limit(1).single()
    // If not admin override, apply public visibility
    if (!forceAdmin) {
      q = supabase
        .from('listings')
        .select('*')
        .eq('id', lid)
        .eq('status', 'approved')
        .eq('is_active', true)
        .limit(1)
        .single()
    }
    let { data, error } = await q
    if (error && !forceAdmin && isAdmin) {
      // if query failed but we ARE admin (without ?admin=1), try admin fetch
      const r = await supabase.from('listings').select('*').eq('id', lid).limit(1).single()
      data = r.data || null
    }
    setListing(data || null)

    if (data?.user_id) {
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_picture')
        .eq('user_id', data.user_id)
        .maybeSingle()
      setPoster(prof || null)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading listing…</div>
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white shadow-sm rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🧐</div>
          <div className="text-gray-800 font-semibold mb-2">Listing not found</div>
          <p className="text-gray-600 mb-6">This listing may be inactive or not approved yet.</p>
          <Link href="/" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Go Home</Link>
        </div>
      </div>
    )
  }

  const img = listing.images?.[0]
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${listing.images[0]}`
    : null

  const avatar = poster?.profile_picture
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${poster.profile_picture}`
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {img ? (
            <img src={img} className="w-full h-72 object-cover" alt={listing.title} />
          ) : (
            <div className="w-full h-72 flex items-center justify-center text-6xl text-gray-300">🏠</div>
          )}

          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">{listing.title}</h1>
              <div className="text-blue-600 font-mono">#{listing.reference_code}</div>
            </div>

            <div className="flex items-center gap-3">
              <Link href={poster ? `/profile/${poster.user_id}` : '#'} className="flex items-center gap-2 group">
                {avatar ? (
                  <img src={avatar} className="w-9 h-9 rounded-full object-cover" alt="Poster" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                    {(poster?.display_name?.[0] || '?').toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-700 group-hover:underline">{poster?.display_name || 'Unknown User'}</span>
              </Link>
            </div>

            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{listing.description}</div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-700">
              <div><span className="font-medium">City:</span> {listing.city}</div>
              <div><span className="font-medium">Rooms:</span> {listing.rooms}</div>
              <div><span className="font-medium">Price:</span> {Number(listing.price || 0).toLocaleString()} {listing.currency}</div>
              <div><span className="font-medium">Status:</span> {listing.status}</div>
              <div><span className="font-medium">Active:</span> {listing.is_active ? 'Yes' : 'No'}</div>
            </div>

            <div className="pt-2">
              <Link href={`/messages?peer=${poster?.user_id || ''}&listing=${listing.id}`} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                Send Message
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-blue-600 hover:underline">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
