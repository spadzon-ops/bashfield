import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import ListingCard from '../components/ListingCard'

export default function Favorites() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
      await fetchFavorites(user)
    }
    getUser()
  }, [])

  const fetchFavorites = async (currentUser) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          listing_id,
          listings (
            *,
            user_profiles (
              user_id,
              display_name,
              profile_picture
            )
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const favoritesWithListings = data
        .filter(fav => fav.listings)
        .map(fav => ({
          ...fav.listings,
          user_profiles: fav.listings.user_profiles
        }))

      setFavorites(favoritesWithListings)
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
    setLoading(false)
  }

  const removeFavorite = async (listingId) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId)

      if (error) throw error
      
      setFavorites(prev => prev.filter(listing => listing.id !== listingId))
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your favorites...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-white">❤️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Favorites</h1>
          <p className="text-gray-600">Properties you've saved for later</p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">💔</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No favorites yet</h3>
            <p className="text-gray-600 mb-6">Start exploring properties and save the ones you love!</p>
            <button 
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Browse Properties
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <p className="text-gray-600">
                You have <span className="font-semibold text-blue-600">{favorites.length}</span> saved properties
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map(listing => (
                <div key={listing.id} className="relative">
                  <ListingCard listing={listing} />
                  <button
                    onClick={() => removeFavorite(listing.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-10"
                    title="Remove from favorites"
                  >
                    <span className="text-sm">✕</span>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}