# Delete Account Feature Setup

## Overview
The delete account feature has been added to the user profile page. Users can now permanently delete their accounts along with all associated data.

## What gets deleted:
- User's profile and profile picture
- All user's property listings and their images
- All conversations and messages
- All favorites
- The user account from Supabase Auth

## Setup Required:

### 1. Environment Variable
Make sure you have the `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local` file:
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

You can find this key in your Supabase dashboard under Settings > API.

### 2. How to Access
1. Go to your profile page
2. Click on the "⚙️ Account Settings" tab
3. Click "Delete My Account" button
4. Confirm the deletion (requires two confirmations)

### 3. Files Modified:
- `pages/profile.js` - Added delete account functionality and new tab
- `pages/api/delete-account.js` - New API endpoint for secure account deletion

### 4. Database Cascading:
The database is already set up with CASCADE DELETE constraints, so when the user is deleted from auth.users, all related data is automatically removed from:
- user_profiles
- listings
- favorites  
- conversations
- messages

### 5. Security:
- Uses server-side API with admin privileges
- Requires user confirmation (double confirmation)
- Cleans up storage files before deleting database records
- Properly signs out user after deletion