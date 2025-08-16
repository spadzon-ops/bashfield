import { createClient } from '@supabase/supabase-js'

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Get user's listings to delete their images
    const { data: listings } = await supabaseAdmin
      .from('listings')
      .select('images')
      .eq('user_id', userId)

    // Get user's profile picture
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('profile_picture')
      .eq('user_id', userId)
      .single()

    // Delete all listing images from storage
    if (listings && listings.length > 0) {
      const allImages = listings.flatMap(listing => listing.images || [])
      if (allImages.length > 0) {
        await supabaseAdmin.storage.from('house-images').remove(allImages)
      }
    }

    // Delete profile picture from storage
    if (profile?.profile_picture) {
      await supabaseAdmin.storage.from('house-images').remove([profile.profile_picture])
    }

    // Delete user account (this will cascade delete all related data due to foreign key constraints)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      throw error
    }

    res.status(200).json({ success: true })

  } catch (error) {
    console.error('Error deleting account:', error)
    res.status(500).json({ error: error.message })
  }
}