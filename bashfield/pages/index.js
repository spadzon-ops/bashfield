// FILE: bashfield/pages/index.js

import { useState, useEffect } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase, CITIES } from '../lib/supabase'
import ListingCard from '../components/ListingCard'
import MapView from '../components/MapView'

export default function Home() {
  const { t } = useTranslation('common')
  const [listings, setListings] = useState([])
  const [filteredListings, setFilteredListings] = useState([])
  const [filters, setFilters] = useState({
    city: '',
    minPrice: '',
    maxPrice: '',
    rooms: '',
    currency: 'USD'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchListings()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, listings])

  const fetchListings = async () => {
    try {
      // First get all approved listings (only active ones)
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (listingsError) {
        console.error('Error fetching listings:', listingsError)
        setListings([])
        setLoading(false)
        return
      }

      // Then get all user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, profile_picture')

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        setProfiles([])
        setLoading(false)
        return
      }

      // Merge user profiles into listings
      const listingsWithProfiles = listingsData.map(listing => ({
        ...listing,
        user_profiles: profilesData.find(p => p.user_id === listing.user_id) || null
      }))

      setListings(listingsWithProfiles)
    } catch (err) {
      console.error('Unexpected error fetching listings:', err)
      setError('Failed to load listings')
    }
    setLoading(false)
  }

  const applyFilters = () => {
    let result = [...listings]

    if (filters.city) {
      result = result.filter(l => l.city.toLowerCase() === filters.city.toLowerCase())
    }

    if (filters.currency) {
      result = result.filter(l => l.currency === filters.currency)
    }

    if (filters.rooms) {
      result = result.filter(l => l.rooms === Number(filters.rooms))
    }

    if (filters.minPrice) {
      result = result.filter(l => l.price >= Number(filters.minPrice))
    }

    if (filters.maxPrice) {
      result = result.filter(l => l.price <= Number(filters.maxPrice))
    }

    setFilteredListings(result)
  }

  const clearFilters = () => {
    setFilters({
      city: '',
      minPrice: '',
      maxPrice: '',
      rooms: '',
      currency: 'USD'
    })
  }

  return (
    <div className="min-h-screen">
      {/* Modern Hero Section etc. (rest of your file unchanged) */}
    </div>
  )
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common']))
    }
  }
}
