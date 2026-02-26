import React from 'react';
import { Search } from 'lucide-react';
import type { ViewType, DashboardStat } from '../types/Index';
import { useProviderProfile } from '../contexts/ProviderProfileContext';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from '../App';

interface Provider {
  id?: string;
  name?: string;
  businessName?: string;
  email?: string;
  category?: string;
  upi_id?: string;
  wallet_balance?: number;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
}

type NotificationToggleKey = 'email' | 'sms' | 'push';

interface DashboardProps {
  onNavigate: (view: ViewType) => void;
}

interface Stat {
  label: string;
  value: string;
  change: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  link: string;
  count?: number;
}

const getProviderAuthToken = () => {
  const userId = localStorage.getItem('userId');
  const sessionId = localStorage.getItem('currentSessionId') || 'default';
  return (
    localStorage.getItem(`token_${userId}_${sessionId}`) ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    ''
  );
};

const deriveNotificationState = (source: any) => ({
  emailNotifications: Boolean(
    source?.emailNotifications ??
      source?.notificationPreferences?.emailEnabled ??
      source?.notification_preferences?.emailEnabled
  ),
  smsNotifications: Boolean(
    source?.smsNotifications ??
      source?.notificationPreferences?.smsEnabled ??
      source?.notification_preferences?.smsEnabled
  ),
  pushNotifications: Boolean(
    source?.pushNotifications ??
      source?.notificationPreferences?.pushEnabled ??
      source?.notification_preferences?.pushEnabled
  )
});

const mergeProviderNotifications = (source: any) => {
  if (!source) return null;
  return {
    ...source,
    ...deriveNotificationState(source)
  };
};

