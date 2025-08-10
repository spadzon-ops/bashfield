
import Head from 'next/head'
import Navbar from './Navbar'

export default function Layout({ title='Bashfield', children }) {
  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
      </Head>
      <Navbar/>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="border-t border-neutral-800 py-6 text-sm text-center text-neutral-400">
        © {new Date().getFullYear()} Bashfield
      </footer>
    </div>
  )
}
