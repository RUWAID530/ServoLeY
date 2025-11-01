import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE } from '../App'

interface User {
  id: string
  name: string
  email: string
  phone: string
  userType: 'CUSTOMER' | 'PROVIDER'
  businessName?: string
  address?: string
}

interface Service {
  id: string
  title: string
  description: string
  price: number
  duration: number
  isActive: boolean
  category: string
  imageUrl?: string
}

interface Order {
  id: string
  serviceId: string
  serviceTitle: string
  customerId: string
  customerName: string
  providerId: string
  providerName: string
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  details: string
  quantity: number
  totalPrice: number
  createdAt: string
  updatedAt: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'orders'>('overview')
  const navigate = useNavigate()

  useEffect(() => {
    fetchUserData()
    fetchServices()
    fetchOrders()
  }, [])

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
        setUser(data.data)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token')
      const userType = localStorage.getItem('userType')

      if (userType === 'PROVIDER') {
        const response = await fetch(`${API_BASE}/api/provider/services`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const data = await response.json()
        if (data.success) {
          setServices(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token')
      const userType = localStorage.getItem('userType')

      const url = userType === 'PROVIDER' 
        ? `${API_BASE}/api/provider/orders`
        : `${API_BASE}/api/customer/orders`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setOrders(data.data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    localStorage.removeItem('userId')
    navigate('/login-signup')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/provider/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()
      if (data.success) {
        fetchOrders()
      } else {
        console.error('Failed to update order status:', data.message)
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const isProvider = user?.userType === 'PROVIDER'

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <button 
            onClick={handleLogout}
            className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'services'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Orders
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="mt-1 text-sm text-gray-900">{user?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="mt-1 text-sm text-gray-900">{user?.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Account Type</p>
                      <p className="mt-1 text-sm text-gray-900">{user?.userType === 'PROVIDER' ? 'Service Provider' : 'Customer'}</p>
                    </div>
                    {isProvider && (
                      <>
                        {user?.businessName && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Business Name</p>
                            <p className="mt-1 text-sm text-gray-900">{user.businessName}</p>
                          </div>
                        )}
                        {user?.address && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Business Address</p>
                            <p className="mt-1 text-sm text-gray-900">{user.address}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total {isProvider ? 'Services Listed' : 'Orders Placed'}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {isProvider ? services.length : orders.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Completed Orders
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {orders.filter(order => order.status === 'COMPLETED').length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div>
              {isProvider ? (
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">My Services</h2>
                  <Link to="/services" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                    Manage Services
                  </Link>
                </div>
              ) : (
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Available Services</h2>
                  <Link to="/services" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                    Browse All Services
                  </Link>
                </div>
              )}

              {services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <div key={service.id} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-1">{service.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">${service.price.toFixed(2)}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  {isProvider ? (
                    <>
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-gray-900">No services listed</h3>
                      <p className="mt-1 text-gray-500">You haven't created any services yet.</p>
                      <div className="mt-6">
                        <Link to="/services" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          Create Your First Service
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-gray-900">No services available</h3>
                      <p className="mt-1 text-gray-500">There are no services available at the moment.</p>
                      <div className="mt-6">
                        <Link to="/services" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          Browse All Services
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {isProvider ? 'Received Orders' : 'My Orders'}
              </h2>

              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {isProvider ? 'Customer' : 'Service'}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.id.substring(0, 8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {isProvider ? order.customerName : order.serviceTitle}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${order.totalPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link to={`/chat/${order.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                              Chat
                            </Link>
                            {isProvider && order.status === 'PENDING' && (
                              <>
                                <button 
                                  onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                                  className="text-green-600 hover:text-green-900 mr-3"
                                >
                                  Accept
                                </button>
                                <button 
                                  onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {isProvider && order.status === 'ACCEPTED' && (
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'IN_PROGRESS')}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                Start Work
                              </button>
                            )}
                            {isProvider && order.status === 'IN_PROGRESS' && (
                              <button 
                                onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Complete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No orders</h3>
                  <p className="mt-1 text-gray-500">
                    {isProvider ? "You haven't received any orders yet." : "You haven't placed any orders yet."}
                  </p>
                  <div className="mt-6">
                    <Link to="/services" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      {isProvider ? 'Your Services' : 'Browse Services'}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}