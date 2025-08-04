import { useTranslation } from 'next-i18next'

export default function ListingCard({ listing }) {
  const { t } = useTranslation('common')

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      {listing.images && listing.images.length > 0 && (
        <div className="h-48 bg-gray-700 relative">
          <img 
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${listing.images[0]}`}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2">{listing.title}</h3>
        <p className="text-gray-300 text-sm mb-3 line-clamp-2">{listing.description}</p>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-blue-400 font-bold">
            {listing.price.toLocaleString()} {t('listing.price')}
          </span>
          <span className="text-gray-400 text-sm">
            {listing.rooms} {t('listing.rooms')}
          </span>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>{t(`cities.${listing.city}`)}</span>
          <span>{t('listing.postedBy')} {listing.user_email}</span>
        </div>
      </div>
    </div>
  )
}