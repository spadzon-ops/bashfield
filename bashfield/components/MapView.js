import { useState, useEffect } from 'react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

export default function MapView({ listings, onListingSelect }) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [map, setMap] = useState(null)
  const [selectedListing, setSelectedListing] = useState(null)
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

  const addMarkersToMap = () => {
    if (!map || !window.L) return

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof window.L.Marker) {
        map.removeLayer(layer)
      }
    })

    // Add markers for each listing
    listings.forEach((listing) => {
      let lat, lng

      if (listing.latitude && listing.longitude) {
        lat = parseFloat(listing.latitude)
        lng = parseFloat(listing.longitude)
      } else if (cityCoordinates[listing.city]) {
        [lat, lng] = cityCoordinates[listing.city]
        // Add small random offset to avoid overlapping markers
        lat += (Math.random() - 0.5) * 0.01
        lng += (Math.random() - 0.5) * 0.01
      } else {
        return // Skip if no coordinates available
      }

      // Create custom marker with price
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

      const marker = window.L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          setSelectedListing(listing)
        })

      // Store listing data with marker
      marker.listingData = listing
    })
  }

  const handleListingClick = (listing) => {
    router.push(`/listing/${listing.id}`)
  }

  const closePopup = () => {
    setSelectedListing(null)
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

      {/* Property Popup */}
      {selectedListing && (
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-sm mx-auto">
            <div className="relative">
              {selectedListing.images && selectedListing.images.length > 0 ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${selectedListing.images[0]}`}
                  alt={selectedListing.title}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <span className="text-3xl">🏠</span>
                </div>
              )}
              <button
                onClick={closePopup}
                className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all flex items-center justify-center"
              >
                ×
              </button>
            </div>
            
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                {selectedListing.title}
              </h3>
              
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-bold text-blue-600">
                  {selectedListing.price.toLocaleString()} {selectedListing.currency}
                </div>
                <div className="text-sm text-gray-500">per month</div>
              </div>
              
              <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span>🛏️</span>
                  <span>{selectedListing.rooms} {selectedListing.rooms === 1 ? 'room' : 'rooms'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>📍</span>
                  <span>{t(`cities.${selectedListing.city}`)}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const message = `Hi! I'm interested in your property: ${selectedListing.title}`
                    const whatsappUrl = `https://wa.me/${selectedListing.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
                    window.open(whatsappUrl, '_blank')
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => handleListingClick(selectedListing)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                >
                  <span>👁️</span>
                  <span>View</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-price-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  )
}