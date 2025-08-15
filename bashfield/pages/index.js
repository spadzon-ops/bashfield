import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { supabase, CITIES, PROPERTY_TYPES } from '../lib/supabase'
import ListingCard from '../components/ListingCard'
import MapView from '../components/MapView'
import ModeSwitcher from '../components/ModeSwitcher'
import InlineModeSwitcher from '../components/InlineModeSwitcher'
import { useMode } from '../contexts/ModeContext'

export default function Home() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { mode, config } = useMode()
  const [prevMode, setPrevMode] = useState(mode)
  const [listings, setListings] = useState([])
  const [displayedListings, setDisplayedListings] = useState([])
  const [filteredListings, setFilteredListings] = useState([])
  const [filters, setFilters] = useState({
    city: '',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    rooms: '',
    minSize: '',
    searchQuery: ''
  })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('default')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [totalFilteredCount, setTotalFilteredCount] = useState(0)
  const ITEMS_PER_PAGE = 12
  const observerRef = useRef()
  const scrollPositionRef = useRef(0)

  useEffect(() => {
    fetchListings()
    // Reset filters when mode changes
    if (prevMode !== mode) {
      setFilters({
        city: '',
        propertyType: '',
        minPrice: '',
        maxPrice: '',
        rooms: '',
        minSize: '',
        searchQuery: ''
      })
      setPage(1)
      setPrevMode(mode)
    }
  }, [mode, prevMode])

  // Prevent initial scroll to top flash
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('homeScrollPosition')
    if (savedPosition) {
      document.documentElement.style.scrollBehavior = 'auto'
      window.scrollTo(0, parseInt(savedPosition))
      setTimeout(() => {
        document.documentElement.style.scrollBehavior = ''
      }, 100)
    }
  }, [])

  // Restore scroll position when returning from property details
  useEffect(() => {
    if (!loading && filteredListings.length > 0) {
      const savedItemCount = sessionStorage.getItem('homeItemCount')
      const savedPosition = sessionStorage.getItem('homeScrollPosition')
      
      if (savedItemCount && savedPosition) {
        const itemCount = parseInt(savedItemCount)
        const neededPage = Math.ceil(itemCount / ITEMS_PER_PAGE)
        setPage(neededPage)
      }
    }
  }, [loading, filteredListings])

  // Scroll to position after items are loaded
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('homeScrollPosition')
    const savedItemCount = sessionStorage.getItem('homeItemCount')
    
    if (savedPosition && savedItemCount && displayedListings.length >= parseInt(savedItemCount)) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: parseInt(savedPosition), behavior: 'instant' })
        sessionStorage.removeItem('homeScrollPosition')
        sessionStorage.removeItem('homeItemCount')
      })
    }
  }, [displayedListings.length])



  useEffect(() => {
    applyFilters()
    getFilteredCount()
  }, [filters, listings, sortBy, mode])

  useEffect(() => {
    updateDisplayedListings()
  }, [filteredListings, page])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && displayedListings.length < filteredListings.length) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [loadingMore, displayedListings.length, filteredListings.length])

  const fetchListings = async () => {
    try {
      // First get all approved and active listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'approved')
        .eq('is_active', true)
        .eq('listing_mode', mode)
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
        .select('user_id, display_name, profile_picture, is_verified')

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

  const getFilteredCount = useCallback(async () => {
    try {
      let query = supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
        .eq('is_active', true)
        .eq('listing_mode', mode)

      if (filters.city) {
        query = query.eq('city', filters.city)
      }

      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType)
      }

      if (filters.rooms) {
        query = query.gte('rooms', parseInt(filters.rooms))
      }

      if (filters.minSize) {
        query = query.gte('size_sqm', parseInt(filters.minSize))
      }

      if (filters.minPrice) {
        query = query.gte('price', parseInt(filters.minPrice))
      }

      if (filters.maxPrice) {
        query = query.lte('price', parseInt(filters.maxPrice))
      }

      if (filters.searchQuery) {
        const searchTerm = `%${filters.searchQuery.toLowerCase()}%`
        query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},city.ilike.${searchTerm}`)
      }

      const { count } = await query
      setTotalFilteredCount(count || 0)
    } catch (error) {
      console.error('Error getting filtered count:', error)
      setTotalFilteredCount(0)
    }
  }, [filters, mode])

  const applyFilters = useCallback(() => {
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

    if (filters.propertyType) {
      filtered = filtered.filter(listing => listing.property_type === filters.propertyType)
    }

    if (filters.rooms) {
      filtered = filtered.filter(listing => listing.rooms >= parseInt(filters.rooms))
    }

    if (filters.minSize) {
      filtered = filtered.filter(listing => listing.size_sqm && listing.size_sqm >= parseInt(filters.minSize))
    }

    // Price filtering
    if (filters.minPrice || filters.maxPrice) {
      filtered = filtered.filter(listing => {
        const price = listing.price
        const minPrice = parseInt(filters.minPrice) || 0
        const maxPrice = parseInt(filters.maxPrice) || 999999
        return price >= minPrice && price <= maxPrice
      })
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'default':
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'price-low':
          return (a.price || 0) - (b.price || 0)
        case 'price-high':
          return (b.price || 0) - (a.price || 0)
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredListings(filtered)
    setPage(1) // Reset pagination when filters change
  }, [listings, filters, sortBy])

  const updateDisplayedListings = useCallback(() => {
    const endIndex = page * ITEMS_PER_PAGE
    setDisplayedListings(filteredListings.slice(0, endIndex))
  }, [filteredListings, page])

  const loadMore = useCallback(() => {
    if (loadingMore || displayedListings.length >= filteredListings.length) return
    
    setLoadingMore(true)
    setTimeout(() => {
      setPage(prev => prev + 1)
      setLoadingMore(false)
    }, 500) // Small delay for better UX
  }, [loadingMore, displayedListings.length, filteredListings.length])

  const clearFilters = useCallback(() => {
    setFilters({
      city: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      rooms: '',
      minSize: '',
      searchQuery: ''
    })
    setPage(1)
  }, [])

  // Memoize expensive calculations
  const hasActiveFilters = useMemo(() => {
    return filters.city || filters.propertyType || filters.rooms || filters.minPrice || filters.maxPrice || filters.minSize
  }, [filters])

  const statsData = useMemo(() => {
    return {
      totalListings: listings.length,
      totalCities: CITIES.length
    }
  }, [listings.length])

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
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white backdrop-blur-sm border border-white/20">
                🏠 #1 Property Platform
              </span>
            </div>
            <div className="mb-8">
              <ModeSwitcher onModeChange={() => {
                setFilters({
                  city: '',
                  propertyType: '',
                  minPrice: '',
                  maxPrice: '',
                  rooms: '',
                  minSize: '',
                  searchQuery: ''
                })
                setPage(1)
              }} />
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-8 leading-tight">
              {config.heroTitle.split(' ').slice(0, -2).join(' ')}
              <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                {config.heroTitle.split(' ').slice(-2).join(' ')}
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-200 mb-12 max-w-4xl mx-auto leading-relaxed">
              {config.heroSubtitle}
              <span className="block mt-2 text-blue-300 font-semibold">{mode === 'rent' ? 'Rent homes • List properties • Connect instantly' : 'Buy homes • Sell properties • Connect instantly'}</span>
            </p>
            


            {/* Enhanced Search Box */}
            <div className="max-w-5xl mx-auto mb-12">
              <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                  <select
                    value={filters.propertyType}
                    onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900 font-medium"
                  >
                    <option value="">All Types</option>
                    {PROPERTY_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filters.city}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900 font-medium"
                  >
                    <option value="">All Cities</option>
                    {CITIES.map(city => (
                      <option key={city} value={city}>{city.charAt(0).toUpperCase() + city.slice(1)}</option>
                    ))}
                  </select>
                  
                  <select
                    value={filters.rooms}
                    onChange={(e) => setFilters(prev => ({ ...prev, rooms: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900 font-medium"
                  >
                    <option value="">Any Rooms</option>
                    <option value="1">1+ Room</option>
                    <option value="2">2+ Rooms</option>
                    <option value="3">3+ Rooms</option>
                    <option value="4">4+ Rooms</option>
                    <option value="5">5+ Rooms</option>
                  </select>
                  
                  <input
                    type="number"
                    placeholder="Min Size (m²)"
                    value={filters.minSize || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      setFilters(prev => ({ ...prev, minSize: value }))
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900 font-medium"
                  />
                  
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={filters.minPrice || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      setFilters(prev => ({ ...prev, minPrice: value }))
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900 font-medium"
                  />
                  
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={filters.maxPrice || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      setFilters(prev => ({ ...prev, maxPrice: value }))
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900 font-medium"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => document.getElementById('listings').scrollIntoView({ behavior: 'smooth' })}
                    className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>{config.searchLabel}</span>
                  </button>
                  <button 
                    onClick={() => window.location.href = '/post'}
                    className="group bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Post Your Property</span>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">FREE</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Stats Section */}
      <div className="bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 text-center border border-blue-200/50">
              <div className="text-2xl font-bold text-blue-600">{statsData.totalListings}+</div>
              <div className="text-sm text-gray-700">{mode === 'rent' ? 'Rentals' : 'For Sale'}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-4 text-center border border-green-200/50">
              <div className="text-2xl font-bold text-green-600">{statsData.totalCities}</div>
              <div className="text-sm text-gray-700">Cities</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-4 text-center border border-purple-200/50">
              <div className="text-2xl font-bold text-purple-600">★★★★★</div>
              <div className="text-sm text-gray-700">Quality</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-4 text-center border border-orange-200/50">
              <div className="text-2xl font-bold text-orange-600">24/7</div>
              <div className="text-sm text-gray-700">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Listings Section */}
      <div id="listings" className="bg-gradient-to-b from-gray-50 to-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="mb-4">
              <InlineModeSwitcher onModeChange={() => {
                setFilters({
                  city: '',
                  propertyType: '',
                  minPrice: '',
                  maxPrice: '',
                  rooms: '',
                  minSize: '',
                  searchQuery: ''
                })
                setPage(1)
              }} />
            </div>
            
            {/* Enhanced Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              {/* View Toggle - Hidden on mobile since grid/list look the same */}
              <div className="hidden sm:inline-flex bg-white rounded-2xl shadow-lg p-2 border border-gray-200">
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
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    viewMode === 'map'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                  </svg>
                  <span>Map</span>
                </button>
              </div>
              
              {/* Mobile Map Toggle - Only show map toggle on mobile */}
              <div className="sm:hidden inline-flex bg-white rounded-2xl shadow-lg p-2 border border-gray-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    viewMode !== 'map'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>List</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    viewMode === 'map'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                >
                  <option value="default">Default</option>
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="mb-6 flex flex-wrap items-center gap-2 justify-center">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.propertyType && (
                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                  {PROPERTY_TYPES.find(t => t.value === filters.propertyType)?.icon} {PROPERTY_TYPES.find(t => t.value === filters.propertyType)?.label}
                </span>
              )}
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
              {filters.minSize && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  📏 {filters.minSize}+ m²
                </span>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  💰 ${(filters.minPrice || 0).toLocaleString()} - ${(filters.maxPrice || '∞').toLocaleString()}
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
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No rentals found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or be the first to list your property for rent!</p>
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
                  List for Rent
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <p className="text-gray-600">
                  Showing <span className="font-semibold">{displayedListings.length}</span> of <span className="font-semibold">{totalFilteredCount}</span> {mode === 'rent' ? 'rentals' : 'properties'}
                  {viewMode === 'list' && <span className="ml-2">in list view</span>}
                </p>
              </div>
              
              {/* Grid View */}
              {viewMode === 'grid' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {displayedListings.map(listing => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                  
                  {/* Loading more indicator */}
                  {displayedListings.length < filteredListings.length && (
                    <div ref={observerRef} className="flex justify-center py-8">
                      {loadingMore ? (
                        <div className="text-center">
                          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-gray-600">Loading more...</p>
                        </div>
                      ) : (
                        <button 
                          onClick={loadMore}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                        >
                          Load More
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
              
              {/* List View */}
              {viewMode === 'list' && (
                <>
                  <div className="space-y-6">
                    {displayedListings.map(listing => (
                      <ListingCard key={listing.id} listing={listing} viewMode="list" />
                    ))}
                  </div>
                  
                  {/* Loading more indicator */}
                  {displayedListings.length < filteredListings.length && (
                    <div ref={observerRef} className="flex justify-center py-8">
                      {loadingMore ? (
                        <div className="text-center">
                          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-gray-600">Loading more...</p>
                        </div>
                      ) : (
                        <button 
                          onClick={loadMore}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                        >
                          Load More
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
              
              {/* Map View */}
              {viewMode === 'map' && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 text-center">
                    <div className="flex items-center justify-center space-x-3 mb-2">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-2xl font-bold">Rental Map</h3>
                    </div>
                    <p className="text-blue-100">Explore {filteredListings.length} rentals by location</p>
                  </div>
                  <div className="h-[500px]">
                    <MapView 
                      listings={filteredListings}
                      onListingSelect={(listing) => {
                        // Handle listing selection if needed
                      }}
                    />
                  </div>
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
