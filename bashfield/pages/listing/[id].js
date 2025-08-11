import { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../../lib/supabase'

/**
 * Listing detail page
 * Server-side rule:
 *  - If listing.status === 'approved' => visible to everyone
 *  - Else if query.admin === 'true'   => visible (admin/owner path)
 *  - Otherwise                        => 404
 */
export default function ListingDetail({ listing: initialListing }) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [listing] = useState(initialListing)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading_property') || 'Loading property...'}</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-700">{t('not_found') || 'Property not found'}</div>
      </div>
    )
  }

  const images = Array.isArray(listing.images) ? listing.images : (listing.images ? [listing.images] : [])
  const hasImages = images.length > 0

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % Math.max(images.length, 1))
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1))

  const onTouchStart = (e) => { touchStartX.current = e.changedTouches[0].screenX }
  const onTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX
    if (touchStartX.current - touchEndX.current > 50) nextImage()
    if (touchEndX.current - touchStartX.current > 50) prevImage()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title || t('untitled')}</h1>

        {/* Owner */}
        <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
          {listing.user_profiles?.profile_picture ? (
            <img src={listing.user_profiles.profile_picture} alt="Owner" className="w-8 h-8 rounded-full object-cover" />
          ) : <div className="w-8 h-8 rounded-full bg-gray-200" />}
          <span>{listing.user_profiles?.display_name || listing.owner_name || t('owner')}</span>
          {listing.status && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full border bg-gray-50">{listing.status}</span>
          )}
        </div>

        {/* Gallery */}
        <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden mb-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {hasImages ? (
            <img
              src={images[currentImageIndex]}
              alt={listing.title || 'Property'}
              className="w-full h-64 object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center text-gray-400">No Image</div>
          )}

          {hasImages && images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full px-2 py-1 text-sm"
              >
                ‹
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full px-2 py-1 text-sm"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-gray-900 font-semibold">{t('details') || 'Details'}</div>
            <div className="text-gray-700"><strong>{t('price') || 'Price'}:</strong> {listing.price ?? '-'}</div>
            <div className="text-gray-700"><strong>{t('city') || 'City'}:</strong> {listing.city || '-'}</div>
            <div className="text-gray-700"><strong>{t('address') || 'Address'}:</strong> {listing.address || '-'}</div>
            <div className="text-gray-700"><strong>{t('rooms') || 'Rooms'}:</strong> {listing.rooms ?? '-'}</div>
            <div className="text-gray-700"><strong>{t('bathrooms') || 'Bathrooms'}:</strong> {listing.bathrooms ?? '-'}</div>
            <div className="text-gray-700"><strong>{t('area') || 'Area'}:</strong> {listing.area ?? '-'}</div>
          </div>

          <div className="space-y-2">
            <div className="text-gray-900 font-semibold">{t('description') || 'Description'}</div>
            <p className="text-gray-700 whitespace-pre-wrap">{listing.description || '-'}</p>

            {(listing.latitude && listing.longitude) && (
              <div className="mt-3">
                <div className="text-gray-900 font-semibold mb-2">{t('location') || 'Location'}</div>
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
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ params, locale, query }) {
  const { id } = params
  const isAdminParam = String(query?.admin || '').toLowerCase() === 'true'

  try {
    // Always fetch the listing by id (no status filter here)
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    if (listingError || !listingData) {
      return { notFound: true }
    }

    // Gate access:
    //  - Public if approved
    //  - Otherwise require admin=true query flag (added client-side only for admin/owner)
    const isApproved = (listingData.status || '').toLowerCase() === 'approved'
    if (!isApproved && !isAdminParam) {
      return { notFound: true }
    }

    // Attach minimal profile
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('display_name, profile_picture')
      .eq('user_id', listingData.user_id)
      .single()

    const listing = {
      ...listingData,
      user_profiles: profileData || null,
      owner_name: profileData?.display_name || (listingData.user_email ? listingData.user_email.split('@')[0] : 'Property Owner')
    }

    return {
      props: {
        listing,
        ...(await serverSideTranslations(locale, ['common'])),
      },
    }
  } catch (error) {
    console.error('Error in getServerSideProps:', error)
    return { notFound: true }
  }
}
