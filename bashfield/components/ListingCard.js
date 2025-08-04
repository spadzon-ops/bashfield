import { useTranslation } from 'next-i18next'

export default function ListingCard({ listing, showActions = false, onApprove, onReject, onDelete }) {
  const { t } = useTranslation('common')

  return (
    <div className="card overflow-hidden group hover:scale-105 transition-transform duration-300">
      {listing.images && listing.images.length > 0 ? (
        <div className="h-56 bg-gray-100 relative overflow-hidden">
          <img 
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${listing.images[0]}`}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              listing.status === 'approved' ? 'bg-green-100 text-green-800' :
              listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-56 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <span className="text-6xl">🏠</span>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{listing.title}</h3>
          <div className="flex items-center space-x-1 text-yellow-500">
            <span>⭐</span>
            <span className="text-sm font-medium text-gray-600">4.8</span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{listing.description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-gray-500">
              <span>🛏️</span>
              <span className="text-sm">{listing.rooms} {t('listing.rooms')}</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-500">
              <span>📍</span>
              <span className="text-sm">{t(`cities.${listing.city}`)}</span>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-2xl font-bold text-blue-600">
                {listing.currency === 'USD' ? '$' : ''}{listing.price.toLocaleString()}
              </span>
              <span className="text-gray-500 text-sm ml-1">
                {listing.currency === 'USD' ? 'USD' : 'IQD'}/month
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-semibold">{listing.user_email[0].toUpperCase()}</span>
              </div>
              <span className="text-xs text-gray-500">{listing.user_email.split('@')[0]}</span>
            </div>
          </div>
          
          {/* Contact Buttons */}
          {!showActions && (
            <div className="flex space-x-2">
              {listing.phone && (
                <a
                  href={`https://wa.me/${listing.phone.replace(/[^0-9]/g, '')}?text=Hi! I'm interested in your property: ${listing.title}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </a>
              )}
              <button
                onClick={() => window.open(`/chat/${listing.id}`, '_blank')}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
              >
                <span>💬</span>
                <span>Chat</span>
              </button>
            </div>
          )}
        </div>
        
        {showActions && (
          <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
            {listing.status === 'pending' && (
              <>
                <button
                  onClick={() => onApprove(listing.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  ✓ {t('admin.approve')}
                </button>
                <button
                  onClick={() => onReject(listing.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  ✗ {t('admin.reject')}
                </button>
              </>
            )}
            <button
              onClick={() => onDelete(listing.id)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              🗑️ {t('admin.delete')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
