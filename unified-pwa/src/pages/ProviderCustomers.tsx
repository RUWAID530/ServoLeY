import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getApiErrorMessage,
  getProviderAuthToken,
  parseJsonSafely,
  providerFetchWithFallback
} from '../utils/providerApi';

interface ProviderCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalBookings: number;
  totalSpent: number;
  lastBookingDate: string;
}

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

export default function ProviderCustomers() {
  const [customers, setCustomers] = useState<ProviderCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authRequired, setAuthRequired] = useState(false);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getProviderAuthToken();

      if (!token) {
        setAuthRequired(true);
        setCustomers([]);
        return;
      }

      setAuthRequired(false);
      const response = await providerFetchWithFallback('/api/provider/customers', token);
      const payload = await parseJsonSafely(response);

      if (!response.ok || !payload?.success) {
        throw new Error(getApiErrorMessage(payload, `Failed to load customers (${response.status})`));
      }

      const mapped: ProviderCustomer[] = Array.isArray(payload?.data?.customers)
        ? payload.data.customers.map((customer: any) => ({
            id: String(customer.id || ''),
            name: customer.name || 'Customer',
            email: customer.email || '',
            phone: customer.phone || '',
            city: customer.city || 'Tirunelveli',
            totalBookings: Number(customer.totalBookings || 0),
            totalSpent: Number(customer.totalSpent || 0),
            lastBookingDate: customer.lastBookingDate || ''
          }))
        : [];

      setCustomers(mapped);
    } catch (customerError: any) {
      setError(customerError?.message || 'Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-56">
          <div className="h-9 w-9 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (authRequired) {
    return (
      <div className="p-6">
        <div className="max-w-xl bg-rose-500/10 border border-rose-500/30 rounded-xl p-6 text-center">
          <p className="text-rose-300 mb-4">Please log in to view your customers.</p>
          <button onClick={() => (window.location.href = '/auth')} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg">
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Customers</h1>
          <p className="text-sm text-slate-400">See repeat customers and booking activity.</p>
        </div>
        <Link to="/provider/dashboard" className="text-cyan-400 hover:text-cyan-300 text-sm">
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-slate-800">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Location</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Bookings</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Total Spend</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Last Booking</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                  No customers yet.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-800">
                  <td className="px-4 py-3">
                    <p className="text-sm text-white">{customer.name}</p>
                    <p className="text-xs text-slate-400">{customer.email || customer.phone || 'No contact info'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{customer.city || 'Tirunelveli'}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{customer.totalBookings}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{formatCurrency(customer.totalSpent)}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {customer.lastBookingDate ? new Date(customer.lastBookingDate).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
