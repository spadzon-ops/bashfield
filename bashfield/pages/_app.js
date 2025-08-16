// bashfield/pages/_app.js
import '../styles/globals.css';
import { TranslationProvider } from '../contexts/TranslationContext';
import { ModeProvider } from '../contexts/ModeContext';

export default function MyApp({ Component, pageProps }) {
  return (
    <TranslationProvider>
      <ModeProvider>
        <Component {...pageProps} />
      </ModeProvider>
    </TranslationProvider>
  );
}
