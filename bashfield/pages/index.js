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
    currency: 'USD',
    searchQuery: ''
  })
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('price-low')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchListings()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, listings, sortBy])

  const fetchListings = async () => {
    try {
      // First get all approved and active listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (listingsError) {
        console.error('Error fetching listings:', listingsError)
        setListings([])
        setLoading(false)
        return
      }

      // Then get all user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_picture')

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
      }

      // Merge the data
      const listingsWithProfiles = listingsData.map(listing => {
        const profile = profilesData?.find(p => p.user_id === listing.user_id)
        return {
          ...listing,
          user_profiles: profile || null
        }
      })

      setListings(listingsWithProfiles || [])
    } catch (error) {
      console.error('Error in fetchListings:', error)
      setListings([])
    }
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = listings

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(listing => 
        listing.title.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query) ||
        listing.city.toLowerCase().includes(query)
      )
    }

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

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        break
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'rooms':
        filtered.sort((a, b) => b.rooms - a.rooms)
        break
    }

    setFilteredListings(filtered)
  }

  const clearFilters = () => {
    setFilters({
      city: '',
      minPrice: '',
      maxPrice: '',
      rooms: '',
      currency: 'USD',
      searchQuery: ''
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Ultra Modern Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gradient-to-r from-pink-400 to-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white backdrop-blur-sm border border-white/20">
                🏠 #1 Property Platform
              </span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-8 leading-tight">
              Find Your Dream
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Home Today
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-200 mb-12 max-w-4xl mx-auto leading-relaxed">
              Discover premium rental properties across major cities with our advanced search platform.
              <span className="block mt-2 text-blue-300 font-semibold">Quality listings • Instant messaging • Secure platform</span>
            </p>
            
            {/* Advanced Search Bar */}
            <div className="max-w-6xl mx-auto mb-12">
              <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Your Perfect Property</h2>
                  <p className="text-gray-600">Use filters to narrow down your search</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🏙️ City</label>
                    <select
                      value={filters.city}
                      onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="">All Cities</option>
                      {CITIES.map(city => (
                        <option key={city} value={city}>{city.charAt(0).toUpperCase() + city.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🛏️ Rooms</label>
                    <select
                      value={filters.rooms}
                      onChange={(e) => setFilters(prev => ({ ...prev, rooms: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="">Any Rooms</option>
                      <option value="1">1+ Room</option>
                      <option value="2">2+ Rooms</option>
                      <option value="3">3+ Rooms</option>
                      <option value="4">4+ Rooms</option>
                      <option value="5">5+ Rooms</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">💰 Currency</label>
                    <select
                      value={filters.currency}
                      onChange={(e) => setFilters(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="IQD">IQD</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">💵 Price Range</label>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="0"
                        max={filters.currency === 'USD' ? '5000' : '5000000'}
                        step={filters.currency === 'USD' ? '50' : '50000'}
                        value={filters.maxPrice || (filters.currency === 'USD' ? '5000' : '5000000')}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((filters.maxPrice || (filters.currency === 'USD' ? 5000 : 5000000)) / (filters.currency === 'USD' ? 5000 : 5000000)) * 100}%, #e5e7eb ${((filters.maxPrice || (filters.currency === 'USD' ? 5000 : 5000000)) / (filters.currency === 'USD' ? 5000 : 5000000)) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>0</span>
                        <span className="font-semibold text-blue-600">
                          {filters.maxPrice ? `${parseInt(filters.maxPrice).toLocaleString()} ${filters.currency}` : 'Max'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={clearFilters}
                    className="px-8 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all flex items-center space-x-2 font-semibold"
                  >
                    <span>🗑️</span>
                    <span>Clear All Filters</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button 
                onClick={() => window.location.href = '/post'}
                className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-6 px-12 rounded-2xl text-xl transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:-translate-y-3 hover:scale-110"
              >
                <span className="flex items-center justify-center space-x-3">
                  <span className="text-2xl group-hover:animate-bounce">🏠</span>
                  <span>List Your Property</span>
                  <span className="text-sm opacity-75">FREE</span>
                </span>
              </button>
              <button 
                onClick={() => document.getElementById('listings').scrollIntoView({ behavior: 'smooth' })}
                className="group border-2 border-white/50 text-white hover:bg-white/10 backdrop-blur-sm font-bold py-6 px-12 rounded-2xl text-xl transition-all duration-500 transform hover:scale-110 hover:border-white"
              >
                <span className="flex items-center justify-center space-x-3">
                  <span className="text-2xl group-hover:animate-pulse">🔍</span>
                  <span>Explore Properties</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Section */}
      <div className="bg-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 mb-6">
              📈 Platform Statistics
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join the fastest-growing rental community with quality properties and instant connections
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="group bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 text-center border border-blue-200/50">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl text-white">🏠</span>
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2 group-hover:scale-110 transition-transform">{listings.length}+</div>
              <div className="text-gray-700 font-semibold text-lg mb-1">Properties</div>
              <div className="text-gray-500 text-sm">Active listings</div>
            </div>
            <div className="group bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 text-center border border-green-200/50">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl text-white">🏙️</span>
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2 group-hover:scale-110 transition-transform">{CITIES.length}</div>
              <div className="text-gray-700 font-semibold text-lg mb-1">Cities</div>
              <div className="text-gray-500 text-sm">Major cities</div>
            </div>
            <div className="group bg-gradient-to-br from-purple-50 to-violet-100 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 text-center border border-purple-200/50">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl text-white">✓</span>
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-2 group-hover:scale-110 transition-transform">★★★★★</div>
              <div className="text-gray-700 font-semibold text-lg mb-1">Quality</div>
              <div className="text-gray-500 text-sm">Top rated</div>
            </div>
            <div className="group bg-gradient-to-br from-orange-50 to-red-100 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 text-center border border-orange-200/50">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl text-white">📞</span>
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-orange-600 mb-2 group-hover:scale-110 transition-transform">24/7</div>
              <div className="text-gray-700 font-semibold text-lg mb-1">Support</div>
              <div className="text-gray-500 text-sm">Always here</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Listings Section */}
      <div id="listings" className="bg-gradient-to-b from-gray-50 to-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-6">
              🏠 Property Listings
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
              Premium Properties
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Discover exceptional rental opportunities across major cities with our curated collection of quality properties
            </p>
            
            {/* Enhanced Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
              {/* View Toggle */}
              <div className="inline-flex bg-white rounded-2xl shadow-lg p-2 border border-gray-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>List</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2 border-2 ${
                    viewMode === 'map'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-xl transform scale-110 animate-pulse border-green-500'
                      : 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 hover:border-green-400'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                  </svg>
                  <span>Map</span>
                </button>
              </div>
              
              {/* Sort Dropdown */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all bg-white"
                >
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.city || filters.rooms || filters.maxPrice) && (
            <div className="mb-6 flex flex-wrap items-center gap-2 justify-center">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.city && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  📍 {filters.city.charAt(0).toUpperCase() + filters.city.slice(1)}
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
              
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                  {filteredListings.map(listing => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
              
              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-6">
                  {filteredListings.map(listing => (
                    <ListingCard key={listing.id} listing={listing} viewMode="list" />
                  ))}
                </div>
              )}
              
              {/* Map View */}
              {viewMode === 'map' && (
                <div className="space-y-6">
                  {/* Enhanced Map Header */}
                  <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-2xl p-8 shadow-xl">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <span className="text-3xl text-white">🗺️</span>
                      </div>
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent mb-3">Interactive Property Map</h3>
                      <p className="text-lg text-gray-700 font-medium">Explore properties by location - Click markers to view details!</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-green-200">
                        <div className="text-2xl font-bold text-green-600 mb-1">{filteredListings.length}</div>
                        <div className="text-sm text-gray-600">Properties on Map</div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-green-200">
                        <div className="text-2xl font-bold text-green-600 mb-1">🔍</div>
                        <div className="text-sm text-gray-600">Zoom & Explore</div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-green-200">
                        <div className="text-2xl font-bold text-green-600 mb-1">💬</div>
                        <div className="text-sm text-gray-600">Direct Contact</div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-4 text-center">
                      <p className="font-semibold">✨ Premium Feature: Interactive map view with real-time property locations!</p>
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
    revalidate: 60,
  }
}
