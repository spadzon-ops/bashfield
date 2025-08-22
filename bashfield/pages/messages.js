import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { ensureConversation } from '../lib/chat'
import { useTranslation } from '../contexts/TranslationContext'

export default function Messages() {
  const router = useRouter()
  const { t } = useTranslation()

  const [user, setUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)

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
    if (window.innerWidth < 768) {
      window.history.replaceState(null, '', '/messages')
    } else {
      router.replace(`/messages`, undefined, { shallow: true })
    }
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

  // Handle browser back button on mobile
  useEffect(() => {
    const handlePopState = (e) => {
      if (activeConversation && window.innerWidth < 768) {
        e.preventDefault()
        leaveActiveConversation()
        window.history.pushState(null, '', '/messages')
      }
    }
    
    if (activeConversation && window.innerWidth < 768) {
      window.history.pushState(null, '', window.location.href)
      window.addEventListener('popstate', handlePopState)
    }
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [activeConversation])

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

      // Don't auto-select any conversation by default
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
  const deleteConversation = async (conversationId) => {
    if (!confirm(t('deleteConversationConfirm'))) {
      return
    }

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (error) throw error

      // Remove from local state
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      
      // If this was the active conversation, clear it
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null)
        router.replace('/messages', undefined, { shallow: true })
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      alert(t('errorDeletingConversation'))
    }
  }

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

    if (error) { setSending(false); alert(t('failedToSendMessage')); return }

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
          <p className="text-gray-600">{t('loadingMessages')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl h-[calc(100vh-80px)] min-h-0 border border-gray-200/50 overflow-hidden">
          <div className="flex h-full min-h-0">
            {/* Enhanced Conversations List */}
            <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-gray-200/50 flex-col min-h-0 relative z-10 bg-gradient-to-b from-white to-gray-50`}>
              <div className="p-6 border-b border-gray-200/50 flex-none bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">{t('messages')}</h2>
                    <p className="text-sm text-gray-600">{t('yourConversations')}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noConversationsYet')}</h3>
                    <p className="text-gray-600">{t('startBrowsingProperties')}</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => selectConversation(conversation)}
                      className={`p-4 mx-3 my-2 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                        activeConversation?.id === conversation.id 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl transform scale-105' 
                          : 'bg-white hover:bg-gray-50 border border-gray-200/50 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <AvatarCircle profile={conversation.other_participant} size={52} />
                          {conversation.unread_count > 0 && (
                            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
                              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`font-semibold truncate ${
                              activeConversation?.id === conversation.id ? 'text-white' : 'text-gray-900'
                            }`}>
                              {conversation.other_participant?.display_name || 'Unknown User'}
                            </p>
                            {conversation.last_message && (
                              <span className={`text-xs ${
                                activeConversation?.id === conversation.id ? 'text-white/80' : 'text-gray-500'
                              }`}>
                                {new Date(conversation.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className={`text-sm truncate mb-1 ${
                            activeConversation?.id === conversation.id ? 'text-white/90' : 'text-blue-600'
                          }`}>
                            {conversation.listing?.title ? `🏠 ${conversation.listing.title}` : `💬 ${t('directMessage')}`}
                          </p>
                          {conversation.last_message && (
                            <p className={`text-sm truncate ${
                              activeConversation?.id === conversation.id ? 'text-white/70' : 'text-gray-500'
                            }`}>
                              {conversation.last_message.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Enhanced Chat Interface */}
            <div className={`${activeConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-h-0 relative z-0`}>
              {activeConversation ? (
                <>
                  {/* Enhanced Header */}
                  <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-white to-gray-50 flex-none">
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          leaveActiveConversation()
                        }} 
                        className="md:hidden text-gray-600 hover:text-blue-600 p-2 rounded-xl hover:bg-blue-50 transition-all duration-300"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <Link href={`/profile/${activeConversation.other_participant?.user_id || ''}`} className="flex items-center space-x-4 group hover:bg-blue-50 rounded-2xl p-3 -m-3 transition-all duration-300">
                        <div className="relative">
                          <AvatarCircle profile={activeConversation.other_participant} size={48} />
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">
                            {activeConversation.other_participant?.display_name || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-blue-600 font-medium">
                            {activeConversation.listing?.title ? `🏠 ${activeConversation.listing.title}` : `💬 ${t('directMessage')}`}
                          </p>
                        </div>
                      </Link>
                      
                      {/* Action Buttons */}
                      <div className="ml-auto flex items-center space-x-2">
                        <div className="relative">
                          <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          {showMenu && (
                            <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 min-w-48">
                              <button
                                onClick={() => {
                                  setShowMenu(false)
                                  deleteConversation(activeConversation.id)
                                }}
                                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>{t('deleteConversation')}</span>
                              </button>
                              {activeConversation.listing?.id ? (
                                <button
                                  onClick={() => {
                                    setShowMenu(false)
                                    router.push(`/listing/${activeConversation.listing.id}`)
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                  </svg>
                                  <span>{t('viewProperty')}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setShowMenu(false)
                                    router.push(`/profile/${activeConversation.other_participant?.user_id}`)
                                  }}
                                  className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span>{t('viewProfile')}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Messages */}
                  <div ref={messagesContainerRef} onScroll={onScroll} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white">
                    {messages.map((m, index) => {
                      const isMe = m.sender_id === user?.id
                      const showAvatar = index === 0 || messages[index - 1]?.sender_id !== m.sender_id
                      const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.sender_id !== m.sender_id
                      
                      return (
                        <div key={m.id} className={`flex items-end space-x-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isMe && (
                            <div className="flex-shrink-0">
                              {showAvatar ? (
                                <AvatarCircle profile={activeConversation.other_participant} size={32} />
                              ) : (
                                <div className="w-8 h-8"></div>
                              )}
                            </div>
                          )}
                          
                          <div className={`max-w-xs lg:max-w-md ${isLastInGroup ? 'mb-2' : 'mb-1'}`}>
                            <div
                              className={`px-4 py-3 rounded-2xl shadow-lg ${
                                isMe 
                                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md' 
                                  : 'bg-white text-gray-900 border border-gray-200/50 rounded-bl-md'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                                {m.content}
                              </p>
                            </div>
                            {isLastInGroup && (
                              <p className={`text-xs mt-2 px-2 ${
                                isMe ? 'text-gray-500 text-right' : 'text-gray-500 text-left'
                              }`}>
                                {formatTime(m.created_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Enhanced Composer */}
                  <div className="p-6 border-t border-gray-200/50 bg-white flex-none">
                    <form className="flex space-x-4 items-end" onSubmit={(e) => { e.preventDefault(); sendMessage() }} autoComplete="off">
                      <div className="flex-1 relative">
                        <textarea
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value)
                            e.target.style.height = 'auto'
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                          }}
                          onKeyDown={(e) => {
                            if (!isMobileRef.current && e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                          placeholder={t('typeYourMessage')}
                          className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none overflow-hidden min-h-[52px] max-h-32 transition-all duration-300 bg-gray-50 focus:bg-white"
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
                        {/* Emoji Button */}
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors p-1"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white p-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none disabled:shadow-none flex items-center justify-center min-w-[52px]"
                      >
                        {sending ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-4">
                      {t('selectConversation')}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {t('chooseConversation')}
                    </p>
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
    return (
      <img 
        src={url} 
        alt="Profile" 
        className="rounded-full object-cover ring-2 ring-white shadow-lg" 
        style={{ width: size, height: size }} 
      />
    )
  }
  const letter = profile?.display_name?.[0]?.toUpperCase() || '?'
  return (
    <div 
      className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center ring-2 ring-white shadow-lg" 
      style={{ width: size, height: size }}
    >
      <span className="text-white font-bold" style={{ fontSize: size * 0.4 }}>{letter}</span>
    </div>
  )
}


