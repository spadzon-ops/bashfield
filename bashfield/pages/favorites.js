import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'
import ListingCard from '../components/ListingCard'
import LoadingScreen from '../components/LoadingScreen'

export default function Favorites() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    
    // Listen for favorite changes
    const handleFavoriteUpdate = () => {
      if (user) {
        fetchFavorites(user)
      }
    }
    
    window.addEventListener('favoriteUpdated', handleFavoriteUpdate)
    
    return () => {
      window.removeEventListener('favoriteUpdated', handleFavoriteUpdate)
    }
  }, [user])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/')
        return
      }

      setUser(user)
      await fetchFavorites(user)
    } catch (error) {
      console.error('Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFavorites = async (user) => {
    try {
      // First get favorite listing IDs
      const { data: favoriteIds, error: favError } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (favError) {
        console.error('Error fetching favorite IDs:', favError)
        return
      }

      console.log('Favorite IDs found:', favoriteIds)
      
      if (!favoriteIds || favoriteIds.length === 0) {
        console.log('No favorites found for user')
        setFavorites([])
        return
      }

      const listingIds = favoriteIds.map(fav => fav.listing_id)

      // Then get the actual listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select(`
          *,
          user_profiles (
            user_id,
            display_name,
            profile_picture
          )
        `)
        .in('id', listingIds)
        .eq('status', 'approved')
        .eq('is_active', true)

      if (listingsError) {
        console.error('Error fetching listings:', listingsError)
        return
      }

      console.log('Final favorites data:', listingsData)
      setFavorites(listingsData || [])
    } catch (error) {
      console.error('Error in fetchFavorites:', error)
      setFavorites([])
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading your favorites..." />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your favorites</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Your Favorites
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Properties you've saved for later viewing
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-5xl">💔</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No favorites yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start exploring properties and save your favorites by clicking the heart icon on any listing.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Browse Properties
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <p className="text-gray-600">
                You have <span className="font-semibold text-blue-600">{favorites.length}</span> favorite {favorites.length === 1 ? 'property' : 'properties'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {favorites.map(listing => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing}
                  showActions={false}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}
