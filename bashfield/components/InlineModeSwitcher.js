import { useMode, MODES, MODE_CONFIG } from '../contexts/ModeContext'

export default function InlineModeSwitcher({ onModeChange }) {
  const { mode, switchMode } = useMode()

  const handleModeSwitch = (newMode) => {
    switchMode(newMode)
    if (onModeChange) {
      onModeChange()
    }
  }

  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex items-center bg-white rounded-2xl shadow-lg border border-gray-200 p-1">
        {Object.entries(MODES).map(([key, value]) => (
          <button
            key={key}
            onClick={() => handleModeSwitch(value)}
            className={`px-4 py-2 rounded-xl text-lg font-bold transition-all duration-300 flex items-center space-x-2 ${
              mode === value
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md transform scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span>{MODE_CONFIG[value].icon}</span>
            <span>{value === 'rent' ? 'Rental' : 'Sale'} Properties</span>
          </button>
        ))}
      </div>
      <div className="ml-3 text-sm text-gray-500">
        <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
        <span className="ml-1">Switch</span>
      </div>
    </div>
  )
}