// Test database connection and table existence
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('Testing database connection...')
  
  try {
    // Test listings table
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('count')
      .limit(1)
    
    if (listingsError) {
      console.error('Listings table error:', listingsError)
    } else {
      console.log('✅ Listings table exists')
    }
    
    // Test user_profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ User profiles table error:', profilesError)
      console.log('Please run the SQL setup script in Supabase dashboard')
    } else {
      console.log('✅ User profiles table exists')
    }
    
  } catch (error) {
    console.error('Database test failed:', error)
  }
}

testDatabase()