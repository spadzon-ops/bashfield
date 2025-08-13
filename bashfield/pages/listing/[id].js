import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../../lib/supabase'

export default function ListingDetail({ listing: initialListing }) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [listing, setListing] = useState(initialListing)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(!initialListing)
  const [currentUser, setCurrentUser] = useState(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (!initialListing) fetchListing()
  }, [router.query?.id]) // eslint-disable-line

  const fetchListing = async () => {
    try {
      const id = router.query?.id
      if (!id) return

      const { data: listingData } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single()

      if (!listingData) {
        setListing(null)
        setLoading(false)
        return
      }

      // Get profile data
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_picture')
        .eq('user_id', listingData.user_id)
        .single()

      const fullListing = {
        ...listingData,
        user_profiles: profileData || null,
        owner_name: profileData?.display_name || listingData.user_email?.split('@')[0] || 'Property Owner'
      }

      setListing(fullListing)
    } catch (error) {
      console.error('Error fetching listing:', error)
      setListing(null)
    }
    setLoading(false)
  }

  if (router.isFallback || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold">Not found</p>
          <button onClick={() => router.push('/')} className="text-blue-600 hover:underline mt-2">Back to home</button>
        </div>
      </div>
    )
  }

  const firstImage = listing.images?.[currentImageIndex] || null
  const firstImageUrl = firstImage
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${firstImage}`
    : null

  const ownerAvatar = listing.user_profiles?.profile_picture
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${listing.user_profiles.profile_picture}`
    : null

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      listing.images && listing.images.length > 0 ? (prev + 1) % listing.images.length : 0
    )
  }
  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      listing.images && listing.images.length > 0 ? (prev - 1 + listing.images.length) % listing.images.length : 0
    )
  }
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchMove = (e) => { touchEndX.current = e.touches[0].clientX }
  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current
    if (distance > 50 && listing.images?.length > 1) nextImage()
    if (distance < -50 && listing.images?.length > 1) prevImage()
  }

  // IMPORTANT: property-scoped conversation lookup (fix for “wrong thread”)
  const startConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Please sign in to send messages'); return }
    if (user.id === listing.user_id) { alert('You cannot message yourself'); return }

    try {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(listing_id.eq.${listing.id},participant1.eq.${user.id},participant2.eq.${listing.user_id}),` +
          `and(listing_id.eq.${listing.id},participant1.eq.${listing.user_id},participant2.eq.${user.id})`
        )
        .maybeSingle()

      if (existingConv?.id) {
        router.push(`/messages?conversation=${existingConv.id}`)
        return
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          listing_id: listing.id,
          participant1: user.id,
          participant2: listing.user_id
        })
        .select('id')
        .single()

      if (error) throw error
      router.push(`/messages?conversation=${data.id}`)
    } catch (err) {
      console.error('Error starting conversation:', err)
      alert('Error starting conversation. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span>←</span>
          <span>Back to listings</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div
                className="relative h-96 bg-gray-200"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {firstImageUrl ? (
                  <>
                    <img
                      src={firstImageUrl}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    {listing.images?.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-9 h-9 flex items-center justify-center"
                        >
                          ←
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-9 h-9 flex items-center justify-center"
                        >
                          →
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">🏠</div>
                )}
              </div>

              {listing.images?.length > 1 && (
                <div className="p-4">
                  <div className="flex space-x-2 overflow-x-auto">
                    {listing.images.map((image, index) => {
                      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${image}`
                      return (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            currentImageIndex === index ? 'border-blue-500' : 'border-transparent'
                          }`}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {listing.title}
                </h1>
                {listing.status !== 'approved' && (
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    listing.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                  </span>
                )}
              </div>

              {/* Owner block (CLICKABLE) */}
              <div className="flex items-center space-x-3 mb-6">
                <Link href={`/profile/${listing.user_id}`} className="flex items-center space-x-3 group">
                  {ownerAvatar ? (
                    <img src={ownerAvatar} alt="Owner" className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200" />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {listing.owner_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="text-blue-600 group-hover:underline">{listing.owner_name}</span>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1"><span>📍</span><span>{listing.city?.charAt(0).toUpperCase() + listing.city?.slice(1)}</span></div>
                <div className="flex items-center space-x-1"><span>🛏️</span><span>{listing.rooms} {listing.rooms === 1 ? 'Room' : 'Rooms'}</span></div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{listing.description}</p>
              </div>

              {listing.address && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
                  <p className="text-gray-700 mb-4">{listing.address}</p>

                  {(listing.latitude && listing.longitude) && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-md font-semibold text-gray-900">Property Location</h4>
                        <button
                          onClick={() => {
                            const mapUrl = `https://www.openstreetmap.org/?mlat=${listing.latitude}&mlon=${listing.longitude}&zoom=15`
                            window.open(mapUrl, '_blank')
                          }}
                          className="inline-flex items-center space-x-2 text-blue-700 px-3 py-1 rounded-lg transition-colors text-sm font-medium"
                        >
                          <span>🗺️</span><span>Open in Maps</span>
                        </button>
                      </div>
                      <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200">
                        <iframe
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(listing.longitude)-0.01},${parseFloat(listing.latitude)-0.01},${parseFloat(listing.longitude)+0.01},${parseFloat(listing.latitude)+0.01}&layer=mapnik&marker=${parseFloat(listing.latitude)},${parseFloat(listing.longitude)}`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          title="Property Location"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {listing.price.toLocaleString()} {listing.currency}
              </div>
              <div className="text-sm text-gray-500 mb-4">per month</div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => router.push(`/listing/${listing.id}`)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  👁️ View Details
                </button>
                <button
                  onClick={() => startConversation()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <span>✉️</span><span>Send Message</span>
                </button>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600">⚠️</span>
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1">Safety Tips</p>
                    <ul className="text-yellow-800 list-disc list-inside space-y-1">
                      <li>Meet in public places</li>
                      <li>Verify the property before payment</li>
                      <li>Use trusted channels for transactions</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export async function getServerSideProps({ params, locale, query }) {
  try {
    const id = params?.id
    const admin = query?.admin

    const { data: listingData } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    if (!listingData) return { notFound: true }

    if (listingData.status === 'approved') {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_picture')
        .eq('user_id', listingData.user_id)
        .single()

      const listing = {
        ...listingData,
        user_profiles: profileData || null,
        owner_name: profileData?.display_name || listingData.user_email?.split('@')[0] || 'Property Owner'
      }

      return { props: { listing, ...(await serverSideTranslations(locale, ['common'])) } }
    }

    if (admin === 'true') {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_picture')
        .eq('user_id', listingData.user_id)
        .single()

      const listing = {
        ...listingData,
        user_profiles: profileData || null,
        owner_name: profileData?.display_name || listingData.user_email?.split('@')[0] || 'Property Owner'
      }

      return { props: { listing, ...(await serverSideTranslations(locale, ['common'])) } }
    }

    return { notFound: true }
  } catch (error) {
    console.error(error)
    return { notFound: true }
  }
}
