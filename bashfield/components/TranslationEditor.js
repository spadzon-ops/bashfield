import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TranslationEditor({ listing, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [translations, setTranslations] = useState({
    en: listing.description || '',
    ku: listing.description_ku || '',
    ar: listing.description_ar || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('listings')
        .update({
          description: translations.en.trim() || null,
          description_ku: translations.ku.trim() || null,
          description_ar: translations.ar.trim() || null
        })
        .eq('id', listing.id)

      if (error) throw error

      onUpdate({
        ...listing,
        description: translations.en.trim() || null,
        description_ku: translations.ku.trim() || null,
        description_ar: translations.ar.trim() || null
      })
      
      setIsEditing(false)
      alert('Translations saved successfully!')
    } catch (error) {
      console.error('Error saving translations:', error)
      alert('Error saving translations: ' + error.message)
    }
    setSaving(false)
  }

  const handleCancel = () => {
    setTranslations({
      en: listing.description || '',
      ku: listing.description_ku || '',
      ar: listing.description_ar || ''
    })
    setIsEditing(false)
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-blue-800 flex items-center gap-2">
          🌐 Property Description Translations
        </h4>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            ✏️ Edit Translations
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium mb-1">📝 User Description (Original)</p>
          <p className="text-xs text-yellow-700">This is what the user originally posted. Translate to all three languages below.</p>
          <div className="mt-2 p-2 bg-white rounded text-sm text-gray-700 max-h-24 overflow-y-auto">
            {listing.description}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🇺🇸 English Translation
          </label>
          {isEditing ? (
            <textarea
              value={translations.en}
              onChange={(e) => setTranslations(prev => ({ ...prev, en: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Enter English translation..."
            />
          ) : (
            <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-700 max-h-32 overflow-y-auto">
              {listing.description || (
                <span className="text-gray-400 italic">No English translation available</span>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🟡 Kurdish Translation
          </label>
          {isEditing ? (
            <textarea
              value={translations.ku}
              onChange={(e) => setTranslations(prev => ({ ...prev, ku: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Enter Kurdish translation..."
              dir="rtl"
            />
          ) : (
            <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-700 max-h-32 overflow-y-auto" dir="rtl">
              {listing.description_ku || (
                <span className="text-gray-400 italic">No Kurdish translation available</span>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🇮🇶 Arabic Translation
          </label>
          {isEditing ? (
            <textarea
              value={translations.ar}
              onChange={(e) => setTranslations(prev => ({ ...prev, ar: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Enter Arabic translation..."
              dir="rtl"
            />
          ) : (
            <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-700 max-h-32 overflow-y-auto" dir="rtl">
              {listing.description_ar || (
                <span className="text-gray-400 italic">No Arabic translation available</span>
              )}
            </div>
          )}
        </div>

        {isEditing && (
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-semibold transition-colors"
            >
              {saving ? 'Saving...' : '💾 Save Translations'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              ❌ Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}