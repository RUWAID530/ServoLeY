import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Settings,
  Wallet,
  Star,
  CheckCircle,
  Megaphone,
  MessageSquare
} from 'lucide-react'
import { API_BASE } from '../config/api'

interface Notification {
  id: string
  title: string
  message: string
  type: 'order' | 'payment' | 'system' | 'review' | 'message'
  timestamp: string
  isRead: boolean
  link?: string
  data?: any
}

type TabKey = 'orders' | 'messages' | 'updates'

type DayBucket = 'today' | 'yesterday' | 'earlier'

const getDayBucket = (value: string): DayBucket => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'earlier'
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)

  if (date >= startOfToday) return 'today'
  if (date >= startOfYesterday) return 'yesterday'
  return 'earlier'
}

const formatTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const formatRelative = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'payment':
      return { icon: <Wallet className="h-5 w-5" />, bg: 'bg-orange-100', text: 'text-orange-600' }
    case 'review':
      return { icon: <Star className="h-5 w-5" />, bg: 'bg-orange-100', text: 'text-orange-600' }
    case 'order':
      return { icon: <CheckCircle className="h-5 w-5" />, bg: 'bg-slate-100', text: 'text-slate-600' }
    case 'message':
      return { icon: <MessageSquare className="h-5 w-5" />, bg: 'bg-emerald-100', text: 'text-emerald-600' }
    default:
      return { icon: <Megaphone className="h-5 w-5" />, bg: 'bg-slate-100', text: 'text-slate-600' }
  }
}

const getTabKey = (notification: Notification): TabKey => {
  if (notification.type === 'message') return 'messages'
  if (notification.type === 'system') return 'updates'
  return 'orders'
}

