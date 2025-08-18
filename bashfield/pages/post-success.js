import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from '../contexts/TranslationContext'

export default function PostSuccess() {
  const router = useRouter()
  const { t } = useTranslation()

  // Removed auto-redirect

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card p-8 text-center">
          {/* Success Animation */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <span className="text-4xl">🎉</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎉 {t('listingSubmittedSuccessfully')}
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            {t('thankYouPosting')}
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">{t('whatHappensNext')}</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• {t('teamReviews')}</li>
              <li>• {t('emailWhenApproved')}</li>
              <li>• {t('propertyWillAppear')}</li>
              <li>• {t('interestedRenters')}</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/profile?tab=listings')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              📊 {t('viewMyListings')}
            </button>
            
            <button 
              onClick={() => router.push('/post')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              🏠 {t('postAnotherProperty')}
            </button>
            
            <button 
              onClick={() => router.push('/')}
              className="w-full text-gray-600 hover:text-gray-800 py-2 transition-colors"
            >
              🏡 {t('backToHomepage')}
            </button>
          </div>
          

        </div>
      </div>
    </div>
  )
}

