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
    
    // Menu
    home: "Home",
    
    // Hero Section
    numberOnePlatform: "🏠 #1 Property Platform",
    rentHomesTagline: "Rent homes • List properties • Connect instantly",
    buyHomesTagline: "Buy homes • Sell properties • Connect instantly",
    
    // Room Options
    threePlusRooms: "3+ Rooms",
    fourPlusRooms: "4+ Rooms",
    fivePlusRooms: "5+ Rooms",
    
    // Filter Units
    plusSquareMeters: "+ m²",
    
    // Mode Config
    renting: "Renting",
    buyingSelling: "Buying & Selling",
    perMonth: "per month",
    totalPrice: "total price",
    listForRent: "List for Rent",
    listForSale: "List for Sale",
    browseRentals: "Browse Rentals",
    browseProperties: "Browse Properties",
    findYourDreamHome: "Find Your Dream Home Today",
    buyOrSellProperties: "Buy or Sell Properties",
    findAndListRentals: "Find and list rental properties across major cities with ease.",
    discoverAndListSales: "Discover and list properties for sale across major cities.",
    
    // ListingCard
    verified: "Verified",
    whatsapp: "WhatsApp",
    chat: "Chat",
    viewDetails: "View Details",
    message: "Message",
    room: "Room",
    rooms: "Rooms",
    
    // LoadingScreen
    loading: "Loading...",
    pleaseWait: "Please wait a moment...",
    
    // Messages
    messages: "Messages",
    yourConversations: "Your conversations",
    noConversationsYet: "No conversations yet",
    startBrowsingProperties: "Start browsing properties to connect with owners",
    loadingMessages: "Loading messages...",
    selectConversation: "Select a conversation",
    chooseConversation: "Choose a conversation from the list to start messaging with property owners and potential tenants",
    directMessage: "Direct Message",
    deleteConversation: "Delete Conversation",
    viewProperty: "View Property",
    viewProfile: "View Profile",
    typeYourMessage: "Type your message…",
    deleteConversationConfirm: "Are you sure you want to delete this conversation? This action cannot be undone.",
    errorDeletingConversation: "Error deleting conversation. Please try again.",
    failedToSendMessage: "Failed to send message. Please try again.",
    
    // Admin Page
    adminDashboard: "Admin Dashboard",
    managePropertyListings: "Manage property listings and user content",
    totalUsers: "Total Users",
    activeUsers: "Active (24h)",
    totalListings: "Total Listings",
    forRent: "For Rent",
    forSale: "For Sale",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    listingsManagement: "Listings Management",
    userManagement: "User Management",
    searchByCode: "Search by Property Code or Title",
    status: "Status",
    all: "All",
    active: "Active",
    inactive: "Inactive",
    type: "Type",
    age: "Age",
    any: "Any",
    activeOnly: "Active only",
    inactiveOnly: "Inactive only",
    olderThan1Month: "Older than 1 month",
    olderThan3Months: "Older than 3 months",
    olderThan6Months: "Older than 6 months",
    olderThan12Months: "Older than 12 months",
    applyFilters: "Apply Filters",
    filtered: "Filtered",
    inactivateAll: "Inactivate All",
    activateAll: "Activate All",
    deleteAll: "Delete All",
    searchUsers: "Search Users",
    searchByNameEmail: "Search by name or email...",
    newestFirst: "Newest First",
    oldestFirst: "Oldest First",
    nameAZ: "Name A-Z",
    emailAZ: "Email A-Z",
    verifiedFirst: "Verified First",
    users: "users",
    joined: "Joined",
    unverify: "Unverify",
    verify: "Verify",
    loadMoreUsers: "Load More Users",
    noListingsFound: "No listings found.",
    posted: "Posted",
    city: "City",
    price: "Price",
    size: "Size",
    approve: "Approve",
    reject: "Reject",
    delete: "Delete",
    inactivate: "Inactivate",
    activate: "Activate",
    loadingMoreListings: "Loading more listings...",
    loadMoreListings: "Load More Listings",
    reachedEndListings: "You've reached the end of the listings",
    loadingAdmin: "Loading admin…"
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
    plusSquareMeters: "+ مەتر چوارگۆشە",
    
    // Mode Config
    renting: "کرێگرتن",
    buyingSelling: "کڕین و فرۆشتن",
    perMonth: "مانگانە",
    totalPrice: "نرخی گشتی",
    listForRent: "لیست بۆ کرێ",
    listForSale: "لیست بۆ فرۆشتن",
    browseRentals: "گەڕان لە کرێکان",
    browseProperties: "گەڕان لە ئۆفەرەکان",
    findYourDreamHome: "ماڵی خەونەکانت بدۆزەوە ئەمڕۆ",
    buyOrSellProperties: "کڕین یان فرۆشتنی ئۆفەر",
    findAndListRentals: "دۆزینەوە و تۆمارکردنی ئۆفەرە کرێیەکان لە شارە گەورەکان بە ئاسانی.",
    discoverAndListSales: "دۆزینەوە و تۆمارکردنی ئۆفەرەکان بۆ فرۆشتن لە شارە گەورەکان.",
    
    // ListingCard
    verified: "پشتڕاستکراوە",
    whatsapp: "واتساپ",
    chat: "گفتوگۆ",
    viewDetails: "بینینی وردەکاری",
    message: "نامە",
    room: "ژوور",
    rooms: "ژوور",
    
    // LoadingScreen
    loading: "بارکردن...",
    pleaseWait: "تکایە کەمێک چاوەڕێبە...",
    
    // Messages
    messages: "نامەکان",
    yourConversations: "گفتوگۆکانت",
    noConversationsYet: "هێشتا هیچ گفتوگۆیەک نییە",
    startBrowsingProperties: "دەست بکە بە گەڕان لە ئۆفەرەکان بۆ پەیوەندی لەگەڵ خاوەنەکان",
    loadingMessages: "نامەکان باردەکرێن...",
    selectConversation: "گفتوگۆیەک هەڵبژێرە",
    chooseConversation: "گفتوگۆیەک لە لیستەکە هەڵبژێرە بۆ دەستپێکردنی نامەنووسین لەگەڵ خاوەن ئۆفەرەکان و کرێخوازان",
    directMessage: "نامەی ڕاستەوخۆ",
    deleteConversation: "سڕینەوەی گفتوگۆ",
    viewProperty: "بینینی ئۆفەر",
    viewProfile: "بینینی پرۆفایل",
    typeYourMessage: "نامەکەت بنووسە…",
    deleteConversationConfirm: "دڵنیایت لە سڕینەوەی ئەم گفتوگۆیە؟ ئەم کردارە ناگەڕێتەوە.",
    errorDeletingConversation: "هەڵە لە سڕینەوەی گفتوگۆ. تکایە هەوڵبدەوە.",
    failedToSendMessage: "شکستی هێنا لە ناردنی نامە. تکایە هەوڵبدەوە."
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
    plusSquareMeters: "+ متر مربع",
    
    // Mode Config
    renting: "الإيجار",
    buyingSelling: "الشراء والبيع",
    perMonth: "شهرياً",
    totalPrice: "السعر الإجمالي",
    listForRent: "قائمة للإيجار",
    listForSale: "قائمة للبيع",
    browseRentals: "تصفح الإيجارات",
    browseProperties: "تصفح العقارات",
    findYourDreamHome: "اعثر على منزل أحلامك اليوم",
    buyOrSellProperties: "شراء أو بيع العقارات",
    findAndListRentals: "العثور على وإدراج العقارات المؤجرة في المدن الكبرى بسهولة.",
    discoverAndListSales: "اكتشاف وإدراج العقارات للبيع في المدن الكبرى.",
    
    // ListingCard
    verified: "موثق",
    whatsapp: "واتساب",
    chat: "محادثة",
    viewDetails: "عرض التفاصيل",
    message: "رسالة",
    room: "غرفة",
    rooms: "غرف",
    
    // LoadingScreen
    loading: "جاري التحميل...",
    pleaseWait: "يرجى الانتظار لحظة...",
    
    // Messages
    messages: "الرسائل",
    yourConversations: "محادثاتك",
    noConversationsYet: "لا توجد محادثات بعد",
    startBrowsingProperties: "ابدأ بتصفح العقارات للتواصل مع الملاك",
    loadingMessages: "جاري تحميل الرسائل...",
    selectConversation: "اختر محادثة",
    chooseConversation: "اختر محادثة من القائمة لبدء المراسلة مع ملاك العقارات والمستأجرين المحتملين",
    directMessage: "رسالة مباشرة",
    deleteConversation: "حذف المحادثة",
    viewProperty: "عرض العقار",
    viewProfile: "عرض الملف الشخصي",
    typeYourMessage: "اكتب رسالتك…",
    deleteConversationConfirm: "هل أنت متأكد من حذف هذه المحادثة؟ لا يمكن التراجع عن هذا الإجراء.",
    errorDeletingConversation: "خطأ في حذف المحادثة. يرجى المحاولة مرة أخرى.",
    failedToSendMessage: "فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى."
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
    if (typeof window === 'undefined') {
      // Server-side rendering fallback
      return translations.en[key] || key
    }
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
    // Fallback for when context is not available
    return {
      language: 'en',
      changeLanguage: () => {},
      t: (key) => key
    }
  }
  return context
}