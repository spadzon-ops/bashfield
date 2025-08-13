import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import ListingCard from '../components/ListingCard'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [listings, setListings] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)

      // Check admin via admin_emails table
      const { data: adminMatch } = await supabase
        .from('admin_emails')
        .select('email')
        .eq('email', user.email)
        .maybeSingle()

      setIsAdmin(!!adminMatch)
      if (!adminMatch) { router.push('/'); return }

      await loadListings()
      setLoading(false)
    })()
  }, []) // eslint-disable-line

  const loadListings = async (search = query, status = statusFilter) => {
    let q = supabase.from('listings').select('*').order('created_at', { ascending: false })

    if (status !== 'all') q = q.eq('status', status)

    const trimmed = (search || '').trim().toUpperCase()
    if (trimmed) {
      // If looks like a code (e.g., BF-XXXXXX), prefer exact match, else try partial on reference_code or title
      if (/^BF-[A-Z0-9]{4,}$/.test(trimmed)) {
        q = q.eq('reference_code', trimmed)
      } else {
        q = q.or(`reference_code.ilike.%${trimmed}%,title.ilike.%${trimmed}%`)
      }
    }

    const { data } = await q
    setListings(data || [])
  }

  const onApprove = async (id) => {
    await supabase.from('listings').update({ status: 'approved' }).eq('id', id)
    await loadListings()
  }
  const onReject = async (id) => {
    await supabase.from('listings').update({ status: 'rejected' }).eq('id', id)
    await loadListings()
  }
  const onDelete = async (id) => {
    if (!confirm('Delete this listing?')) return
    await supabase.from('listings').delete().eq('id', id)
    await loadListings()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading admin…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-3 space-y-3 md:space-y-0">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search by Property Code or Title</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadListings(e.target.value, statusFilter)}
                placeholder="e.g. BF-9A3C71"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); loadListings(query, e.target.value) }}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <button
              onClick={() => loadListings()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Search
            </button>
            <button
              onClick={() => { setQuery(''); setStatusFilter('all'); loadListings('', 'all') }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
            >
              Clear
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Tip: users can read the <strong>Property Code</strong> on the listing details page and tell it to you by phone or chat.</p>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-600">No listings found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                showActions
                isAdmin
                onApprove={onApprove}
                onReject={onReject}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
