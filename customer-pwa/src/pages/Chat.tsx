import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API_BASE } from '../App'

export default function Chat() {
  const { orderId } = useParams<{ orderId: string }>()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [orderInfo, setOrderInfo] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const fetchOrderInfo = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
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
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/messages`, {
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Chat</h1>
          {orderInfo && (
            <p className="text-gray-600">Order: {orderInfo.serviceName} (ID: {orderInfo.id})</p>
          )}
        </div>
        <Link to="/orders" className="text-blue-600 hover:underline">Back to Orders</Link>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          {orderInfo ? (
            <div className="flex justify-between">
              <div>
                <h2 className="text-lg font-medium">{orderInfo.serviceName}</h2>
                <p className="text-sm text-gray-600">Status: {orderInfo.status}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Order Date: {new Date(orderInfo.createdAt).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600">Amount: ${orderInfo.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <p>Loading order information...</p>
          )}
        </div>
        
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
