import useComprehensiveTranslations from '../hooks/useComprehensiveTranslations'

// Universal translation component that can translate any text
export default function TranslateText({ text, children, className, ...props }) {
  const { t } = useComprehensiveTranslations()
  
  // Use text prop or children
  const textToTranslate = text || children
  
  // If it's a string, translate it
  if (typeof textToTranslate === 'string') {
    return (
      <span className={className} {...props}>
        {t(textToTranslate)}
      </span>
    )
  }
  
  // If it's not a string, return as is
  return (
    <span className={className} {...props}>
      {textToTranslate}
    </span>
  )
}

// Export a shorthand version
export const T = TranslateText