import { useEffect } from 'react'

export const useNoTranslate = () => {
  useEffect(() => {
    const addNoTranslateClasses = () => {
      const selectors = [
        '[data-username]',
        '[data-message]',
        '[data-account-name]',
        '.user-name',
        '.username',
        '.account-name',
        '.message-content',
        '.profile-name',
        '.owner-name',
        '.display-name'
      ]

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => {
          if (!el.classList.contains('notranslate')) {
            el.classList.add('notranslate')
          }
        })
      })
    }

    addNoTranslateClasses()

    const observer = new MutationObserver(() => {
      setTimeout(addNoTranslateClasses, 100)
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => observer.disconnect()
  }, [])
}

export default useNoTranslate