import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function FavoriteButton({ listingId, className = "" }) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    getUser()
    
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (user && listingId && mountedRef.current) {
      checkFavoriteStatus()
    }
  }, [user, listingId])

  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (mountedRef.current) {
        setUser(user)
      }
    } catch (error) {
      console.error('Error getting user:', error)
    }
  }

  const checkFavoriteStatus = async () => {
    if (!user || !listingId || !mountedRef.current) return
    
    try {
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
      
      if (mountedRef.current) {
        setIsFavorited(!!data)
      }
    } catch (error) {
      console.error('Error in checkFavoriteStatus:', error)
      if (mountedRef.current) {
        setIsFavorited(false)
      }
    }
  }

  const toggleFavorite = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      alert('Please sign in to save favorites')
      return
    }

    if (loading || !mountedRef.current) return

    setLoading(true)
    setIsAnimating(true)
    
    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId)
        
        if (error) throw error
        
        if (mountedRef.current) {
          setIsFavorited(false)
          window.dispatchEvent(new CustomEvent('favoriteUpdated', { 
            detail: { listingId, action: 'removed' } 
          }))
        }
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, listing_id: listingId })
        
        if (error) throw error
        
        if (mountedRef.current) {
          setIsFavorited(true)
          window.dispatchEvent(new CustomEvent('favoriteUpdated', { 
            detail: { listingId, action: 'added' } 
          }))
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      if (mountedRef.current) {
        alert('Error updating favorites. Please try again.')
      }
    }
    
    if (mountedRef.current) {
      setLoading(false)
      setTimeout(() => {
        if (mountedRef.current) {
          setIsAnimating(false)
        }
      }, 300)
    }
  }

  if (!user) return null

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`p-2 rounded-full transition-all duration-300 transform ${
        isFavorited 
          ? 'bg-red-100 text-red-600 hover:bg-red-200 scale-100' 
          : 'bg-white/80 text-gray-400 hover:bg-gray-100 hover:text-red-500 scale-100'
      } ${isAnimating ? 'animate-pulse scale-110' : ''} ${className} shadow-lg backdrop-blur-sm`}
      style={{ minWidth: '40px', minHeight: '40px' }}
    >
      <span className={`text-xl transition-transform duration-200 ${
        isAnimating ? 'scale-125' : 'scale-100'
      }`}>
        {loading ? '⏳' : isFavorited ? '❤️' : '🤍'}
      </span>
    </button>
  )
}