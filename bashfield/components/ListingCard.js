import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function ListingCard({
  listing,
  showActions = false,
  onApprove,
  onReject,
  onDelete,
  isAdmin = false,
  isOwner = false
}) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [profileData, setProfileData] = useState(listing.user_profiles)
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

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className={`${!showActions ? 'cursor-pointer' : ''}`} onClick={!showActions ? openListing : undefined}>
        {/* Image Carousel */}
        <div
          className="relative h-48 sm:h-56 bg-gray-100 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {firstImageUrl ? (
            <>
              <img
                src={firstImageUrl}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {listing.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 flex items-center justify-center"
                  >
                    ←
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 flex items-center justify-center"
                  >
                    →
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🏠</div>
          )}

          {/* Image counter */}
          {listing.images?.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {currentImageIndex + 1} / {listing.images.length}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Owner Info (CLICKABLE for everyone) */}
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/profile/${listing.user_id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-2 group"
            >
              {ownerAvatar ? (
                <img
                  src={ownerAvatar}
                  alt="Owner"
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">
                    {(profileData?.display_name || listing.user_email || 'U')?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm text-blue-600 group-hover:underline">
                {profileData?.display_name || listing.user_email?.split('@')[0] || 'User'}
              </span>
            </Link>

            {/* Phone / WhatsApp */}
            <button
              onClick={(e) => { e.stopPropagation(); openWhatsApp(e) }}
              className="text-xs px-2 py-1 rounded bg-green-600 text-white"
            >
              WhatsApp
            </button>
          </div>

          {/* Title & Price */}
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2 flex-1 mr-2">
              {listing.title}
            </h3>
            <div className="text-right">
              <div className="text-lg sm:text-xl font-bold text-blue-600">
                {listing.price.toLocaleString()} {listing.currency}
              </div>
              <div className="text-xs text-gray-500">per month</div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {listing.description}
          </p>

          {/* Property details */}
          <div className="flex items-center justify-between mb-4 text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span>🛏️</span>
                <span className="text-sm">{listing.rooms} {listing.rooms === 1 ? 'Room' : 'Rooms'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>📍</span>
                <span className="text-sm">
                  {listing.city?.charAt(0).toUpperCase() + listing.city?.slice(1)}
                </span>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              listing.status === 'approved' ? 'bg-green-100 text-green-800' :
              listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {listing.status}
            </span>
          </div>

          {/* CTA buttons */}
          {!showActions && (
            <div className="flex space-x-2">
              <button
                onClick={(e) => { e.stopPropagation(); openListing() }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
              >
                <span>👁️</span><span>View Details</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); startConversation() }}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
              >
                <span>✉️</span><span>Send Message</span>
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
