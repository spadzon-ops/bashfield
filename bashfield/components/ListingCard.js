import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function ListingCard({ listing, showActions = false, onApprove, onReject, onDelete }) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [profileData, setProfileData] = useState(listing.user_profiles)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (event.detail.profile.user_id === listing.user_id) {
        setProfileData(event.detail.profile)
      }
    }
    
    window.addEventListener('profileUpdated', handleProfileUpdate)
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate)
  }, [listing.user_id])

  const nextImage = (e) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => 
      prev === listing.images.length - 1 ? 0 : prev + 1
    )
  }

  const prevImage = (e) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => 
      prev === 0 ? listing.images.length - 1 : prev - 1
    )
  }

  const openListing = () => {
    router.push(`/listing/${listing.id}`)
  }

  const openWhatsApp = (e) => {
    e.stopPropagation()
    const message = `Hi! I'm interested in your property: ${listing.title}`
    const whatsappUrl = `https://wa.me/${listing.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {
    e.stopPropagation()
    if (!touchStartX.current || !touchEndX.current) return
    
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && listing.images.length > 1) {
      nextImage(e)
    }
    if (isRightSwipe && listing.images.length > 1) {
      prevImage(e)
    }
  }

  const startConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('Please sign in to send messages')
      return
    }
    
    if (user.id === listing.user_id) {
      alert('You cannot message yourself')
      return
    }

    try {
      // Check if conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .or(`and(participant1.eq.${user.id},participant2.eq.${listing.user_id}),and(participant1.eq.${listing.user_id},participant2.eq.${user.id})`)
        .single()

      if (existingConv) {
        router.push(`/messages?conversation=${existingConv.id}`)
        return
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          listing_id: listing.id,
          participant1: user.id,
          participant2: listing.user_id
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/messages?conversation=${data.id}`)
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Error starting conversation. Please try again.')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div 
        className="cursor-pointer"
        onClick={openListing}
      >
      {/* Image Carousel */}
      <div 
        className="relative h-48 sm:h-56 bg-gray-100 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {listing.images && listing.images.length > 0 ? (
          <>
            <img 
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${listing.images[currentImageIndex]}`}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Navigation Arrows */}
            {listing.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                >
                  ←
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                >
                  →
                </button>
              </>
            )}

            {/* Image Dots */}
            {listing.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {listing.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentImageIndex(index)
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex 
                        ? 'bg-white' 
                        : 'bg-white bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Status Badge */}
            {showActions && (
              <div className="absolute top-3 left-3">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  listing.status === 'approved' ? 'bg-green-100 text-green-800' :
                  listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <span className="text-4xl">🏠</span>
          </div>
        )}
      </div>
      </div>
      
      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* Title and Price */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1 mr-2">
            {listing.title}
          </h3>
          <div className="text-right flex-shrink-0">
            <div className="text-lg sm:text-xl font-bold text-blue-600">
              {listing.price.toLocaleString()} {listing.currency}
            </div>
            <div className="text-xs text-gray-500">per month</div>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {listing.description}
        </p>
        
        {/* Property Details */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-gray-500">
              <span>🛏️</span>
              <span className="text-sm">{listing.rooms} {listing.rooms === 1 ? 'Room' : 'Rooms'}</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-500">
              <span>📍</span>
              <span className="text-sm">{listing.city.charAt(0).toUpperCase() + listing.city.slice(1)}</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="pt-4 border-t border-gray-100">
          {/* Owner Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {profileData?.profile_picture ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${profileData.profile_picture}`}
                  alt="Owner"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">
                    {(profileData?.display_name || listing.user_email)?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-600">
                {profileData?.display_name || listing.user_email?.split('@')[0]}
              </span>
            </div>
            
            {/* Image Counter */}
            {listing.images && listing.images.length > 1 && (
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {listing.images.length} photos
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          {!showActions && (
            <div className="space-y-2">
              <div className="flex space-x-2">
                {listing.phone && (
                  <button
                    onClick={openWhatsApp}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openListing()
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                >
                  <span>👁️</span>
                  <span>View Details</span>
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  startConversation()
                }}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
              >
                <span>✉️</span>
                <span>Send Message</span>
              </button>
            </div>
          )}
          
          {/* Admin Actions */}
          {showActions && (
            <div className="flex space-x-2">
              {listing.status === 'pending' && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onApprove(listing.id)
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onReject(listing.id)
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    ✗ Reject
                  </button>
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(listing.id)
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
