import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { API_BASE } from '../App'

interface User {
  id: string
  email?: string
  phone?: string
  userType: string
  profile?: {
    firstName: string
    lastName: string
    businessName?: string
  }
}

export default function Layout() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')

    if (!token || userType !== 'PROVIDER') {
      window.location.href = '/login'
      return
    }

    // Fetch user profile
    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (res.ok) {
          const data = await res.json()
          setUser(data.data.user)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('userType')
        window.location.href = '/login'
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login in useEffect
  }

  const navigation = [
    { name: 'Inbox', href: '/inbox', icon: '📥' },
    { name: 'Wallet', href: '/wallet', icon: '💰' },
    { name: 'Services', href: '/services', icon: '🛠️' },
    { name: 'Reviews', href: '/reviews', icon: '⭐' },
    { name: 'Availability', href: '/availability', icon: '🕒' },
    { name: 'Notifications', href: '/notifications', icon: '🔔' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Servoley Provider</h1>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
              <span className="sr-only">Close sidebar</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-5">
            <div className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  <span className="mr-4 text-lg">{item.icon}</span>
                  {item.name}
                </a>
              ))}
            </div>
          </nav>
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-2 py-2 text-base font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              <span className="mr-4 text-lg">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-xl font-bold text-gray-900">Servoley Provider</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-5">
          <div className="mt-5 px-2 space-y-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </a>
            ))}
          </div>
        </nav>
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            <span className="mr-3 text-lg">🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center">
              <span className="text-lg font-medium text-gray-900">
                Welcome, {user.profile?.businessName || user.profile?.firstName || 'Provider'}!
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
