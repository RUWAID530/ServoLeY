import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../App'

interface Notification {
  id: string
  title: string
  message: string
  type: 'ORDER' | 'MESSAGE' | 'SYSTEM'
  read: boolean
  createdAt: string
  relatedId?: string
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'READ' | 'UNREAD'>('ALL')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setNotifications(data.data)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => 
            notification.id === id 
              ? { ...notification, read: true }
              : notification
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => ({ ...notification, read: true }))
        )
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setNotifications(prevNotifications => 
          prevNotifications.filter(notification => notification.id !== id)
        )
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return (
          <svg className="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        )
      case 'MESSAGE':
        return (
          <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )
      case 'SYSTEM':
        return (
          <svg className="h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'ALL') return true
    if (filter === 'READ') return notification.read
    if (filter === 'UNREAD') return !notification.read
    return true
  })

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p>Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>

        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'ALL' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'UNREAD' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('READ')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'READ' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Read
            </button>
          </div>

          <button
            onClick={markAllAsRead}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Mark All as Read
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`px-6 py-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)}
                        </span>
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mt-1">
                      {notification.message}
                    </p>

                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                      >
                        Mark as read
                      </button>
                    )}

                    {notification.relatedId && (
                      <div className="mt-2">
                        {notification.type === 'ORDER' && (
                          <Link 
                            to={`/orders`}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View Order
                          </Link>
                        )}

                        {notification.type === 'MESSAGE' && (
                          <Link 
                            to={`/chat/${notification.relatedId}`}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View Chat
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-gray-500">You don't have any notifications at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}