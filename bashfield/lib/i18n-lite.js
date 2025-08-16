// bashfield/lib/i18n-lite.js
// Lightweight i18n layer for Bashfield with smart fallbacks.

const DICT = {
  en: {
    // ======= NEW: hero, tabs, filters, buttons, badges =======
    "Property Platform #1 🏠": "Property Platform #1 🏠",
    "Buying & Selling 🏡": "Buying & Selling 🏡",
    "Renting 🏡": "Renting 🏡",
    "Find Your Perfect Home in Iraq": "Find Your Perfect Home in Iraq",
    "Discover amazing rental properties in Erbil and across Iraq":
      "Discover amazing rental properties in Erbil and across Iraq",
    "Max Price": "Max Price",
    "Min Price": "Min Price",
    "in Size (m²)": "in Size (m²)",
    "Any Rooms": "Any Rooms",
    "All Cities": "All Cities",
    "All Types": "All Types",
    "Types": "Types",
    "FREE": "FREE",
    "Post Your Property+": "Post Your Property+",
    "Browse Rentals": "Browse Rentals",
    "Browse Rentals🔍": "Browse Rentals🔍",
    "Rentals": "Rentals",

    // ======= Core set kept from earlier file (most-used app strings) =======
    "Home": "Home",
    "Add Property": "Add Property",
    "Favorites": "Favorites",
    "Admin": "Admin",
    "Admin Dashboard": "Admin Dashboard",
    "Bashfield": "Bashfield",
    "Premier Property Platform": "Premier Property Platform",
    "Cities": "Cities",
    "City": "City",
    "City:": "City:",
    "All": "All",
    "Any": "Any",
    "Rooms": "Rooms",
    "Rooms:": "Rooms:",
    "Type": "Type",
    "Type:": "Type:",
    "Size (m²)": "Size (m²)",
    "Price:": "Price:",
    "USD": "USD",
    "IQD": "IQD",
    "For Rent": "For Rent",
    "For Sale": "For Sale",
    "Search properties...": "Search properties...",
    "Search by code": "Search by code",
    "e.g. BF-9A3C71": "e.g. BF-9A3C71",
    "Browse Rentals…": "Browse Rentals…",
    "List Your Property": "List Your Property",
    "Submit Listing": "Submit Listing",
    "View Details": "View Details",
    "Message Owner": "Message Owner",
    "Messages": "Messages",
    "Send": "Send",
    "Write a message...": "Write a message...",
    "Open in Maps": "Open in Maps",
    "Verified": "Verified",
    "Verification": "Verification",
    "Profile": "Profile",
    "View Profile": "View Profile",
    "Sign In": "Sign In",
    "Sign Out": "Sign Out",
    "Loading...": "Loading...",
    "No listings found": "No listings found",
  },

  ar: {
    // ======= NEW: hero, tabs, filters, buttons, badges =======
    "Property Platform #1 🏠": "منصة العقارات رقم 1 🏠",
    "Buying & Selling 🏡": "البيع والشراء 🏡",
    "Renting 🏡": "الإيجار 🏡",
    "Find Your Perfect Home in Iraq": "اعثر على منزلك المثالي في العراق",
    "Discover amazing rental properties in Erbil and across Iraq":
      "اكتشف عقارات إيجار رائعة في أربيل وجميع أنحاء العراق",
    "Max Price": "أعلى سعر",
    "Min Price": "أقل سعر",
    "in Size (m²)": "بمساحة (م²)",
    "Any Rooms": "أي عدد من الغرف",
    "All Cities": "جميع المدن",
    "All Types": "جميع الأنواع",
    "Types": "الأنواع",
    "FREE": "مجاني",
    "Post Your Property+": "أضف عقارك+",
    "Browse Rentals": "تصفح الإيجارات",
    "Browse Rentals🔍": "تصفح الإيجارات🔍",
    "Rentals": "الإيجارات",

    // ======= Core set =======
    "Home": "الرئيسية",
    "Add Property": "إضافة عقار",
    "Favorites": "المفضلات",
    "Admin": "الإدارة",
    "Admin Dashboard": "لوحة تحكم الإدارة",
    "Bashfield": "باشفيلد",
    "Premier Property Platform": "منصة عقارية رائدة",
    "Cities": "المدن",
    "City": "المدينة",
    "City:": "المدينة:",
    "All": "الكل",
    "Any": "أي",
    "Rooms": "الغرف",
    "Rooms:": "الغرف:",
    "Type": "النوع",
    "Type:": "النوع:",
    "Size (m²)": "المساحة (م²)",
    "Price:": "السعر:",
    "USD": "دولار أمريكي",
    "IQD": "دينار عراقي",
    "For Rent": "للإيجار",
    "For Sale": "للبيع",
    "Search properties...": "ابحث عن عقارات...",
    "Search by code": "ابحث بالرمز",
    "e.g. BF-9A3C71": "مثال: BF-9A3C71",
    "Browse Rentals…": "تصفح الإيجارات…",
    "List Your Property": "أضف عقارك",
    "Submit Listing": "إرسال الإعلان",
    "View Details": "عرض التفاصيل",
    "Message Owner": "أرسل رسالة للمالك",
    "Messages": "الرسائل",
    "Send": "إرسال",
    "Write a message...": "اكتب رسالة...",
    "Open in Maps": "افتح في الخرائط",
    "Verified": "موثّق",
    "Verification": "التحقق",
    "Profile": "الملف الشخصي",
    "View Profile": "عرض الملف الشخصي",
    "Sign In": "تسجيل الدخول",
    "Sign Out": "تسجيل الخروج",
    "Loading...": "جاري التحميل...",
    "No listings found": "لم يتم العثور على إعلانات",
  },

  ku: {
    // ======= NEW: hero, tabs, filters, buttons, badges =======
    "Property Platform #1 🏠": "پلاتفۆرمی ملکان ژمارە ١ 🏠",
    "Buying & Selling 🏡": "کڕین و فرۆشتن 🏡",
    "Renting 🏡": "کرێدان 🏡",
    "Find Your Perfect Home in Iraq": "خانووی گونجای خۆت لە عێراق بدۆزەوە",
    "Discover amazing rental properties in Erbil and across Iraq":
      "ملکە کرێدارییە جوانەکان لە هەولێر و هەموو عێراق بدۆزەوە",
    "Max Price": "زۆرترین نرخ",
    "Min Price": "کەمترین نرخ",
    "in Size (m²)": "بە قەبارەی (م²)",
    "Any Rooms": "هەر چەند ژوور",
    "All Cities": "هەموو شارەکان",
    "All Types": "هەموو جۆرەکان",
    "Types": "جۆرەکان",
    "FREE": "بێبەرامبەر",
    "Post Your Property+": "ملکت زیاد بکە+",
    "Browse Rentals": "کرێکان بگەڕێ",
    "Browse Rentals🔍": "کرێکان بگەڕێ🔍",
    "Rentals": "کرێکان",

    // ======= Core set =======
    "Home": "ماڵەوە",
    "Add Property": "زیادکردنی ملک",
    "Favorites": "دڵخوازەکان",
    "Admin": "بەڕێوەبەر",
    "Admin Dashboard": "داشبۆردی بەڕێوەبەر",
    "Bashfield": "باشفیلد",
    "Premier Property Platform": "پلاتفۆرمی پێشەنگی ملکان",
    "Cities": "شارەکان",
    "City": "شار",
    "City:": "شار:",
    "All": "هەموو",
    "Any": "هەرکام",
    "Rooms": "ژوورەکان",
    "Rooms:": "ژوورەکان:",
    "Type": "جۆر",
    "Type:": "جۆر:",
    "Size (m²)": "قەبارە (م²)",
    "Price:": "نرخ:",
    "USD": "USD",
    "IQD": "IQD",
    "For Rent": "بۆ کرێ",
    "For Sale": "بۆ فرۆشتن",
    "Search properties...": "بەدوای ملکان بگەڕێ...",
    "Search by code": "بەپێی کۆد بگەڕێ",
    "e.g. BF-9A3C71": "نموونە: BF-9A3C71",
    "Browse Rentals…": "کرێکان بگەڕێ…",
    "List Your Property": "ملکت بڵاو بکە",
    "Submit Listing": "ناردنی تۆمار",
    "View Details": "وردەکاری ببینە",
    "Message Owner": "پەیام بنێرە بۆ خاوەنی ملک",
    "Messages": "پەیامەکان",
    "Send": "ناردن",
    "Write a message...": "پەیامێک بنووسە...",
    "Open in Maps": "لە نەخشەدا بکەرەوە",
    "Verified": "دڵنیابوون",
    "Verification": "پشتراستکردنەوە",
    "Profile": "پرۆفایل",
    "View Profile": "پرۆفایل ببینە",
    "Sign In": "چوونەژوورەوە",
    "Sign Out": "چوونەدەرەوە",
    "Loading...": "بار دەکرێت...",
    "No listings found": "هیچ تۆمارێک نەدۆزرایەوە",
  }
};

