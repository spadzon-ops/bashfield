import { useMode, MODES, MODE_CONFIG } from '../contexts/ModeContext'

export default function ModeSwitcher({ onModeChange }) {
  const { mode, switchMode } = useMode()

  const handleModeSwitch = (newMode) => {
    switchMode(newMode)
    if (onModeChange) {
      onModeChange()
    }
  }

  return (
    <div className="inline-flex bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-lg rounded-2xl p-1.5 border-2 border-white/30 shadow-2xl">
      {Object.entries(MODES).map(([key, value]) => (
        <button
          key={key}
          onClick={() => handleModeSwitch(value)}
          className={`px-6 py-3 rounded-xl text-base font-bold transition-all duration-500 flex items-center space-x-3 min-w-[140px] justify-center ${
            mode === value
              ? 'bg-white text-blue-700 shadow-xl transform scale-110 ring-4 ring-white/50'
              : 'text-white/90 hover:text-white hover:bg-white/20 hover:scale-105'
          }`}
        >
          <span className="text-xl">{MODE_CONFIG[value].icon}</span>
          <span>{MODE_CONFIG[value].label}</span>
        </button>
      ))}
    </div>
  )
}