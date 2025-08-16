import { supabase } from '../../lib/supabase'

async function translateText(text, targetLang) {
  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
  )
  const data = await response.json()
  return data[0]?.map(item => item[0]).join('') || text
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { listingId, title, description } = req.body

  if (!listingId || !title || !description) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const [titleKu, titleAr, descKu, descAr] = await Promise.all([
      translateText(title, 'ku'),
      translateText(title, 'ar'), 
      translateText(description, 'ku'),
      translateText(description, 'ar')
    ])

    const { error } = await supabase
      .from('listings')
      .update({
        title_ku: titleKu,
        title_ar: titleAr,
        description_ku: descKu,
        description_ar: descAr
      })
      .eq('id', listingId)

    if (error) throw error

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Auto-translation failed:', error)
    return res.status(500).json({ error: 'Translation failed' })
  }
}