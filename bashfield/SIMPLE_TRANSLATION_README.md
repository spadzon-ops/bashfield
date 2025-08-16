# Simple Translation System

## Overview
A working translation system for English, Kurdish, and Arabic.

## Files Created
1. `lib/simple-translations.js` - Translation dictionary and functions
2. `hooks/useSimpleTranslation.js` - React hook for translations
3. `components/SimpleLanguageToggle.js` - Language switcher component
4. `test-translations.html` - Test file to verify translations work

## Files Updated
1. `components/Layout.js` - Uses simple translation system
2. `pages/index.js` - Uses simple translation system

## How to Use

### 1. In Components
```javascript
import useSimpleTranslation from '../hooks/useSimpleTranslation'

function MyComponent() {
  const { t } = useSimpleTranslation()
  
  return (
    <div>
      <h1>{t('Home')}</h1>
      <button>{t('Save')}</button>
    </div>
  )
}
```

### 2. Language Toggle
```javascript
import SimpleLanguageToggle from '../components/SimpleLanguageToggle'

function MyComponent() {
  return (
    <div>
      <SimpleLanguageToggle />
    </div>
  )
}
```

## Available Translations
- Navigation: Home, Messages, Favorites, Profile, Admin
- Actions: Save, Cancel, Edit, Delete, Search, Filter, Clear, Apply
- UI: Loading..., Back, Next, Yes, No, Close
- Home page: Titles, filters, sort options

## Testing
1. Open `test-translations.html` in browser
2. Click language buttons to test translations
3. Verify text changes correctly

## Adding New Translations
Edit `lib/simple-translations.js` and add new entries to all three language objects:

```javascript
const translations = {
  en: {
    "New Text": "New Text"
  },
  ku: {
    "New Text": "Kurdish Translation"
  },
  ar: {
    "New Text": "Arabic Translation"
  }
}
```

## Next Steps
1. Upload to GitHub
2. Test in development: `npm run dev`
3. Use language toggle to switch languages
4. Add more translations as needed

The system is now working and ready to use!