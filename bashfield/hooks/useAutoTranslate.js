import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { translateText, detectLanguage } from '../lib/translator'

export function useAutoTranslate() {
  const router = useRouter()
  const currentLang = router.locale || 'en'

  const translateContent = async (content, sourceLang = null) => {
    if (!content || currentLang === 'en') return content
    
    const detectedLang = sourceLang || detectLanguage(content)
    if (detectedLang === currentLang) return content
    
    return await translateText(content, detectedLang, currentLang)
  }

  const translateListing = async (listing) => {
    if (!listing || currentLang === 'en') return listing

    const sourceLang = detectLanguage(listing.title + ' ' + listing.description)
    if (sourceLang === currentLang) return listing

    return {
      ...listing,
      title: await translateText(listing.title, sourceLang, currentLang),
      description: await translateText(listing.description, sourceLang, currentLang),
      city: await translateText(listing.city, sourceLang, currentLang)
    }
  }

  const translateMessage = async (message) => {
    if (!message?.content || currentLang === 'en') return message

    const sourceLang = detectLanguage(message.content)
    if (sourceLang === currentLang) return message

    return {
      ...message,
      content: await translateText(message.content, sourceLang, currentLang),
      originalContent: message.content,
      originalLanguage: sourceLang
    }
  }

  return {
    currentLang,
    translateContent,
    translateListing,
    translateMessage
  }
}