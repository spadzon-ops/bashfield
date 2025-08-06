import { useState } from 'react'

export default function MapPicker({ isOpen, onClose, onLocationSelect, initialCenter = [36.1911, 44.0093], selectedCity = 'erbil' }) {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [address, setAddress] = useState('')
  const [clickPosition, setClickPosition] = useState({ x: 50, y: 50 })

  // City coordinates and info
  const cityData = {
    erbil: { coords: [36.1911, 44.0093], name: 'Erbil' },
    baghdad: { coords: [33.3152, 44.3661], name: 'Baghdad' },
    basra: { coords: [30.5085, 47.7804], name: 'Basra' },
    mosul: { coords: [36.3350, 43.1189], name: 'Mosul' },
    sulaymaniyah: { coords: [35.5650, 45.4347], name: 'Sulaymaniyah' },
    najaf: { coords: [32.0000, 44.3333], name: 'Najaf' },
    karbala: { coords: [32.6160, 44.0242], name: 'Karbala' },
    kirkuk: { coords: [35.4681, 44.3922], name: 'Kirkuk' },
    duhok: { coords: [36.8617, 42.9789], name: 'Duhok' }
  }

  const getCurrentCity = () => {
    return cityData[selectedCity] || { coords: initialCenter, name: 'Selected City' }
  }

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setClickPosition({ x, y })
    
    // Convert click position to approximate coordinates
    const city = getCurrentCity()
    const lat = city.coords[0] + (50 - y) * 0.01 // Rough conversion
    const lng = city.coords[1] + (x - 50) * 0.01
    
    setSelectedLocation({ lat, lng })
    setAddress(`${city.name}, Iraq (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
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
          <p className="text-gray-600 mt-2">Click on the map to mark your property's approximate location in {getCurrentCity().name}</p>
        </div>

        <div className="p-6">
          {/* Simple Map */}
          <div 
            className="w-full h-96 rounded-lg border-2 border-gray-200 overflow-hidden cursor-crosshair relative"
            onClick={handleMapClick}
            style={{
              backgroundImage: `url('data:image/svg+xml,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
                  <rect width="400" height="300" fill="#f0f9ff"/>
                  <g stroke="#e5e7eb" stroke-width="1" fill="none">
                    ${Array.from({length: 20}, (_, i) => `<line x1="${i*20}" y1="0" x2="${i*20}" y2="300"/>`).join('')}
                    ${Array.from({length: 15}, (_, i) => `<line x1="0" y1="${i*20}" x2="400" y2="${i*20}"/>`).join('')}
                  </g>
                  <circle cx="200" cy="150" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
                  <text x="200" y="170" text-anchor="middle" fill="#3b82f6" font-size="12" font-family="Arial">${getCurrentCity().name}</text>
                  <g fill="#6b7280" font-size="10" font-family="Arial">
                    <text x="10" y="20">🏢 City Center</text>
                    <text x="10" y="35">🏠 Residential Areas</text>
                    <text x="10" y="50">🛣️ Main Roads</text>
                  </g>
                </svg>
              `)}')`),
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {selectedLocation && (
              <div 
                className="absolute w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${clickPosition.x}%`, top: `${clickPosition.y}%` }}
              >
                <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  📍 Selected Location
                </div>
              </div>
            )}
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
              Property Address
            </label>
            <input
              type="text"
              placeholder={`e.g., Street Name, ${getCurrentCity().name}`}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Click on the map above to set approximate coordinates</p>
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
