// bashfield/components/Header.js
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const RTL_LOCALES = ['ar', 'ku'];

export default function Header() {
  const router = useRouter();
  const { locale, asPath } = router;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // keep <html> correct for accessibility & styles
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = locale || 'en';
    document.documentElement.dir = RTL_LOCALES.includes(locale || 'en') ? 'rtl' : 'ltr';
  }, [locale, mounted]);

  const switchTo = async (lng) => {
    // stay on same path, only change locale
    await router.push(asPath, asPath, { locale: lng });
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    const next = html.classList.contains('dark') ? 'light' : 'dark';
    html.classList.toggle('dark', next === 'dark');
    try { localStorage.setItem('theme', next); } catch {}
  };

  // restore saved theme on first mount
  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem('theme')) || 'light';
    if (saved === 'dark') document.documentElement.classList.add('dark');
  }, []);

  const LangButton = ({ code, label }) => (
    <button
      onClick={() => switchTo(code)}
      className={[
        'px-3 py-1 rounded-md text-sm font-medium transition',
        locale === code
          ? 'bg-blue-600 text-white'
          : 'bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200',
      ].join(' ')}
      aria-current={locale === code ? 'page' : undefined}
    >
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
      <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Bashfield
          </Link>
          <span className="hidden sm:inline text-slate-400">|</span>
          <div className="hidden sm:flex gap-2">
            <Link href="/" className="text-sm text-slate-700 dark:text-slate-200 hover:underline">Home</Link>
            <Link href="/favorites" className="text-sm text-slate-700 dark:text-slate-200 hover:underline">Favorites</Link>
            <Link href="/messages" className="text-sm text-slate-700 dark:text-slate-200 hover:underline">Messages</Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LangButton code="en" label="EN" />
          <LangButton code="ar" label="AR" />
          <LangButton code="ku" label="KU" />
          <button
            onClick={toggleTheme}
            className="ml-2 px-3 py-1 rounded-md text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Toggle theme"
          >
            🌓
          </button>
        </div>
      </nav>
    </header>
  );
}
