import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { language, userId } = req.body

    if (!language || !['en', 'ku', 'ar'].includes(language)) {
      return res.status(400).json({ error: 'Invalid language' })
    }

    if (userId) {
      const { error } = await supabase
        .from('user_profiles')
        .upsert(
          { user_id: userId, preferred_language: language },
          { onConflict: 'user_id' }
        )

      if (error) {
        console.error('Database error:', error)
        return res.status(500).json({ error: 'Failed to save language preference' })
      }
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}