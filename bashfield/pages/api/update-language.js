export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { language } = req.body

    if (!language || !['en', 'ku', 'ar'].includes(language)) {
      return res.status(400).json({ error: 'Invalid language' })
    }

    // For now, just return success - database will be updated later
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}