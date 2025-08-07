import { useState, useEffect } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'
import ListingCard from '../components/ListingCard'

export default function Admin() {
  const { t } = useTranslation('common')
  const [user, setUser] = useState(null)
  const [listings, setListings] = useState({ pending: [], approved: [], rejected: [], old: [] })
  const [activeTab, setActiveTab] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, oldCount: 0 })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        fetchListings()
      } else {
        setLoading(false)
      }
    }
    getUser()
  }, [])

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching listings:', error)
    } else {
      const now = new Date()
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      
      const grouped = {
        pending: data?.filter(l => l.status === 'pending') || [],
        approved: data?.filter(l => l.status === 'approved') || [],
        rejected: data?.filter(l => l.status === 'rejected') || [],
        old: data?.filter(l => new Date(l.created_at) < oneMonthAgo) || []
      }
      
      setListings(grouped)
      setStats({
        total: data?.length || 0,
        thisMonth: data?.filter(l => new Date(l.created_at) >= oneMonthAgo).length || 0,
        oldCount: grouped.old.length
      })
    }
    setLoading(false)
  }

  const updateListingStatus = async (id, status) => {
    const { error } = await supabase
      .from('listings')
      .update({ status })
      .eq('id', id)

    if (!error) {
      fetchListings()
    }
  }

  const deleteListing = async (id) => {
    if (!confirm('Are you sure you want to delete this listing?')) return
    
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchListings()
      alert('Listing deleted successfully!')
    }
  }

  const bulkApproveAll = async () => {
    if (!confirm(`Approve all ${listings.pending.length} pending listings?`)) return
    
    const { error } = await supabase
      .from('listings')
      .update({ status: 'approved' })
      .eq('status', 'pending')

    if (!error) {
      fetchListings()
      alert('All pending listings approved!')
    }
  }

  const bulkDeleteOld = async () => {
    if (!confirm(`Delete all ${listings.old.length} listings older than 1 month?`)) return
    
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    const { error } = await supabase
      .from('listings')
      .delete()
      .lt('created_at', oneMonthAgo.toISOString())

    if (!error) {
      fetchListings()
      alert('Old listings deleted successfully!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!user || user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have admin privileges</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🛡️ Admin Dashboard</h1>
          <p className="text-gray-600">Manage property listings and moderate content</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total}</div>
            <div className="text-gray-600 text-sm">Total Listings</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{listings.approved.length}</div>
            <div className="text-gray-600 text-sm">Approved</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">{listings.pending.length}</div>
            <div className="text-gray-600 text-sm">Pending Review</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{stats.oldCount}</div>
            <div className="text-gray-600 text-sm">Older than 1 Month</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            {listings.pending.length > 0 && (
              <button
                onClick={bulkApproveAll}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>✅</span>
                <span>Approve All Pending ({listings.pending.length})</span>
              </button>
            )}
            {listings.old.length > 0 && (
              <button
                onClick={bulkDeleteOld}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>🗑️</span>
                <span>Delete Old Listings ({listings.old.length})</span>
              </button>
            )}
            <button
              onClick={fetchListings}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'pending', label: '⏳ Pending', count: listings.pending.length },
                { key: 'approved', label: '✅ Approved', count: listings.approved.length },
                { key: 'rejected', label: '❌ Rejected', count: listings.rejected.length },
                { key: 'old', label: '📅 Old (1M+)', count: listings.old.length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {listings[activeTab].length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">
                    {activeTab === 'pending' ? '⏳' : 
                     activeTab === 'approved' ? '✅' : 
                     activeTab === 'rejected' ? '❌' : '📅'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No {activeTab} listings</h3>
                <p className="text-gray-600">All caught up! No {activeTab} listings to show.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings[activeTab].map(listing => (
                  <div key={listing.id} className="relative">
                    <ListingCard 
                      listing={listing} 
                      showActions={true}
                      onApprove={() => updateListingStatus(listing.id, 'approved')}
                      onReject={() => updateListingStatus(listing.id, 'rejected')}
                      onDelete={() => deleteListing(listing.id)}
                    />
                    {/* Date Badge */}
                    <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}