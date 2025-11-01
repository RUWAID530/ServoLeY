import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Inbox from './Inbox';
import Services from './Services';
import Reviews from './Reviews';
import Availability from './Availability';
import Notifications from './Notifications';
import Wallet from './Wallet';

export default function Dashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('inbox');

  const navigation = [
    { name: 'Inbox', href: '/dashboard/inbox', icon: '📥' },
    { name: 'Services', href: '/dashboard/services', icon: '🛠️' },
    { name: 'Reviews', href: '/dashboard/reviews', icon: '⭐' },
    { name: 'Availability', href: '/dashboard/availability', icon: '📅' },
    { name: 'Notifications', href: '/dashboard/notifications', icon: '🔔' },
    { name: 'Wallet', href: '/dashboard/wallet', icon: '💰' },
  ];

  const getCurrentComponent = () => {
    const path = location.pathname;
    if (path.includes('/services')) return <Services />;
    if (path.includes('/reviews')) return <Reviews />;
    if (path.includes('/availability')) return <Availability />;
    if (path.includes('/notifications')) return <Notifications />;
    if (path.includes('/wallet')) return <Wallet />;
    return <Inbox />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-white shadow-lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800">Provider Dashboard</h2>
          </div>
          <nav className="mt-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-6 py-3 text-sm font-medium ${
                  location.pathname === item.href
                    ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab(item.name.toLowerCase())}
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {navigation.find(item => location.pathname === item.href)?.name || 'Dashboard'}
              </h1>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow p-6">
              {getCurrentComponent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
