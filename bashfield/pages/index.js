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
    maxPrice: '',import { useState, useEffect } from 'react'
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
    currency: 'USD'
  })
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'map'

  useEffect(() => {
    fetchListings()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, listings])

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        user_profiles!inner(display_name, profile_picture)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching listings:', error)
    } else {
      setListings(data || [])
    }
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = listings

    if (filters.city) {
      filtered = filtered.filter(listing => listing.city === filters.city)
    }

    if (filters.rooms) {
      filtered = filtered.filter(listing => listing.rooms >= parseInt(filters.rooms))
    }

    if (filters.minPrice || filters.maxPrice) {
      filtered = filtered.filter(listing => {
        if (listing.currency !== filters.currency) return true
        const price = listing.price
        if (filters.minPrice && price < parseInt(filters.minPrice)) return false
        if (filters.maxPrice && price > parseInt(filters.maxPrice)) return false
        return true
      })
    }

    setFilteredListings(filtered)
  }

  const clearFilters = () => {
    setFilters({
      city: '',
      minPrice: '',
      maxPrice: '',
      rooms: '',
      currency: 'USD'
    })
  }

  return (
    <div className="min-h-screen">
      {/* Modern Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Find Your Perfect
              <span className="block text-yellow-400">Home in Iraq</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Discover thousands of verified rental properties across Iraq's major cities. 
              Safe, simple, and trusted by locals.
            </p>
            
            {/* Quick Search */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <select
                    value={filters.city}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">🏙️ All Cities</option>
                    {CITIES.map(city => (
                      <option key={city} value={city}>{t(`cities.${city}`)}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filters.rooms}
                    onChange={(e) => setFilters(prev => ({ ...prev, rooms: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">🛏️ Any Rooms</option>
                    <option value="1">1+ Room</option>
                    <option value="2">2+ Rooms</option>
                    <option value="3">3+ Rooms</option>
                    <option value="4">4+ Rooms</option>
                  </select>
                  
                  <div className="flex space-x-2">
                    <select
                      value={filters.currency}
                      onChange={(e) => setFilters(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-20 px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="IQD">IQD</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Max Price"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                      className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    onClick={() => document.getElementById('listings').scrollIntoView({ behavior: 'smooth' })}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    🔍 Search
                  </button>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '/post'}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                🏠 List Your Property
              </button>
              <button 
                onClick={() => document.getElementById('listings').scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200"
              >
                👀 Browse Properties
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">{listings.length}+</div>
              <div className="text-gray-600 text-sm sm:text-base">Properties</div>
            </div>
            <div className="p-6">
              <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">9</div>
              <div className="text-gray-600 text-sm sm:text-base">Cities</div>
            </div>
            <div className="p-6">
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-2">100%</div>
              <div className="text-gray-600 text-sm sm:text-base">Verified</div>
            </div>
            <div className="p-6">
              <div className="text-3xl sm:text-4xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600 text-sm sm:text-base">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Section */}
      <div id="listings" className="bg-gray-50 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Featured Properties
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Discover amazing rental opportunities across Iraq's major cities
            </p>
            
            {/* Prominent View Toggle */}
            <div className="inline-flex bg-white rounded-xl shadow-lg p-2 border border-gray-200">
              <button
                onClick={() => setViewMode('list')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>📋</span>
                <span>List View</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>🗺️</span>
                <span>Map View</span>
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.city || filters.rooms || filters.maxPrice) && (
            <div className="mb-6 flex flex-wrap items-center gap-2 justify-center">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.city && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  📍 {t(`cities.${filters.city}`)}
                </span>
              )}
              {filters.rooms && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  🛏️ {filters.rooms}+ rooms
                </span>
              )}
              {filters.maxPrice && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  💰 Under {filters.maxPrice} {filters.currency}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-red-600 hover:text-red-800 text-sm underline ml-2"
              >
                Clear all
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading properties...</p>
              </div>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🏠</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No properties found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or be the first to list in this area!</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={clearFilters}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
                <button 
                  onClick={() => window.location.href = '/post'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  List Your Property
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <p className="text-gray-600">
                  Showing <span className="font-semibold">{filteredListings.length}</span> of <span className="font-semibold">{listings.length}</span> properties
                  {viewMode === 'list' && <span className="ml-2">in list view</span>}
                </p>
              </div>
              
              {/* List View */}
              {viewMode === 'list' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {filteredListings.map(listing => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
              
              {/* Map View */}
              {viewMode === 'map' && (
                <div className="space-y-6">
                  {/* Map Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">🗺️ Interactive Property Map</h3>
                        <p className="text-gray-600">Explore properties across Iraq by location</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{filteredListings.length}</div>
                        <div className="text-sm text-gray-500">properties shown</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <span className="w-3 h-3 bg-blue-500 rounded border-2 border-white shadow"></span>
                        <span>Click markers for details</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>🔍</span>
                        <span>Zoom to explore areas</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>💬</span>
                        <span>Direct WhatsApp contact</span>
                      </div>
                    </div>
                  </div>
                  
                  <MapView 
                    listings={filteredListings}
                    onListingSelect={(listing) => {
                      // Handle listing selection if needed
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
    revalidate: 60, // Revalidate every minute
  }
}
    rooms: '',
    currency: 'USD'
  })
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'map'

  useEffect(() => {
    fetchListings()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, listings])

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching listings:', error)
    } else {
      setListings(data || [])
    }
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = listings

    if (filters.city) {
      filtered = filtered.filter(listing => listing.city === filters.city)
    }

    if (filters.rooms) {
      filtered = filtered.filter(listing => listing.rooms >= parseInt(filters.rooms))
    }

    if (filters.minPrice || filters.maxPrice) {
      filtered = filtered.filter(listing => {
        if (listing.currency !== filters.currency) return true
        const price = listing.price
        if (filters.minPrice && price < parseInt(filters.minPrice)) return false
        if (filters.maxPrice && price > parseInt(filters.maxPrice)) return false
        return true
      })
    }

    setFilteredListings(filtered)
  }

  const clearFilters = () => {
    setFilters({
      city: '',
      minPrice: '',
      maxPrice: '',
      rooms: '',
      currency: 'USD'
    })
  }

  return (
    <div className="min-h-screen">
      {/* Modern Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Find Your Perfect
              <span className="block text-yellow-400">Home in Iraq</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Discover thousands of verified rental properties across Iraq's major cities. 
              Safe, simple, and trusted by locals.
            </p>
            
            {/* Quick Search */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <select
                    value={filters.city}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">🏙️ All Cities</option>
                    {CITIES.map(city => (
                      <option key={city} value={city}>{t(`cities.${city}`)}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filters.rooms}
                    onChange={(e) => setFilters(prev => ({ ...prev, rooms: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">🛏️ Any Rooms</option>
                    <option value="1">1+ Room</option>
                    <option value="2">2+ Rooms</option>
                    <option value="3">3+ Rooms</option>
                    <option value="4">4+ Rooms</option>
                  </select>
                  
                  <div className="flex space-x-2">
                    <select
                      value={filters.currency}
                      onChange={(e) => setFilters(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-20 px-2 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="IQD">IQD</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Max Price"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                      className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    onClick={() => document.getElementById('listings').scrollIntoView({ behavior: 'smooth' })}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    🔍 Search
                  </button>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '/post'}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                🏠 List Your Property
              </button>
              <button 
                onClick={() => document.getElementById('listings').scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-200"
              >
                👀 Browse Properties
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">{listings.length}+</div>
              <div className="text-gray-600 text-sm sm:text-base">Properties</div>
            </div>
            <div className="p-6">
              <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">9</div>
              <div className="text-gray-600 text-sm sm:text-base">Cities</div>
            </div>
            <div className="p-6">
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-2">100%</div>
              <div className="text-gray-600 text-sm sm:text-base">Verified</div>
            </div>
            <div className="p-6">
              <div className="text-3xl sm:text-4xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-gray-600 text-sm sm:text-base">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Section */}
      <div id="listings" className="bg-gray-50 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Featured Properties
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Discover amazing rental opportunities across Iraq's major cities
            </p>
            
            {/* Prominent View Toggle */}
            <div className="inline-flex bg-white rounded-xl shadow-lg p-2 border border-gray-200">
              <button
                onClick={() => setViewMode('list')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>📋</span>
                <span>List View</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>🗺️</span>
                <span>Map View</span>
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.city || filters.rooms || filters.maxPrice) && (
            <div className="mb-6 flex flex-wrap items-center gap-2 justify-center">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.city && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  📍 {t(`cities.${filters.city}`)}
                </span>
              )}
              {filters.rooms && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  🛏️ {filters.rooms}+ rooms
                </span>
              )}
              {filters.maxPrice && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  💰 Under {filters.maxPrice} {filters.currency}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-red-600 hover:text-red-800 text-sm underline ml-2"
              >
                Clear all
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading properties...</p>
              </div>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🏠</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No properties found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or be the first to list in this area!</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={clearFilters}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
                <button 
                  onClick={() => window.location.href = '/post'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  List Your Property
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <p className="text-gray-600">
                  Showing <span className="font-semibold">{filteredListings.length}</span> of <span className="font-semibold">{listings.length}</span> properties
                  {viewMode === 'list' && <span className="ml-2">in list view</span>}
                </p>
              </div>
              
              {/* List View */}
              {viewMode === 'list' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {filteredListings.map(listing => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
              
              {/* Map View */}
              {viewMode === 'map' && (
                <div className="space-y-6">
                  {/* Map Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">🗺️ Interactive Property Map</h3>
                        <p className="text-gray-600">Explore properties across Iraq by location</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{filteredListings.length}</div>
                        <div className="text-sm text-gray-500">properties shown</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <span className="w-3 h-3 bg-blue-500 rounded border-2 border-white shadow"></span>
                        <span>Click markers for details</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>🔍</span>
                        <span>Zoom to explore areas</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>💬</span>
                        <span>Direct WhatsApp contact</span>
                      </div>
                    </div>
                  </div>
                  
                  <MapView 
                    listings={filteredListings}
                    onListingSelect={(listing) => {
                      // Handle listing selection if needed
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
    revalidate: 60, // Revalidate every minute
  }
}
