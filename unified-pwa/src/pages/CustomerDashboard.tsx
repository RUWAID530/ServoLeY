import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Calendar, 
  Wallet, 
  User, 
  Settings, 
  LogOut,
  Star,
  Clock,
  TrendingUp,
  CreditCard,
  Smartphone,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Bell
} from 'lucide-react';

const normalizeStoredUser = (raw: any) => {
  if (!raw) return null;
  const profile = raw.profile || raw.profiles || {};

  return {
    ...raw,
    firstName: raw.firstName || profile.firstName || localStorage.getItem('firstName') || '',
    lastName: raw.lastName || profile.lastName || localStorage.getItem('lastName') || '',
    email: raw.email || localStorage.getItem('email') || '',
    phone: raw.phone || localStorage.getItem('phone') || '',
    avatar: raw.avatar || profile.avatar || null
  };
};

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = () => {
      const storedUserData = localStorage.getItem('userData');
      if (!storedUserData) {
        setUserData(null);
        return;
      }

      try {
        const parsed = JSON.parse(storedUserData);
        setUserData(normalizeStoredUser(parsed));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    };

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    loadUserFromStorage();

    const onProfileUpdated = () => loadUserFromStorage();
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'userData') loadUserFromStorage();
    };

    window.addEventListener('customer-profile-updated', onProfileUpdated as EventListener);
    window.addEventListener('storage', onStorage);
    setLoading(false);

    return () => {
      window.removeEventListener('customer-profile-updated', onProfileUpdated as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const handleNavigation = (tab: string, path: string) => {
    setActiveTab(tab);
    navigate(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">ServoLeY</h1>
              <span className="text-white/60">Customer Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-white/80 hover:text-white transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-white font-medium">{userData?.firstName || 'Customer'}</p>
                  <p className="text-white/60 text-sm">{userData?.email || 'customer@example.com'}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {userData?.firstName || 'Customer'}! 👋
          </h2>
          <p className="text-white/70">Here's what's happening with your account today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-blue-400 text-sm">+12%</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">8</h3>
            <p className="text-white/60 text-sm">Active Bookings</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-green-400 text-sm">+8%</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">24</h3>
            <p className="text-white/60 text-sm">Services Used</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <span className="text-purple-400 text-sm">4.8</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">4.8</h3>
            <p className="text-white/60 text-sm">Average Rating</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-pink-400 text-sm">+15%</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">₹2,450</h3>
            <p className="text-white/60 text-sm">Wallet Balance</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Book Service */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleNavigation('services', '/customer/services')}
                className="p-4 bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 border border-indigo-500/30 rounded-xl hover:from-indigo-500/30 hover:to-indigo-600/30 transition-all text-left"
              >
                <Search className="w-8 h-8 text-indigo-400 mb-2" />
                <p className="text-white font-medium">Browse Services</p>
                <p className="text-white/60 text-sm">Find service providers</p>
              </button>

              <button
                onClick={() => handleNavigation('wallet', '/customer/wallet')}
                className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl hover:from-green-500/30 hover:to-green-600/30 transition-all text-left"
              >
                <Wallet className="w-8 h-8 text-green-400 mb-2" />
                <p className="text-white font-medium">Manage Wallet</p>
                <p className="text-white/60 text-sm">Add money & view history</p>
              </button>

              <button
                onClick={() => handleNavigation('bookings', '/customer/bookings')}
                className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl hover:from-purple-500/30 hover:to-purple-600/30 transition-all text-left"
              >
                <Calendar className="w-8 h-8 text-purple-400 mb-2" />
                <p className="text-white font-medium">My Bookings</p>
                <p className="text-white/60 text-sm">View appointments</p>
              </button>

              <button
                onClick={() => handleNavigation('support', '/customer/support')}
                className="p-4 bg-gradient-to-br from-pink-500/20 to-pink-600/20 border border-pink-500/30 rounded-xl hover:from-pink-500/30 hover:to-pink-600/30 transition-all text-left"
              >
                <Phone className="w-8 h-8 text-pink-400 mb-2" />
                <p className="text-white font-medium">Get Support</p>
                <p className="text-white/60 text-sm">24/7 customer service</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-white text-sm">Payment Methods Added</p>
                  <p className="text-white/60 text-xs">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white text-sm">Booking Confirmed</p>
                  <p className="text-white/60 text-xs">Yesterday</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-white text-sm">Service Rated</p>
                  <p className="text-white/60 text-xs">2 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Your Payment Methods</h3>
            <button
              onClick={() => handleNavigation('wallet', '/customer/wallet')}
              className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
            >
              Manage
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl">
              <Smartphone className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-white font-medium">Google Pay</p>
                <p className="text-white/60 text-sm">user@okaxis</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl">
              <CreditCard className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-white font-medium">Card</p>
                <p className="text-white/60 text-sm">•••• 4242</p>
              </div>
            </div>

            <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-white/20 rounded-xl hover:border-white/40 transition-all">
              <CreditCard className="w-6 h-6 text-white/60" />
              <span className="text-white/60">Add Method</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around py-2">
            <button
              onClick={() => handleNavigation('home', '/customer/home')}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                activeTab === 'home' ? 'text-white' : 'text-white/60 hover:text-white/80'
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs mt-1">Home</span>
            </button>

            <button
              onClick={() => handleNavigation('services', '/customer/services')}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                activeTab === 'services' ? 'text-white' : 'text-white/60 hover:text-white/80'
              }`}
            >
              <Search className="w-6 h-6" />
              <span className="text-xs mt-1">Services</span>
            </button>

            <button
              onClick={() => handleNavigation('wallet', '/customer/wallet')}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                activeTab === 'wallet' ? 'text-white' : 'text-white/60 hover:text-white/80'
              }`}
            >
              <Wallet className="w-6 h-6" />
              <span className="text-xs mt-1">Wallet</span>
            </button>

            <button
              onClick={() => handleNavigation('profile', '/customer/profile')}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                activeTab === 'profile' ? 'text-white' : 'text-white/60 hover:text-white/80'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs mt-1">Profile</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default CustomerDashboard;

