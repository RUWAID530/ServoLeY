import { useEffect, useState } from 'react';
import { RefreshCw, Users, Briefcase, Package, IndianRupee } from 'lucide-react';

interface AnalyticsPayload {
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

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    try {
      setError('');
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        setError('Admin session not found. Please login again.');
        return;
      }

      const response = await fetchWithFallback('/api/admin/analytics', token);
      const payload = await parseJsonSafely(response);

      if (!response.ok) {
        throw new Error(payload?.message || `Failed to load analytics (${response.status})`);
      }

      if (!payload?.success) {
        throw new Error(payload?.message || 'Failed to load analytics');
      }

      setAnalytics(payload.data || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load analytics');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400">Platform metrics and growth summary</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-600/40 bg-red-600/10 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-slate-800/50 rounded-xl p-10 border border-slate-700 text-center text-slate-400">
          Loading analytics...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="text-xs text-slate-400">Users</span>
              </div>
              <p className="text-2xl font-bold text-white">{analytics?.users.total || 0}</p>
              <p className="text-xs text-slate-400 mt-1">
                Admin {analytics?.users.byRole.admin || 0} | Provider {analytics?.users.byRole.provider || 0} | Customer {analytics?.users.byRole.customer || 0}
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <span className="text-xs text-slate-400">Providers</span>
              </div>
              <p className="text-2xl font-bold text-white">{analytics?.providers.total || 0}</p>
              <p className="text-xs text-slate-400 mt-1">
                Pending {analytics?.providers.byStatus.pending || 0} | Approved {analytics?.providers.byStatus.approved || 0}
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-5 h-5 text-purple-400" />
                <span className="text-xs text-slate-400">Services</span>
              </div>
              <p className="text-2xl font-bold text-white">{analytics?.services.total || 0}</p>
              <p className="text-xs text-slate-400 mt-1">
                Pending {analytics?.services.byStatus.pending || 0} | Approved {analytics?.services.byStatus.approved || 0}
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <IndianRupee className="w-5 h-5 text-yellow-400" />
                <span className="text-xs text-slate-400">Revenue (30d)</span>
              </div>
              <p className="text-2xl font-bold text-white">Rs {(analytics?.revenue.last30Days || 0).toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">{analytics?.revenue.totalBookings || 0} bookings</p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-3">Status Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-slate-700/40 rounded-lg">
                <p className="text-slate-300 font-medium mb-2">Provider Status</p>
                <p className="text-slate-400">Pending: {analytics?.providers.byStatus.pending || 0}</p>
                <p className="text-slate-400">Approved: {analytics?.providers.byStatus.approved || 0}</p>
                <p className="text-slate-400">Rejected: {analytics?.providers.byStatus.rejected || 0}</p>
                <p className="text-slate-400">Suspended: {analytics?.providers.byStatus.suspended || 0}</p>
              </div>
              <div className="p-4 bg-slate-700/40 rounded-lg">
                <p className="text-slate-300 font-medium mb-2">Service Status</p>
                <p className="text-slate-400">Pending: {analytics?.services.byStatus.pending || 0}</p>
                <p className="text-slate-400">Approved: {analytics?.services.byStatus.approved || 0}</p>
                <p className="text-slate-400">Rejected: {analytics?.services.byStatus.rejected || 0}</p>
                <p className="text-slate-400">Suspended: {analytics?.services.byStatus.suspended || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
