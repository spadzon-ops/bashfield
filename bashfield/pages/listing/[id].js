import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../../lib/supabase'
import { useMode } from '../../contexts/ModeContext'

export default function ListingDetail({ listing: initialListing }) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { config } = useMode()
  const [listing, setListing] = useState(initialListing)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(!initialListing)
  const [currentUser, setCurrentUser] = useState(null)
  const [address, setAddress] = useState('')
  const [addressLoading, setAddressLoading] = useState(false)
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
    if (listing?.latitude && listing?.longitude) {
      fetchAddress(listing.latitude, listing.longitude)
    }
  }, [listing])

  const fetchAddress = async (lat, lng) => {
    setAddressLoading(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
      const data = await response.json()
      if (data && data.display_name) {
        setAddress(data.display_name)
      }
    } catch (error) {
      console.error('Error fetching address:', error)
    }
    setAddressLoading(false)
  }

  useEffect(() => {
    // If no initial listing, fetch client-side
    if (!initialListing && router.query.id) {
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
        owner_name: profileData?.display_name || 'Property Owner'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => {
            // Check if we came from home page with saved scroll position
            const savedPosition = sessionStorage.getItem('homeScrollPosition')
            if (savedPosition) {
              router.push('/')
            } else {
              router.back()
            }
          }}
          className="mb-8 flex items-center space-x-3 text-gray-600 hover:text-blue-600 transition-all duration-300 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105 border border-gray-200/50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold">Back to listings</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50">
              <div 
                className="relative h-96 lg:h-[500px] bg-gradient-to-br from-gray-100 to-gray-200"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {listing.images && listing.images.length > 0 ? (
                  <>
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${listing.images[currentImageIndex]}`}
                      alt={listing.title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                    
                    {/* Gradient overlay for better UI */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                    
                    {listing.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all duration-300 backdrop-blur-sm flex items-center justify-center group"
                        >
                          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all duration-300 backdrop-blur-sm flex items-center justify-center group"
                        >
                          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}

                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
                      {currentImageIndex + 1} / {listing.images.length}
                    </div>
                    

                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                    <span className="text-8xl text-purple-300">🏠</span>
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

            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 lg:p-10 mt-8 border border-gray-200/50">
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4 leading-tight">
                  {listing.title}
                </h1>
                <div className="flex items-center justify-between">
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {listing?.price?.toLocaleString()} {listing?.currency}
                    <span className="text-lg text-gray-500 font-normal ml-2">{config?.priceLabel || 'per month'}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Location</div>
                      <div className="font-semibold text-gray-900">{listing.city.charAt(0).toUpperCase() + listing.city.slice(1)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15v-4a2 2 0 012-2h4a2 2 0 012 2v4" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Rooms</div>
                      <div className="font-semibold text-gray-900">{listing.rooms} {listing.rooms === 1 ? 'Room' : 'Rooms'}</div>
                    </div>
                  </div>
                </div>
                
                {listing.size_sqm && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <span className="text-white text-sm font-bold">📏</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Size</div>
                        <div className="font-semibold text-gray-900">{listing.size_sqm} m²</div>
                        {listing.price && listing.size_sqm && (
                          <div className="text-xs text-gray-500">{(listing.price / listing.size_sqm).toFixed(1)} {listing.currency}/m²</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-200/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Owner</div>
                      <a 
                        href={`/profile/${listing.user_id}`}
                        className="font-semibold text-gray-900 hover:text-purple-600 transition-colors cursor-pointer"
                      >
                        {listing.owner_name || 'Property Owner'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span>Property Description</span>
                </h3>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200/50">
                  <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                    {listing.description}
                  </p>
                </div>
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
                            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                            
                            if (isMobile) {
                              // On mobile, try to open with system map selector
                              const coords = `${listing.latitude},${listing.longitude}`
                              const googleMapsUrl = `https://www.google.com/maps?q=${coords}`
                              window.open(googleMapsUrl, '_blank')
                            } else {
                              // On desktop, open Google Maps
                              const googleMapsUrl = `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}&zoom=15`
                              window.open(googleMapsUrl, '_blank')
                            }
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
            {/* Owner Profile Section */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-gray-200/50">
              <div className="text-center mb-6">
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
                  👤 Property Owner
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <a 
                  href={`/profile/${listing.user_id}`}
                  className="group flex flex-col items-center hover:bg-blue-50 rounded-2xl p-4 transition-all duration-300 transform hover:scale-105"
                >
                  {listing.user_profiles?.profile_picture ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${listing.user_profiles.profile_picture}`}
                      alt="Owner"
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-200 group-hover:ring-blue-400 transition-all duration-300 shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center ring-4 ring-blue-200 group-hover:ring-blue-400 transition-all duration-300 shadow-lg">
                      <span className="text-white text-2xl font-bold">
                        {(listing.user_profiles?.display_name || listing.owner_name || 'U')?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {listing.user_profiles?.display_name || listing.owner_name || 'Property Owner'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Click to view profile</p>
                  </div>
                </a>
                
                <div className="w-full mt-6 space-y-3">
                  <button
                    onClick={() => startConversation()}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Message Owner</span>
                  </button>
                  <button
                    onClick={openWhatsApp}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
                    </svg>
                    <span>Contact via WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sticky top-24 border border-gray-200/50">

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 space-y-4 border border-gray-200/50">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Property Information</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                    <span className="text-gray-600 font-medium">Property Code</span>
                    <span className="font-bold font-mono text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">#{listing.reference_code}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                    <span className="text-gray-600 font-medium">Rooms</span>
                    <span className="font-semibold text-gray-900">{listing.rooms}</span>
                  </div>
                  {listing.size_sqm && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                      <span className="text-gray-600 font-medium">Size</span>
                      <span className="font-semibold text-gray-900">{listing.size_sqm} m²</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                    <span className="text-gray-600 font-medium">City</span>
                    <span className="font-semibold text-gray-900">{listing.city.charAt(0).toUpperCase() + listing.city.slice(1)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                    <span className="text-gray-600 font-medium">Currency</span>
                    <span className="font-semibold text-gray-900">{listing.currency}</span>
                  </div>
                  {(listing.latitude && listing.longitude) && (
                    <div className="flex justify-between items-start py-2">
                      <span className="text-gray-600 font-medium">Address</span>
                      <div className="text-right max-w-[60%]">
                        {addressLoading ? (
                          <span className="text-gray-400 text-sm">Loading...</span>
                        ) : address ? (
                          <span className="font-semibold text-gray-900 text-sm leading-tight">{address}</span>
                        ) : (
                          <span className="text-gray-400 text-sm">Not available</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200/50 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-yellow-800 mb-2 text-lg">Safety First</p>
                    <p className="text-yellow-700 leading-relaxed">
                      Always verify the property and meet in person before making any payments. Report suspicious activity to our support team.
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
      return {
        props: {
          listing: null,
          ...(await serverSideTranslations(locale, ['common'])),
        },
      }
    }

    // Get profile data
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('display_name, profile_picture')
      .eq('user_id', listingData.user_id)
      .single()

    const listing = {
      ...listingData,
      user_profiles: profileData || null,
      owner_name: profileData?.display_name || 'Property Owner'
    }

    // For admin access, always return the listing
    if (admin === 'true') {
      return {
        props: {
          listing,
          ...(await serverSideTranslations(locale, ['common'])),
        },
      }
    }

    // For regular users, only show approved and active listings
    if (listingData.status === 'approved' && listingData.is_active !== false) {
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
    return {
      props: {
        listing: null,
        ...(await serverSideTranslations(locale, ['common'])),
      },
    }
  }
}
