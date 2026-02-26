import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';

interface AdminOrder {
  id: string;
  status: string;
  totalAmount: number;
  serviceDate: string;
  address: string;
  customerId: string;
  providerId: string;
  createdAt: string;
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

export default function Bookings() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadOrders = async () => {
    try {
      setError('');
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        setError('Admin session not found. Please login again.');
        return;
      }

      const response = await fetchWithFallback('/api/orders', token);
      const payload = await parseJsonSafely(response);

      if (!response.ok) {
        throw new Error(payload?.message || `Failed to load bookings (${response.status})`);
      }

      if (!payload?.success) {
        throw new Error(payload?.message || 'Failed to load bookings');
      }

      setOrders(Array.isArray(payload?.data?.orders) ? payload.data.orders : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load bookings');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const statusMatch = statusFilter === 'all' || order.status === statusFilter;
      if (!statusMatch) return false;
      if (!query) return true;
      return (
        order.id.toLowerCase().includes(query) ||
        order.address.toLowerCase().includes(query) ||
        order.customerId.toLowerCase().includes(query) ||
        order.providerId.toLowerCase().includes(query)
      );
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="text-slate-400">Track and review all platform bookings</p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by booking ID, address, customer, provider..."
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-600/40 bg-red-600/10 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase text-slate-300">Booking ID</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-slate-300">Amount</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-slate-300">Service Date</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-slate-300">Address</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-slate-300">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">Loading bookings...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">No bookings found</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-sm text-white font-medium">{order.id}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{order.status}</td>
                    <td className="px-4 py-3 text-sm text-emerald-400">Rs {Number(order.totalAmount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{new Date(order.serviceDate).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{order.address}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{new Date(order.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
