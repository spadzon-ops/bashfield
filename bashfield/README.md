# Bashfield - House Rentals 

A modern, multilingual house rental platform for Iraq, especially Erbil. Built with Next.js, Supabase, and Tailwind CSS.

## 🌟 Features

- **Multilingual**: English, Kurdish (Sorani), and Arabic support
- **Dark Mode**: Beautiful dark theme by default
- **Google Auth**: Gmail-only authentication 
- **Admin Dashboard**: Approve/reject listings
- **Image Upload**: Supabase storage integration
- **City Filtering**: Filter by major Iraqi cities
- **Responsive**: Mobile-friendly design

## 🚀 Live Demo

**Live Sites:**
- **Vercel**: https://bashfield-ten.vercel.app
- **Netlify**: https://your-netlify-url.netlify.app

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **i18n**: next-i18next
- **Deployment**: Vercel

## 📦 Local Development

1. **Clone and install**:
   ```bash
   git clone [your-repo]
   cd bashfield
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials and admin email.

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open**: http://localhost:3000

## 🔧 Deployment

### **Vercel (Main Site)**
1. **Push to GitHub**
2. **Connect to Vercel**
3. **Add environment variables in Vercel dashboard**
4. **Deploy automatically**

### **Netlify (Backup Site)**
1. **Same GitHub repo**
2. **Connect to Netlify**
3. **Add same environment variables**
4. **Uses @netlify/plugin-nextjs for Next.js support**

## 📊 Database Schema

The app uses these Supabase tables:
- `listings`: House rental listings with approval status
- `auth.users`: User authentication (Google only)
- `storage.house-images`: Image storage bucket

## 🌐 Supported Cities

- Erbil (أربيل / هەولێر)
- Baghdad (بغداد / بەغدا)
- Basra (البصرة / بەسرە)
- Mosul (الموصل / موسڵ)
- Sulaymaniyah (السليمانية / سلێمانی)
- Najaf (النجف / نەجەف)
- Karbala (كربلاء / کەربەلا)
- Kirkuk (كركوك / کەرکووک)
- Duhok (دهوك / دهۆک)

## 👨‍💼 Admin Features

- View all listings (pending, approved, rejected)
- Approve or reject new listings
- Delete any listing
- Access restricted to configured admin email

## 🔐 Security

- Row Level Security (RLS) enabled
- Users can only see approved listings
- Users can only edit their own listings
- Admin has full access to all operations

## ✅ **Recent Enhancements (Completed)**

- ✅ **USD/IQD Currency Support** - International pricing
- ✅ **WhatsApp Integration** - Direct messaging to property owners
- ✅ **Map Location Picker** - Precise property locations
- ✅ **Built-in Chat System** - Real-time messaging
- ✅ **User Profile Pages** - Personal dashboards with statistics
- ✅ **Success Pages** - Better user experience after posting
- ✅ **Dual Hosting** - Vercel + Netlify for reliability

## 📱 Future Enhancements

- React Native mobile app
- Email notifications
- Advanced search filters
- Listing favorites
- Payment integration
