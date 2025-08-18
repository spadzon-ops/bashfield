import { supabase } from './supabase'

// Save language preference to database and localStorage
export const saveLanguagePreference = async (language, userId = null) => {
  try {
    // Always save to localStorage for immediate persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', language)
    }
    
    // If user is logged in, save to database via API
    if (userId) {
      const response = await fetch('/api/update-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language, userId }),
      })
      
      if (!response.ok) {
        console.error('Failed to save language to database')
      }
    }
  } catch (error) {
    console.error('Error saving language preference:', error)
  }
}

// Get language preference from database or localStorage
export const getLanguagePreference = async (userId = null) => {
  try {
    // If user is logged in, get from database first
    if (userId) {
      const { data } = await supabase
        .from('user_profiles')
        .select('preferred_language')
        .eq('user_id', userId)
        .single()
      
      if (data?.preferred_language) {
        // Sync with localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('preferred-language', data.preferred_language)
        }
        return data.preferred_language
      }
    }
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferred-language')
      if (saved && ['en', 'ku', 'ar'].includes(saved)) {
        return saved
      }
    }
    
    return 'en' // Default fallback
  } catch (error) {
    console.error('Error getting language preference:', error)
    return 'en'
  }
}