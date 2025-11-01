import React from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../App'

export default function Dashboard() {
  const [userData, setUserData] = React.useState<any>(null)
  const [location, setLocation] = React.useState('New York')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showLocationDropdown, setShowLocationDropdown] = React.useState(false)

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${API_BASE}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        if (data.success) {
          setUserData(data.data)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()
  }, [])

  const popularServices = [
    { id: 1, name: 'Plumbing', icon: '🔧' },
    { id: 2, name: 'Cleaning', icon: '🧹' },
    { id: 3, name: 'Pest Control', icon: '🐜' },
    { id: 4, name: 'Electrician', icon: '💡' },
    { id: 5, name: 'Painting', icon: '🎨' },
    { id: 6, name: 'Carpentry', icon: '🔨' }
  ]

  const quickActions = [
    { id: 1, name: 'Manage Services', icon: '⚙️', link: '/services' },
    { id: 2, name: 'Post Requirement', icon: '➕', link: '/post-requirement' },
    { id: 3, name: 'My Orders', icon: '📦', link: '/orders' },
    { id: 4, name: 'Notifications', icon: '🔔', link: '/notifications' }
  ]

  const ongoingRequests = [
    { id: 1, service: 'Plumbing', status: 'In Progress', date: '2023-12-20' },
    { id: 2, service: 'Cleaning', status: 'Pending', date: '2023-12-22' }
  ]

  const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Top Bar */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => window.history.back()} 
            className="p-2 rounded-md hover:bg-gray-100"
            title="Go Back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-medium">Hello, {userData?.name?.split(' ')[0] || 'User'}</h1>
          <div className="relative">
            <button className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {userData?.name?.[0] || 'U'}
            </button>
          </div>
        </div>
      </header>

      {/* Location Selector */}
      <div className="px-4 py-3 bg-white border-b">
        <div className="relative">
          <button
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            className="flex items-center justify-between w-full py-2 px-3 bg-gray-100 rounded-lg"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{location}</span>
            </div>
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showLocationDropdown && (
            <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-lg z-20 py-1">
              {locations.map(loc => (
                <button
                  key={loc}
                  onClick={() => {
                    setLocation(loc)
                    setShowLocationDropdown(false)
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-4 bg-white border-b">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What service do you need?"
            className="w-full py-3 pl-10 pr-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4 bg-white mb-2">
        <h2 className="text-lg font-medium mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(action => (
            <Link
              key={action.id}
              to={action.link}
              className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl mb-2">{action.icon}</span>
              <span className="text-sm font-medium">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Popular Services */}
      <div className="px-4 py-4 bg-white mb-2">
        <h2 className="text-lg font-medium mb-3">Popular Services in {location}</h2>
        <div className="grid grid-cols-3 gap-3">
          {popularServices.map(service => (
            <Link
              key={service.id}
              to={`/services/${service.name.toLowerCase()}`}
              className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl mb-2">{service.icon}</span>
              <span className="text-xs font-medium text-center">{service.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Ongoing Requests */}
      <div className="px-4 py-4 bg-white mb-2">
        <h2 className="text-lg font-medium mb-3">Your Requests</h2>
        {ongoingRequests.length > 0 ? (
          <div className="space-y-3">
            {ongoingRequests.map(request => (
              <Link
                key={request.id}
                to={`/orders/${request.id}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{request.service}</h3>
                    <p className="text-sm text-gray-600">{request.date}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    request.status === 'In Progress' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-2">No current requests</p>
            <Link to="/post-requirement" className="text-blue-600 font-medium">Start a new service</Link>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="grid grid-cols-4 py-2">
          <Link to="/dashboard" className="flex flex-col items-center py-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1 text-blue-600">Home</span>
          </Link>
          <Link to="/services" className="flex flex-col items-center py-2">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-xs mt-1 text-gray-600">Services</span>
          </Link>
          <Link to="/orders" className="flex flex-col items-center py-2">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs mt-1 text-gray-600">Orders</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center py-2">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs mt-1 text-gray-600">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
