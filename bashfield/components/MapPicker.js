import { useState, useEffect, useRef } from 'react'

export default function MapPicker({ isOpen, onClose, onLocationSelect, initialCenter = [36.1911, 44.0093] }) {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [address, setAddress] = useState('')
  const mapRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (isOpen && !mapLoaded) {
      loadGoogleMaps()
    }
  }, [isOpen])

  const loadGoogleMaps = () => {
    if (window.google) {
      initializeMap()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      initializeMap()
    }
    document.head.appendChild(script)
  }

  const initializeMap = () => {
    if (!mapRef.current) return

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: initialCenter[0], lng: initialCenter[1] },
      zoom: 13,
      mapTypeId: 'roadmap',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'on' }]
        }
      ]
    })

    let marker = new window.google.maps.Marker({
      position: { lat: initialCenter[0], lng: initialCenter[1] },
      map: map,
      draggable: true,
      title: 'Property Location'
    })

    const geocoder = new window.google.maps.Geocoder()

    const updateLocation = (lat, lng) => {
      setSelectedLocation({ lat, lng })
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setAddress(results[0].formatted_address)
        } else {
          setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        }
      })
    }

    map.addListener('click', (event) => {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()
      marker.setPosition({ lat, lng })
      updateLocation(lat, lng)
    })

    marker.addListener('dragend', (event) => {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()
      updateLocation(lat, lng)
    })

    setMapLoaded(true)
  }

  if (!isOpen) return null

  const handleMapClick = () => {
    // This is now handled by Google Maps
  }

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
          <p className="text-gray-600 mt-2">Click on the map to mark your property's exact location</p>
        </div>

        <div className="p-6">
          {/* Google Maps */}
          <div className="w-full h-96 rounded-lg border-2 border-gray-200 overflow-hidden">
            {!mapLoaded && (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading interactive map...</p>
                </div>
              </div>
            )}
            <div 
              ref={mapRef}
              className="w-full h-full"
              style={{ display: mapLoaded ? 'block' : 'none' }}
            />
          </div>
          
          {selectedLocation && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <span className="text-green-500 text-xl mt-1">📍</span>
                <div>
                  <p className="font-medium text-green-800">Location Selected</p>
                  <p className="text-sm text-green-600 mt-1">{address}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Address Input */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Address (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., 123 Main Street, Erbil"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
            disabled={!selectedLocation}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  )
}
