export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, targetLang } = req.body

  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Text and target language are required' })
  }

  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    )

    const data = await response.json()
    
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      const translatedText = data[0].map(item => item[0]).join('')
      return res.status(200).json({ translatedText })
    }

    return res.status(500).json({ error: 'Translation failed' })
  } catch (error) {
    console.error('Translation error:', error)
    return res.status(500).json({ error: 'Translation service unavailable' })
  }
}