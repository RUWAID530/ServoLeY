import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  isVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;
  walletBalance: number;
  totalBookings: number;
  completedBookings: number;
  joinedAt: string;
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
  if (!raw || !raw.trim()) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Admin session not found. Please login again.');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(search.trim() && { search: search.trim() })
      });

      const response = await fetchWithFallback(`/api/admin/customers?${params.toString()}`, token);
      const payload = await parseJsonSafely(response);

      if (!response.ok) {
        throw new Error(payload?.message || `Failed to load customers (${response.status})`);
      }

      if (!payload?.success) {
        throw new Error(payload?.message || 'Failed to load customers');
      }

      setCustomers(Array.isArray(payload?.data) ? payload.data : []);
      setTotalPages(payload?.pagination?.pages || 1);
    } catch (err: any) {
      setError(err?.message || 'Failed to load customers');
      setCustomers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [currentPage, statusFilter, search]);

  const statusLabel = (customer: Customer) => {
    if (customer.isBlocked) return 'Blocked';
    if (!customer.isActive) return 'Inactive';
    return 'Active';
  };

  const statusClass = (customer: Customer) => {
    if (customer.isBlocked) return 'bg-red-600/20 text-red-300 border-red-600/40';
    if (!customer.isActive) return 'bg-yellow-600/20 text-yellow-300 border-yellow-600/40';
    return 'bg-emerald-600/20 text-emerald-300 border-emerald-600/40';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-slate-400">Manage customer accounts and bookings</p>
        </div>
        <button
          onClick={loadCustomers}
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
            onChange={(e) => {
              setCurrentPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search name, email or phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setCurrentPage(1);
            setStatusFilter(e.target.value);
          }}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          <option value="inactive">Inactive</option>
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
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Bookings</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Wallet</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No customers found</td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{customer.name}</p>
                      <p className="text-xs text-slate-400">{customer.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">{customer.email || '-'}</p>
                      <p className="text-sm text-slate-400">{customer.phone || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full border ${statusClass(customer)}`}>
                          {statusLabel(customer)}
                        </span>
                        {!customer.isVerified && (
                          <span className="inline-flex items-center px-2.5 py-1 text-xs rounded-full border bg-slate-700/50 text-slate-300 border-slate-600">
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-white">{customer.totalBookings} total</p>
                      <p className="text-xs text-emerald-400">{customer.completedBookings} completed</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-yellow-300">
                      Rs {Number(customer.walletBalance || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(customer.joinedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
            <div className="text-sm text-slate-400">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm text-white bg-cyan-600 rounded">{currentPage}</span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
