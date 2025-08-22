import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import ListingCard from '../components/ListingCard'
import LoadingScreen from '../components/LoadingScreen'
import { useTranslation } from '../contexts/TranslationContext'

export default function Favorites() {
  const router = useRouter()
  const { t } = useTranslation()
  const [user, setUser] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [displayedFavorites, setDisplayedFavorites] = useState(12)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreFavorites, setHasMoreFavorites] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMoreFavorites) return
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      if (scrollTop + windowHeight >= documentHeight - 100) {
        if (favorites.length > displayedFavorites) {
          setLoadingMore(true)
          setTimeout(() => {
            setDisplayedFavorites(prev => {
              const newCount = prev + 12
              setHasMoreFavorites(favorites.length > newCount)
              return newCount
            })
            setLoadingMore(false)
          }, 300)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadingMore, hasMoreFavorites, favorites, displayedFavorites])

  useEffect(() => {
    if (user) {
      const handleFavoriteUpdate = () => {
        fetchFavorites(user)
      }
      
      window.addEventListener('favoriteUpdated', handleFavoriteUpdate)
      
      return () => {
        window.removeEventListener('favoriteUpdated', handleFavoriteUpdate)
      }
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
    if (!user) return
    
    try {
      console.log('Fetching favorites for user:', user.id)
      
      const { data: favoriteIds, error: favError } = await supabase
        .from('favorites')
        .select('listing_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      console.log('Favorite IDs result:', { favoriteIds, favError })

      if (favError) {
        console.error('Error fetching favorite IDs:', favError)
        setFavorites([])
        return
      }
      
      if (!favoriteIds || favoriteIds.length === 0) {
        console.log('No favorites found')
        setFavorites([])
        return
      }

      const listingIds = favoriteIds.map(fav => fav.listing_id)
      console.log('Looking for listings:', listingIds)

      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .in('id', listingIds)
        .eq('status', 'approved')
        .neq('is_active', false)

      console.log('Listings result:', { listingsData, listingsError })

      if (listingsError) {
        console.error('Error fetching listings:', listingsError)
        setFavorites([])
        return
      }

      if (!listingsData || listingsData.length === 0) {
        console.log('No approved listings found for favorites')
        setFavorites([])
        return
      }

      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_picture')

      // Create a map of listing_id to favorite creation time for sorting
      const favoriteTimeMap = favoriteIds.reduce((acc, fav) => {
        acc[fav.listing_id] = new Date(fav.created_at).getTime()
        return acc
      }, {})
      
      const listingsWithProfiles = listingsData
        .map(listing => {
          const profile = (profilesData || []).find(p => p.user_id === listing.user_id)
          return {
            ...listing,
            user_profiles: profile || null,
            favoriteTime: favoriteTimeMap[listing.id] || 0
          }
        })
        .sort((a, b) => b.favoriteTime - a.favoriteTime) // Sort by newest favorite first

      console.log('Final favorites:', listingsWithProfiles)
      setFavorites(listingsWithProfiles)
      setDisplayedFavorites(12)
      setHasMoreFavorites(listingsWithProfiles.length > 12)
    } catch (error) {
      console.error('Error in fetchFavorites:', error)
      setFavorites([])
    }
  }

  if (loading) {
    return <LoadingScreen message={t('loadingFavorites')} />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('loginRequired')}</h2>
          <p className="text-gray-600 mb-6">{t('pleaseSignInFavorites')}</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {t('goToHomepage')}
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
            {t('yourFavorites')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('propertiesSaved')}
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-5xl">💔</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('noFavoritesYet')}</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {t('startExploring')}
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {t('browseProperties')}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <p className="text-gray-600">
                {t('youHaveFavorite')} <span className="font-semibold text-blue-600">{favorites.length}</span> {favorites.length === 1 ? t('favoriteProperty') : t('favoriteProperties')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {favorites.slice(0, displayedFavorites).map(listing => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing}
                  showActions={false}
                />
              ))}
            </div>
            
            {hasMoreFavorites && (
              <div className="text-center mt-8">
                {loadingMore ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600">{t('loadingMoreFavorites')}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setLoadingMore(true)
                      setTimeout(() => {
                        setDisplayedFavorites(prev => {
                          const newCount = prev + 12
                          setHasMoreFavorites(favorites.length > newCount)
                          return newCount
                        })
                        setLoadingMore(false)
                      }, 300)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                  >
                    {t('loadMoreFavorites')}
                  </button>
                )}
              </div>
            )}
            
            {!hasMoreFavorites && favorites.length > 12 && (
              <div className="text-center mt-8 text-gray-500">
                {t('reachedEndFavorites')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


