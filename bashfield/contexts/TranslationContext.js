import { createContext, useContext, useState, useEffect } from 'react'

const TranslationContext = createContext()

const translations = {
  en: {
    // Navigation
    home: "Home",
    addProperty: "Add Property", 
    favorites: "Favorites",
    messages: "Messages",
    admin: "Admin",
    profile: "Profile",
    signIn: "Sign In",
    logout: "Logout",
    viewProfile: "View Profile",
    
    // Footer
    premierPropertyPlatform: "Premier Property Platform",
    listYourProperty: "List Your Property",
    scrollToTop: "Scroll to Top",
    quickLinks: "Quick Links",
    contact: "Contact",
    madeWithLove: "Made with ❤️ for everyone",
    allRightsReserved: "All rights reserved",
    footerDescription: "Premier house rental platform. Find your perfect home across major cities with trust and ease.",
    
    // Languages
    english: "English",
    kurdish: "Kurdish", 
    arabic: "Arabic"
  },
  ku: {
    // Navigation
    home: "سەرەتا",
    addProperty: "زیادکردنی ئۆفەر",
    favorites: "دڵخوازەکان", 
    messages: "نامەکان",
    admin: "بەڕێوەبەر",
    profile: "پرۆفایل",
    signIn: "چوونە ژوورەوە",
    logout: "چوونە دەرەوە",
    viewProfile: "بینینی پرۆفایل",
    
    // Footer
    premierPropertyPlatform: "پلاتفۆرمی سەرەکی ئۆفەر",
    listYourProperty: "تۆمارکردنی ئۆفەرت",
    scrollToTop: "بڕۆ بەرەو سەرەوە",
    quickLinks: "بەستەرە خێراکان",
    contact: "پەیوەندی",
    madeWithLove: "دروستکراوە بە ❤️ بۆ هەموو کەس",
    allRightsReserved: "هەموو مافەکان پارێزراون",
    footerDescription: "پلاتفۆرمی سەرەکی کرێی خانوو. ماڵەکەت بدۆزەوە لە شارە سەرانسەری گەورە بە متمانە و ئاسان.",
    
    // Languages
    english: "ئینگلیزی",
    kurdish: "کوردی",
    arabic: "عەرەبی"
  },
  ar: {
    // Navigation
    home: "الرئيسية",
    addProperty: "إضافة عقار",
    favorites: "المفضلة",
    messages: "الرسائل", 
    admin: "المشرف",
    profile: "الملف الشخصي",
    signIn: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    viewProfile: "عرض الملف الشخصي",
    
    // Footer
    premierPropertyPlatform: "المنصة المتميزة للعقارات",
    listYourProperty: "أدرج عقارك",
    scrollToTop: "الصعود للأعلى",
    quickLinks: "روابط سريعة",
    contact: "تواصل",
    madeWithLove: "صُنع بحب ❤️ للجميع",
    allRightsReserved: "جميع الحقوق محفوظة",
    footerDescription: "المنصة المتميزة لتأجير المنازل. ابحث عن منزلك المثالي في كبرى المدن بكل ثقة وسهولة.",
    
    // Languages
    english: "الإنجليزية",
    kurdish: "الكردية",
    arabic: "العربية"
  }
}

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState('en')

  useEffect(() => {
    const savedLanguage = localStorage.getItem('bashfield-language')
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage)
    }
  }, [])

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang)
      localStorage.setItem('bashfield-language', lang)
    }
  }

  const t = (key) => {
    return translations[language][key] || translations.en[key] || key
  }

  return (
    <TranslationContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  )
}

export const useTranslation = () => {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider')
  }
  return context
}