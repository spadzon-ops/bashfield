import { useState, useEffect } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'
import ListingCard from '../components/ListingCard'

export default function Profile() {
  const { t } = useTranslation('common')
  const [user, setUser] = useState(null)
  const [userListings, setUserListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        fetchUserListings(user.id)
      } else {
        setLoading(false)
      }
    }
    getUser()
  }, [])

  const fetchUserListings = async (userId) => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user listings:', error)
    } else {
      setUserListings(data || [])
      const stats = {
        total: data?.length || 0,
        approved: data?.filter(l => l.status === 'approved').length || 0,
        pending: data?.filter(l => l.status === 'pending').length || 0,
        rejected: data?.filter(l => l.status === 'rejected').length || 0
      }
      setStats(stats)
    }
    setLoading(false)
  }

  const deleteListing = async (id) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id)

      if (!error) {
        fetchUserListings(user.id)
      }
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600">Please login to view your profile and manage your listings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="card p-8 mb-8">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{user.email[0].toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
            <p className="text-gray-600 text-lg">{user.email}</p>
            <p className="text-sm text-gray-500 mt-1">Member since {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
          <p className="text-gray-600">Total Listings</p>
        </div>
        
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="text-2xl font-bold text-green-600">{stats.approved}</h3>
          <p className="text-gray-600">Approved</p>
        </div>
        
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">⏳</span>
          </div>
          <h3 className="text-2xl font-bold text-yellow-600">{stats.pending}</h3>
          <p className="text-gray-600">Pending</p>
        </div>
        
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">❌</span>
          </div>
          <h3 className="text-2xl font-bold text-red-600">{stats.rejected}</h3>
          <p className="text-gray-600">Rejected</p>
        </div>
      </div>

      {/* User Listings */}
      <div className="card p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Listings</h2>
          <button 
            onClick={() => window.location.href = '/post'}
            className="btn-primary"
          >
            + Add New Listing
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : userListings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏠</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h3>
            <p className="text-gray-600 mb-4">Start by posting your first property listing.</p>
            <button 
              onClick={() => window.location.href = '/post'}
              className="btn-primary"
            >
              Post Your First Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userListings.map(listing => (
              <ListingCard 
                key={listing.id} 
                listing={listing} 
                showActions={true}
                onDelete={deleteListing}
              />
            ))}
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
