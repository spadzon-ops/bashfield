// pages/_app.js
import { TranslationProvider } from "../contexts/TranslationContext";
import "../styles/globals.css"; // keep if you have it; safe to leave even if missing

function MyApp({ Component, pageProps }) {
  return (
    <TranslationProvider initialLanguage="en">
      <Component {...pageProps} />
    </TranslationProvider>
  );
}

export default MyApp;
