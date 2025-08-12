import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'

export default function Home() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      // fetch approved listings
      const { data: items } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      const results = items || []
      const ownerIds = [...new Set(results.map((r) => r.user_id))]
      const { data: profiles } = ownerIds.length
        ? await supabase.from('user_profiles')
            .select('user_id, display_name, profile_picture')
            .in('user_id', ownerIds)
        : { data: [] }

      const merged = results.map((l) => ({
        ...l,
        owner: profiles?.find((p) => p.user_id === l.user_id) || null
      }))

      setListings(merged)
      setLoading(false)
    })()
  }, [])

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Latest Listings</h1>

        {listings.length === 0 ? (
          <p className="text-gray-600">No listings yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((l) => {
              const firstImg = (l.images && l.images.length > 0) ? l.images[0] : null
              const imgUrl = firstImg
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${firstImg}`
                : null
              return (
                <div key={l.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                  {/* Image click -> details */}
                  <Link href={`/post?id=${l.id}`}>
                    {imgUrl ? (
                      <img src={imgUrl} alt={l.title} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-500">No image</div>
                    )}
                  </Link>

                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{l.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{l.description}</p>

                    {/* Owner row (avatar + name -> profile) */}
                    <div className="flex items-center mt-3">
                      <Link href={`/profile/${l.user_id}`} className="flex items-center space-x-2 group">
                        {l.owner?.profile_picture ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${l.owner.profile_picture}`}
                            className="w-8 h-8 rounded-full object-cover"
                            alt="Avatar"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-semibold">{l.owner?.display_name?.[0]?.toUpperCase() || '?'}</span>
                          </div>
                        )}
                        <span className="text-sm text-gray-900 group-hover:underline">{l.owner?.display_name || 'User'}</span>
                      </Link>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      {/* View details */}
                      <Link href={`/post?id=${l.id}`} className="px-3 py-1 rounded bg-gray-100 text-gray-800 text-sm hover:bg-gray-200">
                        View Details
                      </Link>

                      {/* WhatsApp */}
                      <a
                        href={phoneToWhatsLink(l.phone, l.title)}
                        target="_blank" rel="noopener noreferrer"
                        className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
                      >
                        WhatsApp
                      </a>

                      {/* Send Message -> exact property conversation */}
                      <Link
                        href={`/messages?peer=${l.user_id}&listing=${l.id}`}
                        className="ml-auto px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                      >
                        Send Message
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export async function getServerSideProps({ locale }) {
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } }
}
