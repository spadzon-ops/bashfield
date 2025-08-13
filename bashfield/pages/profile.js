// FILE: bashfield/pages/profile.js

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'
import ListingCard from '../components/ListingCard'

export default function Profile() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [profilePicture, setProfilePicture] = useState(null)
  const [userListings, setUserListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)

      // fetch or create profile (unchanged)
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error
        if (data) {
          setProfile(data)
          setDisplayName(data.display_name)
          setProfilePicture(data.profile_picture)
        } else {
          await createProfileDirectly(user)
        }
      } catch (err) {
        console.error('Profile initialization error:', err)
        await createProfileDirectly(user)
      }

      await fetchUserListings(user)
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line

  const createProfileDirectly = async (user) => {
    const defaultName = user?.email?.split('@')[0] || 'User'
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ user_id: user.id, email: user.email, display_name: defaultName })
      .select()
      .single()

    if (!error) {
      setProfile(data)
      setDisplayName(data.display_name)
      setProfilePicture(data.profile_picture)
    }
  }

  const fetchUserListings = async (user) => {
    const { data: listingsData, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (listingsData) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('display_name, profile_picture')
        .eq('user_id', user.id)
        .single()
      const listingsWithProfile = listingsData.map(listing => ({
        ...listing,
        user_profiles: profileData || null
      }))
      setUserListings(listingsWithProfile)
    }
  }

  // ... rest of file unchanged (render, update profile, delete listing, etc.)
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common']))
    }
  }
}
