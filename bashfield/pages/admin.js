import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../contexts/TranslationContext'

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
  const { t } = useTranslation()
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
  const [reports, setReports] = useState([])
  const [warningFilter, setWarningFilter] = useState('all')
  const [displayedListings, setDisplayedListings] = useState(12)
  const [loadingMoreListings, setLoadingMoreListings] = useState(false)
  const [hasMoreListings, setHasMoreListings] = useState(true)
  const [translationModal, setTranslationModal] = useState(null)
  const [translations, setTranslations] = useState({
    title_en: '',
    title_ku: '',
    title_ar: '',
    description_en: '',
    description_ku: '',
    description_ar: ''
  })

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
      await loadReports()
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

  const buildQuery = async (q = query, status = statusFilter, active = activeFilter, age = ageFilter, mode = modeFilter) => {
    let r = supabase.from('listings').select('*').order('created_at', { ascending: false })

    if (status !== 'all') r = r.eq('status', status)
    if (active === 'active') r = r.eq('is_active', true)
    if (active === 'inactive') r = r.eq('is_active', false)
    if (mode !== 'all') r = r.eq('listing_mode', mode)

    if (age !== 'any') {
      const map = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 }
      const iso = ageThreshold(map[age])
      r = r.lte('created_at', iso)
    }

    const trimmed = (q || '').trim()
    if (trimmed) {
      const upper = trimmed.toUpperCase()
      if (/^BF-[A-Z0-9-]{4,}$/.test(upper)) {
        r = r.eq('reference_code', upper)
      } else {
        // Check if searching by email/username
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('user_id')
          .or(`email.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
        
        if (userProfiles && userProfiles.length > 0) {
          const userIds = userProfiles.map(p => p.user_id)
          r = r.in('user_id', userIds)
        } else {
          r = r.or(`reference_code.ilike.%${upper}%,title.ilike.%${trimmed}%`)
        }
      }
    }
    return r
  }

  const loadListings = async (q = query, s = statusFilter, a = activeFilter, g = ageFilter, m = modeFilter) => {
    const queryBuilder = await buildQuery(q, s, a, g, m)
    const { data } = await queryBuilder
    const rows = data || []
    setListings(rows)
    setDisplayedListings(12)
    setHasMoreListings(rows.length > 12)

    // fetch poster profiles for avatar/name
    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))]
    if (userIds.length) {
      const { data: profs } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_picture, is_verified, warning_level')
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

  const openTranslationModal = (listing) => {
    setTranslationModal(listing)
    setTranslations({
      title_en: listing.title_en || '',
      title_ku: listing.title_ku || '',
      title_ar: listing.title_ar || '',
      description_en: listing.description_en || '',
      description_ku: listing.description_ku || '',
      description_ar: listing.description_ar || ''
    })
  }

  const saveTranslations = async () => {
    if (!translationModal) return
    
    const { error } = await supabase
      .from('listings')
      .update(translations)
      .eq('id', translationModal.id)
    
    if (!error) {
      alert('Translations saved successfully!')
      setTranslationModal(null)
      await loadListings()
    } else {
      alert('Error saving translations: ' + error.message)
    }
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
      .select('user_id, email, display_name, profile_picture, is_verified, warning_level, warning_reason, created_at, updated_at')
      .order('created_at', { ascending: false })
    
    setUsers(data || [])
  }

  const loadReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select(`
        *,
        listings(title, reference_code),
        user_profiles!reports_reporter_id_fkey(display_name, email)
      `)
      .order('created_at', { ascending: false })
    
    setReports(data || [])
  }

  const updateReportStatus = async (reportId, status, adminNotes = '') => {
    const { error } = await supabase
      .from('reports')
      .update({ status, admin_notes: adminNotes })
      .eq('id', reportId)
    
    if (!error) {
      await loadReports()
      alert('Report status updated successfully!')
    }
  }

  const filteredUsers = useMemo(() => {
    let filtered = users
    
    // Apply warning filter
    if (warningFilter === 'warnings') {
      filtered = filtered.filter(u => u.warning_level === 'yellow' || u.warning_level === 'red')
    } else if (warningFilter === 'yellow') {
      filtered = filtered.filter(u => u.warning_level === 'yellow')
    } else if (warningFilter === 'red') {
      filtered = filtered.filter(u => u.warning_level === 'red')
    }
    
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
  }, [users, userSearch, userSort, warningFilter])

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

  const setUserWarning = async (userId, level, reason = '') => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ warning_level: level, warning_reason: reason })
      .eq('user_id', userId)
    
    if (!error) {
      await loadUsers()
      await loadListings()
      alert(`Warning ${level === 'none' ? 'removed' : 'set'} successfully!`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">{t('loadingAdmin')}</div>
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
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">{t('adminDashboard')}</h1>
          <p className="text-gray-600 text-lg">{t('managePropertyListings')}</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">{t('totalUsers')}</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-green-500">{stats.activeUsers}</div>
            <div className="text-sm text-gray-600">{t('activeUsers')}</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-green-600">{stats.totalListings}</div>
            <div className="text-sm text-gray-600">{t('totalListings')}</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-blue-500">{stats.rentListings}</div>
            <div className="text-sm text-gray-600">{t('forRent')}</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-orange-500">{stats.saleListings}</div>
            <div className="text-sm text-gray-600">{t('forSale')}</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingListings}</div>
            <div className="text-sm text-gray-600">{t('pending')}</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-green-600">{stats.approvedListings}</div>
            <div className="text-sm text-gray-600">{t('approved')}</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-purple-600">{stats.totalMessages}</div>
            <div className="text-sm text-gray-600">{t('messages')}</div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-100">
            <div className="text-2xl font-bold text-pink-600">{stats.totalFavorites}</div>
            <div className="text-sm text-gray-600">{t('favorites')}</div>
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
                🏠 {t('listingsManagement')}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-2 border-b-3 font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
                }`}
              >
                👥 {t('userManagement')}
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-2 border-b-3 font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'reports'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-600 hover:text-blue-600'
                }`}
              >
                🚨 Reports Management
              </button>
            </nav>
          </div>
          {activeTab === 'listings' && (
            <div className="p-8">
              {/* Search & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search by Code, Title, Username, or Email</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadListings(e.target.value, statusFilter, activeFilter, ageFilter, modeFilter)}
                placeholder="e.g. BF-9A3C71, john@email.com, or username"
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warning Filter</label>
                  <select
                    value={warningFilter}
                    onChange={(e) => setWarningFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 transition-all duration-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Users</option>
                    <option value="warnings">With Warnings</option>
                    <option value="yellow">Yellow Warnings</option>
                    <option value="red">Red Warnings</option>
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
                      <div className="relative">
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
                        {user.warning_level === 'yellow' && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white" title={`Yellow Warning: ${user.warning_reason}`}></div>
                        )}
                        {user.warning_level === 'red' && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" title={`Red Warning: ${user.warning_reason}`}></div>
                        )}
                      </div>
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
                        href={`/profile/${user.user_id}?admin=true`}
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
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            const reason = prompt('Yellow warning reason:')
                            if (reason !== null) setUserWarning(user.user_id, 'yellow', reason)
                          }}
                          className="px-2 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm hover:bg-yellow-200 transition-colors"
                          title="Give Yellow Warning"
                        >
                          🟡
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Red warning reason:')
                            if (reason !== null) setUserWarning(user.user_id, 'red', reason)
                          }}
                          className="px-2 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                          title="Give Red Warning"
                        >
                          🔴
                        </button>
                        {user.warning_level !== 'none' && (
                          <button
                            onClick={() => setUserWarning(user.user_id, 'none')}
                            className="px-2 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                            title="Remove Warning"
                          >
                            ❌
                          </button>
                        )}
                      </div>
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

          {activeTab === 'reports' && (
            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports Management</h3>
                <div className="text-sm text-gray-600 mb-4">
                  Total Reports: {reports.length}
                </div>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No reports found.
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                              report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {report.status.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            Report for: {report.listings?.title || 'Unknown Listing'}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Property Code: #{report.listings?.reference_code}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            Reported by: {report.user_profiles?.display_name} ({report.user_profiles?.email})
                          </p>
                          <div className="mb-3">
                            <span className="font-medium text-gray-700">Reason: </span>
                            <span className="capitalize">{report.reason.replace('_', ' ')}</span>
                          </div>
                          <div className="mb-3">
                            <span className="font-medium text-gray-700">Description: </span>
                            <p className="text-gray-600 mt-1">{report.description}</p>
                          </div>
                          {report.admin_notes && (
                            <div className="bg-blue-50 rounded-lg p-3 mt-3">
                              <span className="font-medium text-blue-800">Admin Notes: </span>
                              <p className="text-blue-700 mt-1">{report.admin_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/listing/${report.listing_id}?admin=true`}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                        >
                          View Listing
                        </Link>
                        <button
                          onClick={() => {
                            const notes = prompt('Admin notes (optional):')
                            updateReportStatus(report.id, 'reviewed', notes || '')
                          }}
                          className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm hover:bg-yellow-200 transition-colors"
                        >
                          Mark Reviewed
                        </button>
                        <button
                          onClick={() => {
                            const notes = prompt('Resolution notes:')
                            if (notes !== null) updateReportStatus(report.id, 'resolved', notes)
                          }}
                          className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
                        >
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => {
                            const notes = prompt('Dismissal reason:')
                            if (notes !== null) updateReportStatus(report.id, 'dismissed', notes)
                          }}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
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
                    <Link href={poster ? `/profile/${poster.user_id}` : '#'} className="flex items-center gap-2 group w-fit">
                      <div className="relative">
                        {avatar ? (
                          <img src={avatar} className="w-7 h-7 rounded-full object-cover" alt="Posted by" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                            {(poster?.display_name?.[0] || '?').toUpperCase()}
                          </div>
                        )}
                        {poster?.warning_level === 'yellow' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-white" title="Yellow Warning"></div>
                        )}
                        {poster?.warning_level === 'red' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" title="Red Warning"></div>
                        )}
                      </div>
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
                      <button onClick={() => openTranslationModal(l)}
                              className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm">
                        Translate
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

        {/* Translation Modal */}
        {translationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Translate Listing</h2>
                  <button
                    onClick={() => setTranslationModal(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <p className="text-gray-600 mt-2">Original: {translationModal.title}</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Original Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Original Content</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Title:</span>
                      <p className="text-gray-600">{translationModal.title}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="text-gray-600">{translationModal.description}</p>
                    </div>
                  </div>
                </div>

                {/* Translations */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* English */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-blue-600">English</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={translations.title_en}
                        onChange={(e) => setTranslations(prev => ({ ...prev, title_en: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="English title..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        rows={4}
                        value={translations.description_en}
                        onChange={(e) => setTranslations(prev => ({ ...prev, description_en: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="English description..."
                      />
                    </div>
                  </div>

                  {/* Kurdish */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-green-600">Kurdish</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={translations.title_ku}
                        onChange={(e) => setTranslations(prev => ({ ...prev, title_ku: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Kurdish title..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        rows={4}
                        value={translations.description_ku}
                        onChange={(e) => setTranslations(prev => ({ ...prev, description_ku: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        placeholder="Kurdish description..."
                      />
                    </div>
                  </div>

                  {/* Arabic */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-orange-600">Arabic</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={translations.title_ar}
                        onChange={(e) => setTranslations(prev => ({ ...prev, title_ar: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Arabic title..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        rows={4}
                        value={translations.description_ar}
                        onChange={(e) => setTranslations(prev => ({ ...prev, description_ar: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        placeholder="Arabic description..."
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setTranslationModal(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTranslations}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Translations
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
