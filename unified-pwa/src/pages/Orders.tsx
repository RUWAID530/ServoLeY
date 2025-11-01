import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../App'

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

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'CUSTOMER' | 'PROVIDER' | null>(null)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    fetchOrders()
    checkUserType()
  }, [])

  const checkUserType = () => {
    const type = localStorage.getItem('userType')
    setUserType(type as 'CUSTOMER' | 'PROVIDER' | null)
  }

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token')
      const type = localStorage.getItem('userType')

      const url = type === 'PROVIDER' 
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

  const filteredOrders = filter === 'ALL' 
    ? orders 
    : orders.filter(order => order.status === filter)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p>Loading orders...</p>
        </div>
      </div>
    )
  }

  const isProvider = userType === 'PROVIDER'

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'ALL' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Orders
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'PENDING' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('ACCEPTED')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'ACCEPTED' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setFilter('IN_PROGRESS')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'IN_PROGRESS' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter('COMPLETED')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'COMPLETED' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('CANCELLED')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'CANCELLED' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        <div className="p-6">
          {filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isProvider ? 'Customer' : 'Provider'}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.serviceTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {isProvider ? order.customerName : order.providerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${order.totalPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/chat/${order.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Chat
                          </Link>

                          {isProvider && (
                            <>
                              {order.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                                    className="text-green-600 hover:text-green-900"
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

                              {order.status === 'ACCEPTED' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'IN_PROGRESS')}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Start Work
                                </button>
                              )}

                              {order.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Complete
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'ALL' 
                  ? "You don't have any orders yet." 
                  : `You don't have any ${filter.toLowerCase()} orders.`}
              </p>
              <div className="mt-6">
                <Link
                  to="/services"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Browse Services
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}