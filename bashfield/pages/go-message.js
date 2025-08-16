// bashfield/pages/go-message.js
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import useSimpleTranslation from '../hooks/useSimpleTranslation'

export default function GoMessage() {
  const router = useRouter()
  const { t } = useSimpleTranslation()

  useEffect(() => {
    // If you later add a helper to ensure a conversation,
    // you can do it here before navigating.
    router.replace('/messages')
  }, [router])

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="text-lg">{t('Loading...')}</div>
    </div>
  )
}
