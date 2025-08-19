import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Cache for favorite status
const favoriteCache = new Map()
let allUserFavorites = new Set()

export default function FavoriteButton({ listingId, className = "" }) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    getUser()
  }, [])

  useEffect(() => {
    if (user && listingId) {
      // Check cache first for instant loading
      const cacheKey = `${user.id}-${listingId}`
      if (favoriteCache.has(cacheKey)) {
        setIsFavorited(favoriteCache.get(cacheKey))
      } else if (allUserFavorites.has(listingId)) {
        setIsFavorited(true)
        favoriteCache.set(cacheKey, true)
      }
      
      checkFavoriteStatus()
      
      // Listen for realtime changes
      const channel = supabase
        .channel(`favorites-${listingId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'favorites',
            filter: `user_id=eq.${user.id}`
          }, 
          () => {
            checkFavoriteStatus()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, listingId])

  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Preload all user favorites for faster loading
      if (user) {
        loadAllUserFavorites(user.id)
      }
    } catch (error) {
      console.error('Error getting user:', error)
    }
  }
  
  const loadAllUserFavorites = async (userId) => {
    try {
      const { data } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', userId)
      
      if (data) {
        allUserFavorites = new Set(data.map(f => f.listing_id))
      }
    } catch (error) {
      console.error('Error loading user favorites:', error)
    }
  }

  const checkFavoriteStatus = async () => {
    if (!user || !listingId) return
    
    try {
      const cacheKey = `${user.id}-${listingId}`
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
        .maybeSingle()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking favorite status:', error)
        return
      }
      
      const isFav = !!data
      setIsFavorited(isFav)
      favoriteCache.set(cacheKey, isFav)
      
      if (isFav) {
        allUserFavorites.add(listingId)
      } else {
        allUserFavorites.delete(listingId)
      }
    } catch (error) {
      console.error('Error in checkFavoriteStatus:', error)
    }
  }

  const toggleFavorite = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      alert('Please sign in to save favorites')
      return
    }

    if (loading) return
    setLoading(true)
    
    try {
      const cacheKey = `${user.id}-${listingId}`
      
      if (isFavorited) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId)
        
        setIsFavorited(false)
        favoriteCache.set(cacheKey, false)
        allUserFavorites.delete(listingId)
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, listing_id: listingId })
        
        setIsFavorited(true)
        favoriteCache.set(cacheKey, true)
        allUserFavorites.add(listingId)
      }
      
      window.dispatchEvent(new CustomEvent('favoriteUpdated'))
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
    
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="p-2 rounded-full bg-gray-100 text-gray-400 shadow-lg backdrop-blur-sm" style={{ minWidth: '40px', minHeight: '40px' }}>
        <span className="text-xl">🤍</span>
      </div>
    )
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`p-2 rounded-full transition-all duration-200 ${
        isFavorited 
          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
          : 'bg-white/80 text-gray-400 hover:bg-gray-100 hover:text-red-500'
      } ${className} shadow-lg backdrop-blur-sm`}
    >
      <span className="text-xl">
        {loading ? '⏳' : isFavorited ? '❤️' : '🤍'}
      </span>
    </button>
  )
}
