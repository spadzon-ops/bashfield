
import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const { data: prof } = await supabase.from('user_profiles').select('*').eq('user_id', data.user.id).single()
        setProfile(prof)
      }
    })
  }, [])

  const saveDisplayName = async (e) => {
    e.preventDefault()
    setSaving(true)
    const display_name = e.target.display_name.value.trim()
    const payload = { user_id: user.id, email: user.email, display_name }
    const { error } = await supabase.from('user_profiles').upsert(payload).select().single()
    if (!error) alert('Saved')
    setSaving(false)
  }

  const uploadAvatar = async () => {
    if (!file || !user) return
    const path = `user-avatars/${user.id}.jpg`
    const { error } = await supabase.storage.from('house-images').upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })
    if (!error) {
      const { data } = supabase.storage.from('house-images').getPublicUrl(path)
      await supabase.from('user_profiles').update({ profile_picture: data.publicUrl }).eq('user_id', user.id)
      const { data: prof } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)
    }
  }

  return (
    <Layout title="Profile">
      <h1 className="text-2xl font-semibold mb-4">Your Profile</h1>
      {!user ? <p>Please sign in.</p> : (
        <div className="grid md:grid-cols-2 gap-6">
          <form onSubmit={saveDisplayName} className="rounded-2xl border border-neutral-800 p-4">
            <label className="block text-sm text-neutral-400 mb-1">Display name</label>
            <input name="display_name" defaultValue={profile?.display_name || ''} className="w-full rounded-xl bg-neutral-900 p-2"/>
            <button disabled={saving} className="mt-3 rounded-xl bg-white text-black px-3 py-2">{saving ? 'Saving…' : 'Save'}</button>
          </form>
          <div className="rounded-2xl border border-neutral-800 p-4">
            <div className="flex items-center gap-3">
              {profile?.profile_picture ? (
                <img src={profile.profile_picture} alt="avatar" className="h-16 w-16 rounded-full object-cover"/>
              ) : (
                <div className="h-16 w-16 rounded-full bg-neutral-800" />
              )}
              <div>
                <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0])}/>
                <button onClick={uploadAvatar} className="mt-2 rounded-xl border px-3 py-1">Upload avatar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
