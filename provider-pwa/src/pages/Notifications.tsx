import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../App'

interface Notification {
  id: string
  title: string
  message: string
  type: 'order' | 'payment' | 'system' | 'review' | 'message'
  timestamp: string
  isRead: boolean
  link?: string
  data?: any // Additional data related to the notification
}

interface NotificationGroup {
  type: string
  icon: JSX.Element
  color: string
  notifications: Notification[]
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    orderUpdates: true,
    newMessages: true,
    newReviews: true,
    paymentAlerts: true
  })

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/provider/notifications`, {
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
      const response = await fetch(`${API_BASE}/api/provider/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setNotifications(notifications.map(notification => 
          notification.id === id ? { ...notification, isRead: true } : notification
        ))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/provider/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setNotifications(notifications.map(notification => ({ ...notification, isRead: true })))
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/provider/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setNotifications(notifications.filter(notification => notification.id !== id))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const updateNotificationSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/provider/notifications/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notificationSettings)
      })
      
      if (response.ok) {
        // Show success message
        alert('Notification settings updated successfully!')
      }
    } catch (error) {
      console.error('Error updating notification settings:', error)
    }
  }

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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getNotificationGroups = (): NotificationGroup[] => {
    const groups: NotificationGroup[] = [
      {
        type: 'order',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        ),
        color: 'blue',
        notifications: []
      },
      {
        type: 'payment',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'green',
        notifications: []
      },
      {
        type: 'review',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ),
        color: 'yellow',
        notifications: []
      },
      {
        type: 'message',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        ),
        color: 'purple',
        notifications: []
      },
      {
        type: 'system',
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        color: 'gray',
        notifications: []
      }
    ]
    
    // Group notifications by type
    notifications.forEach(notification => {
      const group = groups.find(g => g.type === notification.type)
      if (group) {
        group.notifications.push(notification)
      }
    })
    
    // Filter out empty groups
    return groups.filter(group => group.notifications.length > 0)
  }

  const filteredNotifications = notifications.filter(notification => 
    filter === 'all' || !notification.isRead
  )

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Mark all as read
            </button>
          )}
          <Link to="/inbox" className="text-blue-600 hover:underline">Back to Inbox</Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Notifications
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
          
          {loading ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p>Loading notifications...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {getNotificationGroups().map(group => (
                <div key={group.type} className="border-b border-gray-200 last:border-b-0">
                  <div className={`px-6 py-3 bg-${group.color}-50 flex items-center`}>
                    <div className={`text-${group.color}-600 mr-2`}>
                      {group.icon}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 capitalize">{group.type}s</h3>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {group.notifications
                      .filter(notification => filter === 'all' || !notification.isRead)
                      .map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-4 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex justify-between">
                          <div className="flex items-start">
                            {!notification.isRead && (
                              <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-600 mt-2 mr-2"></span>
                            )}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <span>{formatDate(notification.timestamp)}</span>
                                <span className="mx-1">•</span>
                                <span>{formatTime(notification.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {notification.link && (
                              <Link
                                to={notification.link}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                View
                              </Link>
                            )}
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Mark as read
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-gray-500">
                {filter === 'all' 
                  ? "You don't have any notifications at the moment." 
                  : "You don't have any unread notifications."}
              </p>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Notification Methods</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="email-notifications"
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: e.target.checked
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-700">
                      Email notifications
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="push-notifications"
                      type="checkbox"
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        pushNotifications: e.target.checked
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="push-notifications" className="ml-2 block text-sm text-gray-700">
                      Push notifications
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Notification Types</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="order-updates"
                      type="checkbox"
                      checked={notificationSettings.orderUpdates}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        orderUpdates: e.target.checked
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="order-updates" className="ml-2 block text-sm text-gray-700">
                      Order updates
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="new-messages"
                      type="checkbox"
                      checked={notificationSettings.newMessages}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        newMessages: e.target.checked
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="new-messages" className="ml-2 block text-sm text-gray-700">
                      New messages
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="new-reviews"
                      type="checkbox"
                      checked={notificationSettings.newReviews}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        newReviews: e.target.checked
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="new-reviews" className="ml-2 block text-sm text-gray-700">
                      New reviews
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="payment-alerts"
                      type="checkbox"
                      checked={notificationSettings.paymentAlerts}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        paymentAlerts: e.target.checked
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="payment-alerts" className="ml-2 block text-sm text-gray-700">
                      Payment alerts
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  onClick={updateNotificationSettings}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
