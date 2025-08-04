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
      <h1 className="text-3xl font-bold text-white mb-8">{t('admin.title')}</h1>

      <div className="flex space-x-4 mb-8">
        {['pending', 'approved', 'rejected'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md font-medium ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {t(`admin.${tab}`)} ({listings[tab].length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings[activeTab].map(listing => (
          <div key={listing.id} className="relative">
            <ListingCard listing={listing} />
            <div className="absolute top-2 right-2 flex space-x-1">
              {activeTab === 'pending' && (
                <>
                  <button
                    onClick={() => updateListingStatus(listing.id, 'approved')}
                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                  >
                    {t('admin.approve')}
                  </button>
                  <button
                    onClick={() => updateListingStatus(listing.id, 'rejected')}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                  >
                    {t('admin.reject')}
                  </button>
                </>
              )}
              <button
                onClick={() => deleteListing(listing.id)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
              >
                {t('admin.delete')}
              </button>
            </div>
          </div>
        ))}
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