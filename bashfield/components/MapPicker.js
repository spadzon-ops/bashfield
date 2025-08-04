import { useState } from 'react'

export default function MapPicker({ isOpen, onClose, onLocationSelect, initialCenter = [36.1911, 44.0093] }) {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [address, setAddress] = useState('')

  if (!isOpen) return null

  const handleMapClick = (e) => {
    const lat = 36.1911 + (Math.random() - 0.5) * 0.1 // Simulate map click
    const lng = 44.0093 + (Math.random() - 0.5) * 0.1
    setSelectedLocation({ lat, lng })
    setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
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
          {/* Simplified Map Placeholder */}
          <div 
            className="w-full h-96 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg border-2 border-gray-200 relative cursor-crosshair"
            onClick={handleMapClick}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl block mb-4">🗺️</span>
                <p className="text-lg font-semibold text-gray-700">Interactive Map</p>
                <p className="text-gray-500">Click anywhere to select location</p>
                {selectedLocation && (
                  <div className="mt-4 p-3 bg-white rounded-lg shadow-lg">
                    <p className="font-medium text-green-600">📍 Location Selected</p>
                    <p className="text-sm text-gray-600">{address}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Simulated map markers for Iraqi cities */}
            <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
            <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
            <div className="absolute top-1/2 left-2/3 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
            
            {selectedLocation && (
              <div 
                className="absolute w-6 h-6 bg-yellow-500 rounded-full border-3 border-white shadow-lg animate-bounce"
                style={{ 
                  top: '45%', 
                  left: '55%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <span className="text-white text-xs">📍</span>
              </div>
            )}
          </div>

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