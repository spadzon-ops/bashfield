import { useState, useEffect, useRef } from 'react'

export default function MapPicker({ isOpen, onClose, onLocationSelect, initialCenter = [36.1911, 44.0093], selectedCity = 'erbil' }) {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [address, setAddress] = useState('')
  const mapRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [currentLayer, setCurrentLayer] = useState('street')
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

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
        loadGoogleMap()
      } else if (mapInstanceRef.current) {
        setTimeout(() => {
          window.google.maps.event.trigger(mapInstanceRef.current, 'resize')
        }, 100)
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      setMapLoaded(false)
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [isOpen])

  const loadGoogleMap = () => {
    if (!window.google) {
      const script = document.createElement('script')
      script.src = 'https://maps.googleapis.com/maps/api/js?libraries=geometry'
      script.onload = () => {
        initializeMap()
      }
      document.head.appendChild(script)
    } else {
      initializeMap()
    }
  }

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    const center = getCityCenter()
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: center[0], lng: center[1] },
      zoom: 13,
      mapTypeId: currentLayer === 'street' ? 'roadmap' : 'satellite'
    })
    mapInstanceRef.current = map

    const marker = new window.google.maps.Marker({
      position: { lat: center[0], lng: center[1] },
      map: map,
      draggable: true
    })
    markerRef.current = marker

    const updateLocation = (lat, lng) => {
      setSelectedLocation({ lat, lng })
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    }

    marker.addListener('dragend', function() {
      const position = marker.getPosition()
      updateLocation(position.lat(), position.lng())
    })

    map.addListener('click', function(e) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      if (markerRef.current) {
        markerRef.current.setPosition({ lat, lng })
        updateLocation(lat, lng)
      }
    })

    updateLocation(center[0], center[1])
    setMapLoaded(true)
  }

  const switchMapLayer = (layerType) => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current
    
    if (layerType === 'street') {
      map.setMapTypeId('roadmap')
    } else if (layerType === 'satellite') {
      map.setMapTypeId('satellite')
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full h-full sm:h-auto sm:max-h-[95vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📍 Select Property Location</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-2">Click on the map or drag the marker to your exact property location</p>
        </div>

        <div className="p-4 sm:p-6">
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
          
          <div className="w-full h-64 sm:h-80 md:h-96 rounded-lg border-2 border-gray-200 overflow-hidden relative">
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
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-blue-500">📍</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{address}</p>
                </div>
              </div>
            </div>
          )}

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
              Drag the red marker to your exact building location
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {!selectedLocation ? (
              <span>📍 Select Location First</span>
            ) : (
              <span>✅ Confirm Location</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
