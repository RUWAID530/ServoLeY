import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Home,
  ShoppingCart,
  Plus,
  Package,
  Wallet,
  Bell,
  Calendar,
  User,
  LogOut,
  CheckCircle,
  AlertCircle,
  Star,
  DollarSign
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  isButton?: boolean;
}

interface Order {
  id: number;
  customer: string;
  service: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  amount: number;
}

export default function ProviderDashboard() {
  const location = useLocation();
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [earnings] = useState(45780);
  const [rating] = useState(4.8);
  const [totalOrders] = useState(156);
  const [completedOrders] = useState(142);

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/provider-dashboard', icon: <Home className="w-5 h-5" /> },
    { name: 'Manage Orders', href: '/provider-dashboard/orders', icon: <ShoppingCart className="w-5 h-5" /> },
    { name: 'Add New Service', href: '#', icon: <Plus className="w-5 h-5" />, isButton: true },
    { name: 'My Services', href: '/provider-dashboard/services', icon: <Package className="w-5 h-5" /> },
    { name: 'Wallet', href: '/provider-dashboard/wallet', icon: <Wallet className="w-5 h-5" /> },
    { name: 'Notifications', href: '/provider-dashboard/notifications', icon: <Bell className="w-5 h-5" /> },
    { name: 'Availability', href: '/provider-dashboard/availability', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Profile', href: '/provider-dashboard/profile', icon: <User className="w-5 h-5" /> },
    { name: 'Logout', href: '/login', icon: <LogOut className="w-5 h-5" /> },
  ];

  const recentOrders: Order[] = [
    { id: 1, customer: 'Rahul Kumar', service: 'Mobile Repair', status: 'Completed', amount: 1200 },
    { id: 2, customer: 'Priya Singh', service: 'Bike Service', status: 'In Progress', amount: 800 },
    { id: 3, customer: 'Amit Patel', service: 'Home Cleaning', status: 'Pending', amount: 1500 },
  ];

  const getStatusColor = (status: Order['status']): string => {
    const colors = {
      'Completed': 'text-green-600 bg-green-100',
      'In Progress': 'text-blue-600 bg-blue-100',
      'Pending': 'text-yellow-600 bg-yellow-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const handleAddServiceClick = () => {
    setShowAddServiceModal(true);
  };

  const handleSubmitService = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle service submission
    setShowAddServiceModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-white shadow-lg">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <img
                src="https://picsum.photos/seed/provider123/40/40.jpg"
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h3 className="font-semibold text-gray-800">Pro Services</h3>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-gray-500">{rating}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-lg font-semibold">₹{earnings.toLocaleString()}</p>
            </div>
          </div>
          <nav className="mt-6">
            {navigation.map((item) => (
              item.isButton ? (
                <button
                  key={item.name}
                  onClick={handleAddServiceClick}
                  className="flex items-center w-full px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </button>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-6 py-3 text-sm font-medium ${
                    location.pathname === item.href
                      ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              )
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {location.pathname === '/provider-dashboard' ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900">Service Provider Dashboard</h1>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Orders</p>
                        <p className="text-2xl font-bold">{totalOrders}</p>
                      </div>
                      <ShoppingCart className="w-10 h-10 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Completed Orders</p>
                        <p className="text-2xl font-bold">{completedOrders}</p>
                      </div>
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Earnings</p>
                        <p className="text-2xl font-bold">₹{earnings.toLocaleString()}</p>
                      </div>
                      <DollarSign className="w-10 h-10 text-yellow-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Today's Requests</p>
                        <p className="text-2xl font-bold">3</p>
                      </div>
                      <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-lg shadow mb-8">
                  <div className="px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold">Recent Orders</h2>
                  </div>
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Service
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {recentOrders.map((order) => (
                            <tr key={order.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <img
                                    src={`https://picsum.photos/seed/customer${order.id}/32/32.jpg`}
                                    alt={order.customer}
                                    className="w-8 h-8 rounded-full mr-3"
                                  />
                                  <div className="text-sm font-medium text-gray-900">{order.customer}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {order.service}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ₹{order.amount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                      <button
                        onClick={handleAddServiceClick}
                        className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Create New Service</span>
                      </button>
                      <button className="w-full flex items-center justify-center space-x-2 border border-gray-300 py-2 px-4 rounded hover:bg-gray-50">
                        <Calendar className="w-5 h-5" />
                        <span>Update Availability</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Performance Overview</h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Completion Rate</span>
                        <span className="text-sm font-semibold">91%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Average Response Time</span>
                        <span className="text-sm font-semibold">2 hours</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Customer Satisfaction</span>
                        <span className="text-sm font-semibold">4.8/5.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <Outlet />
            )}
          </div>
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Add New Service</h2>
            <form onSubmit={handleSubmitService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option>Mobile Service</option>
                  <option>Bike Service</option>
                  <option>Car Wash</option>
                  <option>Home Cleaning</option>
                  <option>Electrician</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subcategory</label>
                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option>Display Replacement</option>
                  <option>Battery Change</option>
                  <option>Software Update</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Realme 7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="₹0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe your service..."
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
            