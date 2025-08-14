import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'

// Singleton pattern to ensure only one client instance
let supabaseInstance = null

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createPagesBrowserClient()
  }
  return supabaseInstance
}

// Single client used across the app
export const supabase = getSupabaseClient()

// Keep this – other pages depend on it
export const CITIES = [
  'erbil', 'baghdad', 'basra', 'mosul', 'sulaymaniyah',
  'najaf', 'karbala', 'kirkuk', 'duhok', 'halabja',
  'samawah', 'diwaniyah', 'kut', 'nasiriyah', 'ramadi',
  'baqubah', 'amarah', 'tuz', 'tikrit'
]
