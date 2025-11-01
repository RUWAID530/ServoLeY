import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE } from '../App'

interface Service {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

interface Order {
  id: string;
  service: string;
  status: string;
  date: string;
  progress?: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profile?: {
    firstName: string;
    lastName: string;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [location, setLocation] = useState('New York');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setUserData(data.data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchServices = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/services`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          // Transform services data to include icons
          const servicesWithIcons = data.data.map((service: any) => ({
            ...service,
            icon: getServiceIcon(service.name)
          }));
          setServices(servicesWithIcons);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchUserData(), fetchServices(), fetchOrders()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const getServiceIcon = (serviceName: string) => {
    const icons: { [key: string]: string } = {
      'Plumbing': '🔧',
      'Cleaning': '🧹',
      'Pest Control': '🐜',
      'Electrician': '💡',
      'Painting': '🎨',
      'Carpentry': '🔨',
      'Gardening': '🌳',
      'Moving': '🚚',
      'Appliance Repair': '🔌',
      'Home Security': '🔐',
      'default': '🛠️'
    };
    return icons[serviceName] || icons['default'];
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Miami', 'Seattle', 'Boston'];

  const quickActions = [
    { id: 1, name: 'Browse Services', icon: '🛠️', link: '/services', color: 'bg-blue-100 text-blue-700' },
    { id: 2, name: 'Post Requirement', icon: '➕', link: '/post-requirement', color: 'bg-green-100 text-green-700' },
    { id: 3, name: 'My Orders', icon: '📦', link: '/orders', color: 'bg-purple-100 text-purple-700' },
    { id: 4, name: 'Notifications', icon: '🔔', link: '/notifications', color: 'bg-yellow-100 text-yellow-700' }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold mr-3">
                {userData?.name?.[0] || 'U'}
              </div>
              <div>
                <h1 className="text-xl font-medium">Welcome back, {userData?.name?.split(' ')[0] || 'User'}!</h1>
                <p className="text-blue-100 text-sm">What service do you need today?</p>
              </div>
            </div>
            <button className="p-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for services, providers, or more..."
              className="w-full py-3 pl-10 pr-4 bg-white/10 backdrop-blur-sm rounded-lg text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button type="submit" className="absolute right-2 top-2 px-3 py-1 bg-white text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors">
              Search
            </button>
          </form>
        </div>
      </header>

      {/* Location Selector */}
      <div className="px-4 py-3 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-700">Current Location: <span className="font-medium">{location}</span></span>
          </div>
          <button
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            className="text-blue-600 text-sm font-medium"
          >
            Change
          </button>
        </div>

        {showLocationDropdown && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {locations.map(loc => (
              <button
                key={loc}
                onClick={() => {
                  setLocation(loc);
                  setShowLocationDropdown(false);
                }}
                className={`py-2 px-3 rounded-md text-sm ${
                  location === loc
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map(action => (
            <Link
              key={action.id}
              to={action.link}
              className={`${action.color} rounded-xl p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow`}
            >
              <span className="text-3xl mb-2">{action.icon}</span>
              <span className="text-sm font-medium text-center">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Popular Services */}
      <div className="px-4 pb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Popular Services</h2>
          <Link to="/services" className="text-blue-600 text-sm font-medium">View All</Link>
        </div>

        {services.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {services.slice(0, 6).map(service => (
              <Link
                key={service.id}
                to={`/services/${service.id}`}
                className="bg-white rounded-lg p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-2xl mb-2">{service.icon}</span>
                <span className="text-xs font-medium text-center text-gray-700">{service.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 text-center">
            <p className="text-gray-500">Loading services...</p>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="px-4 pb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Recent Orders</h2>
          <Link to="/orders" className="text-blue-600 text-sm font-medium">View All</Link>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.slice(0, 3).map(order => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{order.service}</h3>
                    <p className="text-sm text-gray-500 mt-1">Order ID: {order.id}</p>
                    <p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {order.status === 'processing' && order.progress !== undefined && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{order.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${order.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by browsing our services.</p>
            <div className="mt-4">
              <Link
                to="/services"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse Services
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
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
