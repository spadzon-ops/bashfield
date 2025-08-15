import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function FavoriteButton({ listingId, className = "" }) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    getUser()
  }, [])

  useEffect(() => {
    if (user && listingId) {
      checkFavoriteStatus()
      
      // Listen for favorite changes
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
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const checkFavoriteStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
        .maybeSingle()
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking favorite status:', error)
      }
      
      setIsFavorited(!!data)
    } catch (error) {
      console.error('Error in checkFavoriteStatus:', error)
      setIsFavorited(false)
    }
  }

  const toggleFavorite = async (e) => {
    e.stopPropagation()
    if (!user) {
      alert('Please sign in to save favorites')
      return
    }

    setLoading(true)
    
    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId)
        
        if (error) throw error
        setIsFavorited(false)
        window.dispatchEvent(new CustomEvent('favoriteUpdated'))
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, listing_id: listingId })
        
        if (error) throw error
        setIsFavorited(true)
        window.dispatchEvent(new CustomEvent('favoriteUpdated'))
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert('Error updating favorites. Please try again.')
    }
    
    setLoading(false)
  }

  if (!user) return null

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`p-2 rounded-full transition-all duration-200 ${
        isFavorited 
          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-500'
      } ${className}`}
    >
      <span className="text-xl">
        {loading ? '⏳' : isFavorited ? '❤️' : '🤍'}
      </span>
    </button>
  )
}