// bashfield/pages/_app.js
import '../styles/globals.css';
import Header from '../components/Header';

// Keep these providers if they exist in your repo.
// If either file does NOT exist, delete its import AND remove the wrapper below.
import { TranslationProvider } from '../contexts/TranslationContext';
import { ModeProvider } from '../contexts/ModeContext';

export default function MyApp({ Component, pageProps }) {
  return (
    <TranslationProvider>
      <ModeProvider>
        <Header />
        <Component {...pageProps} />
      </ModeProvider>
    </TranslationProvider>
  );
}