const getFallbackNotifications = () => {
  const now = new Date()
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const yesterdayLate = new Date(yesterday)
  yesterdayLate.setHours(16, 30, 0, 0)
  const yesterdayMorning = new Date(yesterday)
  yesterdayMorning.setHours(10, 15, 0, 0)

  return [
    {
      id: 'pay-001',
      title: 'Payment Received',
      message: '$450.00 from client John Doe has been credited to your wallet.',
      type: 'payment',
      timestamp: twoMinutesAgo.toISOString(),
      isRead: false,
      link: '/provider/wallet',
      data: { actionLabel: 'View Wallet' }
    },
    {
      id: 'rev-001',
      title: 'New Review',
      message: 'Sarah Jenkins left you a 5-star review: "Excellent work on the plumbing repairs!"',
      type: 'review',
      timestamp: oneHourAgo.toISOString(),
      isRead: false,
      data: { thumbnail: true }
    },
    {
      id: 'ord-001',
      title: 'Order Completed',
      message: 'The project "Kitchen Remodel Phase 1" has been marked as complete.',
      type: 'order',
      timestamp: yesterdayLate.toISOString(),
      isRead: true
    },
    {
      id: 'sys-001',
      title: 'Policy Update',
      message: "We've updated our service provider terms of service. Please review the changes.",
      type: 'system',
      timestamp: yesterdayMorning.toISOString(),
      isRead: true,
      link: '/provider/settings',
      data: { actionLabel: 'Read More' }
    }
  ]
}

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('orders')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/provider/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setNotifications(Array.isArray(data.data) ? data.data : [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const displayNotifications = useMemo(() => {
    if (loading) return []
    if (notifications.length > 0) return notifications
    return getFallbackNotifications()
  }, [loading, notifications])

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'messages') {
      return displayNotifications.filter((notification) => getTabKey(notification) === 'messages')
    }
    if (activeTab === 'updates') {
      return displayNotifications.filter((notification) => getTabKey(notification) === 'updates')
    }
    return displayNotifications.filter((notification) => getTabKey(notification) === 'orders')
  }, [activeTab, displayNotifications])

  const grouped = useMemo(() => {
    return filteredNotifications.reduce(
      (acc, notification) => {
        const bucket = getDayBucket(notification.timestamp)
        acc[bucket].push(notification)
        return acc
      },
      { today: [] as Notification[], yesterday: [] as Notification[], earlier: [] as Notification[] }
    )
  }, [filteredNotifications])

  const handleBack = () => {
    navigate('/provider/dashboard')
  }

  const handleSettings = () => {
    navigate('/provider/settings')
  }

  const handleAction = (link?: string) => {
    if (link) {
      navigate(link)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f1ef]">
      <div className="bg-gradient-to-b from-[#3b261d] to-[#2a1b15] px-5 pt-6 pb-5 text-white">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Notifications</h1>
          <button
            type="button"
            onClick={handleSettings}
            className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center gap-8 text-sm font-semibold text-white/80">
          {([
            { key: 'orders', label: 'New Orders' },
            { key: 'messages', label: 'Messages' },
            { key: 'updates', label: 'Platform Updates' }
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 transition-colors ${
                activeTab === tab.key
                  ? 'text-orange-400 border-b-2 border-orange-500'
                  : 'hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-6 pb-24">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-3xl bg-white border border-slate-100 p-8 text-center text-slate-500 shadow-sm">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.today.length > 0 && (
              <section>
                <p className="text-xs font-semibold tracking-[0.3em] text-slate-500">TODAY</p>
                <div className="mt-4 space-y-4">
                  {grouped.today.map((notification) => {
                    const meta = getNotificationIcon(notification.type)
                    return (
                      <div
                        key={notification.id}
                        className="rounded-3xl bg-white border border-slate-100 p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${meta.bg} ${meta.text}`}>
                              {meta.icon}
                            </div>
                            <div>
                              <p className="text-base font-semibold text-slate-900">{notification.title}</p>
                              <p className="mt-2 text-sm text-slate-600">{notification.message}</p>
                              {notification.data?.actionLabel && (
                                <button
                                  type="button"
                                  onClick={() => handleAction(notification.link)}
                                  className="mt-4 inline-flex items-center justify-center rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                                >
                                  {notification.data.actionLabel}
                                </button>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-slate-400">{formatRelative(notification.timestamp)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {grouped.yesterday.length > 0 && (
              <section>
                <p className="text-xs font-semibold tracking-[0.3em] text-slate-500">YESTERDAY</p>
                <div className="mt-4 space-y-4">
                  {grouped.yesterday.map((notification) => {
                    const meta = getNotificationIcon(notification.type)
                    return (
                      <div
                        key={notification.id}
                        className="rounded-3xl bg-white border border-slate-100 p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${meta.bg} ${meta.text}`}>
                              {meta.icon}
                            </div>
                            <div className="flex-1">
                              <p className="text-base font-semibold text-slate-900">{notification.title}</p>
                              <p className="mt-2 text-sm text-slate-600">{notification.message}</p>
                              {notification.data?.actionLabel && (
                                <button
                                  type="button"
                                  onClick={() => handleAction(notification.link)}
                                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-600"
                                >
                                  {notification.data.actionLabel}
                                  <span aria-hidden>?</span>
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-slate-400">Yesterday, {formatTime(notification.timestamp)}</span>
                            {notification.data?.thumbnail && (
                              <div className="mt-4 h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 via-orange-400 to-slate-700" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {grouped.earlier.length > 0 && (
              <section>
                <p className="text-xs font-semibold tracking-[0.3em] text-slate-500">EARLIER</p>
                <div className="mt-4 space-y-4">
                  {grouped.earlier.map((notification) => {
                    const meta = getNotificationIcon(notification.type)
                    return (
                      <div
                        key={notification.id}
                        className="rounded-3xl bg-white border border-slate-100 p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${meta.bg} ${meta.text}`}>
                              {meta.icon}
                            </div>
                            <div>
                              <p className="text-base font-semibold text-slate-900">{notification.title}</p>
                              <p className="mt-2 text-sm text-slate-600">{notification.message}</p>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400">{formatRelative(notification.timestamp)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
