import { useState, useEffect } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase, CITIES } from '../lib/supabase'
import ListingCard from '../components/ListingCard'
import MapView from '../components/MapView'

export default function Home() {
  const { t } = useTranslation('common')
  const [listings, setListings] = useState([])
  const [filteredListings, setFilteredListings] = useState([])
  const [filters, setFilters] = useState({
    city: '',
    minPrice: '',
    maxPrice: '',
    rooms: '',
  })
  const [loading, setLoading] = useState(true)
  const [mapCenter, setMapCenter] = useState([36.1911, 44.0092])
  const [mapZoom, setMapZoom] = useState(12)

  useEffect(() => {
    fetchListings()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [listings, filters])

  const fetchListings = async () => {
    try {
      setLoading(true)

      // Only show APPROVED + ACTIVE on homepage
      const { data: listingsData, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'approved').eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching listings:', error)
        setListings([])
        setLoading(false)
        return
      }

      // Fetch related profiles for display names/avatars
      const userIds = [...new Set((listingsData || []).map(l => l.user_id))]

      let profilesData = []
      if (userIds.length) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, profile_picture')
          .in('user_id', userIds)

        if (!profilesError) profilesData = profiles || []
        else console.error('Error fetching profiles:', profilesError)
      }

      // Merge the data
      const listingsWithProfiles = (listingsData || []).map(listing => {
        const profile = profilesData?.find(p => p.user_id === listing.user_id)
        return {
          ...listing,
          user_profiles: profile || null
        }
      })

      setListings(listingsWithProfiles || [])
    } catch (error) {
      console.error('Error in fetchListings:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...(listings || [])]

    if (filters.city) {
      result = result.filter(l => l.city === filters.city)
    }
    if (filters.minPrice) {
      result = result.filter(l => Number(l.price) >= Number(filters.minPrice))
    }
    if (filters.maxPrice) {
      result = result.filter(l => Number(l.price) <= Number(filters.maxPrice))
    }
    if (filters.rooms) {
      result = result.filter(l => Number(l.rooms) === Number(filters.rooms))
    }

    setFilteredListings(result)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select
                name="city"
                value={filters.city}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-lg"
              >
                <option value="">All</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-lg"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-lg"
                placeholder="Any"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rooms</label>
              <input
                type="number"
                name="rooms"
                value={filters.rooms}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-lg"
                placeholder="Any"
              />
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <MapView
            listings={filteredListings}
            center={mapCenter}
            zoom={mapZoom}
            onMarkerClick={(coords) => {
              setMapCenter(coords)
              setMapZoom(14)
            }}
          />
        </div>

        {/* Listings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {loading ? (
            <div className="text-center text-gray-600">Loading…</div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center text-gray-600">No listings found</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
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
