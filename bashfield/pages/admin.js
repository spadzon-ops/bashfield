// bashfield/pages/admin.js
import { useState, useEffect } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'
import ListingCard from '../components/ListingCard'

const Admin = () => {
  const { t } = useTranslation('admin')
  const [listings, setListings] = useState([])
  const [pendingListings, setPendingListings] = useState([])
  const [approvedListings, setApprovedListings] = useState([])
  const [rejectedListings, setRejectedListings] = useState([])

  useEffect(() => {
    const fetchListings = async () => {
      const { data: allListings } = await supabase
        .from('listings')
        .select('*')

      const pending = allListings.filter((listing) => listing.status === 'pending')
      const approved = allListings.filter((listing) => listing.status === 'approved')
      const rejected = allListings.filter((listing) => listing.status === 'rejected')

      setListings(allListings)
      setPendingListings(pending)
      setApprovedListings(approved)
      setRejectedListings(rejected)
    }

    fetchListings()
  }, [])

  const handleViewDetails = (listing) => {
    // Add logic to view details of the listing
    console.log(listing)
  }

  return (
    <div>
      <h1>{t('title')}</h1>
      <h2>{t('pending')}</h2>
      <ul>
        {pendingListings.map((listing) => (
          <li key={listing.id}>
            <ListingCard listing={listing} onViewDetails={handleViewDetails} />
          </li>
        ))}
      </ul>

      <h2>{t('approved')}</h2>
      <ul>
        {approvedListings.map((listing) => (
          <li key={listing.id}>
            <ListingCard listing={listing} onViewDetails={handleViewDetails} />
          </li>
        ))}
      </ul>

      <h2>{t('rejected')}</h2>
      <ul>
        {rejectedListings.map((listing) => (
          <li key={listing.id}>
            <ListingCard listing={listing} onViewDetails={handleViewDetails} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Admin
