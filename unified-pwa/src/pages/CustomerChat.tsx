import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { API_BASE } from '../config/api'
import { ArrowLeft } from 'lucide-react'

export default function Chat() {
  const { orderId } = useParams<{ orderId: string }>()
  const location = useLocation()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [orderInfo, setOrderInfo] = useState<any>(null)
  const [chatTitle, setChatTitle] = useState<string>('Chat')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check if we have provider data from location state
  useEffect(() => {
    if (location.state?.providerName) {
      setChatTitle(`Chat with ${location.state.providerName}`)
    }
  }, [location.state])

  useEffect(() => {
    fetchMessages()
    fetchOrderInfo()
    
    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 5000)
    
    return () => clearInterval(interval)
  }, [orderId])

  useEffect(() => {
    // Scroll to bottom of messages
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/orders/${orderId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setMessages(data.data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderInfo = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setOrderInfo(data.data)
      }
    } catch (error) {
      console.error('Error fetching order info:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/orders/${orderId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage })
      })

      const data = await response.json()
      if (data.success) {
        setNewMessage('')
        fetchMessages() // Refresh messages
      } else {
        console.error('Failed to send message:', data.message)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      <div className="sticky top-0 bg-gray-950/95 backdrop-blur-lg border-b border-gray-800 z-40">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">{chatTitle}</h1>
        </div>
      </div>
      
      <div className="px-4 py-6">
        {orderInfo && (
          <div className="bg-gray-800/60 rounded-xl p-4 mb-6">
            <div className="flex justify-between">
              <div>
                <h2 className="text-lg font-medium">{orderInfo.serviceName}</h2>
                <p className="text-sm text-gray-400">Status: {orderInfo.status}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Order Date: {new Date(orderInfo.createdAt).toLocaleDateString()}</p>
                <p className="text-sm text-gray-400">Amount: ${orderInfo.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="h-96 overflow-y-auto p-4 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading messages...</p>
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isFromCustomer ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isFromCustomer
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.isFromCustomer ? 'text-blue-200' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
