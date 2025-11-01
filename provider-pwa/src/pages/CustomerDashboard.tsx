import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  ShoppingCart, 
  Wallet, 
  Tag, 
  HelpCircle, 
  FileText, 
  User, 
  LogOut,
  Bell,
  MapPin,
  Star,
  Clock,
  TrendingUp,
  MessageSquare,
  HeadphonesIcon
} from 'lucide-react';

export default function CustomerDashboard() {
  const location = useLocation();
  const [userLocation, setUserLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [walletBalance] = useState(2500);
  const [notifications] = useState(3);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation('Bangalore, Karnataka');
        },
        (error) => {
          setUserLocation('Mumbai, Maharashtra');
        }
      );
    }
  }, []);

  const navigation = [
    { name: 'Home', href: '/customer-dashboard', icon: <Home className="w-5 h-5" /> },
    { name: 'Browse Services', href: '/customer-dashboard/services', icon: <Search className="w-5 h-5" /> },
    { name: 'Your Orders', href: '/customer-dashboard/orders', icon: <ShoppingCart className="w-5 h-5" /> },
    { name: 'Wallet', href: '/customer-dashboard/wallet', icon: <Wallet className="w-5 h-5" /> },
    { name: 'Offers', href: '/customer-dashboard/offers', icon: <Tag className="w-5 h-5" /> },
    { name: 'Help & Support', href: '/customer-dashboard/help', icon: <HelpCircle className="w-5 h-5" /> },
    { name: 'Raise a Ticket', href: '/customer-dashboard/ticket', icon: <FileText className="w-5 h-5" /> },
    { name: 'Profile', href: '/customer-dashboard/profile', icon: <User className="w-5 h-5" /> },
    { name: 'Logout', href: '/login', icon: <LogOut className="w-5 h-5" /> },
  ];

  const popularServices = [
    { id: 1, name: 'Home Cleaning', icon: '🧹', providers: 128, price: '₹499' },
    { id: 2, name: 'Mobile Repair', icon: '📱', providers: 89, price: '₹299' },
    { id: 3, name: 'Bike Service', icon: '🏍️', providers: 67, price: '₹599' },
    { id: 4, name: 'Car Wash', icon: '🚗', providers: 95, price: '₹399' },
    { id: 5, name: 'Beauty & Spa', icon: '💅', providers: 156, price: '₹799' },
    { id: 6, name: 'Electrician', icon: '💡', providers: 72, price: '₹199' },
  ];

  const activeOrders = [
    { 
      id: 1, 
      service: 'Home Cleaning', 
      provider: 'CleanPro Services', 
      status: 'In Progress',
      statusColor: 'text-blue-600 bg-blue-100',
      date: 'Today, 2:00 PM',
      professional: 'Priya Sharma'
    },
    { 
      id: 2, 
      service: 'Mobile Repair', 
      provider: 'TechFix Solutions', 
      status: 'Scheduled',
      statusColor: 'text-yellow-600 bg-yellow-100',
      date: 'Tomorrow, 10:00 AM',
      professional: 'Rahul Kumar'
    },
    { 
      id: 3, 
      service: 'Bike Service', 
      provider: 'BikeCare Garage', 
      status: 'Pending',
      statusColor: 'text-gray-600 bg-gray-100',
      date: 'Dec 20, 3:00 PM',
      professional: 'Not Assigned'
    },
  ];

  const offers = [
    { 
      id: 1, 
      title: '20% off on Home Cleaning', 
      code: 'CLEAN20', 
      validUntil: 'Dec 31, 2023',
      discount: '20%',
      category: 'Home Cleaning'
    },
    { 
      id: 2, 
      title: '₹100 off on First Booking', 
      code: 'FIRST100', 
      validUntil: 'Dec 25, 2023',
      discount: '₹100',
      category: 'All Services'
    },
    { 
      id: 3, 
      title: 'Free Bike Inspection', 
      code: 'BIKEFREE', 
      validUntil: 'Dec 28, 2023',
      discount: 'FREE',
      category: 'Bike Service'
    },
  ];

  const helpOptions = [
    { id: 1, title: 'FAQs', icon: <HelpCircle className="w-6 h-6" />, description: 'Find answers to common questions' },
    { id: 2, title: 'Live Chat', icon: <MessageSquare className="w-6 h-6" />, description: 'Chat with our support team' },
    { id: 3, title: 'Call Support', icon: <HeadphonesIcon className="w-6 h-6" />, description: 'Contact our helpline' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-white shadow-lg">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <img
                src="https://picsum.photos/seed/user123/40/40.jpg"
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h3 className="font-semibold text-gray-800">John Doe</h3>
                <p className="text-sm text-gray-500">₹{walletBalance}</p>
              </div>
            </div>
          </div>
          <nav className="mt-6">
            {navigation.map((item) => (
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
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white shadow-sm border-b sticky top-0 z-10">
            <div className="px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 max-w-2xl">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for a service"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <div className="flex items-center space-x-4 ml-6">
                  <button 
                    onClick={() => setShowLocationModal(true)}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <MapPin className="w-5 h-5 mr-1" />
                    {userLocation}
                  </button>
                  <div className="relative">
                    <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-900" />
                    {notifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notifications}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome back, John!</h1>

            {/* Popular Services */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Popular Services in {userLocation}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularServices.map((service) => (
                  <div 
                    key={service.id} 
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-4xl">{service.icon}</span>
                        <span className="text-lg font-semibold text-blue-600">{service.price}</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">{service.providers} providers</p>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Active Orders */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Your Active Orders</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {activeOrders.map((order) => (
                    <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-2xl">
                                {order.service === 'Home Cleaning' && '🧹'}
                                {order.service === 'Mobile Repair' && '📱'}
                                {order.service === 'Bike Service' && '🏍️'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{order.service}</h3>
                            <p className="text-sm text-gray-500">{order.provider}</p>
                            <p className="text-sm text-gray-500">Professional: {order.professional}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${order.statusColor}`}>
                            {order.status}
                          </span>
                          <p className="text-sm text-gray-500 mt-2">{order.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Wallet and Offers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Wallet Summary */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Wallet Summary</h2>
                  <Wallet className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-gray-500">Current Balance</p>
                    <p className="text-3xl font-bold">₹{walletBalance}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Last Added</p>
                    <p className="text-sm font-semibold">Dec 10, 2023</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                    Add Money
                  </button>
                  <button className="flex-1 border border-gray-300 py-2 px-4 rounded hover:bg-gray-50 transition-colors">
                    View History
                  </button>
                </div>
              </div>

              {/* Offers */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Special Offers</h2>
                  <Tag className="w-8 h-8 text-blue-600" />
                </div>
                <div className="space-y-3">
                  {offers.map((offer) => (
                    <div key={offer.id} className="border-l-4 border-blue-500 pl-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{offer.title}</h3>
                          <p className="text-sm text-gray-500">Code: {offer.code}</p>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">{offer.discount}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Valid until: {offer.validUntil}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Help & Support */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Help & Support</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {helpOptions.map((option) => (
                  <button
                    key={option.id}
                    className="flex flex-col items-center justify-center p-6 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {option.icon}
                    <h3 className="mt-3 font-semibold">{option.title}</h3>
                    <p className="mt-1 text-sm text-gray-500 text-center">{option.description}</p>
                  </button>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Select Your Location</h2>
            <input
              type="text"
              placeholder="Enter your location"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 mb-4"
              defaultValue={userLocation}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
