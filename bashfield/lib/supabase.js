import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Single client used across the app
export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

// Keep this – other pages depend on it
export const CITIES = [
  'erbil', 'baghdad', 'basra', 'mosul', 'sulaymaniyah',
  'najaf', 'karbala', 'kirkuk', 'duhok', 'halabja',
  'samawah', 'diwaniyah', 'kut', 'nasiriyah', 'ramadi',
  'baqubah', 'amarah', 'tuz', 'tikrit'
]
