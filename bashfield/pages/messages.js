import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { supabase } from '../lib/supabase'

export default function Messages() {
  const { t } = useTranslation('common')
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const messagesRef = useRef(null)
  const autoScrollRef = useRef(true)

  // ------- Auth & initial load -------
  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) {
        router.push('/')
        return
      }
      setUser(u)
      setCurrentUser(u)
      await fetchConversations(u)
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!user) return
    // Open specific conversation from URL (?conversation=ID preferred; also support ?id=ID)
    const urlParams = new URLSearchParams(window.location.search)
    const conversationId = urlParams.get('conversation') || urlParams.get('id')
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c.id === conversationId)
      if (conv) setActiveConversation(conv)
    }
  }, [user, conversations])

  // ------- Fetchers -------
  const fetchConversations = async (u = user) => {
    if (!u) return
    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant1.eq.${u.id},participant2.eq.${u.id}`)
      .order('updated_at', { ascending: false })

    if (!convs) { setConversations([]); return }

    const participantIds = [...new Set(convs.flatMap(c => [c.participant1, c.participant2]))]
    const listingIds = [...new Set(convs.map(c => c.listing_id).filter(Boolean))]

    const [{ data: profiles }, { data: listings }] = await Promise.all([
      supabase.from('user_profiles').select('user_id, display_name, profile_picture').in('user_id', participantIds),
      listingIds.length
        ? supabase.from('listings').select('id, title').in('id', listingIds)
        : Promise.resolve({ data: [] }),
    ])

    const merged = (convs || []).map(conv => {
      const otherId = conv.participant1 === u.id ? conv.participant2 : conv.participant1
      const other = profiles?.find(p => p.user_id === otherId) || null
      const listing = listings?.find(l => l.id === conv.listing_id) || null
      return { ...conv, other_participant: other, listing }
    })

    setConversations(merged)
  }

  const fetchMessages = async () => {
    if (!activeConversation) return
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', activeConversation.id)
      .order('created_at', { ascending: true })

    if (!msgs) { setMessages([]); return }

    const uniqueSenders = [...new Set(msgs.map(m => m.sender_id))]
    const { data: senders } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, profile_picture')
      .in('user_id', uniqueSenders)

    const withProfiles = msgs.map(m => ({
      ...m,
      sender: senders?.find(p => p.user_id === m.sender_id) || { user_id: m.sender_id, display_name: 'Unknown' }
    }))
    setMessages(withProfiles)
  }

  const markAsRead = async () => {
    if (!activeConversation || !user) return
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', activeConversation.id)
      .eq('recipient_id', user.id)
      .eq('read', false)
    window.dispatchEvent(new CustomEvent('messagesRead'))
  }

  // ------- Effects: active conversation, realtime -------
  useEffect(() => {
    if (activeConversation) {
      window.activeConversationId = activeConversation.id
      fetchMessages()
      markAsRead()
    } else {
      window.activeConversationId = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id])

  useEffect(() => {
    if (!activeConversation || !user) return
    const channel = supabase
      .channel(`conversation-${activeConversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${activeConversation.id}`
      }, async (payload) => {
        const m = payload.new
        const { data: sp } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, profile_picture')
          .eq('user_id', m.sender_id)
          .single()
        setMessages(prev => [...prev, { ...m, sender: sp || { user_id: m.sender_id, display_name: 'Unknown' } }])
        setConversations(prev =>
          prev.map(c => c.id === activeConversation.id
            ? { ...c, updated_at: m.created_at }
            : c
          ).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        )
        if (m.recipient_id === user.id) await supabase.from('messages').update({ read: true }).eq('id', m.id)
        if (autoScrollRef.current) requestAnimationFrame(() => {
          const el = messagesRef.current
          if (el) el.scrollTop = el.scrollHeight
        })
      })
      .subscribe()

    return () => { try { supabase.removeChannel(channel) } catch {} }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id, user?.id])

  useEffect(() => {
    // keep conversations fresh while you’re on the page
    const id = setInterval(() => { if (user) fetchConversations(user) }, 5000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    const onScroll = () => {
      const el = messagesRef.current
      if (!el) return
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
      autoScrollRef.current = nearBottom
    }
    const el = messagesRef.current
    if (el) el.addEventListener('scroll', onScroll)
    return () => { if (el) el.removeEventListener('scroll', onScroll) }
  }, [])

  // ------- Send -------
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !user) return
    const otherId = activeConversation.participant1 === user.id ? activeConversation.participant2 : activeConversation.participant1

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConversation.id,
        sender_id: user.id,
        recipient_id: otherId,
        content: newMessage.trim()
      })
      .select('*')
      .single()

    if (error) { alert('Failed to send. Try again.'); return }

    const myProfile = { user_id: user.id, display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Me' }
    setMessages(prev => [...prev, { ...data, sender: myProfile }])
    setNewMessage('')
    setConversations(prev =>
      prev.map(c => c.id === activeConversation.id
        ? { ...c, updated_at: data.created_at }
        : c
      ).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    )
    requestAnimationFrame(() => {
      const el = messagesRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  // ------- UI -------
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

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
          <div className="flex h-full">
            {/* Section 2: conversation list */}
            <div className={`${activeConversation ? 'hidden md:block' : 'block'} w-full md:w-1/3 border-r border-gray-200 flex flex-col`}>
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">💬 Messages</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
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
                      onClick={() => setActiveConversation(conversation)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        activeConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {conversation.other_participant?.profile_picture ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${conversation.other_participant.profile_picture}`}
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {conversation.other_participant?.display_name?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.other_participant?.display_name || 'Unknown User'}
                            </p>
                            {/* badges handled elsewhere (global) */}
                          </div>
                          <p className="text-xs text-gray-600 truncate">Re: {conversation.listing?.title || 'Property'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Section 3: chat */}
            <div className={`${activeConversation ? 'block' : 'hidden md:block'} flex-1 flex flex-col`}>
              {activeConversation ? (
                <>
                  {/* Header: avatar+name link to profile */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setActiveConversation(null)}
                        className="md:hidden text-gray-600 hover:text-gray-900 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <Link href={`/profile/${activeConversation.other_participant?.user_id || ''}`} className="flex items-center space-x-3 group">
                        {activeConversation.other_participant?.profile_picture ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/house-images/${activeConversation.other_participant.profile_picture}`}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {activeConversation.other_participant?.display_name?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
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
                  <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  <div className="p-4 border-t border-gray-200">
                    <form
                      className="flex space-x-2 items-end"
                      onSubmit={(e) => { e.preventDefault(); sendMessage() }}
                      autoComplete="off"
                    >
                      <textarea
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value)
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        onKeyDown={(e) => {
                          // Desktop: Enter sends, Shift+Enter newline; Mobile keyboard shows newline key
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        placeholder="Type your message…"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden min-h-[44px] max-h-60"
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
                        disabled={!newMessage.trim()}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Send
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
          </div>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}
