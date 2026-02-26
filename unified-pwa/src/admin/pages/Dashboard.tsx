import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  DollarSign,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface Analytics {
  users: {
    total: number;
    byRole: {
      admin: number;
      provider: number;
      customer: number;
    };
  };
  providers: {
    total: number;
    byStatus: {
      pending: number;
      approved: number;
      rejected: number;
      suspended: number;
    };
  };
  services: {
    total: number;
    byStatus: {
      pending: number;
      approved: number;
      rejected: number;
      suspended: number;
    };
  };
  revenue: {
    last30Days: number;
    totalBookings: number;
  };
  recentActivity: Array<{
    action_type: string;
    count: number;
  }>;
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

const fetchWithFallback = async (path: string, token: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const endpoints = [`${API_BASE}${normalizedPath}`, normalizedPath];
  let lastError: any = null;

  for (let i = 0; i < endpoints.length; i += 1) {
    const endpoint = endpoints[i];
    try {
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 404 && i < endpoints.length - 1) {
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Network error');
};

const parseJsonSafely = async (response: Response) => {
  const raw = await response.text();
  if (!raw || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Admin session not found. Please login again.');
        setAnalytics(null);
        return;
      }

      setError('');
      const response = await fetchWithFallback('/api/admin/analytics', token);

      if (!response.ok) {
        throw new Error(`Failed to load analytics: ${response.status}`);
      }

      const data = await parseJsonSafely(response);
      if (data?.success) {
        setAnalytics(data.data);
      } else {
        throw new Error(data?.message || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load analytics');
      setAnalytics(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Platform overview and analytics</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-600/40 bg-red-600/10 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">Total Users</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{analytics?.users.total || 0}</p>
            <div className="flex gap-4 text-xs">
              <span className="text-slate-400">Admin: {analytics?.users.byRole.admin || 0}</span>
              <span className="text-slate-400">Provider: {analytics?.users.byRole.provider || 0}</span>
              <span className="text-slate-400">Customer: {analytics?.users.byRole.customer || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-sm text-slate-400">Providers</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{analytics?.providers.total || 0}</p>
            <div className="flex gap-4 text-xs">
              <span className="text-yellow-400">Pending: {analytics?.providers.byStatus.pending || 0}</span>
              <span className="text-emerald-400">Approved: {analytics?.providers.byStatus.approved || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-sm text-slate-400">Services</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{analytics?.services.total || 0}</p>
            <div className="flex gap-4 text-xs">
              <span className="text-yellow-400">Pending: {analytics?.services.byStatus.pending || 0}</span>
              <span className="text-emerald-400">Approved: {analytics?.services.byStatus.approved || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-sm text-slate-400">Revenue (30d)</span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">₹{analytics?.revenue.last30Days.toLocaleString() || 0}</p>
            <div className="text-xs text-slate-400">
              {analytics?.revenue.totalBookings || 0} bookings
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/admin/providers')}
              className="flex items-center gap-3 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Eye className="w-5 h-5 text-cyan-400" />
              <div className="text-left">
                <p className="font-medium text-white">Review Providers</p>
                <p className="text-xs text-slate-400">{analytics?.providers.byStatus.pending || 0} pending</p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/admin/services')}
              className="flex items-center gap-3 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Package className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <p className="font-medium text-white">Review Services</p>
                <p className="text-xs text-slate-400">{analytics?.services.byStatus.pending || 0} pending</p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/admin/bookings')}
              className="flex items-center gap-3 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <p className="font-medium text-white">View Bookings</p>
                <p className="text-xs text-slate-400">Manage orders</p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/admin/analytics')}
              className="flex items-center gap-3 p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <div className="text-left">
                <p className="font-medium text-white">Analytics</p>
                <p className="text-xs text-slate-400">View reports</p>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {analytics?.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.action_type.includes('APPROVE') ? 'bg-emerald-600/20' :
                    activity.action_type.includes('REJECT') ? 'bg-red-600/20' :
                    'bg-blue-600/20'
                  }`}>
                    {activity.action_type.includes('APPROVE') ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                     activity.action_type.includes('REJECT') ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
                     <Clock className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{activity.action_type.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-400">{activity.count} actions</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">Last 7 days</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
