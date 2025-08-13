// FILE: bashfield/pages/listing/[id].js

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
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    })()
  }, [])

  // If no SSR listing and admin override is present, fetch client-side with user JWT
  useEffect(() => {
    if (!initialListing && ['true','1','yes'].includes(String(router.query.admin).toLowerCase()) && router.query.id) {
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
          <p className="text-gray-600">Loading property…</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h1>
            <p className="text-gray-600">This listing may be inactive, rejected, or no longer available.</p>
          </div>
        </div>
      </div>
    )
  }

  const openWhatsApp = () => {
    const message = `Hi! I'm interested in your property: ${listing.title}`
    const whatsappUrl = `https://wa.me/${listing.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  // … UI omitted for brevity … key additions below:
  // 1) A small badge showing the property reference code in the header area
  // (The rest of your JSX remains unchanged.)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* gallery (unchanged) */}

            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{listing.title}</h1>
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
                <div className="flex items-center space-x-1"><span>📍</span><span>{listing.city.charAt(0).toUpperCase() + listing.city.slice(1)}</span></div>
                <div className="flex items-center space-x-1"><span>🛏️</span><span>{listing.rooms} {listing.rooms === 1 ? 'Room' : 'Rooms'}</span></div>
                <div className="flex items-center space-x-1"><span>🏷️</span><span className="font-mono">{listing.reference_code}</span></div>
                <div className="flex items-center space-x-2">
                  {listing.user_profiles?.profile_picture ? (
                    <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${listing.user_profiles.profile_picture}`} alt="Owner" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <span>👤</span>
                  )}
                  <span>By {listing.owner_name || 'Property Owner'}</span>
                </div>
              </div>

              {/* description, location, etc. (unchanged) */}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">{listing?.price?.toLocaleString()} {listing?.currency}</div>
                <div className="text-gray-600">per month</div>
              </div>
              <div className="space-y-3 mb-4">
                <button onClick={openWhatsApp} className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium">Contact on WhatsApp</button>
                <a href={`tel:${listing.phone}`} className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium">Call {listing.phone}</a>
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
    // Get listing data (public path). This will only return approved+active rows due to RLS.
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    if (listingError || !listingData) {
      // If any admin override param is present, let the client fetch with user JWT
      if (admin && String(admin).toLowerCase() !== 'false') {
        return {
          props: { listing: null, ...(await serverSideTranslations(locale, ['common'])) },
        }
      }
      return { notFound: true }
    }

    // For approved listings, always allow
    if (listingData.status === 'approved') {
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

      return { props: { listing, ...(await serverSideTranslations(locale, ['common'])) } }
    }

    // Non-approved: only allow if admin override is present
    if (admin && String(admin).toLowerCase() !== 'false') {
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

      return { props: { listing, ...(await serverSideTranslations(locale, ['common'])) } }
    }

    // Default: not found for non-approved without admin param
    return { notFound: true }
  } catch (error) {
    console.error('Error in getServerSideProps:', error)
    if (admin && String(admin).toLowerCase() !== 'false') {
      return { props: { listing: null, ...(await serverSideTranslations(locale, ['common'])) } }
    }
    return { notFound: true }
  }
}
