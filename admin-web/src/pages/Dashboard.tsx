import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../App'

interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
}

interface RecentActivity {
  id: string
  type: 'order' | 'user' | 'payment'
  description: string
  timestamp: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setStats(data.data.stats)
        setRecentActivities(data.data.recentActivities)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link to="/login" className="text-blue-600 hover:underline">Logout</Link>
      </div>
      
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Total Users</h3>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Total Orders</h3>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pending Orders</h3>
              <p className="text-3xl font-bold">{stats.pendingOrders}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Link to="/users" className="bg-white overflow-hidden shadow rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <h3 className="text-lg font-medium mb-2">Manage Users</h3>
                      <p className="text-gray-600">View and manage all users</p>
                    </div>
                  </Link>
                  
                  <Link to="/orders" className="bg-white overflow-hidden shadow rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <h3 className="text-lg font-medium mb-2">View Orders</h3>
                      <p className="text-gray-600">Check order status and details</p>
                    </div>
                  </Link>
                  
                  <Link to="/wallets" className="bg-white overflow-hidden shadow rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <h3 className="text-lg font-medium mb-2">Wallet Management</h3>
                      <p className="text-gray-600">Manage wallet transactions</p>
                    </div>
                  </Link>
                  
                  <Link to="/tickets" className="bg-white overflow-hidden shadow rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <h3 className="text-lg font-medium mb-2">Support Tickets</h3>
                      <p className="text-gray-600">Handle support requests</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          activity.type === 'order' ? 'bg-blue-100' : 
                          activity.type === 'user' ? 'bg-green-100' : 'bg-yellow-100'
                        }`}>
                          <svg className={`h-6 w-6 ${
                            activity.type === 'order' ? 'text-blue-600' : 
                            activity.type === 'user' ? 'text-green-600' : 'text-yellow-600'
                          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {activity.type === 'order' && (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            )}
                            {activity.type === 'user' && (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            )}
                            {activity.type === 'payment' && (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{activity.description}</div>
                          <div className="text-sm text-gray-500">{formatDate(activity.timestamp)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-4 text-center text-gray-500">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
