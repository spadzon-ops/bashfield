import { createContext, useContext, useState, useEffect } from 'react'
import { useTranslation } from './TranslationContext'

const ModeContext = createContext()

export const MODES = {
  RENT: 'rent',
  SALE: 'sale'
}

export const getModeConfig = (t) => ({
  [MODES.RENT]: {
    label: t('renting'),
    icon: '🏠',
    priceLabel: t('perMonth'),
    actionLabel: t('listForRent'),
    searchLabel: t('browseRentals'),
    heroTitle: t('findYourDreamHome'),
    heroSubtitle: t('findAndListRentals')
  },
  [MODES.SALE]: {
    label: t('buyingSelling'),
    icon: '🏡',
    priceLabel: t('totalPrice'),
    actionLabel: t('listForSale'),
    searchLabel: t('browseProperties'),
    heroTitle: t('buyOrSellProperties'),
    heroSubtitle: t('discoverAndListSales')
  }
})

export function ModeProvider({ children }) {
  const [mode, setMode] = useState(MODES.RENT)

  useEffect(() => {
    const savedMode = localStorage.getItem('bashfield_mode')
    if (savedMode && Object.values(MODES).includes(savedMode)) {
      setMode(savedMode)
    }
  }, [])

  const switchMode = (newMode) => {
    setMode(newMode)
    localStorage.setItem('bashfield_mode', newMode)
  }

  return (
    <ModeContext.Provider value={{ mode, switchMode }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const context = useContext(ModeContext)
  const { t } = useTranslation()
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider')
  }
  const config = getModeConfig(t)[context.mode]
  return { ...context, config }
}