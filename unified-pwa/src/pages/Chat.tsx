import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API_BASE } from '../App'
import { io, Socket } from 'socket.io-client'

interface Message {
  id: string
  orderId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
}

interface Order {
  id: string
  serviceId: string
  serviceTitle: string
  customerId: string
  customerName: string
  providerId: string
  providerName: string
  status: string
}

export default function Chat() {
  const { orderId } = useParams<{ orderId: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [userType, setUserType] = useState<'CUSTOMER' | 'PROVIDER' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchOrderDetails()
    fetchMessages()
    checkUserInfo()

    // Initialize socket connection
    const token = localStorage.getItem('token')
    const newSocket = io(API_BASE, {
      auth: {
        token
      }
    })

    newSocket.emit('joinOrderRoom', orderId)

    newSocket.on('newMessage', (message: Message) => {
      setMessages(prevMessages => [...prevMessages, message])
    })

    setSocket(newSocket)

    return () => {
      newSocket.emit('leaveOrderRoom', orderId)
      newSocket.disconnect()
    }
  }, [orderId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkUserInfo = () => {
    const type = localStorage.getItem('userType')
    const id = localStorage.getItem('userId')
    setUserType(type as 'CUSTOMER' | 'PROVIDER' | null)
    setUserId(id)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setOrder(data.data)
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/messages`, {
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !socket || !orderId) return

    socket.emit('sendMessage', {
      orderId,
      content: newMessage
    })

    setNewMessage('')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p>Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow h-[600px] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Chat</h1>
            {order && (
              <p className="text-sm text-gray-500 mt-1">
                Order: {order.serviceTitle} ({order.id.substring(0, 8)}...)
              </p>
            )}
          </div>
          <Link to="/orders" className="text-blue-600 hover:underline">
            Back to Orders
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === userId 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <div className="font-medium text-sm mb-1">
                    {message.senderId === userId ? 'You' : message.senderName}
                  </div>
                  <div>{message.content}</div>
                  <div className={`text-xs mt-1 ${
                    message.senderId === userId ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatDate(message.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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