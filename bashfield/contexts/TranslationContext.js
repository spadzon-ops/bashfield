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
    arabic: "Arabic",
    
    // Hero Section
    numberOnePlatform: "🏠 #1 Property Platform",
    rentHomesTagline: "Rent homes • List properties • Connect instantly",
    buyHomesTagline: "Buy homes • Sell properties • Connect instantly",
    
    // Room Options
    threePlusRooms: "3+ Rooms",
    fourPlusRooms: "4+ Rooms",
    fivePlusRooms: "5+ Rooms",
    
    // Filter Units
    plusSquareMeters: "+ m²"
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
    arabic: "عەرەبی",
    
    // Post Page
    addYourProperty: "زیادکردنی ئۆفەرەکەت",
    reachThousands: "دەگەیت بە هەزاران کرێخواز/کڕیار لە سەرانسەری عێراق",
    details: "وردەکاری",
    images: "وێنەکان",
    review: "پشکنین",
    propertyDetails: "وردەکاری ئۆفەر",
    propertyTitle: "ناونیشانی ئۆفەر *",
    propertyTitlePlaceholder: "بۆ نموونە، شوقەی نوێی ٢ ژوورخەوی لە ناوەندی هەولێر",
    description: "وەسف *",
    descriptionPlaceholder: "ئۆفەرەکەت، خزمەتگوزاریەکان و نزیکترین دەرگاکان باس بکە...",
    monthlyRent: "کرێی مانگانە",
    salePrice: "نرخ",
    whatsappNumber: "ژمارەی واتساپ *",
    whatsappPlaceholder: "+964 750 123 4567",
    propertyType: "جۆری ئۆفەر *",
    numberOfRooms: "ژمارەی ژوورەکان",
    room: "ژوور",
    rooms: "ژوور",
    sizeSquareMeters: "قەبارە (مەترێکی چوارگۆشە)",
    sizePlaceholder: "بۆ نموونە: ١٢٠",
    city: "شار",
    propertyLocation: "شوێنی ئۆفەر",
    locationSelected: "شوێن دیاریکرا",
    selectLocationOnMap: "شوێن دیاربکە لەسەر نەخشە",
    optionalHelpsFind: "ئەرێنی - یارمەتیدەرە بۆ کرێخوازان بۆ دۆزینەوەت",
    propertyImages: "وێنەکانی ئۆفەر",
    uploadingImages: "بارکردنی وێنەکان...",
    uploadImages: "بارکردنی وێنە",
    addHighQualityPhotos: "تا ١٠ وێنەی کوالیتی بەرز دابنێ",
    uploading: "بارکردن...",
    chooseImages: "وێنە هەڵبژێرە",
    uploadedImages: "وێنەکانی بارکراو",
    property: "ئۆفەر",
    reviewSubmit: "پشکنین و ناردن",
    propertySummary: "کورتەی ئۆفەر",
    title: "ناونیشان:",
    type: "جۆر:",
    price: "نرخ:",
    roomsLabel: "ژوورەکان:",
    size: "قەبارە:",
    whatsapp: "واتساپ:",
    imagesLabel: "وێنەکان:",
    notSpecified: "دیاری نەکراو",
    uploaded: "بارکراو",
    perMonth: "/مانگ",
    reviewProcess: "پرۆسەی پشکنین",
    reviewProcessDesc: "لیستی تۆ لەلایەن تیمەکەمان پشکنراوە دەبێت لە ماوەی ٢٤ کاتژمێر. ئەلیکترۆنیەکەت پێدەگات کاتێک پەسەند کرا و بڵاودەبێتەوە.",
    previous: "پێشوو",
    next: "دواتر",
    submitting: "ناردن...",
    submitListing: "ناردنی لیست",
    
    // Alert messages
    maximumImagesAllowed: "زۆرترین ١٠ وێنە ڕێگەپێدراوە",
    imageTooLarge: "گەورەیە زۆر. زۆرترین ٥MB بۆ هەر وێنەیەک",
    pleaseEnterWhatsapp: "تکایە ژمارەی واتساپ بنووسە",
    pleaseUploadImage: "تکایە لانی کەم یەک وێنە باربکە",
    errorSubmittingListing: "هەڵە لە ناردنی لیست:",
    unexpectedError: "هەڵەیەکی چاوەڕواننەکراو ڕووی دا. تکایە هەوڵبدەوە",
    pleaseFillRequired: "تکایە هەموو خانە پێویستەکان پڕبکەوە",
    
    // Post Success
    listingSubmittedSuccessfully: "لیست بەسەرکەوتووی نێردرا!",
    thankYouPosting: "سوپاس بۆ ناردنی ئۆفەرەکەت لە Bashfield! لیستەکەت نێردراوە و ئێستا لە ژێر پشکنینی تیمی بەڕێوەبەرییە. کاتێک پەسەند بکرێت، دەبێتەوە بۆ هەزاران کرێخواز لە سەرانسەری عێراق.",
    whatHappensNext: "پاشان چی دەبێت؟",
    teamReviews: "تیمەکەمان لیستەکەت پشکنین دەکات (زۆرجار لە ماوەی ٢٤ کاتژمێر)",
    emailWhenApproved: "ئەلیکترۆنی پێدەگات کاتێک پەسەند بکرێت",
    propertyWillAppear: "ئۆفەرەکەت لە لاپەڕەی سەرەکی دەردەکەوێت",
    interestedRenters: "کرێخوازانی حەزدار دەتوانن ڕاستەوخۆ پەیوەندیت پێوە بکەن",
    viewMyListings: "بینینی لیستەکانم",
    postAnotherProperty: "ناردنی ئۆفەری تر",
    backToHomepage: "گەڕانەوە بۆ لاپەڕەی سەرەکی",
    
    // Favorites
    loadingFavorites: "دڵخوازەکانت باردەکرێن...",
    loginRequired: "چوونە ژوورەوە پێویستە",
    pleaseSignInFavorites: "تکایە بچۆ ژوورەوە بۆ بینینی دڵخوازەکانت",
    goToHomepage: "بچۆ بۆ لاپەڕەی سەرەکی",
    yourFavorites: "دڵخوازەکانت",
    propertiesSaved: "ئۆفەرەکانت کە بۆ دواتر پاشەکەوت کردووە",
    noFavoritesYet: "هێشتا هیچ دڵخوازت نییە",
    startExploring: "دەست بکە بە گەڕانی ئۆفەرەکان و دڵخوازەکانت پاشەکەوت بکە بە کرتە کردن لەسەر نیشانی دڵ لەسەر هەر لیستێک.",
    browseProperties: "گەڕان لە ئۆفەرەکان",
    youHaveFavorite: "تۆ",
    favoriteProperty: "ئۆفەرە دڵخوازت هەیە",
    favoriteProperties: "ئۆفەرە دڵخوازت هەیە",
    showing: "نیشاندانی",
    of: "لە",
    loadingMoreFavorites: "دڵخوازە زیاتر باردەکرێن...",
    loadMoreFavorites: "دڵخوازە زیاتر باربکە",
    reachedEndFavorites: "کۆتایی دڵخوازەکانت گەیشتوویت",
    
    // Index Page
    loadingProperties: "ئۆفەرەکان باردەکرێن...",
    switchingModes: "گۆڕینی دۆخ...",
    noRentalsFound: "هیچ کرێ نەدۆزرایەوە",
    noPropertiesFound: "هیچ ئۆفەر نەدۆزرایەوە",
    tryAdjustingFilters: "هەوڵبدە فلتەرەکان بگۆڕیت یان یەکەم کەس بێت بۆ تۆمارکردنی ئۆفەرەکەت",
    forRent: "بۆ کرێ",
    forSale: "فرۆشتن",
    clearFilters: "فلتەرەکان پاکبکە",
    listForRent: "لیست بۆ کرێ",
    listForSale: "فرۆشتن",
    showingResults: "نیشاندانی",
    rentals: "کرێ",
    properties: "ئۆفەر",
    inListView: "لە نیشاندانی لیست",
    loadingMore: "زیاتر باردەکرێن...",
    loadMore: "زیاتر باربکە",
    allTypes: "هەموو جۆرەکان",
    allCities: "هەموو شارەکان",
    anyRooms: "هەر ژوورێک",
    onePlusRoom: "١+ ژوور",
    twoPlusRooms: "٢+ ژوور",
    minSizePlaceholder: "کەمترین قەبارە (مەتر چوارگۆشە)",
    minPricePlaceholder: "کەمترین نرخ",
    maxPricePlaceholder: "زۆرترین نرخ",
    postYourProperty: "ناردنی ئۆفەرەکەت",
    free: "بەخۆڕایی",
    cities: "شارەکان",
    quality: "کوالیتی",
    support: "پاڵپشتی",
    grid: "ڕیز",
    list: "لیست",
    map: "نەخشە",
    sortBy: "ڕیزکردن بە:",
    default: "بنەڕەت",
    newestFirst: "نوێترین لە سەرەتا",
    priceLowToHigh: "نرخ: کەم بۆ زۆر",
    priceHighToLow: "نرخ: زۆر بۆ کەم",
    activeFilters: "فلتەرە چالاکەکان:",
    clearAll: "هەمووی پاکبکە",
    rentalMap: "نەخشەی کرێ",
    exploreByLocation: "گەڕان لە",
    byLocation: "بە شوێن",
    
    // Hero Section
    numberOnePlatform: "🏠 پلاتفۆرمی ژمارە ١ ئۆفەر",
    rentHomesTagline: "کرێی خانوو • تۆمارکردنی ئۆفەر • پەیوەندی خێرا",
    buyHomesTagline: "کڕینی خانوو • فرۆشتنی ئۆفەر • پەیوەندی خێرا",
    
    // Room Options
    threePlusRooms: "٣+ ژوور",
    fourPlusRooms: "٤+ ژوور",
    fivePlusRooms: "٥+ ژوور",
    
    // Filter Units
    plusSquareMeters: "+ مەتر چوارگۆشە"
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
    arabic: "العربية",
    
    // Post Page
    addYourProperty: "أضف عقارك",
    reachThousands: "الوصول إلى آلاف المستأجرين/المشترين المحتملين في جميع أنحاء العراق",
    details: "التفاصيل",
    images: "الصور",
    review: "مراجعة",
    propertyDetails: "تفاصيل العقار",
    propertyTitle: "عنوان العقار *",
    propertyTitlePlaceholder: "مثال: شقة حديثة بغرفتي نوم في مركز أربيل",
    description: "الوصف *",
    descriptionPlaceholder: "صف عقارك، المرافق، والخدمات القريبة...",
    monthlyRent: "الإيجار الشهري",
    salePrice: "سعر البيع",
    whatsappNumber: "رقم الواتساب *",
    whatsappPlaceholder: "+964 750 123 4567",
    propertyType: "نوع العقار *",
    numberOfRooms: "عدد الغرف",
    room: "غرفة",
    rooms: "غرف",
    sizeSquareMeters: "المساحة (بالمتر المربع)",
    sizePlaceholder: "مثال: ١٢٠",
    city: "المدينة",
    propertyLocation: "موقع العقار",
    locationSelected: "الموقع المحدد",
    selectLocationOnMap: "اختر الموقع على الخريطة",
    optionalHelpsFind: "اختياري - يساعد المستأجرين في العثور عليك",
    propertyImages: "صور العقار",
    uploadingImages: "جاري رفع الصور...",
    uploadImages: "رفع الصور",
    addHighQualityPhotos: "أضف ما يصل إلى 10 صور عالية الجودة",
    uploading: "جاري الرفع...",
    chooseImages: "اختر الصور",
    uploadedImages: "الصور المرفوعة",
    property: "العقار",
    reviewSubmit: "مراجعة وإرسال",
    propertySummary: "ملخص العقار",
    title: "العنوان:",
    type: "النوع:",
    price: "السعر:",
    roomsLabel: "الغرف:",
    size: "المساحة:",
    whatsapp: "واتساب:",
    imagesLabel: "الصور:",
    notSpecified: "غير محدد",
    uploaded: "مرفوع",
    perMonth: "/شهر",
    reviewProcess: "عملية المراجعة",
    reviewProcessDesc: "سيتم مراجعة إعلانك من قبل فريقنا خلال 24 ساعة. ستتلقى إشعاراً عبر البريد الإلكتروني بمجرد الموافقة عليه ونشره.",
    previous: "السابق",
    next: "التالي",
    submitting: "جاري الإرسال...",
    submitListing: "إرسال الإعلان",
    
    // Alert messages
    maximumImagesAllowed: "مسموح بحد أقصى 10 صور",
    imageTooLarge: "الصورة كبيرة جداً. الحد الأقصى 5 ميغابايت لكل صورة",
    pleaseEnterWhatsapp: "الرجاء إدخال رقم الواتساب",
    pleaseUploadImage: "الرجاء رفع صورة واحدة على الأقل",
    errorSubmittingListing: "خطأ في إرسال الإعلان:",
    unexpectedError: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى",
    pleaseFillRequired: "يرجى ملء جميع الحقول المطلوبة",
    
    // Post Success
    listingSubmittedSuccessfully: "تم إرسال الإعلان بنجاح!",
    thankYouPosting: "شكراً لنشرك عقارك على Bashfield! لقد تم إرسال إعلانك وهو الآن قيد المراجعة من قبل فريق الإدارة. بمجرد الموافقة، سيظهر لآلاف المستأجرين في جميع أنحاء العراق.",
    whatHappensNext: "ماذا سيحدث بعد ذلك؟",
    teamReviews: "يقوم فريقنا بمراجعة إعلانك (عادة خلال 24 ساعة)",
    emailWhenApproved: "ستتلقى بريداً إلكترونياً عند الموافقة",
    propertyWillAppear: "سيظهر عقارك على الصفحة الرئيسية",
    interestedRenters: "يمكن للمستأجرين المهتمين التواصل معك مباشرة",
    viewMyListings: "عرض إعلاناتي",
    postAnotherProperty: "أضف عقاراً آخر",
    backToHomepage: "العودة إلى الصفحة الرئيسية",
    
    // Favorites
    loadingFavorites: "جاري تحميل المفضلة...",
    loginRequired: "تسجيل الدخول مطلوب",
    pleaseSignInFavorites: "الرجاء تسجيل الدخول لعرض المفضلة",
    goToHomepage: "اذهب إلى الصفحة الرئيسية",
    yourFavorites: "مفضلتك",
    propertiesSaved: "العقارات التي حفظتها للمشاهدة لاحقاً",
    noFavoritesYet: "لا توجد مفضلة بعد",
    startExploring: "ابدأ باستكشاف العقارات واحفظ المفضلة لديك بالضغط على أيقونة القلب في أي إعلان.",
    browseProperties: "تصفح العقارات",
    youHaveFavorite: "لديك",
    favoriteProperty: "عقار مفضل",
    favoriteProperties: "عقارات مفضلة",
    showing: "عرض",
    of: "من",
    loadingMoreFavorites: "جاري تحميل المزيد من المفضلة...",
    loadMoreFavorites: "تحميل المزيد من المفضلة",
    reachedEndFavorites: "لقد وصلت إلى نهاية المفضلة لديك",
    
    // Index Page
    loadingProperties: "جاري تحميل العقارات...",
    switchingModes: "جارٍ تبديل الوضع...",
    noRentalsFound: "لم يتم العثور على أي إيجارات",
    noPropertiesFound: "لم يتم العثور على أي عقارات",
    tryAdjustingFilters: "حاول تعديل الفلاتر أو كن أول من يدرج عقاره",
    forRent: "للإيجار",
    forSale: "للبيع",
    clearFilters: "مسح الفلاتر",
    listForRent: "قائمة للإيجار",
    listForSale: "للبيع",
    showingResults: "عرض",
    rentals: "إيجارات",
    properties: "عقارات",
    inListView: "في عرض القائمة",
    loadingMore: "جارٍ تحميل المزيد...",
    loadMore: "تحميل المزيد",
    allTypes: "جميع الأنواع",
    allCities: "جميع المدن",
    anyRooms: "أي عدد من الغرف",
    onePlusRoom: "غرفة 1+",
    twoPlusRooms: "غرفتان +",
    minSizePlaceholder: "الحد الأدنى للمساحة (م²)",
    minPricePlaceholder: "الحد الأدنى للسعر",
    maxPricePlaceholder: "الحد الأقصى للسعر",
    postYourProperty: "أدرج عقارك",
    free: "مجاناً",
    cities: "المدن",
    quality: "الجودة",
    support: "الدعم",
    grid: "شبكة",
    list: "قائمة",
    map: "خريطة",
    sortBy: "الترتيب حسب:",
    default: "الافتراضي",
    newestFirst: "الأحدث أولاً",
    priceLowToHigh: "السعر: من الأقل إلى الأعلى",
    priceHighToLow: "السعر: من الأعلى إلى الأقل",
    activeFilters: "الفلاتر النشطة:",
    clearAll: "مسح الكل",
    rentalMap: "خريطة الإيجارات",
    exploreByLocation: "استكشف",
    byLocation: "حسب الموقع",
    
    // Hero Section
    numberOnePlatform: "🏠 المنصة العقارية رقم ١",
    rentHomesTagline: "استئجار منازل • إدراج عقارات • تواصل فوري",
    buyHomesTagline: "شراء منازل • بيع عقارات • تواصل فوري",
    
    // Room Options
    threePlusRooms: "٣+ غرف",
    fourPlusRooms: "٤+ غرف",
    fivePlusRooms: "٥+ غرف",
    
    // Filter Units
    plusSquareMeters: "+ متر مربع"
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