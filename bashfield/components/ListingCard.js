import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function ListingCard({
  listing,
  showActions = false,
  onApprove,
  onReject,
  onDelete,
  isAdmin = false,
  isOwner = false
}) {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [profileData, setProfileData] = useState(listing.user_profiles)
  const [currentUser, setCurrentUser] = useState(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileData && listing?.user_id) {
        const { data } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, profile_picture')
          .eq('user_id', listing.user_id)
          .single()
        if (data) setProfileData(data)
      }
    }
    fetchProfile()
  }, [listing?.user_id]) // eslint-disable-line

  const nextImage = (e) => {
    e?.stopPropagation?.()
    setCurrentImageIndex((prev) =>
      listing.images && listing.images.length > 0
        ? (prev + 1) % listing.images.length
        : 0
    )
  }
  const prevImage = (e) => {
    e?.stopPropagation?.()
    setCurrentImageIndex((prev) =>
      listing.images && listing.images.length > 0
        ? (prev - 1 + listing.images.length) % listing.images.length
        : 0
    )
  }

  const openListing = () => {
    const isCurrentUserAdmin = currentUser?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
    const url = (isCurrentUserAdmin || isOwner || showActions)
      ? `/listing/${listing.id}?admin=true`
      : `/listing/${listing.id}`
    router.push(url)
  }

  const openWhatsApp = (e) => {
    e.stopPropagation()
    const message = `Hi! I'm interested in your property: ${listing.title}`
    const whatsappUrl = `https://wa.me/${(listing.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_bl_
