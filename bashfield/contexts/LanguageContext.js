import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    // Navigation
    home: 'Home',
    post: 'Post Property',
    admin: 'Admin',
    profile: 'Profile',
    messages: 'Messages',
    favorites: 'Favorites',
    
    // Common
    search: 'Search',
    filter: 'Filter',
    city: 'City',
    price: 'Price',
    rooms: 'Rooms',
    contact: 'Contact',
    details: 'Details',
    description: 'Description',
    location: 'Location',
    images: 'Images',
    
    // Property
    rent: 'For Rent',
    sale: 'For Sale',
    apartment: 'Apartment',
    house: 'House',
    villa: 'Villa',
    studio: 'Studio',
    
    // Cities
    erbil: 'Erbil',
    baghdad: 'Baghdad',
    basra: 'Basra',
    mosul: 'Mosul',
    sulaymaniyah: 'Sulaymaniyah',
    najaf: 'Najaf',
    karbala: 'Karbala',
    kirkuk: 'Kirkuk',
    duhok: 'Duhok',
    
    // Actions
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    approve: 'Approve',
    reject: 'Reject',
    
    // Status
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    
    // Auth
    login: 'Login',
    logout: 'Logout',
    signIn: 'Sign In with Google',
  },
  
  ku: {
    // Navigation
    home: 'سەرەتا',
    post: 'خانوو دابنێ',
    admin: 'بەڕێوەبەر',
    profile: 'پرۆفایل',
    messages: 'پەیامەکان',
    favorites: 'دڵخوازەکان',
    
    // Common
    search: 'گەڕان',
    filter: 'فلتەر',
    city: 'شار',
    price: 'نرخ',
    rooms: 'ژوور',
    contact: 'پەیوەندی',
    details: 'وردەکاری',
    description: 'باسکردن',
    location: 'شوێن',
    images: 'وێنەکان',
    
    // Property
    rent: 'بۆ کرێ',
    sale: 'بۆ فرۆشتن',
    apartment: 'شوقە',
    house: 'خانوو',
    villa: 'ڤیلا',
    studio: 'ستودیۆ',
    
    // Cities
    erbil: 'هەولێر',
    baghdad: 'بەغدا',
    basra: 'بەسرە',
    mosul: 'موسڵ',
    sulaymaniyah: 'سلێمانی',
    najaf: 'نەجەف',
    karbala: 'کەربەلا',
    kirkuk: 'کەرکووک',
    duhok: 'دهۆک',
    
    // Actions
    submit: 'ناردن',
    cancel: 'هەڵوەشاندنەوە',
    save: 'پاشەکەوتکردن',
    delete: 'سڕینەوە',
    edit: 'دەستکاریکردن',
    approve: 'پەسەندکردن',
    reject: 'ڕەتکردنەوە',
    
    // Status
    pending: 'چاوەڕوان',
    approved: 'پەسەندکراو',
    rejected: 'ڕەتکراوە',
    
    // Auth
    login: 'چوونەژوورەوە',
    logout: 'چوونەدەرەوە',
    signIn: 'بە گووگڵ بچۆرەوە',
  },
  
  ar: {
    // Navigation
    home: 'الرئيسية',
    post: 'إضافة عقار',
    admin: 'الإدارة',
    profile: 'الملف الشخصي',
    messages: 'الرسائل',
    favorites: 'المفضلة',
    
    // Common
    search: 'بحث',
    filter: 'تصفية',
    city: 'المدينة',
    price: 'السعر',
    rooms: 'الغرف',
    contact: 'اتصال',
    details: 'التفاصيل',
    description: 'الوصف',
    location: 'الموقع',
    images: 'الصور',
    
    // Property
    rent: 'للإيجار',
    sale: 'للبيع',
    apartment: 'شقة',
    house: 'منزل',
    villa: 'فيلا',
    studio: 'استوديو',
    
    // Cities
    erbil: 'أربيل',
    baghdad: 'بغداد',
    basra: 'البصرة',
    mosul: 'الموصل',
    sulaymaniyah: 'السليمانية',
    najaf: 'النجف',
    karbala: 'كربلاء',
    kirkuk: 'كركوك',
    duhok: 'دهوك',
    
    // Actions
    submit: 'إرسال',
    cancel: 'إلغاء',
    save: 'حفظ',
    delete: 'حذف',
    edit: 'تعديل',
    approve: 'موافقة',
    reject: 'رفض',
    
    // Status
    pending: 'قيد الانتظار',
    approved: 'مقبول',
    rejected: 'مرفوض',
    
    // Auth
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    signIn: 'تسجيل الدخول بجوجل',
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Load saved language from localStorage
    const saved = localStorage.getItem('bashfield-language');
    if (saved && ['en', 'ku', 'ar'].includes(saved)) {
      setLanguage(saved);
    }
  }, []);

  const changeLanguage = (lang) => {
    if (['en', 'ku', 'ar'].includes(lang)) {
      setLanguage(lang);
      localStorage.setItem('bashfield-language', lang);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const value = {
    language,
    changeLanguage,
    t,
    isRTL: language === 'ar'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}