// bashfield/pages/_document.js
import Document, { Html, Head, Main, NextScript } from 'next/document'

function parseCookie(cookies, name) {
  if (!cookies) return null
  const m = cookies.match(new RegExp('(^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[2]) : null
}

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    const cookie = ctx?.req?.headers?.cookie || ''
    const cookieLang = parseCookie(cookie, 'bf_lang')
    const lang = cookieLang || 'en'
    const dir = ['ar','ku'].includes(lang) ? 'rtl' : 'ltr'
    return { ...initialProps, lang, dir }
  }

  render() {
    const { lang, dir } = this.props
    return (
      <Html lang={lang || 'en'} dir={dir || 'ltr'}>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
