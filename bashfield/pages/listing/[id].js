// bashfield/bashfield/pages/listing/[id].js
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { supabase } from '../../lib/supabase'

export default function ListingDetails() {
  const router = useRouter()
  const { id } = router.query

  const [viewer, setViewer] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [listing, setListing] = useState(null)
  const [poster, setPoster] = useState(null)
  const [loading, setLoading] = useState(true)

  // load viewer & admin
  useEffect(() => {
    if (!router.isReady) return
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setViewer(user || null)
      let adminFlag = false
      if (user?.email) {
        const { data: adminRow } = await supabase
          .from('admin_emails')
          .select('email')
          .eq('email', user.email)
          .maybeSingle()
        adminFlag = !!adminRow
      }
      setIsAdmin(adminFlag)
    })()
  }, [router.isReady])

  // load listing (re-run when admin state known)
  useEffect(() => {
    if (!router.isReady || !id) return
    ;(async () => {
      // Admin sees ANY listing; others see only approved+active
      const q = isAdmin
        ? supabase.from('listings').select('*').eq('id', id).single()
        : supabase.from('listings').select('*').eq('id', id).eq('status', 'approved').eq('is_active', true).single()

      let { data } = await q
      setListing(data || null)

      if (data?.user_id) {
        const { data: prof } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, profile_picture')
          .eq('user_id', data.user_id)
          .maybeSingle()
        setPoster(prof || null)
      }
      setLoading(false)
    })()
  }, [router.isReady, id, isAdmin])

  const mapUrl = useMemo(() => {
    if (!listing?.latitude || !listing?.longitude) return null
    const lat = Number(listing.latitude)
    const lon = Number(listing.longitude)
    return `https://www.google.com/maps?q=${lat},${lon}&z=14&output=embed`
  }, [listing])

  const waHref = useMemo(() => {
    const message = `Hello, I'm interested in "${listing?.title}" (Code ${listing?.reference_code}).`
    return `https://wa.me/?text=${encodeURIComponent(message)}`
  }, [listing?.title, listing?.reference_code])

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

  const hero = listing.images?.[0]
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${listing.images[0]}`
    : null
  const avatar = poster?.profile_picture
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${poster.profile_picture}`
    : null

  return (
    <>
      <Head><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {hero ? (
              <img src={hero} alt={listing.title} className="w-full h-72 object-cover" />
            ) : (
              <div className="w-full h-72 flex items-center justify-center text-6xl text-gray-300">🏠</div>
            )}
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-semibold text-gray-900">{listing.title}</h1>
                <div className="text-blue-600 font-mono whitespace-nowrap">#{listing.reference_code}</div>
              </div>

              <div className="flex items-center gap-3">
                <Link href={poster ? `/profile/${poster.user_id}` : '#'} className="flex items-center gap-2 group">
                  {avatar ? (
                    <img src={avatar} className="w-10 h-10 rounded-full object-cover" alt="Poster" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                      {(poster?.display_name?.[0] || '?').toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-gray-700 group-hover:underline">{poster?.display_name || 'Unknown User'}</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-700">
                <div><span className="font-medium">City:</span> {listing.city}</div>
                <div><span className="font-medium">Rooms:</span> {listing.rooms}</div>
                <div><span className="font-medium">Price:</span> {Number(listing.price || 0).toLocaleString()} {listing.currency}</div>
                <div><span className="font-medium">Status:</span> {listing.status}</div>
                <div><span className="font-medium">Active:</span> {listing.is_active ? 'Yes' : 'No'}</div>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-800 whitespace-pre-wrap">{listing.description}</p>
              </div>

              {mapUrl && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-gray-900">Location</h2>
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <iframe
                      src={mapUrl}
                      className="w-full h-72"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Property location map"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href={`/messages?peer=${poster?.user_id || ''}&listing=${listing.id}`} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                  Send Message
                </Link>
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">
                  WhatsApp
                </a>
                <Link href="/" className="text-blue-600 hover:underline ml-auto">← Back to home</Link>
              </div>
            </div>
          </div>

          {Array.isArray(listing.images) && listing.images.length > 1 && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {listing.images.slice(1).map((img, i) => {
                  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${img}`
                  return <img key={i} src={url} alt={`Photo ${i + 2}`} className="w-full h-28 object-cover rounded-lg border border-gray-200" />
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
