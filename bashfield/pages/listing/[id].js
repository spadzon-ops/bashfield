import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { supabase } from '../../lib/supabase'

export default function ListingDetails({ listing }) {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

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

  const avatarUrl = listing.user_profiles?.profile_picture
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${listing.user_profiles.profile_picture}`
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Link href={`/profile/${listing.user_id}`} className="flex items-center space-x-3 group">
                {avatarUrl ? (
                  <img src={avatarUrl} className="w-10 h-10 rounded-full object-cover" alt="Owner" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-semibold flex items-center justify-center">
                    {(listing.owner_name?.[0] || '?').toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-900 group-hover:underline">
                    {listing.owner_name || 'Property Owner'}
                  </div>
                  <div className="text-sm text-gray-600">Posted in {listing.city}</div>
                </div>
              </Link>
            </div>
            <div>
              <Link
                href={`/messages?peer=${listing.user_id}&listing=${listing.id}`}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                Send Message
              </Link>
            </div>
          </div>

          {/* Title + status + property code */}
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {listing.title}
              </h1>
              {/* Property Code */}
              {listing.reference_code && (
                <div className="mt-1 text-sm text-gray-600">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">#{listing.reference_code}</span>
                </div>
              )}
            </div>
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
        </div>

        {/* Gallery */}
        {Array.isArray(listing.images) && listing.images.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="relative w-full h-64 sm:h-96 rounded-lg overflow-hidden">
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${listing.images[currentImageIndex]}`}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              {listing.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><span className="text-gray-500">City:</span> {listing.city}</div>
            <div><span className="text-gray-500">Rooms:</span> {listing.rooms}</div>
            <div><span className="text-gray-500">Price:</span> {Number(listing.price || 0).toLocaleString()} {listing.currency}</div>
            <div><span className="text-gray-500">Phone:</span> {listing.phone}</div>
          </div>
          <p className="text-gray-800 whitespace-pre-wrap">{listing.description}</p>
        </div>

        {/* Map (kept OSM/Leaflet approach through MapView if you wire it here) */}
      </div>
    </div>
  )
}

export async function getServerSideProps({ params, locale, query }) {
  const { id } = params
  const { admin } = query
  const isAdminOverride = typeof admin !== 'undefined' && admin !== 'false' && admin !== '0'
  
  try {
    // Get listing data (no filters here; decide access below)
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    if (listingError || !listingData) {
      if (isAdminOverride) {
        return {
          props: {
            listing: null,
            ...(await serverSideTranslations(locale, ['common'])),
          },
        }
      }
      return { notFound: true }
    }

    // Allow for public only if approved AND active
    if (listingData.status === 'approved' && (listingData.is_active ?? true)) {
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

    // Non-approved or inactive → show only when admin override is present
    if (isAdminOverride) {
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

    // Otherwise hide
    return { notFound: true }
  } catch (error) {
    console.error('Error in getServerSideProps:', error)
    if (isAdminOverride) {
      return {
        props: {
          listing: null,
          ...(await serverSideTranslations(locale, ['common'])),
        },
      }
    }
    return { notFound: true }
  }
}
