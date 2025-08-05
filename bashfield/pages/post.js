import { useState, useEffect } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase, CITIES } from '../lib/supabase'
import MapPicker from '../components/MapPicker'

export default function Post() {
  const { t } = useTranslation('common')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'USD',
    city: 'erbil',
    rooms: 1,
    phone: '',
    latitude: null,
    longitude: null,
    address: '',
    images: []
  })
  const [showMap, setShowMap] = useState(false)
  const [mapCenter, setMapCenter] = useState([36.1911, 44.0093]) // Erbil coordinates

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    const uploadedImages = []

    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('house-images')
        .upload(fileName, file)

      if (!error) {
        uploadedImages.push(fileName)
      }
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...uploadedImages]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validate required fields
    if (!formData.latitude || !formData.longitude) {
      alert('Please select a location on the map')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('listings')
      .insert([{
        ...formData,
        price: parseInt(formData.price),
        user_id: user.id,
        user_email: user.email
      }])

    if (error) {
      console.error('Error creating listing:', error)
      alert('Error submitting listing. Please try again.')
    } else {
      // Redirect to success page
      window.location.href = '/post-success'
    }
    setLoading(false)
  }

  const handleMapClick = (lat, lng, address) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }))
    setShowMap(false)
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-400 text-lg">{t('post.loginRequired')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('post.title')}</h1>
        <p className="text-xl text-gray-600">Share your property with thousands of potential tenants</p>
      </div>

      {success && (
        <div className="card p-6 mb-8 border-l-4 border-green-500 bg-green-50">
          <div className="flex items-center">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <h3 className="font-semibold text-green-800">Success!</h3>
              <p className="text-green-700">{t('post.success')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">🏠</span>
              Property Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🏷️ {t('post.form.title')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Beautiful 3BR Apartment in Erbil Center"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📝 {t('post.form.description')}
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Describe your property, amenities, nearby facilities, etc."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  💰 Monthly Rent
                </label>
                <div className="flex space-x-3">
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="input-field w-24"
                  >
                    <option value="USD">USD</option>
                    <option value="IQD">IQD</option>
                  </select>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder={formData.currency === 'USD' ? '500' : '500000'}
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="input-field pr-16"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                      {formData.currency}/month
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📱 WhatsApp Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+964 750 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +964 for Iraq)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🛏️ {t('post.form.rooms')}
                </label>
                <select
                  value={formData.rooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, rooms: parseInt(e.target.value) }))}
                  className="input-field"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Room' : 'Rooms'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📍 {t('post.form.city')}
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="input-field"
                >
                  {CITIES.map(city => (
                    <option key={city} value={city}>{t(`cities.${city}`)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🗺️ Property Location
                </label>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowMap(true)}
                    className={`w-full p-4 border-2 border-dashed rounded-lg text-center transition-colors ${
                      formData.latitude ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {formData.latitude ? (
                      <div>
                        <span className="text-2xl block mb-2">✅</span>
                        <p className="font-medium text-green-800">Location Selected</p>
                        <p className="text-sm text-green-600">{formData.address}</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-2xl block mb-2">🗺️</span>
                        <p className="font-medium text-gray-700">Click to Select Location on Map</p>
                        <p className="text-sm text-gray-500">Required for listing approval</p>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">📷</span>
              Property Images
            </h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📷</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Property Images</h3>
                <p className="text-gray-600 mb-4">Drag and drop or click to select multiple images</p>
                <div className="btn-secondary inline-block">
                  Choose Images
                </div>
              </label>
              
              {formData.images.length > 0 && (
                <div className="mt-6">
                  <p className="text-green-600 font-medium">
                    ✓ {formData.images.length} image(s) uploaded successfully
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('post.form.submitting')}</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>{t('post.form.submit')}</span>
                </>
              )}
            </button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              Your listing will be reviewed by our team before going live
            </p>
          </div>
        </form>
      </div>

      {/* Map Picker Modal */}
      <MapPicker
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        onLocationSelect={handleMapClick}
        initialCenter={mapCenter}
      />
    </div>
  )
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}