// Languages that should use RTL layout
const RTL_LANGS = new Set(['ar', 'ku']);

function getLang() {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('translate-lang') || 'en';
}

function setLang(lang) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('translate-lang', lang);
  applyDocumentDirection(lang);
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

function isRTL(lang = getLang()) {
  return RTL_LANGS.has(lang);
}

function applyDocumentDirection(lang = getLang()) {
  if (typeof document === 'undefined') return;
  const dir = isRTL(lang) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lang);
}

// Strict lookup
function tStrict(key, lang = getLang()) {
  const dict = DICT[lang] || {};
  if (!key) return '';
  const k = String(key);
  if (Object.prototype.hasOwnProperty.call(dict, k)) return dict[k];
  const trimmed = k.trim();
  if (Object.prototype.hasOwnProperty.call(dict, trimmed)) return dict[trimmed];
  return k;
}

// Smart fallback: try composition for simple phrases like "All Cities", "Any Rooms"
function tSmart(key, lang = getLang()) {
  const direct = tStrict(key, lang);
  if (direct !== key) return direct;

  // Normalize whitespace
  const normalized = String(key).replace(/\s+/g, ' ').trim();
  if (normalized !== key) {
    const n2 = tStrict(normalized, lang);
    if (n2 !== normalized) return n2;
  }

  // Patterns: Any X / All X / "in Size (m²)" → "Size (m²)"
  const patterns = [
    [/^Any\s+(.+)$/i, (m) => `${tStrict('Any', lang)} ${tStrict(m[1], lang)}`],
    [/^All\s+(.+)$/i, (m) => `${tStrict('All', lang)} ${tStrict(m[1], lang)}`],
    [/^in\s+Size\s+\(m²\)$/i, () => tStrict('Size (m²)', lang)],
  ];
  for (const [re, fn] of patterns) {
    const m = normalized.match(re);
    if (m) return fn(m);
  }

  // Token-by-token (short phrases only)
  const tokens = normalized.split(' ');
  if (tokens.length > 1 && tokens.length <= 4) {
    const maybe = tokens.map(tok => tStrict(tok, lang));
    if (maybe.every((v, i) => v !== tokens[i])) {
      return maybe.join(' ');
    }
  }

  return key;
}

