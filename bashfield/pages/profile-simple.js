import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import ListingCard from '../components/ListingCard'

export default function ProfileSimple() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [profilePicture, setProfilePicture] = useState(null)
  const [userListings, setUserListings] = useState([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
      await fetchUserListings(user)
    }
    init()
  }, [])

  const fetchUserListings = async (user) => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (data) {
      setUserListings(data)
    }
  }

  const handleSave = async () => {
    // …
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Profile</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {userListings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      </div>
    </div>
  )
}
