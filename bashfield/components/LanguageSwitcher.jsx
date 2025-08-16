// components/LanguageSwitcher.jsx
import { useRouter } from 'next/router';
import { useTranslation } from '../contexts/TranslationContext';

const LANGS = [
  { code: 'en', labelKey: 'language.english' },
  { code: 'ar', labelKey: 'language.arabic' },
  { code: 'ku', labelKey: 'language.kurdish' },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const { t } = useTranslation('common');

  const change = async (code) => {
    if (code === router.locale) return;
    const asPath = router.asPath || '/';
    await router.push(asPath, asPath, { locale: code });
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {LANGS.map((lng) => (
        <button
          key={lng.code}
          onClick={() => change(lng.code)}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #ddd',
            background: router.locale === lng.code ? '#eee' : 'white',
            cursor: 'pointer',
          }}
          aria-current={router.locale === lng.code ? 'true' : 'false'}
        >
          {t(lng.labelKey)}
        </button>
      ))}
    </div>
  );
}
