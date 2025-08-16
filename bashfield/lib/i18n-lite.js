// Lightweight i18n utilities for Bashfield
// Exposes BOTH named exports (translate, getDir, isRTL, applyDocumentDirection)
// and a default export object for flexibility.

export const DICT = {
  en: {
    dir: "ltr",
    "Home": "Home",
    "Post": "Post",
    "Admin": "Admin",
    "Chat with owner": "Chat with owner",
    "Post created successfully!": "Post created successfully!",
    "Something went wrong.": "Something went wrong.",
    "Send message": "Send message",
    "Type your message…": "Type your message…",
    "Back": "Back",
    "Post a listing": "Post a listing",
    "Title": "Title",
    "Price": "Price",
    "Description": "Description",
    "Location": "Location",
    "Submit": "Submit",
    "Required": "Required",
    "Invalid": "Invalid",
    "Loading…": "Loading…",
    "Try again": "Try again",
    "Go to chat": "Go to chat",
    "All listings": "All listings",
    "No results": "No results",
    "Owner": "Owner",
    "You": "You",
    "minutes ago": "minutes ago",
    "Just now": "Just now"
  },
  ku: {
    dir: "rtl",
    "Home": "سەرەتا",
    "Post": "بەشداری",
    "Admin": "بەڕێوەبەرایەتی",
    "Chat with owner": "گفتوگۆ لەگەڵ خاوی",
    "Post created successfully!": "بەشداری بە سەرکەوتوویی دروست کرا!",
    "Something went wrong.": "هەڵەیەک ڕوویدا.",
    "Send message": "نامە بنێرە",
    "Type your message…": "نامەکەت بنووسە…",
    "Back": "گەڕانەوە",
    "Post a listing": "لیستێک بڵاو بکەوە",
    "Title": "ناونیشان",
    "Price": "نرخ",
    "Description": "وەسف",
    "Location": "شوێن",
    "Submit": "ناردن",
    "Required": "پێویستە",
    "Invalid": "نادروست",
    "Loading…": "باردەکرێت…",
    "Try again": "دووبارە هەوڵبدە",
    "Go to chat": "بڕۆ بۆ گفتوگۆ",
    "All listings": "هەموو لیستەکان",
    "No results": "هیچ ئەنجامێک نییە",
    "Owner": "خاوەن",
    "You": "تۆ",
    "minutes ago": "خولەک لەمەوبەر",
    "Just now": "ئێستا"
  },
  ar: {
    dir: "rtl",
    "Home": "الرئيسية",
    "Post": "نشر",
    "Admin": "الإدارة",
    "Chat with owner": "الدردشة مع المالك",
    "Post created successfully!": "تم إنشاء المنشور بنجاح!",
    "Something went wrong.": "حدث خطأ ما.",
    "Send message": "إرسال",
    "Type your message…": "اكتب رسالتك…",
    "Back": "رجوع",
    "Post a listing": "إضافة إعلان",
    "Title": "العنوان",
    "Price": "السعر",
    "Description": "الوصف",
    "Location": "الموقع",
    "Submit": "إرسال",
    "Required": "مطلوب",
    "Invalid": "غير صالح",
    "Loading…": "جارٍ التحميل…",
    "Try again": "أعد المحاولة",
    "Go to chat": "اذهب للدردشة",
    "All listings": "كل الإعلانات",
    "No results": "لا توجد نتائج",
    "Owner": "المالك",
    "You": "أنت",
    "minutes ago": "دقائق مضت",
    "Just now": "الآن"
  }
};

/**
 * Returns "rtl" or "ltr" for a language code.
 */
export function getDir(lang) {
  const code = (lang || "").toLowerCase().split("-")[0];
  return (DICT[code] && DICT[code].dir) || "ltr";
}

/**
 * Is the language Right-To-Left?
 */
export function isRTL(lang) {
  return getDir(lang) === "rtl";
}

/**
 * Translate helper. Signature matches how the app calls it: tr(lang, key)
 * Falls back gracefully: key -> en -> first available language -> key
 */
export function translate(lang, key) {
  const code = (lang || "").toLowerCase().split("-")[0];
  if (DICT[code] && DICT[code][key]) return DICT[code][key];
  if (DICT.en && DICT.en[key]) return DICT.en[key];
  // fallback: try any other language that has the key
  for (const k of Object.keys(DICT)) {
    if (DICT[k] && DICT[k][key]) return DICT[k][key];
  }
  return key;
}

/**
 * Apply document.dir on the client. Safe no-op on server.
 */
export function applyDocumentDirection(lang) {
  if (typeof window === "undefined") return;
  try {
    const dir = getDir(lang);
    if (document && document.documentElement) {
      document.documentElement.setAttribute("dir", dir);
    }
  } catch {}
}

// Default export (optional usage)
const i18nCore = { DICT, translate, getDir, isRTL, applyDocumentDirection };
export default i18nCore;
