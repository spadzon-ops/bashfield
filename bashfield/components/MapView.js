import { useState, useEffect } from 'react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

export default function MapView({ listings, onListingSelect }) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [map, setMap] = useState(null)
  const [selectedCluster, setSelectedCluster] = useState(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(null)

  // City coordinates for Iraq
  const cityCoordinates = {
    'erbil': [36.1911, 44.0093],
    'baghdad': [33.3152, 44.3661],
    'basra': [30.5085, 47.7804],
    'mosul': [36.3350, 43.1189],
    'sulaymaniyah': [35.5650, 45.4347],
    'najaf': [32.0000, 44.3167],
    'karbala': [32.6160, 44.0242],
    'kirkuk': [35.4681, 44.3922],
    'duhok': [36.8617, 42.9789]
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadMap()
    }
  }, [])

  useEffect(() => {
    if (map && listings.length > 0) {
      addMarkersToMap()
    }
  }, [map, listings])

  const loadMap = async () => {
    try {
      // Load Leaflet CSS and JS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      if (!window.L) {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.onload = initializeMap
        script.onerror = () => setMapError('Failed to load map library')
        document.head.appendChild(script)
      } else {
        initializeMap()
      }
    } catch (error) {
      console.error('Error loading map:', error)
      setMapError('Failed to initialize map')
    }
  }

  const initializeMap = () => {
    try {
      if (!window.L || !document.getElementById('property-map')) return

      // Center on Iraq
      const mapInstance = window.L.map('property-map').setView([33.2232, 43.6793], 6)

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(mapInstance)

      setMap(mapInstance)
      setIsMapLoaded(true)
    } catch (error) {
      console.error('Error initializing map:', error)
      setMapError('Failed to initialize map')
    }
  }

  const clusterNearbyListings = (listings) => {
    const clusters = []
    const processed = new Set()
    const CLUSTER_DISTANCE = 0.005 // ~500 meters

    listings.forEach((listing, index) => {
      if (processed.has(index)) return

      let lat, lng
      if (listing.latitude && listing.longitude) {
        lat = parseFloat(listing.latitude)
        lng = parseFloat(listing.longitude)
      } else if (cityCoordinates[listing.city]) {
        [lat, lng] = cityCoordinates[listing.city]
        // Add small random offset
        lat += (Math.random() - 0.5) * 0.01
        lng += (Math.random() - 0.5) * 0.01
      } else {
        return
      }

      const cluster = {
        lat,
        lng,
        listings: [listing],
        center: { lat, lng }
      }

      // Find nearby listings to cluster
      listings.forEach((otherListing, otherIndex) => {
        if (processed.has(otherIndex) || index === otherIndex) return

        let otherLat, otherLng
        if (otherListing.latitude && otherListing.longitude) {
          otherLat = parseFloat(otherListing.latitude)
          otherLng = parseFloat(otherListing.longitude)
        } else if (cityCoordinates[otherListing.city]) {
          [otherLat, otherLng] = cityCoordinates[otherListing.city]
          otherLat += (Math.random() - 0.5) * 0.01
          otherLng += (Math.random() - 0.5) * 0.01
        } else {
          return
        }

        const distance = Math.sqrt(
          Math.pow(lat - otherLat, 2) + Math.pow(lng - otherLng, 2)
        )

        if (distance < CLUSTER_DISTANCE) {
          cluster.listings.push(otherListing)
          processed.add(otherIndex)
        }
      })

      processed.add(index)
      clusters.push(cluster)
    })

    return clusters
  }

  const addMarkersToMap = () => {
    if (!map || !window.L) return

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof window.L.Marker) {
        map.removeLayer(layer)
      }
    })

    const clusters = clusterNearbyListings(listings)

    clusters.forEach((cluster) => {
      if (cluster.listings.length === 1) {
        // Single listing marker
        const listing = cluster.listings[0]
        const markerHtml = `
          <div class="bg-white border-2 border-blue-500 rounded-lg px-2 py-1 shadow-lg text-xs font-semibold text-blue-600 whitespace-nowrap">
            ${listing.price.toLocaleString()} ${listing.currency}
          </div>
        `

        const customIcon = window.L.divIcon({
          html: markerHtml,
          className: 'custom-price-marker',
          iconSize: [60, 30],
          iconAnchor: [30, 30]
        })

        const marker = window.L.marker([cluster.lat, cluster.lng], { icon: customIcon })
          .addTo(map)
          .on('click', () => {
            setSelectedCluster({ listings: [listing], isCluster: false })
          })
      } else {
        // Cluster marker
        const minPrice = Math.min(...cluster.listings.map(l => l.price))
        const maxPrice = Math.max(...cluster.listings.map(l => l.price))
        const currency = cluster.listings[0].currency

        const clusterHtml = `
          <div class="bg-red-500 border-2 border-red-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-white font-bold text-sm">
            ${cluster.listings.length}
          </div>
        `

        const clusterIcon = window.L.divIcon({
          html: clusterHtml,
          className: 'custom-cluster-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })

        const marker = window.L.marker([cluster.lat, cluster.lng], { icon: clusterIcon })
          .addTo(map)
          .on('click', () => {
            setSelectedCluster({ 
              listings: cluster.listings, 
              isCluster: true,
              priceRange: `${minPrice.toLocaleString()}-${maxPrice.toLocaleString()} ${currency}`
            })
          })
      }
    })
  }

  const handleListingClick = (listing) => {
    router.push(`/listing/${listing.id}`)
  }

  const closePopup = () => {
    setSelectedCluster(null)
  }

  return (
    <div className="relative">
      <div 
        id="property-map" 
        className="w-full h-96 rounded-xl shadow-lg"
        style={{ minHeight: '400px' }}
      />
      
      {!isMapLoaded && !mapError && (
        <div className="absolute inset-0 bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      {mapError && (
        <div className="absolute inset-0 bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗺️</span>
            </div>
            <p className="text-gray-600 mb-2">Map unavailable</p>
            <p className="text-sm text-gray-500">Please check your internet connection</p>
          </div>
        </div>
      )}

      {/* Cluster/Listing Popup */}
      {selectedCluster && (
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-md mx-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">
                  {selectedCluster.isCluster 
                    ? `${selectedCluster.listings.length} Properties` 
                    : selectedCluster.listings[0].title
                  }
                </h3>
                <button
                  onClick={closePopup}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-all flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              {selectedCluster.isCluster && (
                <p className="text-sm text-gray-600 mt-1">
                  Price range: {selectedCluster.priceRange}
                </p>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {selectedCluster.listings.map((listing, index) => (
                <div key={listing.id} className={`p-4 ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                  <div className="flex space-x-3">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${listing.images[0]}`}
                        alt={listing.title}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🏠</span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">
                        {listing.title}
                      </h4>
                      
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg font-bold text-blue-600">
                          {listing.price.toLocaleString()} {listing.currency}
                        </div>
                        <div className="text-xs text-gray-500">per month</div>
                      </div>
                      
                      <div className="flex items-center space-x-3 mb-3 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <span>🛏️</span>
                          <span>{listing.rooms} {listing.rooms === 1 ? 'room' : 'rooms'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>📍</span>
                          <span>{t(`cities.${listing.city}`)}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const message = `Hi! I'm interested in your property: ${listing.title}`
                            const whatsappUrl = `https://wa.me/${listing.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
                            window.open(whatsappUrl, '_blank')
                          }}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                        >
                          <span>💬</span>
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() => handleListingClick(listing)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                        >
                          <span>👁️</span>
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-price-marker, .custom-cluster-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  )
}