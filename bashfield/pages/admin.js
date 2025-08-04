import { useState, useEffect } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'
import ListingCard from '../components/ListingCard'

export default function Admin() {
  const { t } = useTranslation('common')
  const [user, setUser] = useState(null)
  const [listings, setListings] = useState({ pending: [], approved: [], rejected: [] })
  const [activeTab, setActiveTab] = useState('pending')
  const [loading, setLoading] = useState(true)

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
      const grouped = {
        pending: data?.filter(l => l.status === 'pending') || [],
        approved: data?.filter(l => l.status === 'approved') || [],
        rejected: data?.filter(l => l.status === 'rejected') || []
      }
      setListings(grouped)
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
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchListings()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user || user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-400 text-lg">{t('admin.noAccess')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('admin.title')}</h1>
        <p className="text-xl text-gray-600">Manage and moderate property listings</p>
      </div>

      <div className="card p-6 mb-8">
        <div className="flex flex-wrap gap-4 justify-center">
          {['pending', 'approved', 'rejected'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">
                {tab === 'pending' ? '⏳' : tab === 'approved' ? '✅' : '❌'}
              </span>
              {t(`admin.${tab}`)} ({listings[tab].length})
            </button>
          ))}
        </div>
      </div>

      {listings[activeTab].length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">
              {activeTab === 'pending' ? '⏳' : activeTab === 'approved' ? '✅' : '❌'}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No {activeTab} listings</h3>
          <p className="text-gray-600">All caught up! No {activeTab} listings to show.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings[activeTab].map(listing => (
            <ListingCard 
              key={listing.id} 
              listing={listing} 
              showActions={true}
              onApprove={() => updateListingStatus(listing.id, 'approved')}
              onReject={() => updateListingStatus(listing.id, 'rejected')}
              onDelete={() => deleteListing(listing.id)}
            />
          ))}
        </div>
      )}
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
