
export default function Error({ statusCode }) {
  return (
    <main className="min-h-screen bg-black text-neutral-100 grid place-items-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-2">{statusCode || 500}</h1>
        <p className="text-neutral-400">Something went wrong.</p>
        <a className="mt-4 inline-block rounded-xl border px-4 py-2" href="/">Back home</a>
      </div>
    </main>
  )
}
Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
