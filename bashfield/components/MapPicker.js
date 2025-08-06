import { useState, useEffect, useRef } from 'react'

export default function MapPicker({ isOpen, onClose, onLocationSelect, initialCenter = [36.1911, 44.0093], selectedCity = 'erbil' }) {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [address, setAddress] = useState('')
  const mapRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [currentLayer, setCurrentLayer] = useState('street')
  const mapInstanceRef = useRef(null)
  const layersRef = useRef({})
  const markerRef = useRef(null)
  const [locationConfirmed, setLocationConfirmed] = useState(false)

  // City coordinates
  const cityCoordinates = {
    erbil: [36.1911, 44.0093],
    baghdad: [33.3152, 44.3661],
    basra: [30.5085, 47.7804],
    mosul: [36.3350, 43.1189],
    sulaymaniyah: [35.5650, 45.4347],
    najaf: [32.0000, 44.3333],
    karbala: [32.6160, 44.0242],
    kirkuk: [35.4681, 44.3922],
    duhok: [36.8617, 42.9789]
  }

  const getCityCenter = () => {
    return cityCoordinates[selectedCity] || initialCenter
  }

  useEffect(() => {
    if (isOpen) {
      if (!mapLoaded) {
        loadLeafletMap()
      } else if (mapInstanceRef.current) {
        // Refresh map when reopened
        setTimeout(() => {
          mapInstanceRef.current.invalidateSize()
        }, 100)
      }
    }
  }, [isOpen])

  useEffect(() => {
    // Reset map when closed
    if (!isOpen && mapInstanceRef.current) {
      setMapLoaded(false)
      mapInstanceRef.current = null
      layersRef.current = {}
      markerRef.current = null
    }
  }, [isOpen])

  const loadLeafletMap = () => {
    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Load Leaflet JS
    if (!window.L) {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = () => {
        initializeMap()
      }
      document.head.appendChild(script)
    } else {
      initializeMap()
    }
  }

  const initializeMap = () => {
    if (!mapRef.current || !window.L) return

    const center = getCityCenter()
    
    // Create map
    const map = window.L.map(mapRef.current).setView(center, 13)
    mapInstanceRef.current = map

    // Define map layers
    const streetLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    })

    const satelliteLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri, Maxar, Earthstar Geographics',
      maxZoom: 19
    })

    const satelliteLabelsLayer = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 19
    })

    // Store layers
    layersRef.current = {
      street: streetLayer,
      satellite: satelliteLayer,
      satelliteLabels: satelliteLabelsLayer
    }

    // Add default layer
    streetLayer.addTo(map)

    // Add marker
    const marker = window.L.marker(center, {
      draggable: true
    }).addTo(map)
    markerRef.current = marker

    // Update location when marker is moved
    const updateLocation = (lat, lng) => {
      setSelectedLocation({ lat, lng })
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      setLocationConfirmed(false) // Reset confirmation when location changes
    }

    // Handle marker drag
    marker.on('dragend', function(e) {
      const position = e.target.getLatLng()
      updateLocation(position.lat, position.lng)
    })

    // Handle map click
    map.on('click', function(e) {
      const { lat, lng } = e.latlng
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
        updateLocation(lat, lng)
      }
    })

    // Set initial location
    updateLocation(center[0], center[1])
    setMapLoaded(true)
  }

  const switchMapLayer = (layerType) => {
    if (!mapInstanceRef.current || !layersRef.current) return

    const map = mapInstanceRef.current
    
    // Remove current layers
    Object.values(layersRef.current).forEach(layer => {
      map.removeLayer(layer)
    })

    // Add new layer(s)
    if (layerType === 'street') {
      layersRef.current.street.addTo(map)
    } else if (layerType === 'satellite') {
      layersRef.current.satellite.addTo(map)
      layersRef.current.satelliteLabels.addTo(map)
    }

    setCurrentLayer(layerType)
  }

  if (!isOpen) return null

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation.lat, selectedLocation.lng, address)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">📍 Select Property Location</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-2">Click on the map or drag the marker to your exact property location</p>
        </div>

        <div className="p-6">
          {/* Map Controls */}
          <div className="flex justify-center mb-4">
            <div className="bg-white border border-gray-300 rounded-lg p-1 shadow-sm">
              <button
                onClick={() => switchMapLayer('street')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentLayer === 'street'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🗺️ Street
              </button>
              <button
                onClick={() => switchMapLayer('satellite')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentLayer === 'satellite'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🛰️ Satellite
              </button>
            </div>
          </div>
          
          {/* Real Map */}
          <div className="w-full h-96 rounded-lg border-2 border-gray-200 overflow-hidden relative">
            {!mapLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading real map...</p>
                </div>
              </div>
            )}
            <div 
              ref={mapRef}
              className="w-full h-full"
            />
          </div>
          
          {selectedLocation && (
            <div className={`mt-4 p-4 border rounded-lg ${
              locationConfirmed 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start space-x-3">
                <span className={`text-xl mt-1 ${
                  locationConfirmed ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {locationConfirmed ? '✅' : '📍'}
                </span>
                <div className="flex-1">
                  <p className={`font-medium ${
                    locationConfirmed ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {locationConfirmed ? 'Location Confirmed!' : 'Location Selected - Please Confirm'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    locationConfirmed ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {address}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                  {!locationConfirmed && (
                    <button
                      onClick={() => setLocationConfirmed(true)}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      ✓ Confirm This Location
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Address Input */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Address
            </label>
            <input
              type="text"
              placeholder="e.g., Street Name, Building Number"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {selectedLocation && !locationConfirmed 
                ? 'Click "Confirm This Location" above to proceed' 
                : 'Drag the red marker to your exact building location'
              }
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!selectedLocation || !locationConfirmed}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {!selectedLocation ? (
              <span>📍 Select Location First</span>
            ) : !locationConfirmed ? (
              <span>⏳ Confirm Location Above</span>
            ) : (
              <span>✅ Use This Location</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
