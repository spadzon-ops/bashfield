import { useMode, MODES, getModeConfig } from '../contexts/ModeContext'
import { useTranslation } from '../contexts/TranslationContext'

export default function PostModeSwitcher() {
  const { mode, switchMode } = useMode()
  const { t } = useTranslation()
  const modeConfig = getModeConfig(t)

  return (
    <div className="flex justify-center">
      <div className="inline-flex bg-white rounded-2xl shadow-xl border-2 border-blue-200 p-2">
        {Object.entries(MODES).map(([key, value]) => (
          <button
            key={key}
            onClick={() => switchMode(value)}
            className={`px-6 py-3 rounded-xl text-base font-bold transition-all duration-300 flex items-center space-x-3 min-w-[160px] justify-center ${
              mode === value
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <span className="text-xl">{modeConfig[value].icon}</span>
            <span>{modeConfig[value].label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}