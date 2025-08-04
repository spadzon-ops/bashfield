import { useEffect } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

export default function PostSuccess() {
  const { t } = useTranslation('common')
  const router = useRouter()

  useEffect(() => {
    // Auto redirect after 10 seconds
    const timer = setTimeout(() => {
      router.push('/')
    }, 10000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card p-8 text-center">
          {/* Success Animation */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <span className="text-4xl">🎉</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Listing Submitted Successfully!
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Thank you for posting your property! Your listing has been submitted and is now under review by our team. 
            You'll receive an email notification once it's approved and goes live.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Our team reviews your listing (usually within 24 hours)</li>
              <li>• You'll get an email when it's approved</li>
              <li>• Your property will appear on the main page</li>
              <li>• Interested renters can contact you directly</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/profile')}
              className="w-full btn-primary"
            >
              📊 View My Listings
            </button>
            
            <button 
              onClick={() => router.push('/post')}
              className="w-full btn-secondary"
            >
              🏠 Post Another Property
            </button>
            
            <button 
              onClick={() => router.push('/')}
              className="w-full text-gray-600 hover:text-gray-800 py-2 transition-colors"
            >
              🏡 Back to Homepage
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            Redirecting to homepage in 10 seconds...
          </p>
        </div>
      </div>
    </div>
  )
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}