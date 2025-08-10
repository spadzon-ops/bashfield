
import Layout from '../../components/Layout'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Messages() {
  const [convos, setConvos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant1.eq.${user.id},participant2.eq.${user.id}`)
        .order('updated_at', { ascending: false })
      if (!error) setConvos(data || [])
      setLoading(false)
    }
    run()

    // live updates for new messages
    const channel = supabase
      .channel('messages-inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        // refresh list on new message
        if (typeof window !== 'undefined') location.reload()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <Layout title="Messages">
      <h1 className="text-2xl font-semibold mb-4">Your Conversations</h1>
      {loading ? <p>Loading…</p> : (
        <ul className="divide-y divide-neutral-800 rounded-xl border border-neutral-800">
          {convos.map(c => (
            <li key={c.id} className="p-4 hover:bg-neutral-900/40 flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-400">Listing</div>
                <div className="font-medium">{c.listing_id}</div>
              </div>
              <Link href={`/chat/${c.listing_id}`} className="rounded-xl border px-3 py-1">Open</Link>
            </li>
          ))}
          {convos.length === 0 && (
            <li className="p-6 text-neutral-400">No conversations yet.</li>
          )}
        </ul>
      )}
    </Layout>
  )
}