export const ProviderDashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [error, setError] = useState<string>("");
  const [statsError, setStatsError] = useState<string>("");
  const [notificationError, setNotificationError] = useState<string>("");
  const [notificationSaving, setNotificationSaving] = useState<NotificationToggleKey | ''>('');
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { state: profileState } = useProviderProfile();
  const profileLoading = profileState.isLoading;
  const profileError = profileState.error;


    // Load saved profile data on mount
  useEffect(() => {
    console.log('🔥 Dashboard mounting...');
    try {
      const userId = localStorage.getItem('userId');
      const savedProfile = userId ? localStorage.getItem(`providerProfile:${userId}`) : null;
      const token = getProviderAuthToken();
      
      if (savedProfile && token) {
        const parsedProfile = JSON.parse(savedProfile);
        console.log(' Loaded saved profile:', parsedProfile);
        setProvider(mergeProviderNotifications(parsedProfile));
      } else {
        console.log('🔥 No saved profile or token found');
        setLoading(false);
      }
    } catch (error) {
      console.error('🔥 Error loading saved profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []); // Only run once on mount


    // Update provider when profile context changes
  useEffect(() => {
    if (profileState.profile && !profileLoading) {
      console.log('🔥 Updating provider from context:', profileState.profile);
      setProvider(mergeProviderNotifications(profileState.profile));
      if (profileError) {
        setError(profileError);
      } else {
        setError("");
      }
    }
  }, [profileState.profile, profileLoading, profileError]);


    useEffect(() => {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const fetchStats = async () => {
      console.log('🔥 Fetching dashboard stats...');
      
      // Check if we have valid data before proceeding
      const token = getProviderAuthToken();
      if (!token || !provider) {
        console.log('🔥 Skipping stats fetch - no provider or token');
        setLoading(false);
        return;
      }

      try {
        timeoutId = setTimeout(() => {
          controller.abort();
          console.log('🔥 Stats request timed out');
        }, 10000); // Increase timeout to 10 seconds

        const response = await fetch(`${API_BASE}/api/provider/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('🔥 Stats data received:', data);

        // Process stats data
        const statsData = data.data || {};
        const ordersByStatus = statsData.ordersByStatus || {};
        const totalOrders = Object.values(ordersByStatus).reduce(
          (sum: number, value: any) => sum + Number(value || 0),
          0
        );
        const walletBalance = statsData.wallet?.balance ?? 0;
        const avgRating = statsData.ratings?.average ?? 0;
        const totalReviews = statsData.ratings?.total ?? 0;

        const computedStats: DashboardStat[] = [
          {
            label: 'Total orders',
            value: totalOrders.toString(),
            change: totalOrders > 0 ? `${totalOrders} orders` : 'No orders yet',
            color: 'text-emerald-400'
          },
          {
            label: 'Wallet balance',
            value: `₹${walletBalance}`,
            change: walletBalance > 0 ? 'Available' : 'Start earning',
            color: 'text-cyan-400'
          },
          {
            label: 'Average rating',
            value: avgRating.toFixed(1),
            change: totalReviews > 0 ? `${totalReviews} reviews` : 'No reviews yet',
            color: 'text-amber-400'
          }
        ];

        setStats(computedStats);
        setStatsError('');
      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          console.log('🔥 Stats request was aborted');
          return;
        }

        console.error('🔥 Error fetching stats:', error);

        // Set default stats on error
        const defaultStats: DashboardStat[] = [
          {
            label: 'Total orders',
            value: '0',
            change: 'No orders yet',
            color: 'text-emerald-400'
          },
          {
            label: 'Wallet balance',
            value: '₹0',
            change: 'Start earning',
            color: 'text-cyan-400'
          },
          {
            label: 'Average rating',
            value: '0.0',
            change: 'No reviews yet',
            color: 'text-amber-400'
          }
        ];

        setStats(defaultStats);
        setStatsError('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      controller.abort();
    };
  }, [provider]); // Only depend on provider changes

  const handleNotificationToggle = async (key: NotificationToggleKey) => {
    if (!provider) return;

    const token = getProviderAuthToken();
    if (!token) {
      setNotificationError('Please log in again to update notifications.');
      return;
    }

    const current = {
      email: Boolean(provider.emailNotifications),
      sms: Boolean(provider.smsNotifications),
      push: Boolean(provider.pushNotifications)
    };

    const next = {
      ...current,
      [key]: !current[key]
    };

    const previousProvider = provider;
    const nextProvider = {
      ...provider,
      emailNotifications: next.email,
      smsNotifications: next.sms,
      pushNotifications: next.push
    };

    setNotificationSaving(key);
    setNotificationError('');
    setProvider(nextProvider);

    try {
      const response = await fetch(`${API_BASE}/api/provider/profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationPreferences: {
            emailEnabled: next.email,
            smsEnabled: next.sms,
            pushEnabled: next.push
          }
        })
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || `Failed to update notification settings (${response.status})`);
      }

      const userId = localStorage.getItem('userId');
      if (userId) {
        localStorage.setItem(`providerProfile:${userId}`, JSON.stringify(nextProvider));
      }
    } catch (toggleError: any) {
      setProvider(previousProvider);
      setNotificationError(toggleError?.message || 'Failed to update notification settings.');
    } finally {
      setNotificationSaving('');
    }
  };


    const handleViewChange = (view: string) => { // Change ViewType to string
    const routePath = `/provider/${view}`;
    navigate(routePath);
    if (onNavigate) {
      onNavigate(view as ViewType);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-200 items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="mx-auto w-20 h-20 relative">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-20"></div>
                <div className="relative bg-red-500 rounded-full p-4 shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Unable to Load Profile</h3>
              <p className="text-slate-300 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-6 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 break-words">Welcome back, {profileState.profile?.displayName || provider?.name || provider?.businessName || 'Provider'}!</h1>
                <p className="text-slate-400">Here's what's happening with your business today</p>
                {statsError && <p className="text-amber-400 text-sm mt-1">{statsError}</p>}
              </div>
              <button 
                onClick={() => handleViewChange('new-listing')}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add New Service</span>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, i) => (
                <div key={i} className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:border-cyan-500/30 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.color.includes('emerald') ? 'bg-emerald-500/20' : stat.color.includes('cyan') ? 'bg-cyan-500/20' : 'bg-amber-500/20'}`}>
                      {stat.label.includes('orders') && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      )}
                      {stat.label.includes('balance') && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      )}
                      {stat.label.includes('rating') && (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{stat.label}</p>
                    </div>
                  </div>
                  <h3 className={`text-3xl font-bold text-white mb-2 ${stat.color}`}>
                    {stat.value}
                  </h3>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${stat.color.includes('emerald') ? 'bg-emerald-500/20 text-emerald-400' : stat.color.includes('cyan') ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>
       
            {/* Recent Bookings Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Bookings */}
              <div className="lg:col-span-2 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white flex items-center">
                      <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Recent Bookings
                    </h3>
                    <div className="flex gap-2">
                      <button onClick={() => handleViewChange('payouts')} className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs px-3 py-1.5 rounded-lg transition-colors">Today</button>
                      <button onClick={() => handleViewChange('payouts')} className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">All</button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* No bookings for fresh account */}
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-slate-400 font-medium">No bookings yet</p>
                    <p className="text-slate-500 text-sm">Your bookings will appear here</p>
                  </div>
                </div>
              </div>

              {/* Earnings Section */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Earnings Overview
                  </h3>
                  <select className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                    <option>This month</option>
                    <option>Last 3 months</option>
                  </select>
                </div>
                <div className="h-48 flex items-center justify-center border-2 border-dashed border-white/20 rounded-xl bg-white/5">
                   <div className="text-center">
                    <svg className="w-12 h-12 text-emerald-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-white text-lg font-medium mb-1">₹0</p>
                    <p className="text-emerald-400 text-sm">Start earning to see data</p>
                   </div>
                </div>
                <div className="mt-6 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Avg. order value: <span className="text-white font-medium">₹0</span></span>
                  <button onClick={() => handleViewChange('payouts')} className="text-emerald-400 hover:text-emerald-300 font-medium">View detailed report →</button>
                </div>
              </div>
            </div>

            {/* Quick Actions & Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleViewChange('new-listing')}
                    className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 p-4 rounded-xl transition-all duration-200 hover:scale-105 border border-cyan-500/20">
                    <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm font-medium text-cyan-400">Add Service</span>
                  </button>
                  <button 
                    onClick={() => handleViewChange('orders')}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 p-4 rounded-xl transition-all duration-200 hover:scale-105 border border-emerald-500/20">
                    <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-sm font-medium">View Orders</span>
                  </button>
                  <button 
                    onClick={() => handleViewChange('settings')}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 p-4 rounded-xl transition-all duration-200 hover:scale-105 border border-amber-500/20"
                  >
                    <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-medium">Settings</span>
                  </button>
                  <button 
                    onClick={() => handleViewChange('reviews')}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-4 rounded-xl transition-all duration-200 hover:scale-105 border border-blue-500/20"
                  >
                    <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="text-sm font-medium">Reviews</span>
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Notification Settings
                </h3>
                {notificationError && <p className="text-xs text-rose-300 mb-3">{notificationError}</p>}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-white text-sm">Email Notifications</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!provider?.emailNotifications}
                        className="sr-only"
                        disabled={notificationSaving === 'email'}
                        onChange={() => handleNotificationToggle('email')}
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${provider?.emailNotifications ? 'bg-cyan-500' : 'bg-slate-600'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${provider?.emailNotifications ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-white text-sm">SMS Notifications</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!provider?.smsNotifications}
                        className="sr-only"
                        disabled={notificationSaving === 'sms'}
                        onChange={() => handleNotificationToggle('sms')}
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${provider?.smsNotifications ? 'bg-cyan-500' : 'bg-slate-600'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${provider?.smsNotifications ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <span className="text-white text-sm">Push Notifications</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!provider?.pushNotifications}
                        className="sr-only"
                        disabled={notificationSaving === 'push'}
                        onChange={() => handleNotificationToggle('push')}
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${provider?.pushNotifications ? 'bg-cyan-500' : 'bg-slate-600'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${provider?.pushNotifications ? 'translate-x-5' : 'translate-x-0'}`}></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar Mini */}
              <div className="bg-[#152233] rounded-xl border border-slate-800 p-5 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                  <h3 className="font-semibold text-white">Calendar</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <button className="p-1.5 bg-slate-800 rounded hover:bg-slate-700 text-slate-300"><Search size={16}/></button>
                    <div className="flex bg-slate-800/50 p-1 rounded-md">
                      <button className="bg-[#1A374D] text-cyan-400 px-3 py-1.5 rounded-md text-xs font-bold">Day</button>
                      <button className="text-slate-400 px-3 py-1.5 rounded-md text-xs font-bold hover:text-white">Week</button>
                      <button className="text-slate-400 px-3 py-1.5 rounded-md text-xs font-bold hover:text-white">Month</button>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto pb-2">
                  <div className="grid grid-cols-7 gap-2 min-w-[600px]">
                    {['Sun 10', 'Mon 11', 'Tue 12', 'Wed 13', 'Thu 14', 'Fri 15', 'Sat 16'].map((day, i) => (
                      <div key={i} className="min-h-[100px] bg-[#0B141E] rounded-lg border border-slate-800 p-2 text-[10px]">
                        <span className="text-slate-500 block mb-2">{day}</span>
                        {day.includes('11') && <div className="bg-[#FFB129] text-white p-1 rounded font-bold truncate">Deep Cleaning</div>}
                        {day.includes('12') && <div className="bg-[#FFA726] text-white p-1 rounded font-bold mt-1 truncate">AC Service</div>}
                        {day.includes('15') && <div className="bg-[#4CAF50] text-white p-1 rounded font-bold mt-1 truncate">Payout</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Messages Mini */}
              <div className="bg-[#152233] rounded-xl border border-slate-800 p-5">
                <h3 className="font-semibold text-white mb-4">Messages</h3>
                <div className="space-y-4">
                  {/* No messages yet for fresh account */}
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-slate-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-slate-400 font-medium">No messages yet</p>
                    <p className="text-slate-500 text-sm">Your messages will appear here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </div>
  );
};

export default ProviderDashboard;
