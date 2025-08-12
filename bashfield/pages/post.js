import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'

export default function PostDetails() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { id } = router.query

  const [listing, setListing] = useState(null)
  const [owner, setOwner] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!router.isReady || !id) return
    ;(async () => {
      const { data: l } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (!l) { setListing(null); setLoading(false); return }

      const { data: p } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_picture')
        .eq('user_id', l.user_id)
        .maybeSingle()

      setListing(l)
      setOwner(p || null)
      setLoading(false)
    })()
  }, [router.isReady, id])

  const phoneToWhatsLink = (phone, title) => {
    if (!phone) return '#'
    const digits = String(phone).replace(/[^\d+]/g, '')
    const text = encodeURIComponent(`Hi, I'm interested in: ${title}`)
    return `https://wa.me/${digits}?text=${text}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading…</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold">Listing not found</p>
          <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">Go home</Link>
        </div>
      </div>
    )
  }

  const imgUrl = listing.images?.[0]
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${listing.images[0]}`
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {imgUrl ? (
            <img src={imgUrl} alt={listing.title} className="w-full h-72 object-cover" />
          ) : (
            <div className="w-full h-72 bg-gray-100 flex items-center justify-center text-gray-500">No image</div>
          )}

          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
            <p className="mt-2 text-gray-700 whitespace-pre-wrap">{listing.description}</p>

            {/* Owner row */}
            <div className="mt-6 flex items-center">
              <Link href={`/profile/${listing.user_id}`} className="flex items-center space-x-3 group">
                {owner?.profile_picture ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${owner.profile_picture}`}
                    className="w-10 h-10 rounded-full object-cover"
                    alt="Avatar"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {owner?.display_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-gray-900 font-medium group-hover:underline">{owner?.display_name || 'User'}</p>
                  <p className="text-gray-500 text-sm">Posted this listing</p>
                </div>
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-2">
              {/* WhatsApp */}
              <a
                href={phoneToWhatsLink(listing.phone, listing.title)}
                target="_blank" rel="noopener noreferrer"
                className="px-3 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700"
              >
                WhatsApp
              </a>

              {/* Send Message (per property) */}
              <Link
                href={`/messages?peer=${listing.user_id}&listing=${listing.id}`}
                className="px-3 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Send Message
              </Link>

              {/* Back */}
              <Link href="/" className="ml-auto text-blue-600 hover:underline text-sm">
                ← Back to listings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ locale }) {
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } }
}
