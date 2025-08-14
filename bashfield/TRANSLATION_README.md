# Bashfield Translation System

## Overview
Bashfield now supports automatic translation between English, Kurdish (Sorani), and Arabic. The system automatically detects the language of user-generated content and translates it to the user's preferred language.

## Supported Languages
- **English (en)** - Default language, LTR
- **Kurdish (ku)** - Sorani Kurdish, RTL
- **Arabic (ar)** - Modern Standard Arabic, RTL

## Features

### Automatic Translation
- **Listings**: Title, description, and city names are automatically translated
- **Messages**: Chat messages are translated in real-time
- **User Interface**: Static text uses i18next for translations
- **Language Detection**: Automatic detection of content language using character patterns

### What Gets Translated
✅ Property titles and descriptions
✅ City names
✅ Chat messages
✅ UI text and labels
✅ Error messages and notifications

### What Doesn't Get Translated
❌ User names and display names
❌ Email addresses
❌ Phone numbers
❌ Numeric values (prices, room counts)
❌ Dates and timestamps
❌ Reference codes

### RTL Support
- Automatic text direction switching
- Proper layout adjustments for Arabic and Kurdish
- Flag and language selector with proper RTL handling

## Technical Implementation

### Translation API
- Uses MyMemory Translation API (free)
- Automatic caching to reduce API calls
- Fallback to original text if translation fails
- Rate limiting and error handling

### Language Detection
- Arabic: Unicode range [\u0600-\u06FF]
- Kurdish: Specific characters [ئەڕێۆوەیەکگ]
- English: Default fallback

### Database Schema
- Added `detected_language` columns to listings and messages
- Automatic language detection triggers
- Indexed for performance

## Usage

### For Users
1. Select language from the dropdown in the navigation
2. Content automatically translates to selected language
3. RTL languages (Arabic, Kurdish) automatically adjust layout
4. Original language is preserved in database

### For Developers
```javascript
import { useAutoTranslate } from '../hooks/useAutoTranslate'

const { translateContent, translateListing, translateMessage } = useAutoTranslate()

// Translate any text
const translatedText = await translateContent('Hello world')

// Translate listing object
const translatedListing = await translateListing(listing)

// Translate message object
const translatedMessage = await translateMessage(message)
```

## Configuration

### Language Settings
Edit `lib/translationConfig.js` to modify:
- Supported languages
- Translation API settings
- Language detection patterns
- RTL/LTR directions

### Translation Files
Located in `public/locales/[lang]/common.json`:
- `en/common.json` - English translations
- `ku/common.json` - Kurdish translations  
- `ar/common.json` - Arabic translations

## Performance Optimizations

### Caching
- Translation results cached in memory
- 24-hour cache timeout
- Reduces API calls for repeated content

### Batch Processing
- Multiple texts translated in single API call
- Configurable batch size (default: 10)
- Automatic retry with exponential backoff

### Database Optimization
- Language detection at insert/update time
- Indexed language columns for fast filtering
- Minimal overhead on existing queries

## Deployment Notes

### Database Updates
Run the SQL migration:
```sql
-- Apply translation schema updates
\i translation-schema-update.sql
```

### Environment Variables
No additional environment variables required - uses free translation API.

### Build Process
Translation system is fully integrated with Next.js build process.

## Troubleshooting

### Translation Not Working
1. Check browser console for API errors
2. Verify internet connection (requires external API)
3. Check if content contains translatable text
4. Clear browser cache and reload

### RTL Layout Issues
1. Ensure CSS supports RTL with `dir` attribute
2. Check if custom styles override RTL behavior
3. Verify language direction in browser dev tools

### Performance Issues
1. Monitor translation API response times
2. Check cache hit rates in browser dev tools
3. Consider reducing batch size if needed

## Future Enhancements
- Offline translation support
- Additional language support
- Translation quality improvements
- User preference persistence
- Translation confidence scoring