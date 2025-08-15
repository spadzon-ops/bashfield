import { createContext, useContext, useState, useEffect } from 'react'

const ModeContext = createContext()

export const MODES = {
  RENT: 'rent',
  SALE: 'sale'
}

export const MODE_CONFIG = {
  [MODES.RENT]: {
    label: 'Renting',
    icon: '🏠',
    priceLabel: 'per month',
    actionLabel: 'List for Rent',
    searchLabel: 'Search Rentals',
    heroTitle: 'Find Your Dream Home Today',
    heroSubtitle: 'Find and list rental properties across major cities with ease.'
  },
  [MODES.SALE]: {
    label: 'Buying & Selling',
    icon: '🏡',
    priceLabel: 'total price',
    actionLabel: 'List for Sale',
    searchLabel: 'Search Properties',
    heroTitle: 'Buy or Sell Properties',
    heroSubtitle: 'Discover and list properties for sale across major cities.'
  }
}

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
    <ModeContext.Provider value={{ mode, switchMode, config: MODE_CONFIG[mode] }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const context = useContext(ModeContext)
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider')
  }
  return context
}