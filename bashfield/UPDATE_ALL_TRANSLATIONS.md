# Complete Translation Implementation

## Files Updated:

### ✅ COMPLETED:
1. **lib/translations.js** - Translation store with all keys
2. **hooks/useTranslations.js** - Translation hook
3. **pages/index.js** - Homepage with translations
4. **components/Layout.js** - Navigation with translations

### 🔄 TO UPDATE (Add `import useTranslations from '../hooks/useTranslations'` and replace text):

## Profile Page
```javascript
// pages/profile.js
import useTranslations from '../hooks/useTranslations'

export default function Profile() {
  const { t } = useTranslations()
  
  // Replace:
  "My Listings" → {t('profile.myListings')}
  "Pending" → {t('profile.pending')}
  "Account Settings" → {t('profile.accountSettings')}
  "Delete" → {t('profile.delete')}
  "Create Listing" → {t('profile.createListing')}
  "Loading..." → {t('ui.loading')}
  "Save" → {t('ui.save')}
  "Cancel" → {t('ui.cancel')}
  "Edit" → {t('ui.edit')}
}
```

## Post Page
```javascript
// pages/post.js
import useTranslations from '../hooks/useTranslations'

export default function Post() {
  const { t } = useTranslations()
  
  // Replace:
  "Post Your House" → {t('nav.post')}
  "Property Title" → {t('post.propertyTitle')}
  "Description" → {t('post.description')}
  "Monthly Rent (IQD)" → {t('post.monthlyRent')}
  "City" → {t('post.city')}
  "Number of Rooms" → {t('post.numberOfRooms')}
  "Upload Images" → {t('post.uploadImages')}
  "Submit Listing" → {t('post.submitListing')}
  "Submitting..." → {t('post.submitting')}
}
```

## Admin Page
```javascript
// pages/admin.js
import useTranslations from '../hooks/useTranslations'

export default function Admin() {
  const { t } = useTranslations()
  
  // Replace all hardcoded text with t('admin.key')
}
```

## Listing Card Component
```javascript
// components/ListingCard.js
import useTranslations from '../hooks/useTranslations'

export default function ListingCard() {
  const { t } = useTranslations()
  
  // Replace:
  "rooms" → {t('listing.rooms')}
  "Posted by" → {t('listing.postedBy')}
  "View Details" → {t('listing.viewDetails')}
  "Contact Owner" → {t('listing.contactOwner')}
}
```

## Property Details Page
```javascript
// pages/listing/[id].js
import useTranslations from '../hooks/useTranslations'

export default function ListingDetail() {
  const { t } = useTranslations()
  
  // Replace all text with t('propertyDetails.key')
}
```

## Messages Page
```javascript
// pages/messages.js
import useTranslations from '../hooks/useTranslations'

export default function Messages() {
  const { t } = useTranslations()
  
  // Replace all text with t('messages.key')
}
```

## Favorites Page
```javascript
// pages/favorites.js
import useTranslations from '../hooks/useTranslations'

export default function Favorites() {
  const { t } = useTranslations()
  
  // Replace all text with t('favorites.key')
}
```

## RESPONSIVE DESIGN FIXES:

### Navigation Menu (Layout.js):
- ✅ Already responsive with mobile menu
- ✅ Proper spacing and sizing
- ✅ Overflow handling

### Homepage:
- ✅ Grid responsive
- ✅ Mobile-friendly filters
- ✅ Proper text sizing

### Need to check:
- Profile page mobile view
- Admin page mobile view
- Property details mobile view
- Forms mobile view

## IMPLEMENTATION PRIORITY:
1. Profile page (most used)
2. Property details page
3. Post page
4. Admin page
5. Messages page
6. Favorites page
7. All other components

Each file needs:
1. Import translation hook
2. Use t('key') for all text
3. Test mobile responsiveness
4. Ensure no text overflow