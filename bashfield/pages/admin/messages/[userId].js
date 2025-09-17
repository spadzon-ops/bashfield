import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../../lib/supabase'
import { useTranslation } from '../../../contexts/TranslationContext'

export default function AdminUserMessages() {
  const router = useRouter()
  const { userId } = router.query
  const { t } = useTranslation()

  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [targetUser, setTargetUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [profiles, setProfiles] = useState(new Map())

  const messagesContainerRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return router.push('/')
      setUser(u)

      // Check admin status
      const { data: adminMatch } = await supabase
        .from('admin_emails')
        .select('email')
        .eq('email', u.email)
        .maybeSingle()

      if (!adminMatch) return router.push('/')
      setIsAdmin(true)

      if (userId) {
        await loadTargetUser(userId)
        await loadUserConversations(userId)
      }
      
      setLoading(false)
    })()
  }, [userId]) // eslint-disable-line

  const loadTargetUser = async (targetUserId) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .single()
    
    setTargetUser(profile)
  }

  const loadUserConversations = async (targetUserId) => {
    // Get all conversations where the target user is a participant
    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant1.eq.${targetUserId},participant2.eq.${targetUserId}`)
      .order('updated_at', { ascending: false })

    if (!convs) {
      setConversations([])
      return
    }

    // Get all participant IDs and listing IDs
    const participantIds = [...new Set(convs.flatMap((c) => [c.participant1, c.participant2]))]
    const listingIds = [...new Set(convs.map((c) => c.listing_id).filter(Boolean))]

    const [{ data: profilesData }, { data: listings }, { data: lastMsgs }] = await Promise.all([
      supabase.from('user_profiles')
        .select('user_id, display_name, profile_picture, email')
        .in('user_id', participantIds),
      listingIds.length
        ? supabase.from('listings').select('id, title, reference_code').in('id', listingIds)
        : Promise.resolve({ data: [] }),
      convs.length
        ? supabase.from('messages')
            .select('conversation_id, content, created_at, sender_id')
            .in('conversation_id', convs.map((c) => c.id))
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
    ])

    // Create profiles map
    const profilesMap = new Map()
    ;(profilesData || []).forEach(p => profilesMap.set(p.user_id, p))
    setProfiles(profilesMap)

    // Process conversations
    const processed = (convs || []).map((conv) => {
      const otherId = conv.participant1 === targetUserId ? conv.participant2 : conv.participant1
      const other = profilesData?.find((p) => p.user_id === otherId) || null
      const listing = listings?.find((l) => l.id === conv.listing_id) || null
      const last = lastMsgs?.find((m) => m.conversation_id === conv.id) || null
      
      return { 
        ...conv, 
        other_participant: other, 
        listing, 
        last_message: last,
        target_user: profilesMap.get(targetUserId)
      }
    }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))

    setConversations(processed)
  }

  const loadMessages = async (conversationId) => {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!msgs) {
      setMessages([])
      return
    }

    // Add sender profiles to messages
    const messagesWithProfiles = msgs.map((m) => ({
      ...m,
      sender: profiles.get(m.sender_id) || { display_name: 'Unknown User' },
    }))

    setMessages(messagesWithProfiles)
  }

  const selectConversation = async (conv) => {
    setActiveConversation(conv)
    await loadMessages(conv.id)
    // Auto scroll to bottom
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }
    }, 100)
  }

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const formatDate = (ts) => new Date(ts).toLocaleDateString()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/admin" 
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Admin</span>
            </Link>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center">
                <span className="text-2xl text-white">📱</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                  Message Review
                </h1>
                <p className="text-gray-600 text-lg">
                  Reviewing conversations for: <span className="font-semibold">{targetUser?.display_name}</span> ({targetUser?.email})
                </p>
                <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-1 rounded-lg inline-block">
                  ⚠️ Admin Review Mode - Read Only
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Interface */}
        <div className="bg-white rounded-3xl shadow-2xl h-[calc(100vh-200px)] min-h-0 border border-gray-200 overflow-hidden">
          <div className="flex h-full min-h-0">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 flex-col min-h-0 bg-gradient-to-b from-white to-gray-50">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <h2 className="text-xl font-bold text-gray-900">Conversations ({conversations.length})</h2>
                <p className="text-sm text-gray-600">All conversations involving this user</p>
              </div>
              
              <div className="flex-1 min-h-0 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Conversations</h3>
                    <p className="text-gray-600">This user has no message conversations yet.</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => selectConversation(conversation)}
                      className={`p-4 mx-3 my-2 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                        activeConversation?.id === conversation.id 
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-xl' 
                          : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-purple-200'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <AvatarCircle profile={conversation.other_participant} size={48} />
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
                                {formatDate(conversation.last_message.created_at)}
                              </span>
                            )}
                          </div>
                          <p className={`text-sm truncate mb-1 ${
                            activeConversation?.id === conversation.id ? 'text-white/90' : 'text-purple-600'
                          }`}>
                            {conversation.listing?.title ? `🏠 ${conversation.listing.title}` : '💬 Direct Message'}
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

            {/* Messages View */}
            <div className="flex-1 flex-col min-h-0">
              {activeConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
                    <div className="flex items-center space-x-4">
                      <AvatarCircle profile={activeConversation.other_participant} size={48} />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">
                          Conversation between {targetUser?.display_name} & {activeConversation.other_participant?.display_name}
                        </h3>
                        <p className="text-sm text-purple-600 font-medium">
                          {activeConversation.listing?.title ? `🏠 Property: ${activeConversation.listing.title} (${activeConversation.listing.reference_code})` : '💬 Direct Message'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Started: {formatDate(activeConversation.created_at)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Messages: {messages.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No messages in this conversation yet.
                      </div>
                    ) : (
                      messages.map((m, index) => {
                        const isTargetUser = m.sender_id === userId
                        const showAvatar = index === 0 || messages[index - 1]?.sender_id !== m.sender_id
                        const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.sender_id !== m.sender_id
                        
                        return (
                          <div key={m.id} className={`flex items-end space-x-3 ${isTargetUser ? 'justify-end' : 'justify-start'}`}>
                            {!isTargetUser && (
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
                                  isTargetUser 
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white rounded-br-md' 
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-bl-md'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                  {m.content}
                                </p>
                              </div>
                              {isLastInGroup && (
                                <div className={`text-xs mt-2 px-2 flex items-center space-x-2 ${
                                  isTargetUser ? 'justify-end' : 'justify-start'
                                }`}>
                                  <span className="text-gray-500">
                                    {m.sender?.display_name} • {formatTime(m.created_at)}
                                  </span>
                                  {m.read && (
                                    <span className="text-green-500 text-xs">✓ Read</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {isTargetUser && (
                              <div className="flex-shrink-0">
                                {showAvatar ? (
                                  <AvatarCircle profile={targetUser} size={32} />
                                ) : (
                                  <div className="w-8 h-8"></div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>

                  {/* Read-only Notice */}
                  <div className="p-4 bg-red-50 border-t border-red-200">
                    <div className="flex items-center justify-center space-x-2 text-red-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="font-semibold">Admin Review Mode - Messages are read-only</span>
                    </div>
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
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-4">
                      Select a Conversation
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Choose a conversation from the left to review the messages.
                    </p>
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
      className="rounded-full bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center ring-2 ring-white shadow-lg" 
      style={{ width: size, height: size }}
    >
      <span className="text-white font-bold" style={{ fontSize: size * 0.4 }}>{letter}</span>
    </div>
  )
}