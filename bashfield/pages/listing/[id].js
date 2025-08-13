import { useState, useRef, useEffect } from 'react'
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
    // If no initial listing and we have admin param, fetch client-side
    if (!initialListing && router.query.admin === 'true' && router.query.id) {
      fetchListingClientSide()
    }
  }, [router.query, initialListing])

  const fetchListingClientSide = async () => {
    try {
      const { data: listingData, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', router.query.id)
        .single()

      if (error || !listingData) {
        setListing(null)
        setLoading(false)
        return
      }

      // Get profile data
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('display_name, profile_picture')
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
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h1>
          <p className="text-gray-600 mb-6">This property may have been removed or is no longer available.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            ← Back to Homepage
          </button>
        </div>
      </div>
    )
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === listing.images.length - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? listing.images.length - 1 : prev - 1
    )
  }

  const openWhatsApp = () => {
    const message = `Hi! I'm interested in your property: ${listing.title}`
    const whatsappUrl = `https://wa.me/${listing.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const startConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('Please sign in to send messages')
      return
    }
    
    if (user.id === listing.user_id) {
      alert('You cannot message yourself')
      return
    }

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .or(`and(participant1.eq.${user.id},participant2.eq.${listing.user_id}),and(participant1.eq.${listing.user_id},participant2.eq.${user.id})`)
        .single()

      if (existingConv) {
        router.push(`/messages?conversation=${existingConv.id}`)
        return
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          listing_id: listing.id,
          participant1: user.id,
          participant2: listing.user_id
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/messages?conversation=${data.id}`)
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Error starting conversation. Please try again.')
    }
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && listing.images.length > 1) {
      nextImage()
    }
    if (isRightSwipe && listing.images.length > 1) {
      prevImage()
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
                {listing.images && listing.images.length > 0 ? (
                  <>
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${listing.images[currentImageIndex]}`}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {listing.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                        >
                          ←
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                        >
                          →
                        </button>
                      </>
                    )}

                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {listing.images.length}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">🏠</span>
                  </div>
                )}
              </div>

              {listing.images && listing.images.length > 1 && (
                <div className="p-4">
                  <div className="flex space-x-2 overflow-x-auto">
                    {listing.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentImageIndex 
                            ? 'border-blue-500' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${image}`}
                          alt={`View ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
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
              
              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span>📍</span>
                  <span>{listing.city.charAt(0).toUpperCase() + listing.city.slice(1)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🛏️</span>
                  <span>{listing.rooms} {listing.rooms === 1 ? 'Room' : 'Rooms'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {listing.user_profiles?.profile_picture ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${listing.user_profiles.profile_picture}`}
                      alt="Owner"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <span>👤</span>
                  )}
                  <span>By {listing.owner_name || 'Property Owner'}</span>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
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
                          className="inline-flex items-center space-x-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg transition-colors text-sm font-medium"
                        >
                          <span>🗺️</span>
                          <span>Open in Maps</span>
                        </button>
                      </div>
                      <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200">
                        <iframe
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(listing.longitude)-0.002},${parseFloat(listing.latitude)-0.002},${parseFloat(listing.longitude)+0.002},${parseFloat(listing.latitude)+0.002}&layer=mapnik&marker=${parseFloat(listing.latitude)},${parseFloat(listing.longitude)}`}
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

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {listing?.price?.toLocaleString()} {listing?.currency}
                </div>
                <div className="text-gray-600">per month</div>
              </div>

              <div className="space-y-3 mb-4">
                <button
                  onClick={openWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span>💬</span>
                  <span>Contact via WhatsApp</span>
                </button>
                
                <button
                  onClick={() => startConversation()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span>✉️</span>
                  <span>Send Message</span>
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Code</span>
                  <span className="font-medium font-mono text-blue-600">#{listing.reference_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rooms</span>
                  <span className="font-medium">{listing.rooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">City</span>
                  <span className="font-medium">{listing.city.charAt(0).toUpperCase() + listing.city.slice(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Currency</span>
                  <span className="font-medium">{listing.currency}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600">⚠️</span>
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1">Safety Tips</p>
                    <p className="text-yellow-700">
                      Always verify the property and meet in person before making any payments.
                    </p>
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
  const { id } = params
  const { admin } = query
  
  try {
    // Get listing data
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    if (listingError || !listingData) {
        // If admin param is present, let client-side handle it
      if (admin === 'true') {
        return {
          props: {
            listing: null,
            ...(await serverSideTranslations(locale, ['common'])),
          },
        }
      }
      return {
        notFound: true,
      }
    }

    // For approved and active listings, always allow access
    if (listingData.status === 'approved' && listingData.is_active !== false) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('display_name, profile_picture')
        .eq('user_id', listingData.user_id)
        .single()

      const listing = {
        ...listingData,
        user_profiles: profileData || null,
        owner_name: profileData?.display_name || listingData.user_email?.split('@')[0] || 'Property Owner'
      }

      return {
        props: {
          listing,
          ...(await serverSideTranslations(locale, ['common'])),
        },
      }
    }

    // For non-approved listings, only allow if admin param is present
    if (admin === 'true') {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('display_name, profile_picture')
        .eq('user_id', listingData.user_id)
        .single()

      const listing = {
        ...listingData,
        user_profiles: profileData || null,
        owner_name: profileData?.display_name || listingData.user_email?.split('@')[0] || 'Property Owner'
      }

      return {
        props: {
          listing,
          ...(await serverSideTranslations(locale, ['common'])),
        },
      }
    }

    // Default: not found for non-approved without admin param
    return {
      notFound: true,
    }
  } catch (error) {
    console.error('Error in getServerSideProps:', error)
    // If admin param is present, let client-side handle it
    if (admin === 'true') {
      return {
        props: {
          listing: null,
          ...(await serverSideTranslations(locale, ['common'])),
        },
      }
    }
    return {
      notFound: true,
    }
  }
}
