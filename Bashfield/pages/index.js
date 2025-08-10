
import Layout from '../components/Layout'
import ListingCard from '../components/ListingCard'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const [listings, setListings] = useState([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [count, setCount] = useState(0)

  const pageSize = 12

  useEffect(() => { load() }, [page])

  const load = async () => {
    const from = page * pageSize
    const to = from + pageSize - 1
    let query = supabase.from('listings').select('*', { count: 'exact' }).eq('approved', true).order('created_at', { ascending: false }).range(from, to)
    if (q.trim()) {
      query = query.ilike('title', `%${q}%`)
    }
    const { data, count: c } = await query
    setListings(data || [])
    setCount(c || 0)
  }

  const totalPages = Math.ceil(count / pageSize)

  return (
    <Layout>
      <div className="mb-4 flex items-center gap-3">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search listings…" className="flex-1 rounded-xl bg-neutral-900 p-2"/>
        <button onClick={() => {setPage(0); load()}} className="rounded-xl border px-3 py-2">Search</button>
        <a href="/post" className="rounded-xl bg-white text-black px-3 py-2">Post</a>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {listings.map(l => <ListingCard key={l.id} listing={l} />)}
      </div>
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button disabled={page===0} onClick={() => setPage(p => Math.max(0, p-1))} className="rounded-xl border px-3 py-1 disabled:opacity-50">Prev</button>
          <div className="text-sm">{page+1} / {totalPages}</div>
          <button disabled={page>=totalPages-1} onClick={() => setPage(p => p+1)} className="rounded-xl border px-3 py-1 disabled:opacity-50">Next</button>
        </div>
      )}
    </Layout>
  )
}
