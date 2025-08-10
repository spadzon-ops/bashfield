import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function Chat() {
  const router = useRouter()
  const { listingId } = router.query
  const [user, setUser] = useState(null)
  const [listing, setListing] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user && listingId) {
        fetchListing()
        fetchMessages()
      } else {
        setLoading(false)
      }
    }
    getUser()
  }, [listingId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchListing = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single()

    if (!error && data) {
      setListing(data)
    }
  }

  const fetchMessages = async () => {
    // Simulate messages for now
    const simulatedMessages = [
      {
        id: 1,
        sender_id: 'other',
        sender_email: 'owner@example.com',
        message: 'Hello! Thanks for your interest in my property.',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 2,
        sender_id: user?.id,
        sender_email: user?.email,
        message: 'Hi! I would like to know more about this property.',
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ]
    setMessages(simulatedMessages)
    setLoading(false)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    const newMsg = {
      id: Date.now(),
      sender_id: user.id,
      sender_email: user.email,
      message: newMessage.trim(),
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, newMsg])
    setNewMessage('')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md w-full">
          <span className="text-4xl block mb-4">🔒</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to start chatting about this property.</p>
          <button 
            onClick={() => window.close()}
            className="btn-primary w-full"
          >
            Close Window
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => window.close()}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ←
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{listing?.title || 'Property Chat'}</h1>
              <p className="text-sm text-gray-600">Chat with property owner</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">
              {listing?.currency === 'USD' ? '$' : ''}{listing?.price?.toLocaleString() || '---'}
            </span>
            <span className="text-gray-500 text-sm">
              {listing?.currency === 'USD' ? 'USD' : 'IQD'}/month
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-4">💬</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Start the conversation</h3>
            <p className="text-gray-600">Send a message to inquire about this property.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index}
              className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender_id === user.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                <p className="text-sm">{message.message}</p>
                <p className={`text-xs mt-1 ${
                  message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}