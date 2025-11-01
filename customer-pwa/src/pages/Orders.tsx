import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../App'

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'active', 'completed', 'cancelled'

  React.useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/customer/orders`, {
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

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    return order.status.toLowerCase() === filter
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Orders</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm sm:text-base">Back to Dashboard</Link>
      </div>

      <div className="mb-4 sm:mb-6">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'cancelled'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <p>Loading orders...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <li key={order.id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="w-full sm:w-auto">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <h3 className="text-lg font-medium text-gray-900">{order.serviceName}</h3>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <p className="text-sm text-gray-500">Order ID: {order.id}</p>
                        <p className="text-sm text-gray-500">Date: {formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                      <p className="text-lg font-semibold">${order.totalAmount.toFixed(2)}</p>
                      <div>
                        <Link
                          to={`/chat/${order.id}`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Chat
                        </Link>
                      </div>
                    </div>
                  </div>

                  {order.details && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">{order.details}</p>
                    </div>
                  )}

                  {order.status === 'processing' && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${order.progress || 30}%` }}
                        ></div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">In progress: {order.progress || 30}%</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 sm:p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No orders</h3>
          <p className="mt-1 text-gray-500">
            {filter === 'all'
              ? "You don't have any orders yet."
              : `You don't have any ${filter} orders.`}
          </p>
          <div className="mt-6">
            <Link
              to="/services"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse Services
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
