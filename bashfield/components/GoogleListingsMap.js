// bashfield/bashfield/pages/index.js
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'
import dynamic from 'next/dynamic'

const GoogleListingsMap = dynamic(() => import('../components/GoogleListingsMap'), { ssr: false })

export default function Home() {
  const { t } = useTranslation('common')
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      // PUBLIC: only approved + active (owner also will not see inactive here)
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      setListings(data || [])
      setLoading(false)
    })()
  }, [])

  const markers = useMemo(() => {
    return (listings || []).filter(l => l.latitude && l.longitude).map(l => ({
      id: l.id, lat: Number(l.latitude), lng: Number(l.longitude), title: l.title
    }))
  }, [listings])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading…</div>
      </div>
    )
  }

  return (
    <>
      <Head><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Map View (Google Maps) */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Map View</h2>
            <GoogleListingsMap markers={markers} className="w-full h-96 rounded-xl overflow-hidden border border-gray-200" />
          </section>

          {/* Listings grid */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Latest Listings</h2>
            {listings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-600">No listings yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map(l => {
                  const img = l.images?.[0]
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${l.images[0]}`
                    : null
                  return (
                    <div key={l.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                      <div className="h-40 bg-gray-100">
                        {img ? <img src={img} alt={l.title} className="w-full h-full object-cover" /> : (
                          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">🏠</div>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900 pr-2">{l.title}</h3>
                          <div className="text-blue-600 text-sm font-mono">#{l.reference_code}</div>
                        </div>
                        <PostedBy userId={l.user_id} />
                        <div className="text-sm text-gray-600">City: {l.city}</div>
                        <div className="text-sm text-gray-600">Price: {Number(l.price || 0).toLocaleString()} {l.currency}</div>
                        <div className="pt-2 flex gap-2">
                          <Link href={`/listing/${l.id}`} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">
                            View details
                          </Link>
                          <Link href={`/messages?peer=${l.user_id}&listing=${l.id}`} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm">
                            Message
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

function PostedBy({ userId }) {
  const [p, setP] = useState(null)
  useEffect(() => {
    ;(async () => {
      if (!userId) return
      const { data } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_picture')
        .eq('user_id', userId)
        .maybeSingle()
      setP(data || null)
    })()
  }, [userId])
  const avatar = p?.profile_picture
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${p.profile_picture}`
    : null
  return (
    <Link href={p ? `/profile/${p.user_id}` : '#'} className="flex items-center gap-2 group w-fit">
      {avatar ? (
        <img src={avatar} className="w-7 h-7 rounded-full object-cover" alt="Posted by" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
          {(p?.display_name?.[0] || '?').toUpperCase()}
        </div>
      )}
      <span className="text-sm text-gray-700 group-hover:underline">{p?.display_name || 'Unknown User'}</span>
    </Link>
  )
}

export async function getServerSideProps({ locale }) {
  return { props: { ...(await serverSideTranslations(locale ?? 'en', ['common'])) } }
}
