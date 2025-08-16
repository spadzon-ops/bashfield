import { useRouter } from 'next/router';
import { TranslationProvider } from '../contexts/TranslationContext';

export default function App({ Component, pageProps }) {
  const { locale } = useRouter();
  return (
    <TranslationProvider lang={locale || 'en'}>
      <Component {...pageProps} />
    </TranslationProvider>
  );
}