function t(key, lang = getLang()) {
  return tSmart(key, lang);
}

// Translate text nodes + common attributes across the page.
function translatePage(lang = getLang()) {
  if (typeof document === 'undefined') return;

  const translateTextValue = (val) => {
    if (!val) return val;
    return t(val, lang);
  };

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('[data-i18n-skip]')) return NodeFilter.FILTER_REJECT;
        if (!/\S/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        if (node.nodeValue.length > 200) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    },
    false
  );

  const textNodes = [];
  let n;
  while ((n = walker.nextNode())) textNodes.push(n);
  textNodes.forEach((node) => {
    const original = node.nodeValue;
    const translated = translateTextValue(original);
    if (translated && translated !== original) {
      node.nodeValue = translated;
    }
  });

  const ATTRS = ['placeholder', 'title', 'aria-label', 'aria-placeholder'];
  ATTRS.forEach((attr) => {
    document.querySelectorAll(`[${attr}]`).forEach((el) => {
      if (el.closest('[data-i18n-skip]')) return;
      const val = el.getAttribute(attr);
      if (!val) return;
      const translated = translateTextValue(val);
      if (translated && translated !== val) {
        el.setAttribute(attr, translated);
      }
    });
  });

  applyDocumentDirection(lang);
}

export const i18n = { t, getLang, setLang, isRTL, translatePage, applyDocumentDirection, DICT };
export default i18n;
