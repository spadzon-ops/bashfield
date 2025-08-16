# Translation Implementation Guide

## How to add translations to any component:

### 1. Import the translation hook:
```javascript
import useTranslations from '../hooks/useTranslations'
```

### 2. Use the hook in your component:
```javascript
export default function YourComponent() {
  const { t } = useTranslations()
  
  return (
    <div>
      <h1>{t('nav.home')}</h1>
      <p>{t('home.title')}</p>
    </div>
  )
}
```

### 3. Replace hardcoded text with translation keys:

**Before:**
```javascript
<button>Save</button>
<p>Loading...</p>
<h1>My Listings</h1>
```

**After:**
```javascript
<button>{t('ui.save')}</button>
<p>{t('ui.loading')}</p>
<h1>{t('profile.myListings')}</h1>
```

### 4. Add fallback for missing translations:
```javascript
<span>{t('some.key') || 'Fallback Text'}</span>
```

## Quick Reference - Common Translation Keys:

### Navigation:
- `t('nav.home')` → "Home" / "ماڵەوە" / "الرئيسية"
- `t('nav.post')` → "Post Your House"
- `t('nav.profile')` → "Profile"
- `t('nav.messages')` → "Messages"
- `t('nav.favorites')` → "Favorites"

### UI Elements:
- `t('ui.loading')` → "Loading..."
- `t('ui.save')` → "Save"
- `t('ui.cancel')` → "Cancel"
- `t('ui.edit')` → "Edit"
- `t('ui.delete')` → "Delete"
- `t('ui.search')` → "Search"

### Property Related:
- `t('listing.rooms')` → "rooms"
- `t('listing.viewDetails')` → "View Details"
- `t('propertyDetails.location')` → "Location"
- `t('propertyDetails.size')` → "Size"

### Profile:
- `t('profile.myListings')` → "My Listings"
- `t('profile.pending')` → "Pending"
- `t('profile.accountSettings')` → "Account Settings"

## Files that need translation implementation:

1. **pages/index.js** ✅ (partially done)
2. **pages/profile.js** - Add `useTranslations` hook
3. **pages/post.js** - Add `useTranslations` hook
4. **pages/admin.js** - Add `useTranslations` hook
5. **components/ListingCard.js** - Add `useTranslations` hook
6. **components/Layout.js** - Add `useTranslations` hook
7. **pages/listing/[id].js** - Add `useTranslations` hook
8. **pages/messages.js** - Add `useTranslations` hook
9. **pages/favorites.js** - Add `useTranslations` hook

## Example Implementation for ListingCard:

```javascript
import useTranslations from '../hooks/useTranslations'

export default function ListingCard({ listing }) {
  const { t } = useTranslations()
  
  return (
    <div>
      <h3>{listing.title}</h3>
      <p>{listing.rooms} {t('listing.rooms')}</p>
      <span>{t('listing.postedBy')} {listing.owner}</span>
      <button>{t('listing.viewDetails')}</button>
    </div>
  )
}
```

This way you can systematically add translations to each component by:
1. Import the hook
2. Use `t('key.path')` for each text
3. Test language switching