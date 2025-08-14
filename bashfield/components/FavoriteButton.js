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
    }
  }, [user, listingId])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const checkFavoriteStatus = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .single()
    
    setIsFavorited(!!data)
  }

  const toggleFavorite = async (e) => {
    e.stopPropagation()
    if (!user) return

    setLoading(true)
    
    if (isFavorited) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
      setIsFavorited(false)
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: user.id, listing_id: listingId })
      setIsFavorited(true)
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