// Simple test to verify the favorites functionality
const { supabase } = require('./lib/supabase')

async function testFavorites() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('listings')
      .select('id, title')
      .limit(1)
    
    if (error) {
      console.error('Connection error:', error)
      return
    }
    
    console.log('✅ Supabase connection successful')
    console.log('Sample listing:', data?.[0])
    
    // Test the new query structure
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'approved')
      .eq('is_active', true)
      .limit(1)

    if (listingsError) {
      console.error('Listings query error:', listingsError)
      return
    }

    // Test user profiles query
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, profile_picture')
      .limit(1)

    if (profilesError) {
      console.error('Profiles query error:', profilesError)
      return
    }

    console.log('✅ Separate queries work correctly')
    console.log('Listings sample:', listingsData?.[0])
    console.log('Profiles sample:', profilesData?.[0])
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testFavorites()