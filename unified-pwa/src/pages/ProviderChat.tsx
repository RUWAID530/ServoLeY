import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../config/api'

interface Message {
  id: string
  senderId: string
  senderName: string
  orderId: string
  serviceTitle: string
  content: string
  timestamp: string
  isRead: boolean
}

export default function Inbox() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found')
        setLoading(false)
        return
      }

      // TODO: Replace with actual API endpoint when backend is ready
      // For now, show empty state since we want real data
      setMessages([])
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/provider/messages/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setMessages(messages.map(msg => 
          msg.id === id ? { ...msg, isRead: true } : msg
        ))
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const filteredMessages = messages.filter(message => 
    filter === 'all' || !message.isRead
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) {
      return 'Today'
    } else if (diffInDays === 1) {
      return 'Yesterday'
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const unreadCount = messages.filter(m => !m.isRead).length

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold">Inbox</h1>
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-sm rounded-full ${
                filter === 'unread' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Unread
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p>Loading messages...</p>
        </div>
      ) : filteredMessages.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredMessages.map((message) => (
              <li 
                key={message.id} 
                className={`p-4 hover:bg-gray-50 ${!message.isRead ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between">
                  <div className="flex items-start">
                    {!message.isRead && (
                      <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600 mt-2 mr-2"></span>
                    )}
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900">{message.senderName}</h3>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{formatDate(message.timestamp)}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{message.content}</p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>Order: {message.serviceTitle}</span>
                        <span className="mx-2">•</span>
                        <span>ID: {message.orderId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {!message.isRead && (
                      <button
                        onClick={() => markAsRead(message.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 mb-2"
                      >
                        Mark as read
                      </button>
                    )}
                    <Link
                      to={`/chat/${message.orderId}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Reply
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No messages</h3>
          <p className="mt-1 text-gray-500">
            {filter === 'all' 
              ? "You don't have any messages at the moment." 
              : "You don't have any unread messages."}
          </p>
        </div>
      )}
    </div>
  )
}
