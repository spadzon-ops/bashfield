import { useRouter } from 'next/router';
import { useState } from 'react';

export default function LanguageToggle() {
  const router = useRouter();
  const { locale, asPath } = router;
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e) => {
    const nextLocale = e.target.value;
    if (nextLocale === locale) return;
    setLoading(true);
    try {
      await router.push(asPath, asPath, { locale: nextLocale, scroll: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <select
        onChange={handleToggle}
        defaultValue={locale}
        disabled={loading}
        className="border rounded px-2 py-1"
        aria-label="Select language"
      >
        <option value="en">English</option>
        <option value="ar">العربية</option>
        <option value="ku">Kurdî</option>
      </select>
      {loading ? <span className="text-sm opacity-70">…</span> : null}
    </div>
  );
}
