import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../../lib/supabase'

export default function UserProfilePage() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { userId } = router.query

  const [me, setMe] = useState(null)
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [{ data: { user } }, { data: prof }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('user_profiles')
        .select('user_id, display_name, email, profile_picture, created_at')
        .eq('user_id', userId)
        .maybeSingle()
    ])
    setMe(user || null)
    setProfile(prof || null)

    let adminFlag = false
    if (user?.email) {
      const { data: rows } = await supabase.from('admin_emails').select('email').eq('email', user.email)
      adminFlag = (rows?.length || 0) > 0
    }
    setIsAdmin(adminFlag)

    // show all owner listings to owner or admin; otherwise only approved
    if (user && (user.id === userId || adminFlag)) {
      const { data: own } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setListings(own || [])
    } else {
      const { data: approved } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
      setListings(approved || [])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!router.isReady || !userId) return
    load()
  }, [router.isReady, userId, load])

  const phoneToWhatsLink = (phone, title) => {
    if (!phone) return '#'
    const digits = String(phone).replace(/[^\d+]/g, '')
    const text = encodeURIComponent(`Hi, I'm interested in: ${title}`)
    return `https://wa.me/${digits}?text=${text}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile…</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold">Profile not found</p>
          <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">Go home</Link>
        </div>
      </div>
    )
  }

  const avatarUrl = profile.profile_picture
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${profile.profile_picture}`
    : null

  const showEmail = isAdmin || (me?.id === profile.user_id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-20 h-20 rounded-full object-cover" alt="Avatar" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl text-blue-600 font-semibold">
                  {profile.display_name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
              {showEmail ? (
                <p className="text-gray-600">{profile.email}</p>
              ) : (
                <p className="text-gray-500 text-sm">Email hidden</p>
              )}
              <p className="text-gray-500 text-sm">
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="ml-auto">
              {me?.id !== profile.user_id && (
                <Link
                  href={`/messages?peer=${profile.user_id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Message
                </Link>
              )}
            </div>
          </div>

          <hr className="my-6" />

          <h2 className="text-lg font-semibold mb-4">Listings</h2>
          {listings.length === 0 ? (
            <p className="text-gray-600">No listings yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((l) => {
                const firstImg = (l.images && l.images.length > 0) ? l.images[0] : null
                const imgUrl = firstImg
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${firstImg}`
                  : null
                return (
                  <div key={l.id} className="border rounded-lg overflow-hidden">
                    {/* Clickable image -> details */}
                    <Link href={`/post?id=${l.id}`}>
                      {imgUrl ? (
                        <img src={imgUrl} alt={l.title} className="w-full h-40 object-cover" />
                      ) : (
                        <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-500">No image</div>
                      )}
                    </Link>

                    <div className="p-4">
                      <h3 className="font-semibold">{l.title}</h3>
                      <p className="text-sm text-gray-600 truncate">{l.description}</p>

                      <div className="flex items-center gap-2 mt-3">
                        <Link href={`/post?id=${l.id}`} className="text-blue-600 hover:underline">
                          View Details
                        </Link>

                        <a
                          href={phoneToWhatsLink(l.phone, l.title)}
                          target="_blank" rel="noopener noreferrer"
                          className="text-green-700 border border-green-700 px-2 py-1 rounded text-xs"
                        >
                          WhatsApp
                        </a>

                        <Link
                          href={`/messages?peer=${l.user_id}&listing=${l.id}`}
                          className="text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
                        >
                          Send Message
                        </Link>

                        {/* Admin quick actions (optional) */}
                        {/* You can keep your previous admin controls here if needed */}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ locale }) {
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } }
}
