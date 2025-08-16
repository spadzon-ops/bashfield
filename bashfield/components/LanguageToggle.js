// bashfield/components/LanguageToggle.js
import { useEffect, useState } from 'react'
import i18n from '../lib/i18n-lite'

export default function LanguageToggle() {
  const [lang, setLang] = useState('en')

  useEffect(() => {
    const l = i18n.getLang()
    setLang(l)
    i18n.applyDocumentDirection(l)
  }, [])

  const change = (l) => {
    if (l === lang) return
    i18n.setLang(l)
    i18n.translatePage(l)
    setLang(l)
  }

  const Btn = ({ code, label }) => (
    <button
      onClick={() => change(code)}
      className={`px-2 py-1 rounded-md text-sm border ${lang===code ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} transition`}
      aria-label={`Switch language to ${label}`}
      title={`Switch language to ${label}`}
      type="button"
    >
      {code.toUpperCase()}
    </button>
  )

  return (
    <div className="flex items-center gap-1">
      <Btn code="en" label="English" />
      <Btn code="ku" label="Kurdî" />
      <Btn code="ar" label="العربية" />
    </div>
  )
}
