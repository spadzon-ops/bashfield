// bashfield/components/LanguageToggle.js
import { useTranslation } from '../contexts/TranslationContext'

export default function LanguageToggle() {
  const { lang, setLang, t } = useTranslation()

  const Btn = ({ code, label }) => (
    <button
      type="button"
      onClick={() => code !== lang && setLang(code)}
      className={`px-2 py-1 rounded-md text-sm border transition
        ${lang===code ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}
      aria-label={t('Switch') + ' ' + label}
      title={t('Switch') + ' ' + label}
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
