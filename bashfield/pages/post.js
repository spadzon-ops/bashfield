import { useState, useEffect } from 'react'
import { supabase, CITIES, PROPERTY_TYPES } from '../lib/supabase'
import MapPicker from '../components/MapPicker'
import AuthGuard from '../components/AuthGuard'
import PostModeSwitcher from '../components/PostModeSwitcher'
import { useMode } from '../contexts/ModeContext'
import { useTranslation } from '../contexts/TranslationContext'

export default function Post() {
  const { mode, config } = useMode()
  const { t } = useTranslation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
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
    has_installments: false
  })
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

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
    if (files.length > 10) {
      alert(t('maximumImagesAllowed'))
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

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      if (!formData.phone?.trim()) {
        alert(t('pleaseEnterWhatsapp'))
        setLoading(false)
        return
      }

      if (formData.images.length === 0) {
        alert(t('pleaseUploadImage'))
        setLoading(false)
        return
      }

      const listingData = {
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
        user_id: user.id,
        user_email: user.email,
        status: 'pending',
        size_sqm: parseInt(formData.size_sqm) || null,
        property_type: formData.property_type,
        listing_mode: mode,
        has_installments: mode === 'buy' ? formData.has_installments : false
      }

      const { error } = await supabase
        .from('listings')
        .insert([listingData])

      if (error) {
        console.error('Error creating listing:', error)
        alert(t('errorSubmittingListing') + ' ' + error.message)
      } else {
        window.location.href = '/post-success'
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert(t('unexpectedError'))
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

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.title || !formData.description || !formData.price || !formData.phone) {
        alert(t('pleaseFillRequired'))
        return
      }
    }
    if (currentStep === 2) {
      if (formData.images.length === 0) {
        alert(t('pleaseUploadImage'))
        return
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">🏠</span>
            </div>
            <div className="mb-6">
              <PostModeSwitcher />
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-3">{t('addYourProperty')}</h1>
            <p className="text-gray-600 text-lg">{t('reachThousands')}</p>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step <= currentStep 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  <div className={`hidden sm:block ml-2 text-sm font-medium ${
                    step <= currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step === 1 && t('details')}
                    {step === 2 && t('images')}
                    {step === 3 && t('review')}
                  </div>
                  {step < 3 && (
                    <div className={`flex-1 h-1 mx-4 ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">ℹ️</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('propertyDetails')}</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyTitle')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('propertyTitlePlaceholder')}
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('description')}
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder={formData.has_installments ? t('descriptionWithInstallments') : t('descriptionPlaceholder')}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  {formData.has_installments && (
                    <p className="text-sm text-blue-600 mt-2">
                      {t('installmentDescriptionNote')}
                    </p>
                  )}
                </div>

                {mode === 'buy' && (
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
                          {t('acceptInstallments')}
                        </label>
                        <p className="text-xs text-blue-700 mt-1">
                          {t('installmentOptionDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {mode === 'rent' ? t('monthlyRent') : t('salePrice')} *
                    </label>
                    <div className="flex">
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-20 px-3 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="USD">USD</option>
                        <option value="IQD">IQD</option>
                      </select>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder={formData.currency === 'USD' ? '500' : '500000'}
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="flex-1 px-4 py-3 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('whatsappNumber')}
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder={t('whatsappPlaceholder')}
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('propertyType')}
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('numberOfRooms')}
                    </label>
                    <select
                      value={formData.rooms}
                      onChange={(e) => setFormData(prev => ({ ...prev, rooms: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? t('room') : t('rooms')}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('sizeSquareMeters')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder={t('sizePlaceholder')}
                      value={formData.size_sqm}
                      onChange={(e) => setFormData(prev => ({ ...prev, size_sqm: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('city')}
                    </label>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyLocation')}
                  </label>
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
                        <p className="font-medium text-green-800">{t('locationSelected')}</p>
                        <p className="text-sm text-green-600">{formData.address}</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-2xl block mb-2">🗺️</span>
                        <p className="font-medium text-gray-700">{t('selectLocationOnMap')}</p>
                        <p className="text-sm text-gray-500">{t('optionalHelpsFind')}</p>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Images */}
          {currentStep === 2 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">📷</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('propertyImages')}</h2>
              </div>
              
              <div className="space-y-6">
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
                      {imageLoading ? t('uploadingImages') : t('uploadImages')}
                    </h3>
                    <p className="text-gray-600 mb-2">{t('addHighQualityPhotos')}</p>
                    <p className="text-sm text-blue-600 mb-4">Maximum allowed picture size is 15MB</p>
                    <div className={`px-6 py-2 rounded-lg inline-block transition-colors ${
                      imageLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}>
                      {imageLoading ? t('uploading') : t('chooseImages')}
                    </div>
                  </label>
                </div>

                {formData.images.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {t('uploadedImages')} ({formData.images.length}/10)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${image}`}
                            alt={`${t('property')} ${index + 1}`}
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
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('reviewSubmit')}</h2>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">{t('propertySummary')}</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>{t('title')}</strong> {formData.title}</div>
                    <div><strong>{t('type')}</strong> {PROPERTY_TYPES.find(type => type.value === formData.property_type)?.icon} {PROPERTY_TYPES.find(type => type.value === formData.property_type)?.label}</div>
                    <div><strong>{t('price')}</strong> {formData.price} {formData.currency}{mode === 'rent' ? t('perMonth') : ''}</div>
                    <div><strong>{t('roomsLabel')}</strong> {formData.rooms}</div>
                    <div><strong>{t('size')}</strong> {formData.size_sqm ? `${formData.size_sqm} m²` : t('notSpecified')}</div>
                    <div><strong>{t('city')}</strong> {formData.city.charAt(0).toUpperCase() + formData.city.slice(1)}</div>
                    <div><strong>{t('whatsapp')}</strong> {formData.phone}</div>
                    {mode === 'buy' && formData.has_installments && (
                      <div><strong>{t('installments')}</strong> {t('available')}</div>
                    )}
                    <div><strong>{t('imagesLabel')}</strong> {formData.images.length} {t('uploaded')}</div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-500 text-xl">ℹ️</span>
                    <div>
                      <h4 className="font-medium text-blue-900">{t('reviewProcess')}</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        {t('reviewProcessDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('previous')}
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {t('next')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('submitting')}</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>{t('submitListing')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map Picker Modal */}
      <MapPicker
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        onLocationSelect={handleMapClick}
        selectedCity={formData.city}
      />
      </div>
    </AuthGuard>
  )
}


