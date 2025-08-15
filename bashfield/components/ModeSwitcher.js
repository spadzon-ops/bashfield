import { useMode, MODES, MODE_CONFIG } from '../contexts/ModeContext'

export default function ModeSwitcher() {
  const { mode, switchMode } = useMode()

  return (
    <div className="inline-flex bg-white/10 backdrop-blur-sm rounded-2xl p-1 border border-white/20">
      {Object.entries(MODES).map(([key, value]) => (
        <button
          key={key}
          onClick={() => switchMode(value)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center space-x-2 ${
            mode === value
              ? 'bg-white text-blue-600 shadow-lg transform scale-105'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          <span>{MODE_CONFIG[value].icon}</span>
          <span>{MODE_CONFIG[value].label}</span>
        </button>
      ))}
    </div>
  )
}