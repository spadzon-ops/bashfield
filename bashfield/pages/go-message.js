import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { ensureConversationAndGo } from '../lib/chat'
import { supabase } from '../lib/supabase'

export default function GoMessage() {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    ;(async () => {
      const peer = router.query.peer
      const listing = router.query.listing || null

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      if (!peer) { router.replace('/messages'); return }
      await ensureConversationAndGo({ router, otherId: String(peer), listingId: listing ? String(listing) : null })
    })()
  }, [router.isReady])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-top-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Opening chat…</p>
      </div>
    </div>
  )
}

export async function getServerSideProps({ locale }) {
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } }
}
