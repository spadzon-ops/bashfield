// FILE: bashfield/pages/admin.js

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

export default function Admin() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [ageFilter, setAgeFilter] = useState('any')
  const [working, setWorking] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

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

  const loadListings = async (q = query, status = statusFilter, active = activeFilter, age = ageFilter) => {
    const { data } = await buildQuery(q, status, active, age)
    setListings(data || [])
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading…</div>
  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); loadListings(e.target.value) }}
              placeholder="Search title or BF-XXXXXX…"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full"
            />

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
                <option value="all">All</option>
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

          <div className="flex items-center gap-2 mt-4">
            <button onClick={bulkInactivate} disabled={working} className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm">Bulk Inactivate</button>
            <button onClick={bulkActivate} disabled={working} className="px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm">Bulk Activate</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="divide-y">
            {listings.map((l) => (
              <div key={l.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{l.reference_code}</span>
                    <span className="text-sm text-gray-500">{fmtDate(l.created_at)}</span>
                  </div>
                  <div className="font-medium text-gray-900 truncate">{l.title}</div>
                  <div className="text-sm text-gray-600">{l.city} • {l.rooms} rooms • {l.currency} {l.price?.toLocaleString()}</div>
                  <div className="mt-1">
                    <span className={`inline-block text-xs px-2 py-1 rounded-full mr-1 ${l.status === 'approved' ? 'bg-green-100 text-green-700' : l.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700'}`}>{l.status}</span>
                    <span className={`inline-block text-xs px-2 py-1 rounded-full ${l.is_active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{l.is_active ? 'active' : 'inactive'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/listing/${l.id}?admin=true`} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">View Details</Link>
                  {l.is_active ? (
                    <button onClick={() => onToggleActive(l.id, false)} className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm">Inactivate</button>
                   ) : (
                    <button onClick={() => onToggleActive(l.id, true)} className="px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm">Activate</button>
                 )}
                  <button onClick={() => onDelete(l.id)} className="px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
