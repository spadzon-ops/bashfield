// pages/_app.js
import '@/styles/globals.css';
import { appWithTranslation } from 'next-i18next';
import { TranslationProvider } from '@/contexts/TranslationContext';
import nextI18NextConfig from '@/../next-i18next.config.js';

function App({ Component, pageProps }) {
  return (
    <TranslationProvider>
      <Component {...pageProps} />
    </TranslationProvider>
  );
}

export default appWithTranslation(App, nextI18NextConfig);
