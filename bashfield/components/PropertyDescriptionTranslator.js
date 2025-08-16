import { useState, useEffect } from 'react'

export default function PropertyDescriptionTranslator({ listing, currentLang }) {
  const [displayText, setDisplayText] = useState(listing.description)

  useEffect(() => {
    switch (currentLang) {
      case 'ku':
        setDisplayText(listing.description_ku || listing.description)
        break
      case 'ar':
        setDisplayText(listing.description_ar || listing.description)
        break
      default:
        setDisplayText(listing.description)
    }
  }, [listing, currentLang])

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200/50">
      <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
        {displayText}
      </p>
    </div>
  )
}