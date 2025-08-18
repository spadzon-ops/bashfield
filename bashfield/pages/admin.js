import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
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
  const [modeFilter, setModeFilter] = useState('all')          // all | rent | sale

  const [listings, setListings] = useState([])
  const [profiles, setProfiles] = useState(new Map())
  const [working, setWorking] = useState(false)
  const [activeTab, setActiveTab] = useState('listings')
  const [stats, setStats] = useState({})
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [userSort, setUserSort] = useState('newest')
  const [displayedUsers, setDisplayedUsers] = useState(20)
  const [displayedListings, setDisplayedListings] = useState(12)
  const [loadingMoreListings, setLoadingMoreListings] = useState(false)
  const [hasMoreListings, setHasMoreListings] = useState(true)

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
      await loadStats()
      await loadUsers()
      setLoading(false)
    })()
  }, []) // eslint-disable-line

  useEffect(() => {
    if (activeTab !== 'listings') return
    
    const handleScroll = () => {
      if (loadingMoreListings || !hasMoreListings) return
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      if (scrollTop + windowHeight >= documentHeight - 100) {
        if (listings.length > displayedListings) {
          setLoadingMoreListings(true)
          setTimeout(() => {
            setDisplayedListings(prev => {
              const newCount = prev + 12
              setHasMoreListings(listings.length > newCount)
              return newCount
            })
            setLoadingMoreListings(false)
          }, 500)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [activeTab, loadingMoreListings, hasMoreListings, listings, displayedListings])

  const buildQuery = (q = query, status = statusFilter, active = activeFilter, age = ageFilter, mode = modeFilter) => {
    let r = supabase.from('listings').select('*').order('created_at', { ascending: false })

    if (status !== 'all') r = r.eq('status', status)
    if (active === 'active') r = r.eq('is_active', true)
    if (active === 'inactive') r = r.eq('is_active', false)
    if (mode !== 'all') r = r.eq('listing_mode', mode)

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

  const loadListings = async (q = query, s = statusFilter, a = activeFilter, g = ageFilter, m = modeFilter) => {
    const { data } = await buildQuery(q, s, a, g, m)
    const rows = data || []
    setListings(rows)
    setDisplayedListings(12)
    setHasMoreListings(rows.length > 12)

    // fetch poster profiles for avatar/name
    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))]
    if (userIds.length) {
      const { data: profs } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_picture, is_verified')
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
    
    const userInput = prompt(`PERMANENTLY delete ${idsOfFiltered.length} listing(s)? This cannot be undone.\n\nIf you are sure, please type "delete all" to confirm:`)
    
    if (userInput !== 'delete all') {
      alert('Deletion cancelled. You must type "delete all" exactly to confirm.')
      return
    }
    
    setWorking(true)
    await supabase.from('listings').delete().in('id', idsOfFiltered)
    setWorking(false)
    await loadListings()
  }

  const loadStats = async () => {
    const [usersRes, listingsRes, messagesRes, favoritesRes, activeUsersRes] = await Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id, status, listing_mode', { count: 'exact' }),
      supabase.from('messages').select('id', { count: 'exact', head: true }),
      supabase.from('favorites').select('id', { count: 'exact', head: true }),
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ])
    
    const listingsByStatus = (listingsRes.data || []).reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1
      if (l.listing_mode === 'rent') {
        acc.rentListings = (acc.rentListings || 0) + 1
      } else if (l.listing_mode === 'sale') {
        acc.saleListings = (acc.saleListings || 0) + 1
      }
      return acc
    }, {})
    
    setStats({
      totalUsers: usersRes.count || 0,
      activeUsers: activeUsersRes.count || 0,
      totalListings: listingsRes.count || 0,
      rentListings: listingsByStatus.rentListings || 0,
      saleListings: listingsByStatus.saleListings || 0,
      pendingListings: listingsByStatus.pending || 0,
      approvedListings: listingsByStatus.approved || 0,
      rejectedListings: listingsByStatus.rejected || 0,
      totalMessages: messagesRes.count || 0,
      totalFavorites: favoritesRes.count || 0
    })
  }

  const loadUsers = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('user_id, email, display_name, profile_picture, is_verified, created_at, updated_at')
      .order('created_at', { ascending: false })
    
    setUsers(data || [])
  }

  const filteredUsers = useMemo(() => {
    let filtered = users
    
    if (userSearch.trim()) {
      const search = userSearch.toLowerCase()
      filtered = filtered.filter(u => 
        u.display_name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search)
      )
    }
    
    switch (userSort) {
      case 'oldest':
        filtered = [...filtered].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        break
      case 'name':
        filtered = [...filtered].sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''))
        break
      case 'email':
        filtered = [...filtered].sort((a, b) => (a.email || '').localeCompare(b.email || ''))
        break
      case 'verified':
        filtered = [...filtered].sort((a, b) => (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0))
        break
      default: // newest
        filtered = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
    
    return filtered
  }, [users, userSearch, userSort])

  const toggleUserVerification = async (userId, currentStatus) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_verified: !currentStatus })
      .eq('user_id', userId)
    
    if (!error) {
      await loadUsers()
      alert(`User ${!currentStatus ? 'verified' : 'unverified'} successfully!`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading admin…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">⚙️</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 text-lg">Manage property listings and user content</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-green-500">{stats.activeUsers}</div>
            <div className="text-sm text-gray-600">Active (24h)</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-green-600">{stats.totalListings}</div>
            <div className="text-sm text-gray-600">Total Listings</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-blue-500">{stats.rentListings}</div>
            <div className="text-sm text-gray-600">For Rent</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-orange-500">{stats.saleListings}</div>
            <div className="text-sm text-gray-600">For Sale</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingListings}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-green-600">{stats.approvedListings}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-purple-600">{stats.totalMessages}</div>
            <div className="text-sm text-gray-600">Messages</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-pink-600">{stats.totalFavorites}</div>
            <div className="text-sm text-gray-600">Favorites</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('listings')}
                className={`py-4 px-2 border-b-3 font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'listings'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
                }`}
              >
                🏠 Listings Management
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-2 border-b-3 font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
                }`}
              >
                👥 User Management
              </button>
            </nav>
          </div>
          {activeTab === 'listings' && (
            <div className="p-8">
              {/* Search & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search by Property Code or Title</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadListings(e.target.value, statusFilter, activeFilter, ageFilter, modeFilter)}
                placeholder="e.g. BF-9A3C71"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); loadListings(query, e.target.value, activeFilter, ageFilter, modeFilter) }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 transition-all duration-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                onChange={(e) => { setActiveFilter(e.target.value); loadListings(query, statusFilter, e.target.value, ageFilter, modeFilter) }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 transition-all duration-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="any">Any</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={modeFilter}
                onChange={(e) => { setModeFilter(e.target.value); loadListings(query, statusFilter, activeFilter, ageFilter, e.target.value) }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 transition-all duration-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="rent">For Rent</option>
                <option value="sale">For Sale</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <select
                value={ageFilter}
                onChange={(e) => { setAgeFilter(e.target.value); loadListings(query, statusFilter, activeFilter, e.target.value, modeFilter) }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 transition-all duration-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <button onClick={() => loadListings()} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              🔍 Apply Filters
            </button>
            <span className="text-sm text-gray-600 ml-2">Filtered: <b>{listings.length}</b></span>
            <div className="flex-1" />
            <button onClick={bulkInactivate} disabled={working || listings.length === 0}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-amber-300 disabled:to-amber-400 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
              ⏸️ Inactivate All
            </button>
            <button onClick={bulkActivate} disabled={working || listings.length === 0}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-green-300 disabled:to-green-400 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
              ▶️ Activate All
            </button>
            <button onClick={bulkDelete} disabled={working || listings.length === 0}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-300 disabled:to-red-400 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
              🗑️ Delete All
            </button>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-8">
              {/* User Search & Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Users</label>
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={userSort}
                    onChange={(e) => setUserSort(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 transition-all duration-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">Name A-Z</option>
                    <option value="email">Email A-Z</option>
                    <option value="verified">Verified First</option>
                  </select>
                </div>
              </div>

              <div className="mb-4 text-sm text-gray-600">
                Showing {Math.min(displayedUsers, filteredUsers.length)} of {filteredUsers.length} users
              </div>

              {/* Users List */}
              <div className="space-y-4">
                {filteredUsers.slice(0, displayedUsers).map((user) => (
                  <div key={user.user_id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {user.profile_picture ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${user.profile_picture}`}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 font-semibold">
                            {user.display_name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{user.display_name}</h3>
                          {user.is_verified && (
                            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/profile/${user.user_id}`}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={() => toggleUserVerification(user.user_id, user.is_verified)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          user.is_verified
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {user.is_verified ? '❌ Unverify' : '✅ Verify'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredUsers.length > displayedUsers && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setDisplayedUsers(prev => prev + 20)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                  >
                    Load More Users
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {activeTab === 'listings' && (
          <div>
            {/* Results */}
            {listings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-600">No listings found.</div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.slice(0, displayedListings).map((l) => {
              const thumb = l.images?.[0]
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${l.images[0]}`
                : null
              const poster = profiles.get(l.user_id)
              const avatar = poster?.profile_picture
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${poster.profile_picture}`
                : null

              return (
                <div key={l.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden border border-gray-100 transition-all duration-300 transform hover:-translate-y-1">
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
                    <Link href={poster ? `/admin/profile/${poster.user_id}` : '#'} className="flex items-center gap-2 group w-fit">
                      {avatar ? (
                        <img src={avatar} className="w-7 h-7 rounded-full object-cover" alt="Posted by" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                          {(poster?.display_name?.[0] || '?').toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-gray-700 group-hover:underline flex items-center gap-2">
                        {poster?.display_name || 'Unknown User'}
                        {poster?.is_verified && (
                          <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                            ✓ Verified
                          </span>
                        )}
                      </span>
                    </Link>

                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Posted:</span> {fmtDate(l.created_at)}
                    </div>
                    <div className="text-sm text-gray-600">City: {l.city}</div>
                    <div className="text-sm text-gray-600">Price: {Number(l.price || 0).toLocaleString()} {l.currency} ({l.listing_mode === 'rent' ? 'For Rent' : 'For Sale'})</div>
                    {l.size_sqm && (
                      <div className="text-sm text-gray-600">Size: {l.size_sqm} m²</div>
                    )}

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
                {hasMoreListings && (
                  <div className="text-center mt-8">
                    {loadingMoreListings ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600">Loading more listings...</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setLoadingMoreListings(true)
                          setTimeout(() => {
                            setDisplayedListings(prev => {
                              const newCount = prev + 12
                              setHasMoreListings(listings.length > newCount)
                              return newCount
                            })
                            setLoadingMoreListings(false)
                          }, 500)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                      >
                        Load More Listings
                      </button>
                    )}
                  </div>
                )}
                {!hasMoreListings && listings.length > 12 && (
                  <div className="text-center mt-8 text-gray-500">
                    You've reached the end of the listings
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}