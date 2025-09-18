import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase, CITIES, PROPERTY_TYPES } from '../../../lib/supabase'
import MapPicker from '../../../components/MapPicker'

export default function AdminEditListing() {
  const router = useRouter()
  const { id } = router.query
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [listing, setListing] = useState(null)
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
    images: [],
    size_sqm: '',
    property_type: 'apartment',
    has_installments: false,
    status: 'pending',
    is_active: true
  })
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)

      const { data: adminMatch } = await supabase
        .from('admin_emails')
        .select('email')
        .eq('email', user.email)
        .maybeSingle()

      if (!adminMatch) {
        router.push('/')
        return
      }
      setIsAdmin(true)

      if (id) {
        await loadListing()
      }
      setLoading(false)
    }
    checkAuth()
  }, [id])

  const loadListing = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      alert('Listing not found')
      router.push('/admin')
      return
    }

    setListing(data)
    setFormData({
      title: data.title || '',
      description: data.description || '',
      price: data.price?.toString() || '',
      currency: data.currency || 'USD',
      city: data.city || 'erbil',
      rooms: data.rooms || 1,
      phone: data.phone || '',
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address || '',
      images: data.images || [],
      size_sqm: data.size_sqm?.toString() || '',
      property_type: data.property_type || 'apartment',
      has_installments: data.has_installments || false,
      status: data.status || 'pending',
      is_active: data.is_active !== false
    })
  }

  const compressImage = (file, maxSizeKB = 200) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        const maxWidth = 1200
        const maxHeight = 800
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        let quality = 0.8
        const compress = () => {
          canvas.toBlob((blob) => {
            if (blob.size <= maxSizeKB * 1024 || quality <= 0.1) {
              resolve(blob)
            } else {
              quality -= 0.1
              compress()
            }
          }, 'image/jpeg', quality)
        }
        compress()
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length + formData.images.length > 10) {
      alert('Maximum 10 images allowed')
      return
    }

    setImageLoading(true)
    const uploadedImages = []

    for (const file of files) {
      if (file.size > 15 * 1024 * 1024) {
        alert(`${file.name} is too large (max 15MB)`)
        continue
      }

      try {
        const compressedBlob = await compressImage(file, 200)
        const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' })
        
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/\.[^/.]+$/, '')}.jpg`
        const { data, error } = await supabase.storage
          .from('house-images')
          .upload(fileName, compressedFile)

        if (!error) {
          uploadedImages.push(fileName)
        }
      } catch (err) {
        console.error('Error compressing image:', err)
      }
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...uploadedImages]
    }))
    setImageLoading(false)
  }

  const removeImage = async (index) => {
    const imageToRemove = formData.images[index]
    
    // Remove from storage
    await supabase.storage
      .from('house-images')
      .remove([imageToRemove])

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    setSaving(true)

    try {
      if (!formData.phone?.trim()) {
        alert('Please enter WhatsApp number')
        setSaving(false)
        return
      }

      if (formData.images.length === 0) {
        alert('Please upload at least one image')
        setSaving(false)
        return
      }

      const updateData = {
        title: formData.title,
        description: formData.description,
        price: parseInt(formData.price),
        currency: formData.currency,
        city: formData.city,
        rooms: parseInt(formData.rooms),
        phone: formData.phone,
        latitude: formData.latitude || 36.1911,
        longitude: formData.longitude || 44.0093,
        address: formData.address || `${formData.city}, Iraq`,
        images: formData.images,
        size_sqm: parseInt(formData.size_sqm) || null,
        property_type: formData.property_type,
        has_installments: formData.has_installments,
        status: formData.status,
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('Error updating listing:', error)
        alert('Error updating listing: ' + error.message)
      } else {
        alert('Listing updated successfully!')
        router.push('/admin')
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Unexpected error occurred')
    }
    
    setSaving(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Listing Not Found</h1>
          <button 
            onClick={() => router.push('/admin')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Admin
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4 mb-6">
            <button 
              onClick={() => router.push('/admin')}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Admin</span>
            </button>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">✏️</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-3">Edit Property</h1>
            <p className="text-gray-600 text-lg">Admin editing: {listing.reference_code}</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100">
          <div className="space-y-6">
            {/* Status and Active Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Active Status</label>
                <select
                  value={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {/* Basic Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Title *</label>
              <input
                type="text"
                required
                maxLength={200}
                placeholder="Enter property title..."
                value={formData.title}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setFormData(prev => ({ ...prev, title: e.target.value }))
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-500 mt-1">{formData.title.length}/200</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                required
                rows={4}
                maxLength={4500}
                placeholder="Describe the property..."
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= 4500) {
                    setFormData(prev => ({ ...prev, description: e.target.value }))
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="text-xs text-gray-500 mt-1">{formData.description.length}/4500</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                <div className="flex">
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-20 px-3 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                  </select>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="500"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="flex-1 px-4 py-3 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+964 750 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, property_type: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {PROPERTY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rooms *</label>
                <select
                  value={formData.rooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, rooms: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'room' : 'rooms'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Size (m²) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="100"
                  value={formData.size_sqm}
                  onChange={(e) => setFormData(prev => ({ ...prev, size_sqm: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CITIES.map(city => (
                    <option key={city} value={city}>{city.charAt(0).toUpperCase() + city.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Location</label>
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
                    <p className="font-medium text-gray-700">Select Location on Map</p>
                    <p className="text-sm text-gray-500">Click to open map picker</p>
                  </div>
                )}
              </button>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Images</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={imageLoading}
                />
                <label htmlFor="image-upload" className={`cursor-pointer ${imageLoading ? 'opacity-50' : ''}`}>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {imageLoading ? (
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="text-2xl">📷</span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {imageLoading ? 'Uploading Images...' : 'Upload Images'}
                  </h3>
                  <p className="text-gray-600 mb-2">Add or replace property photos</p>
                  <div className={`px-6 py-2 rounded-lg inline-block transition-colors ${
                    imageLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}>
                    {imageLoading ? 'Uploading...' : 'Choose Images'}
                  </div>
                </label>
              </div>

              {formData.images.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Current Images ({formData.images.length}/10)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${image}`}
                          alt={`Property ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Installments for sale mode */}
            {listing.listing_mode === 'sale' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="installments"
                    checked={formData.has_installments}
                    onChange={(e) => setFormData(prev => ({ ...prev, has_installments: e.target.checked }))}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="installments" className="text-sm font-medium text-blue-900 cursor-pointer">
                      Accept Installments
                    </label>
                    <p className="text-xs text-blue-700 mt-1">
                      Check this if installment payments are accepted for this property.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Map Picker Modal */}
      <MapPicker
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        onLocationSelect={handleMapClick}
        selectedCity={formData.city}
        currentLocation={formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : null}
      />
    </div>
  )
}