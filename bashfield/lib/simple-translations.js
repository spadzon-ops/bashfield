const translations = {
  en: {
    "Home": "Home",
    "Messages": "Messages", 
    "Favorites": "Favorites",
    "Profile": "Profile",
    "Admin": "Admin",
    "Login": "Login",
    "Logout": "Logout",
    "Sign In": "Sign In",
    "Sign Up": "Sign Up",
    "Add Property": "Add Property",
    "View Profile": "View Profile",
    "Loading...": "Loading...",
    "Save": "Save",
    "Cancel": "Cancel",
    "Edit": "Edit",
    "Delete": "Delete",
    "Search": "Search",
    "Filter": "Filter",
    "Clear": "Clear",
    "Apply": "Apply",
    "Back": "Back",
    "Next": "Next",
    "Yes": "Yes",
    "No": "No",
    "Close": "Close",
    "Find Your Perfect Home in Iraq": "Find Your Perfect Home in Iraq",
    "Discover amazing rental properties in Erbil and across Iraq": "Discover amazing rental properties in Erbil and across Iraq",
    "All Cities": "All Cities",
    "All Types": "All Types",
    "Any Rooms": "Any Rooms",
    "Min Size": "Min Size",
    "Min Price": "Min Price",
    "Max Price": "Max Price",
    "Grid": "Grid",
    "List": "List",
    "Map": "Map",
    "Sort by": "Sort by",
    "Default": "Default",
    "Newest First": "Newest First",
    "Price: Low to High": "Price: Low to High",
    "Price: High to Low": "Price: High to Low"
  },
  ku: {
    "Home": "ماڵەوە",
    "Messages": "پەیامەکان",
    "Favorites": "دڵخوازەکان", 
    "Profile": "پرۆفایل",
    "Admin": "بەڕێوەبەر",
    "Login": "چوونەژوورەوە",
    "Logout": "دەرچوون",
    "Sign In": "چوونەژوورەوە",
    "Sign Up": "خۆتۆمارکردن",
    "Add Property": "جایداد زیاد بکە",
    "View Profile": "بینینی پرۆفایل",
    "Loading...": "باردەکرێت...",
    "Save": "پاشەکەوت",
    "Cancel": "هەڵوەشاندنەوە",
    "Edit": "دەستکاری",
    "Delete": "سڕینەوە",
    "Search": "گەڕان",
    "Filter": "فلتەر",
    "Clear": "پاککردنەوە",
    "Apply": "جێبەجێکردن",
    "Back": "گەڕانەوە",
    "Next": "دواتر",
    "Yes": "بەڵێ",
    "No": "نەخێر",
    "Close": "داخستن",
    "Find Your Perfect Home in Iraq": "ماڵی گونجاوی خۆت لە عێراق بدۆزەوە",
    "Discover amazing rental properties in Erbil and across Iraq": "جایدادەکانی کرێیەری سەرنجڕاکێش بدۆزەوە لە هەولێر و سەرتاسەری عێراق",
    "All Cities": "هەموو شارەکان",
    "All Types": "هەموو جۆرەکان",
    "Any Rooms": "هەر ژوورێک",
    "Min Size": "کەمترین قەبارە",
    "Min Price": "کەمترین نرخ",
    "Max Price": "زۆرترین نرخ",
    "Grid": "تۆڕ",
    "List": "لیست",
    "Map": "نەخشە",
    "Sort by": "ڕیزکردن بە پێی",
    "Default": "بنەڕەتی",
    "Newest First": "نوێترین سەرەتا",
    "Price: Low to High": "نرخ: کەم بۆ زۆر",
    "Price: High to Low": "نرخ: زۆر بۆ کەم"
  },
  ar: {
    "Home": "الرئيسية",
    "Messages": "الرسائل",
    "Favorites": "المفضلات",
    "Profile": "الملف الشخصي", 
    "Admin": "الإدارة",
    "Login": "تسجيل الدخول",
    "Logout": "تسجيل الخروج",
    "Sign In": "تسجيل الدخول",
    "Sign Up": "إنشاء حساب",
    "Add Property": "إضافة عقار",
    "View Profile": "عرض الملف الشخصي",
    "Loading...": "جاري التحميل...",
    "Save": "حفظ",
    "Cancel": "إلغاء",
    "Edit": "تعديل",
    "Delete": "حذف",
    "Search": "بحث",
    "Filter": "تصفية",
    "Clear": "مسح",
    "Apply": "تطبيق",
    "Back": "رجوع",
    "Next": "التالي",
    "Yes": "نعم",
    "No": "لا",
    "Close": "إغلاق",
    "Find Your Perfect Home in Iraq": "اعثر على منزلك المثالي في العراق",
    "Discover amazing rental properties in Erbil and across Iraq": "اكتشف عقارات إيجار مذهلة في أربيل وأنحاء العراق",
    "All Cities": "جميع المدن",
    "All Types": "جميع الأنواع",
    "Any Rooms": "أي غرف",
    "Min Size": "أقل مساحة",
    "Min Price": "أقل سعر",
    "Max Price": "أعلى سعر",
    "Grid": "شبكة",
    "List": "قائمة",
    "Map": "خريطة",
    "Sort by": "ترتيب حسب",
    "Default": "افتراضي",
    "Newest First": "الأحدث أولاً",
    "Price: Low to High": "السعر: من الأقل للأعلى",
    "Price: High to Low": "السعر: من الأعلى للأقل"
  }
}

export function t(key, lang = null) {
  if (!lang && typeof window !== 'undefined') {
    lang = localStorage.getItem('language') || 'en'
  }
  lang = lang || 'en'
  return translations[lang]?.[key] || translations.en[key] || key
}

export function setLanguage(lang) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lang)
    window.dispatchEvent(new Event('languageChanged'))
  }
}

export function getCurrentLanguage() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('language') || 'en'
  }
  return 'en'
}

export default translations