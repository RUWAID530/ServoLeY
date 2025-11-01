import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { API_BASE } from '../App'

interface User {
  id: string
  email?: string
  phone?: string
  userType: string
  profile?: {
    firstName: string
    lastName: string
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activePath, setActivePath] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setActivePath(location.pathname)
    // Close mobile menu when route changes
    setMobileMenuOpen(false)
  }, [location])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')

    // If no token or user is not customer, redirect to login
    if (!token || userType !== 'CUSTOMER') {
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
        } else {
          // If token is invalid, clear it and redirect to login
          localStorage.removeItem('token')
          localStorage.removeItem('userType')
          window.location.href = '/login'
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Services', href: '/services', icon: '🛠️' },
    { name: 'Orders', href: '/orders', icon: '📋' },
    { name: 'Wallet', href: '/wallet', icon: '💰' },
    { name: 'Notifications', href: '/notifications', icon: '🔔' }]

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile navigation */}
      <div className={`lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-white transform transition-transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Servoley</h1>
            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100">
              <span className="sr-only">Close menu</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-5">
            <div className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    activePath === item.href
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-4 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <span className="mr-3 text-lg">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex h-16 items-center px-4">
          <h1 className="text-xl font-bold text-gray-900">Servoley</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-5">
          <div className="mt-5 px-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  activePath === item.href
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
              type="button"
              className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 p-1 rounded-md hover:bg-gray-100"
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center">
              <span className="text-lg font-medium text-gray-900">
                Welcome, {user?.profile?.firstName || 'Customer'}!
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="py-4 sm:py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
