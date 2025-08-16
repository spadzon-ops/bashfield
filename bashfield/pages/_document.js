// pages/_document.js
import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    const locale = this.props.__NEXT_DATA__?.locale || 'en';
    const rtl = ['ar', 'ku'].includes(locale);
    return (
      <Html lang={locale} dir={rtl ? 'rtl' : 'ltr'}>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
