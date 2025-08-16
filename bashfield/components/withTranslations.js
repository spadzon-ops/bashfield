import React from 'react'
import useComprehensiveTranslations from '../hooks/useComprehensiveTranslations'

// Higher-order component that provides translation function to any component
export default function withTranslations(WrappedComponent) {
  return function TranslatedComponent(props) {
    const { t, currentLang } = useComprehensiveTranslations()
    
    return (
      <WrappedComponent 
        {...props} 
        t={t} 
        currentLang={currentLang}
      />
    )
  }
}

// Hook version for functional components
export function useTranslate() {
  const { t, currentLang } = useComprehensiveTranslations()
  return { t, currentLang }
}