import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import FavoriteButton from './FavoriteButton'

export default function ListingCard({
  listing,
  showActions = false,
  onApprove,
  onReject,
  onDelete,
  isAdmin = false,
  isOwner = false,
  viewMode = 'grid'
}) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [profileData, setProfileData] = useState(listing.user_profiles)
  const [currentUser, setCurrentUser] = useState(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      if (user) {
        checkFavoriteStatus(user.id)
      }
    }
    getUser()
  }, [])

  const checkFavoriteStatus = async (userId) => {
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('listing_id', listing.id)
        .single()
      
      setIsFavorited(!!data)
    } catch (error) {
      // Not favorited or error
      setIsFavorited(false)
    }
  }

  const toggleFavorite = async (e) => {
    e.stopPropagation()
    
    if (!currentUser) {
      alert('Please sign in to save favorites')
      return
    }

    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('listing_id', listing.id)
        
        if (error) throw error
        setIsFavorited(false)
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: currentUser.id,
            listing_id: listing.id
          })
        
        if (error) throw error
        setIsFavorited(true)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert('Error updating favorites. Please try again.')
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileData && listing?.user_id) {
        const { data } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, profile_picture')
          .eq('user_id', listing.user_id)
          .single()
        if (data) setProfileData(data)
      }
    }
    fetchProfile()
  }, [listing?.user_id]) // eslint-disable-line

  const nextImage = (e) => {
    e?.stopPropagation?.()
    setCurrentImageIndex((prev) =>
      listing.images && listing.images.length > 0
        ? (prev + 1) % listing.images.length
        : 0
    )
  }

  const prevImage = (e) => {
    e?.stopPropagation?.()
    setCurrentImageIndex((prev) =>
      listing.images && listing.images.length > 0
        ? (prev - 1 + listing.images.length) % listing.images.length
        : 0
    )
  }

  const openListing = () => {
    const isCurrentUserAdmin = currentUser?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
    const url = (isCurrentUserAdmin || isOwner || showActions)
      ? `/listing/${listing.id}?admin=true`
      : `/listing/${listing.id}`
    router.push(url)
  }

  const openWhatsApp = (e) => {
    e.stopPropagation()
    const message = `Hi! I'm interested in your property: ${listing.title}`
    const whatsappUrl = `https://wa.me/${listing.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchMove = (e) => { touchEndX.current = e.touches[0].clientX }
  const handleTouchEnd = (e) => {
    e.stopPropagation()
    const distance = touchStartX.current - touchEndX.current
    if (distance > 50 && listing.images?.length > 1) nextImage(e)
    if (distance < -50 && listing.images?.length > 1) prevImage(e)
  }

  // IMPORTANT: property-scoped conversation lookup (fix for “wrong thread”)
  const startConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please sign in to send messages')
        return
      }
      if (user.id === listing.user_id) {
        alert('You cannot message yourself')
        return
      }

      // Find existing conversation for THIS property + these two users (either order).
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

      // Create new conversation for this property
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
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Error starting conversation. Please try again.')
    }
  }

  const firstImage = listing.images?.[currentImageIndex] || null
  const firstImageUrl = firstImage
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${firstImage}`
    : null

  const ownerAvatar = profileData?.profile_picture
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${profileData.profile_picture}`
    : null

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border border-gray-100/50 backdrop-blur-sm">
        <div className={`flex flex-col md:flex-row ${!showActions ? 'cursor-pointer' : ''}`} onClick={!showActions ? openListing : undefined}>
          {/* Image Section */}
          <div
            className="relative w-full md:w-80 h-64 md:h-48 bg-gray-100 overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {firstImageUrl ? (
              <>
                <img
                  src={firstImageUrl}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {listing.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <span className="text-6xl text-gray-400">🏠</span>
              </div>
            )}
            
            {/* Image counter */}
            {listing.images?.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                {currentImageIndex + 1} / {listing.images.length}
              </div>
            )}
            
            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
                listing.status === 'approved' ? 'bg-green-500/90 text-white' :
                listing.status === 'pending' ? 'bg-yellow-500/90 text-white' :
                'bg-red-500/90 text-white'
              }`}>
                {listing.status.toUpperCase()}
              </span>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="flex-1 p-6 md:p-8">
            {/* Owner Info */}
            <div className="flex items-center justify-between mb-4">
              <Link
                href={`/profile/${listing.user_id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center space-x-3 group/owner hover:bg-gray-50 rounded-xl p-2 -m-2 transition-all"
              >
                {ownerAvatar ? (
                  <img
                    src={ownerAvatar}
                    alt="Owner"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 group-hover/owner:ring-blue-300 transition-all"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-blue-200 group-hover/owner:ring-blue-400 transition-all">
                    <span className="text-white text-sm font-bold">
                      {(profileData?.display_name || listing.user_email || 'U')?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-sm font-semibold text-blue-600 group-hover/owner:text-blue-700 transition-colors">
                    {profileData?.display_name || listing.user_email?.split('@')[0] || 'User'}
                  </span>
                </div>
              </Link>
              
              <button
                onClick={(e) => { e.stopPropagation(); openWhatsApp(e) }}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-sm font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
                </svg>
                <span>WhatsApp</span>
              </button>
            </div>
            
            {/* Title & Price */}
            <div className="mb-4">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {listing.title}
              </h3>
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {listing.price.toLocaleString()} {listing.currency}
                  </div>
                  <div className="text-sm text-gray-500">per month</div>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
              {listing.description}
            </p>
            
            {/* Property details */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 bg-blue-50 rounded-xl px-3 py-2">
                  <span className="text-blue-500">🛏️</span>
                  <span className="text-sm font-semibold text-gray-700">{listing.rooms} {listing.rooms === 1 ? 'Room' : 'Rooms'}</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-blue-500">📍</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {listing.city?.charAt(0).toUpperCase() + listing.city?.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* CTA buttons */}
            {!showActions && (
              <div className="flex space-x-3">
                <button
                  onClick={(e) => { e.stopPropagation(); openListing() }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>View Details</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); startConversation() }}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Message</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 border border-gray-100/50 backdrop-blur-sm">
      <div className={`${!showActions ? 'cursor-pointer' : ''}`} onClick={!showActions ? openListing : undefined}>
        {/* Enhanced Image Carousel */}
        <div
          className="relative h-48 sm:h-52 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {firstImageUrl ? (
            <>
              <img
                src={firstImageUrl}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              {listing.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-10 h-10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              
              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
              <span className="text-6xl text-blue-300">🏠</span>
            </div>
          )}

          {/* Enhanced Image counter */}
          {listing.images?.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-semibold">
              {currentImageIndex + 1} / {listing.images.length}
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
              listing.status === 'approved' ? 'bg-green-500/90 text-white' :
              listing.status === 'pending' ? 'bg-yellow-500/90 text-white' :
              'bg-red-500/90 text-white'
            }`}>
              {listing.status.toUpperCase()}
            </span>
          </div>
          
          {/* Favorite Button */}
          <button 
            onClick={toggleFavorite}
            className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-lg ${
              isFavorited 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-gray-600 hover:text-red-500'
            }`}
          >
            <svg className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Enhanced Body */}
        <div className="p-5">
          {/* Owner Info with enhanced styling */}
          <div className="flex items-center justify-between mb-5">
            <Link
              href={`/profile/${listing.user_id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-3 group/owner hover:bg-gray-50 rounded-xl p-2 -m-2 transition-all"
            >
              {ownerAvatar ? (
                <img
                  src={ownerAvatar}
                  alt="Owner"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 group-hover/owner:ring-blue-300 transition-all"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-blue-200 group-hover/owner:ring-blue-400 transition-all">
                  <span className="text-white text-sm font-bold">
                    {(profileData?.display_name || listing.user_email || 'U')?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <span className="text-sm font-semibold text-blue-600 group-hover/owner:text-blue-700 transition-colors">
                  {profileData?.display_name || listing.user_email?.split('@')[0] || 'User'}
                </span>
              </div>
            </Link>

            {/* Enhanced WhatsApp Button */}
            <button
              onClick={(e) => { e.stopPropagation(); openWhatsApp(e) }}
              className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-xs font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-1"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.700"/>
              </svg>
              <span>Chat</span>
            </button>
          </div>

          {/* Enhanced Title & Price */}
          <div className="mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
              {listing.title}
            </h3>
            <div className="flex items-center justify-between">
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  {listing.price.toLocaleString()} {listing.currency}
                </div>
                <div className="text-xs text-gray-500">per month</div>
              </div>
            </div>
          </div>

          {/* Enhanced Description */}
          <p className="text-gray-600 text-sm mb-5 line-clamp-3 leading-relaxed">
            {listing.description}
          </p>

          {/* Enhanced Property details */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-blue-50 rounded-xl px-3 py-2">
                <span className="text-blue-500">🛏️</span>
                <span className="text-sm font-semibold text-gray-700">{listing.rooms} {listing.rooms === 1 ? 'Room' : 'Rooms'}</span>
              </div>
              <div className="flex items-center space-x-2 bg-blue-50 rounded-xl px-3 py-2">
                <span className="text-blue-500">📍</span>
                <span className="text-sm font-semibold text-gray-700">
                  {listing.city?.charAt(0).toUpperCase() + listing.city?.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced CTA buttons */}
          {!showActions && (
            <div className="flex space-x-3">
              <button
                onClick={(e) => { e.stopPropagation(); openListing() }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>View Details</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); startConversation() }}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Message</span>
              </button>
            </div>
          )}

          {/* Admin actions */}
          {showActions && (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onApprove?.(listing.id) }}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReject?.(listing.id) }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                >
                  ⚠️ Reject
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete?.(listing.id) }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                >
                  🗑️ Delete
                </button>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); openListing() }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
              >
                👁️ Open Listing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
