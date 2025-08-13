import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

function fmtDate(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
         ' ' +
         d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function ageThreshold(months) {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString()
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')      // all | pending | approved | rejected
  const [activeFilter, setActiveFilter] = useState('any')      // any | active | inactive
  const [ageFilter, setAgeFilter] = useState('any')            // any | 1m | 3m | 6m | 12m

  const [listings, setListings] = useState([])
  const [profiles, setProfiles] = useState(new Map())
  const [working, setWorking] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)

      const { data: adminMatch } = await supabase
        .from('admin_emails')
        .select('email')
        .eq('email', user.email)
        .maybeSingle()

      if (!adminMatch) { router.push('/'); return }
      setIsAdmin(true)
      await loadListings()
      setLoading(false)
    })()
  }, []) // eslint-disable-line

  const buildQuery = (q = query, status = statusFilter, active = activeFilter, age = ageFilter) => {
    let r = supabase.from('listings').select('*').order('created_at', { ascending: false })

    if (status !== 'all') r = r.eq('status', status)
    if (active === 'active') r = r.eq('is_active', true)
    if (active === 'inactive') r = r.eq('is_active', false)

    if (age !== 'any') {
      const map = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 }
      const iso = ageThreshold(map[age])
      r = r.lte('created_at', iso) // older than threshold
    }

    const trimmed = (q || '').trim()
    if (trimmed) {
      const upper = trimmed.toUpperCase()
      if (/^BF-[A-Z0-9-]{4,}$/.test(upper)) {
        r = r.eq('reference_code', upper)
      } else {
        r = r.or(`reference_code.ilike.%${upper}%,title.ilike.%${trimmed}%`)
      }
    }
    return r
  }

  const loadListings = async (q = query, s = statusFilter, a = activeFilter, g = ageFilter) => {
    const { data } = await buildQuery(q, s, a, g)
    const rows = data || []
    setListings(rows)

    // fetch poster profiles for avatar/name
    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))]
    if (userIds.length) {
      const { data: profs } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_picture')
        .in('user_id', userIds)
      const map = new Map()
      ;(profs || []).forEach(p => map.set(p.user_id, p))
      setProfiles(map)
    } else {
      setProfiles(new Map())
    }
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
  const onToggleActive = async (id, to) => {
    await supabase.from('listings').update({ is_active: to }).eq('id', id)
    await loadListings()
  }

  // BULK ACTIONS (apply to current filtered results)
  const idsOfFiltered = useMemo(() => listings.map(l => l.id), [listings])

  const bulkInactivate = async () => {
    if (idsOfFiltered.length === 0) return alert('Nothing to inactivate.')
    if (!confirm(`Inactivate ${idsOfFiltered.length} listing(s)?`)) return
    setWorking(true)
    await supabase.from('listings').update({ is_active: false }).in('id', idsOfFiltered)
    setWorking(false)
    await loadListings()
  }
  const bulkActivate = async () => {
    if (idsOfFiltered.length === 0) return alert('Nothing to activate.')
    if (!confirm(`Activate ${idsOfFiltered.length} listing(s)?`)) return
    setWorking(true)
    await supabase.from('listings').update({ is_active: true }).in('id', idsOfFiltered)
    setWorking(false)
    await loadListings()
  }
  const bulkDelete = async () => {
    if (idsOfFiltered.length === 0) return alert('Nothing to delete.')
    if (!confirm(`PERMANENTLY delete ${idsOfFiltered.length} listing(s)? This cannot be undone.`)) return
    setWorking(true)
    await supabase.from('listings').delete().in('id', idsOfFiltered)
    setWorking(false)
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search by Property Code or Title</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadListings(e.target.value, statusFilter, activeFilter, ageFilter)}
                placeholder="e.g. BF-9A3C71"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); loadListings(query, e.target.value, activeFilter, ageFilter) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
              <select
                value={activeFilter}
                onChange={(e) => { setActiveFilter(e.target.value); loadListings(query, statusFilter, e.target.value, ageFilter) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="any">Any</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <select
                value={ageFilter}
                onChange={(e) => { setAgeFilter(e.target.value); loadListings(query, statusFilter, activeFilter, e.target.value) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="any">Any</option>
                <option value="1m">Older than 1 month</option>
                <option value="3m">Older than 3 months</option>
                <option value="6m">Older than 6 months</option>
                <option value="12m">Older than 12 months</option>
              </select>
            </div>
          </div>

          {/* Bulk actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button onClick={() => loadListings()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              Apply Filters
            </button>
            <span className="text-sm text-gray-600 ml-2">Filtered: <b>{listings.length}</b></span>
            <div className="flex-1" />
            <button onClick={bulkInactivate} disabled={working || listings.length === 0}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white px-3 py-2 rounded-lg">
              Inactivate All Filtered
            </button>
            <button onClick={bulkActivate} disabled={working || listings.length === 0}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-3 py-2 rounded-lg">
              Activate All Filtered
            </button>
            <button onClick={bulkDelete} disabled={working || listings.length === 0}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-3 py-2 rounded-lg">
              Delete All Filtered
            </button>
          </div>
        </div>

        {/* Results */}
        {listings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-600">No listings found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((l) => {
              const thumb = l.images?.[0]
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${l.images[0]}`
                : null
              const poster = profiles.get(l.user_id)
              const avatar = poster?.profile_picture
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${poster.profile_picture}`
                : null

              return (
                <div key={l.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                  <div className="relative h-40 bg-gray-100">
                    {thumb ? (
                      <img src={thumb} alt={l.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl text-gray-300">🏠</div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        l.status === 'approved' ? 'bg-green-100 text-green-800'
                          : l.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {l.status}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${l.is_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'}`}>
                        {l.is_active ? 'active' : 'inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 pr-2">{l.title}</h3>
                      <div className="text-blue-600 text-sm font-mono">#{l.reference_code}</div>
                    </div>

                    {/* Posted by (clickable) */}
                    <Link href={poster ? `/profile/${poster.user_id}` : '#'} className="flex items-center gap-2 group w-fit">
                      {avatar ? (
                        <img src={avatar} className="w-7 h-7 rounded-full object-cover" alt="Posted by" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                          {(poster?.display_name?.[0] || '?').toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-gray-700 group-hover:underline">
                        {poster?.display_name || 'Unknown User'}
                      </span>
                    </Link>

                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Posted:</span> {fmtDate(l.created_at)}
                    </div>
                    <div className="text-sm text-gray-600">City: {l.city}</div>
                    <div className="text-sm text-gray-600">Price: {Number(l.price || 0).toLocaleString()} {l.currency}</div>

                    <div className="pt-3 flex flex-wrap items-center gap-2">
                      {/* View details always works for admin via ?admin=true */}
                      <Link href={`/listing/${l.id}?admin=true`} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">
                        View details
                      </Link>
                      <button onClick={() => onApprove(l.id)}
                              className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm">
                        Approve
                      </button>
                      <button onClick={() => onReject(l.id)}
                              className="px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-sm">
                        Reject
                      </button>
                      <button onClick={() => onDelete(l.id)}
                              className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm">
                        Delete
                      </button>
                      {l.is_active ? (
                        <button onClick={() => onToggleActive(l.id, false)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs">
                          Inactivate
                        </button>
                      ) : (
                        <button onClick={() => onToggleActive(l.id, true)}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs">
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
