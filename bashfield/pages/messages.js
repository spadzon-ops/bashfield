import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'
import { ensureConversation } from '../lib/chat'

export default function Messages() {
  const { t } = useTranslation('common')
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const userRef = useRef(null)
  const activeConversationRef = useRef(null)
  const convsRef = useRef([])
  const mountedAtRef = useRef(Date.now())
  const bootstrappedRef = useRef(false)
  const manualSelectRef = useRef(false)

  // scroll control
  const messagesContainerRef = useRef(null)
  const autoScrollRef = useRef(true)
  const isNearBottom = () => {
    const el = messagesContainerRef.current
    if (!el) return true
    const threshold = 80
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }
  const onScroll = () => { autoScrollRef.current = isNearBottom() }
  const scrollToBottom = () => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  // detect mobile once (for keyboard behavior)
  const isMobileRef = useRef(false)
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      isMobileRef.current = /android|iphone|ipad|ipod|iemobile|opera mini/i.test(
        navigator.userAgent.toLowerCase()
      )
    }
  }, [])

  // profile cache
  const profileCacheRef = useRef(new Map())
  const getProfile = useCallback(async (userId) => {
    if (profileCacheRef.current.has(userId)) return profileCacheRef.current.get(userId)
    const { data } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, profile_picture')
      .eq('user_id', userId)
      .single()
    const profile = data || { user_id: userId, display_name: 'Unknown User' }
    profileCacheRef.current.set(userId, profile)
    return profile
  }, [])

  // auth + initial list
  useEffect(() => {
    ;(async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return router.push('/')
      setUser(u)
      userRef.current = u
      await fetchConversations(u)
      setLoading(false)
    })()
  }, []) // eslint-disable-line

  useEffect(() => { convsRef.current = conversations }, [conversations])

  // loader helpers
  const fetchConversations = useCallback(async (u = userRef.current) => {
    if (!u) return
    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant1.eq.${u.id},participant2.eq.${u.id}`)
      .order('updated_at', { ascending: false })

    if (!convs) { setConversations([]); return }

    const participantIds = [...new Set(convs.flatMap((c) => [c.participant1, c.participant2]))]
    const listingIds = [...new Set(convs.map((c) => c.listing_id).filter(Boolean))]

    const [{ data: profiles }, { data: listings }, { data: lastMsgs }, { data: unread }] =
      await Promise.all([
        supabase.from('user_profiles')
          .select('user_id, display_name, profile_picture')
          .in('user_id', participantIds),
        listingIds.length
          ? supabase.from('listings').select('id, title').in('id', listingIds)
          : Promise.resolve({ data: [] }),
        convs.length
          ? supabase.from('messages')
              .select('conversation_id, content, created_at, sender_id')
              .in('conversation_id', convs.map((c) => c.id))
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        convs.length
          ? supabase.from('messages')
              .select('conversation_id, id')
              .in('conversation_id', convs.map((c) => c.id))
              .eq('recipient_id', u.id)
              .eq('read', false)
          : Promise.resolve({ data: [] }),
      ])

    const processed = (convs || []).map((conv) => {
      const otherId = conv.participant1 === u.id ? conv.participant2 : conv.participant1
      const other = profiles?.find((p) => p.user_id === otherId) || null
      const listing = listings?.find((l) => l.id === conv.listing_id) || null
      const last = lastMsgs?.find((m) => m.conversation_id === conv.id) || null
      let unreadCount = unread?.filter((m) => m.conversation_id === conv.id).length || 0
      if (typeof window !== 'undefined' && window.activeConversationId && conv.id === window.activeConversationId) unreadCount = 0
      return { ...conv, other_participant: other, listing, last_message: last, unread_count: unreadCount }
    }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))

    setConversations(processed)
  }, [])

  const fetchMessages = useCallback(async (conversationId) => {
    const id = conversationId || activeConversationRef.current?.id
    if (!id) return
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (!msgs) { setMessages([]); return }

    const uniqueSenders = [...new Set(msgs.map((m) => m.sender_id))]
    await Promise.all(uniqueSenders.map((uid) => getProfile(uid)))
    const merged = msgs.map((m) => ({
      ...m,
      sender: profileCacheRef.current.get(m.sender_id) || { display_name: 'Unknown User' },
    }))
    setMessages(merged)
  }, [getProfile])

  const markAsRead = useCallback(async (conversationId) => {
    const uid = userRef.current?.id
    if (!conversationId || !uid) return
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('recipient_id', uid)
      .eq('read', false)
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('messagesRead'))
    await fetchConversations()
  }, [fetchConversations])

  // open/select helpers
  const selectConversation = async (conv) => {
    manualSelectRef.current = true
    setActiveConversation(conv)
    await fetchMessages(conv.id)
    await markAsRead(conv.id)
    setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c)))
    autoScrollRef.current = true
    requestAnimationFrame(scrollToBottom)
    router.replace(`/messages?id=${conv.id}`, undefined, { shallow: true })
  }

  const leaveActiveConversation = async () => {
    const prev = activeConversationRef.current
    if (prev) await markAsRead(prev.id)
    setActiveConversation(null)
    router.replace(`/messages`, undefined, { shallow: true })
  }

  // global flag for Section 1/2 muting
  useEffect(() => {
    activeConversationRef.current = activeConversation
    if (typeof window !== 'undefined') {
      window.activeConversationId = activeConversation?.id || null
      window.dispatchEvent(new CustomEvent('activeConversationChanged', { detail: { id: window.activeConversationId } }))
    }
    if (activeConversation) {
      autoScrollRef.current = true
      requestAnimationFrame(scrollToBottom)
    }
  }, [activeConversation])

  useEffect(() => {
    const handleRouteChange = () => {
      if (typeof window !== 'undefined') {
        window.activeConversationId = null
        window.dispatchEvent(new CustomEvent('activeConversationChanged', { detail: { id: null } }))
      }
    }
    router.events.on('routeChangeStart', handleRouteChange)
    return () => router.events.off('routeChangeStart', handleRouteChange)
  }, [router.events])

  // Deep-link bootstrap (runs once)
  useEffect(() => {
    if (!router.isReady || conversations.length === 0 || !userRef.current) return

    const qs = new URLSearchParams(window.location.search)
    const idFromQuery = qs.get('id')
    const peer = qs.get('peer')
    const listing = qs.get('listing')

    if (manualSelectRef.current) { manualSelectRef.current = false; return }
    if (bootstrappedRef.current && !peer && !listing) {
      if (idFromQuery && activeConversationRef.current?.id === idFromQuery) return
      if (activeConversationRef.current && !idFromQuery) return
    }

    if (idFromQuery) {
      const c = conversations.find((x) => x.id === idFromQuery)
      if (c) {
        if (activeConversationRef.current?.id !== idFromQuery) selectConversation(c)
        bootstrappedRef.current = true
        return
      }
    }

    ;(async () => {
      if (peer || listing) {
        try {
          const convId = await ensureConversation({ otherId: peer, listingId: listing || null })
          await fetchConversations()
          const c = convsRef.current.find((x) => x.id === convId)
          if (c) {
            await selectConversation(c)
            router.replace(`/messages?id=${convId}`, undefined, { shallow: true })
            bootstrappedRef.current = true
            return
          }
        } catch {}
      }

      if (!bootstrappedRef.current && !activeConversationRef.current && conversations.length > 0) {
        const now = Date.now()
        const candidate = conversations.find((c) => {
          const lastAt = c.last_message?.created_at ? new Date(c.last_message.created_at).getTime() : 0
          const updatedAt = c.updated_at ? new Date(c.updated_at).getTime() : 0
          return (now - Math.max(lastAt, updatedAt) < 2 * 60 * 1000) || (updatedAt >= mountedAtRef.current)
        })
        if (candidate) {
          await selectConversation(candidate)
          bootstrappedRef.current = true
          return
        }
      }
      bootstrappedRef.current = true
    })()
  }, [router.isReady, conversations]) // eslint-disable-line

  // Realtime: open conversation stream
  useEffect(() => {
    const u = userRef.current
    const conv = activeConversationRef.current
    if (!u || !conv) return

    const ch = supabase
      .channel(`conv-${conv.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` },
        async (payload) => {
          const m = payload.new
          if (!m) return
          const profile = await getProfile(m.sender_id)
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, { ...m, sender: profile }]))

          setConversations((prev) => {
            const updated = prev.map((c) =>
              c.id === conv.id
                ? {
                    ...c,
                    updated_at: m.created_at,
                    last_message: { content: m.content, sender_id: m.sender_id, created_at: m.created_at },
                    unread_count: 0,
                  }
                : c
            )
            return updated.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          })

          if (m.recipient_id === u.id) {
            await supabase.from('messages').update({ read: true }).eq('id', m.id)
            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('messagesRead'))
          }

          if (autoScrollRef.current) requestAnimationFrame(scrollToBottom)
        }
      )
      .subscribe()

    const poll = setInterval(() => fetchMessages(conv.id), 2000)
    return () => { try { supabase.removeChannel(ch) } catch {} ; clearInterval(poll) }
  }, [activeConversation?.id, getProfile, fetchMessages])

  // Realtime: Section 2 live list
  useEffect(() => {
    if (!user?.id) return
    const chAll = supabase
      .channel(`all-messages-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new
          if (!m) return
          if (m.sender_id !== user.id && m.recipient_id !== user.id) return

          if (activeConversationRef.current?.id !== m.conversation_id) {
            setConversations((prev) => {
              const idx = prev.findIndex((c) => c.id === m.conversation_id)
              if (idx === -1) { fetchConversations(); return prev }
              const c = prev[idx]
              const inc = m.recipient_id === user.id ? 1 : 0
              const updated = {
                ...c,
                updated_at: m.created_at,
                last_message: { content: m.content, sender_id: m.sender_id, created_at: m.created_at },
                unread_count: (c.unread_count || 0) + inc,
              }
              const rest = prev.filter((_, i) => i !== idx)
              return [updated, ...rest]
            })
          }
        }
      )
      .subscribe()

    const onVis = () => { if (document.visibilityState === 'visible') fetchConversations() }
    document.addEventListener('visibilitychange', onVis)
    const poll = setInterval(fetchConversations, 5000)

    return () => {
      try { supabase.removeChannel(chAll) } catch {}
      document.removeEventListener('visibilitychange', onVis)
      clearInterval(poll)
    }
  }, [user?.id, fetchConversations])

  // send
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sending) return
    setSending(true)

    const me = userRef.current
    const otherId = activeConversation.participant1 === me.id
      ? activeConversation.participant2
      : activeConversation.participant1

    const content = newMessage.trim()
    const { data, error } = await supabase
      .from('messages')
      .insert([{ conversation_id: activeConversation.id, sender_id: me.id, recipient_id: otherId, content }])
      .select('*')
      .single()

    if (error) { setSending(false); alert('Failed to send message. Please try again.'); return }

    const myProfile =
      profileCacheRef.current.get(me.id) || {
        user_id: me.id,
        display_name: me.user_metadata?.full_name || me.email?.split('@')[0] || 'Me',
      }

    setMessages((prev) => [...prev, { ...data, sender: myProfile }])
    setNewMessage('')

    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              updated_at: data.created_at,
              last_message: { content: data.content, sender_id: data.sender_id, created_at: data.created_at },
              unread_count: 0,
            }
          : c
      )
      return updated.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    })

    autoScrollRef.current = true
    requestAnimationFrame(scrollToBottom)
    setSending(false)
  }

  // autoscroll on new messages
  useEffect(() => {
    if (autoScrollRef.current) requestAnimationFrame(scrollToBottom)
  }, [messages])

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Keep both panes scrollable: NO overflow-hidden; enforce min-h-0 on every flex level */}
        <div className="bg-white rounded-xl shadow-sm h-[calc(100vh-120px)] min-h-0">
          <div className="flex h-full min-h-0">
            {/* -------- Section 2: list -------- */}
            <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-gray-200 flex-col min-h-0 relative z-10`}>
              <div className="p-4 border-b border-gray-200 flex-none">
                <h2 className="text-xl font-bold text-gray-900">💬 Messages</h2>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">💬</span>
                    </div>
                    <p className="text-gray-600">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => selectConversation(conversation)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        activeConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <AvatarCircle profile={conversation.other_participant} size={48} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.other_participant?.display_name || 'Unknown User'}
                            </p>
                            {conversation.unread_count > 0 && (
                              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate">Re: {conversation.listing?.title || 'Property'}</p>
                          {conversation.last_message && (
                            <p className="text-xs text-gray-500 truncate mt-1">{conversation.last_message.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* -------- Section 3: chat -------- */}
            <div className={`${activeConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-h-0 relative z-0`}>
              {activeConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50 flex-none">
                    <div className="flex items-center space-x-3">
                      <button onClick={leaveActiveConversation} className="md:hidden text-gray-600 hover:text-gray-900 p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <Link href={`/profile/${activeConversation.other_participant?.user_id || ''}`} className="flex items-center space-x-3 group">
                        <AvatarCircle profile={activeConversation.other_participant} size={40} />
                        <div>
                          <h3 className="font-medium text-gray-900 group-hover:underline">
                            {activeConversation.other_participant?.display_name || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-gray-600">About: {activeConversation.listing?.title || 'Property'}</p>
                        </div>
                      </Link>
                    </div>
                  </div>

                  {/* Messages */}
                  <div ref={messagesContainerRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                    {messages.map((m) => (
                      <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            m.sender_id === user?.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                            {m.content}
                          </p>
                          <p className={`text-xs mt-1 ${m.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                            {formatTime(m.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Composer */}
                  <div className="p-4 border-t border-gray-200 flex-none">
                    <form className="flex space-x-2 items-end" onSubmit={(e) => { e.preventDefault(); sendMessage() }} autoComplete="off">
                      <textarea
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value)
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        onKeyDown={(e) => {
                          if (!isMobileRef.current && e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        placeholder="Type your message…"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden min-h-[44px] max-h-60"
                        disabled={sending}
                        rows={1}
                        name="message"
                        id="message"
                        autoComplete="off"
                        autoCorrect="on"
                        autoCapitalize="sentences"
                        spellCheck={true}
                        inputMode="text"
                        data-form-type="other"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        {sending ? '...' : 'Send'}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">💬</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
            {/* ---- end layout ---- */}
          </div>
        </div>
      </div>
    </div>
  )
}

function AvatarCircle({ profile, size = 40 }) {
  const url = profile?.profile_picture
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${profile.profile_picture}`
    : null
  if (url) {
    return <img src={url} alt="Profile" className="rounded-full object-cover" style={{ width: size, height: size }} />
  }
  const letter = profile?.display_name?.[0]?.toUpperCase() || '?'
  return (
    <div className="rounded-full bg-blue-100 flex items-center justify-center" style={{ width: size, height: size }}>
      <span className="text-blue-600 font-semibold">{letter}</span>
    </div>
  )
}

export async function getServerSideProps({ locale }) {
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } }
}
