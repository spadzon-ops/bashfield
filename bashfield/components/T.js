import useComprehensiveTranslations from '../hooks/useComprehensiveTranslations'

// Universal Translation Component - wraps any text and translates it
export default function T({ children, ...props }) {
  const { t } = useComprehensiveTranslations()
  
  // If children is a string, translate it
  if (typeof children === 'string') {
    return <span {...props}>{t(children)}</span>
  }
  
  // If children is not a string, return as is
  return <span {...props}>{children}</span>
}

// Alternative usage as a function
export function translate(text) {
  const { t } = useComprehensiveTranslations()
  return t(text)
}