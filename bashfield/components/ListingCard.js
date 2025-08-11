import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

/**
 * ListingCard
 * - Renders a single listing tile with image carousel
 * - If user is admin (by email) or the owner, clicking card routes to /listing/[id]?admin=true
 *   so server-side detail page will allow access even if status is pending/rejected.
 */
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
      setCurrentUser(user || null)

      // fallback: fetch profile if not embedded
      if (!profileData && listing.user_id) {
        const { data } = await supabase
          .from('user_profiles')
          .select('display_name, profile_picture')
          .eq('user_id', listing.user_id)
          .single()
        if (data) setProfileData(data)
      }
    }
    getUser()
  }, [listing.user_id]) // eslint-disable-line react-hooks/exhaustive-deps

  const images = Array.isArray(listing.images) ? listing.images : (listing.images ? [listing.images] : [])
  const hasImages = images.length > 0

  const nextImage = (e) => {
    e?.stopPropagation?.()
    setCurrentImageIndex((prev) => (prev + 1) % Math.max(images.length, 1))
  }
  const prevImage = (e) => {
    e?.stopPropagation?.()
    setCurrentImageIndex((prev) => (prev - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1))
  }

  const onTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX
  }
  const onTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX
    if (touchStartX.current - touchEndX.current > 50) nextImage()
    if (touchEndX.current - touchStartX.current > 50) prevImage()
  }

  const emailIsAdmin = (email) => {
    const adminEnv = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase()
    return !!email && adminEnv && email.toLowerCase() === adminEnv
  }

  const openListing = () => {
    const isCurrentUserAdmin = emailIsAdmin(currentUser?.email) || isAdmin
    const adminFlag = (isCurrentUserAdmin || isOwner) ? '?admin=true' : ''
    router.push(`/listing/${listing.id}${adminFlag}`)
  }

  return (
    <div
      onClick={openListing}
      className="cursor-pointer rounded-2xl shadow-sm border border-gray-200 bg-white overflow-hidden hover:shadow-md transition"
    >
      {/* Image */}
      <div className="relative w-full h-48 bg-gray-100" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {hasImages ? (
          <img
            src={images[currentImageIndex]}
            alt={listing.title || 'Property'}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center text-gray-400">No Image</div>
        )}

        {hasImages && images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(e) }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full px-2 py-1 text-sm"
            >
              ‹
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(e) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full px-2 py-1 text-sm"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          {profileData?.profile_picture ? (
            <img src={profileData.profile_picture} alt="Owner" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-200" />
          )}
          <div className="text-sm text-gray-700">
            {profileData?.display_name || listing.owner_name || t('owner')}
          </div>
          {listing.status && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full border bg-gray-50">
              {listing.status}
            </span>
          )}
        </div>

        <div className="font-semibold text-gray-900 line-clamp-1">{listing.title || t('untitled')}</div>
        <div className="text-sm text-gray-600 line-clamp-2">{listing.description || ''}</div>

        {showActions && (
          <div className="mt-3 flex gap-2">
            {onApprove && (
              <button
                onClick={(e) => { e.stopPropagation(); onApprove(listing.id) }}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm"
              >
                ✅ {t('approve')}
              </button>
            )}
            {onReject && (
              <button
                onClick={(e) => { e.stopPropagation(); onReject(listing.id) }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-sm"
              >
                🚫 {t('reject')}
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(listing.id) }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm"
              >
                🗑️ {t('delete')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
