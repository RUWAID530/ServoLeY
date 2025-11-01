import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  DollarSign,
  Users,
  Upload,
  X,
  ChevronDown
} from 'lucide-react';

export default function NewProviderDashboard() {
  const location = useLocation();
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [earnings] = useState(45780);
  const [rating] = useState(4.8);
  const [totalOrders] = useState(156);
  const [completedOrders] = useState(142);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [modelName, setModelName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState({
    start: '09:00',
    end: '18:00'
  });

  const categories = {
    'Mobile Service': ['Display Replacement', 'Battery Change', 'Software Issues', 'Charging Port'],
    'Bike Service': ['Regular Service', 'Oil Change', 'Brake Service', 'Engine Checkup'],
    'Car Wash': ['Basic Wash', 'Premium Wash', 'Interior Cleaning', 'Complete Detailing'],
    'Home Cleaning': ['Regular Cleaning', 'Deep Cleaning', 'Kitchen Cleaning', 'Bathroom Cleaning'],
    'Beauty & Spa': ['Haircut', 'Facial', 'Manicure', 'Pedicure'],
    'Electrician': ['Wiring', 'Switch Installation', 'Lighting', 'Appliance Repair']
  };

  const recentOrders = [
    { id: 1, customer: 'Rahul Kumar', service: 'Mobile Repair', status: 'Completed', amount: 1200, date: '2023-12-15' },
    { id: 2, customer: 'Priya Singh', service: 'Bike Service', status: 'In Progress', amount: 800, date: '2023-12-16' },
    { id: 3, customer: 'Amit Patel', service: 'Home Cleaning', status: 'Pending', amount: 1500, date: '2023-12-17' },
  ];

  const navigation = [
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleAddService = () => {
    setShowAddServiceModal(true);
  };

  const handleSubmitService = () => {
    // Handle service submission
    console.log('Service submitted:', {
      category: selectedCategory,
      subcategory: selectedSubcategory,
      modelName,
      price,
      description,
      availability: {
        days: selectedDays,
        timeSlots
      }
    });
    setShowAddServiceModal(false);
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
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
                  onClick={handleAddService}
                  className="flex items-center w-full px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </button>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
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
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Service Provider Dashboard</h1>
            </div>

            {/* Analytics Cards */}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.date}
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
                    onClick={handleAddService}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create New Service</span>
                  </button>
                  <button className="w-full flex items-center justify-center space-x-2 border border-gray-300 py-2 px-4 rounded hover:bg-gray-50 transition-colors">
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
          </div>
        </div>
      </div>

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add New Service</h2>
              <button
                onClick={() => setShowAddServiceModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Category
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedSubcategory('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a category</option>
                    {Object.keys(categories).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Subcategory Selection */}
              {selectedCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Subcategory
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSubcategory}
                      onChange={(e) => setSelectedSubcategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose a subcategory</option>
                      {categories[selectedCategory as keyof typeof categories].map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              )}

              {/* Model Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Name (e.g., Realme 7, Redmi 14)
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter model name"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter price"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter service description"
                />
              </div>

              {/* Upload Image/Video */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image or Video
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input type="file" className="sr-only" />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Set Availability
                </label>
                <div className="space-y-4">
                  {/* Days Selection */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Select Days</p>
                    <div className="grid grid-cols-4 gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <button
                          key={day}
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            selectedDays.includes(day)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={timeSlots.start}
                        onChange={(e) => setTimeSlots(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">End Time</label>
                      <input
                        type="time"
                        value={timeSlots.end}
                        onChange={(e) => setTimeSlots(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitService}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
