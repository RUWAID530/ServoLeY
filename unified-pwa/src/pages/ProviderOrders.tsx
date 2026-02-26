import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getApiErrorMessage,
  getProviderAuthToken,
  parseJsonSafely,
  providerFetchWithFallback
} from '../utils/providerApi';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

type ProviderOrderStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

interface ProviderOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  status: ProviderOrderStatus;
  totalAmount: number;
  bookingDate: string;
  bookingTime: string;
  address: string;
  issueDescription: string;
  issuePhotos: string[];
  createdAt: string;
}

const normalizeOrderStatus = (value: string): ProviderOrderStatus => {
  const status = String(value || '').toLowerCase();
  if (status === 'accepted' || status === 'confirmed') return 'accepted';
  if (status === 'in_progress' || status === 'processing') return 'in_progress';
  if (status === 'completed') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'rejected') return 'rejected';
  return 'pending';
};

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

const formatDateTime = (dateValue: string, timeValue?: string) => {
  const parsedDate = new Date(dateValue);
  const dateLabel = Number.isNaN(parsedDate.getTime())
    ? 'Not scheduled'
    : parsedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  if (timeValue && String(timeValue).trim()) {
    return `${dateLabel} ${String(timeValue).trim()}`;
  }

  if (Number.isNaN(parsedDate.getTime())) return dateLabel;
  return `${dateLabel} ${parsedDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
};

const getStatusColor = (status: ProviderOrderStatus) => {
  if (status === 'pending') return 'bg-amber-500/20 text-amber-300';
  if (status === 'accepted' || status === 'in_progress') return 'bg-blue-500/20 text-blue-300';
  if (status === 'completed') return 'bg-emerald-500/20 text-emerald-300';
  if (status === 'rejected') return 'bg-rose-500/20 text-rose-300';
  return 'bg-slate-600/20 text-slate-300';
};

const statusLabel = (status: ProviderOrderStatus) => {
  if (status === 'in_progress') return 'In Progress';
  return status[0].toUpperCase() + status.slice(1);
};

const normalizeIssueDataFromNotes = (notes: string) => {
  const raw = String(notes || '').trim();
  if (!raw) {
    return {
      issueDescription: '',
      issuePhotos: []
    };
  }

  const markerRegex = /\n?Issue photos:\s*\n?/i;
  const issueDescription = markerRegex.test(raw) ? raw.split(markerRegex)[0].trim() : raw;
  const issuePhotos = (raw.match(/\/uploads\/issues\/[^\s)]+/g) || []).filter(Boolean);

  return {
    issueDescription,
    issuePhotos: Array.from(new Set(issuePhotos))
  };
};

const resolveMediaUrl = (value: string) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${API_BASE}${raw.startsWith('/') ? raw : `/${raw}`}`;
};

export default function ProviderOrders() {
  const [orders, setOrders] = useState<ProviderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authRequired, setAuthRequired] = useState(false);
  const [filter, setFilter] = useState<'all' | ProviderOrderStatus>('all');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getProviderAuthToken();
      if (!token) {
        setAuthRequired(true);
        setOrders([]);
        return;
      }

      setAuthRequired(false);
      const response = await providerFetchWithFallback('/api/provider/orders', token);
      const payload = await parseJsonSafely(response);

      if (!response.ok || !payload?.success) {
        throw new Error(getApiErrorMessage(payload, `Failed to load orders (${response.status})`));
      }

      const mapped: ProviderOrder[] = Array.isArray(payload?.data?.orders)
        ? payload.data.orders.map((order: any) => ({
            id: String(order.id || ''),
            orderNumber: order.orderNumber || `ORD-${String(order.id || '').slice(0, 8).toUpperCase()}`,
            customerName: order?.customer?.full_name || order?.customerName || 'Customer',
            customerPhone: order?.customer?.phone || '',
            serviceName: order?.service?.name || order?.serviceName || 'Service',
            status: normalizeOrderStatus(order?.status),
            totalAmount: Number(order?.totalAmount || order?.price || 0),
            bookingDate: order?.bookingDate || order?.serviceDate || order?.createdAt || '',
            bookingTime: String(order?.bookingTime || ''),
            address: String(order?.address || order?.location || ''),
            issueDescription:
              String(order?.issueDescription || '').trim() ||
              normalizeIssueDataFromNotes(String(order?.notes || '')).issueDescription,
            issuePhotos: Array.isArray(order?.issuePhotos)
              ? order.issuePhotos.filter(Boolean)
              : normalizeIssueDataFromNotes(String(order?.notes || '')).issuePhotos,
            createdAt: order?.createdAt || order?.bookingDate || ''
          }))
        : [];

      setOrders(mapped);
    } catch (fetchError: any) {
      setError(fetchError?.message || 'Failed to load provider bookings');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((order) => order.status === filter);
  }, [filter, orders]);

  const updateOrderStatus = async (orderId: string, apiStatus: string, fallbackStatus: ProviderOrderStatus) => {
    try {
      setError('');
      const token = getProviderAuthToken();
      if (!token) {
        setAuthRequired(true);
        return;
      }

      const response = await providerFetchWithFallback(`/api/provider/orders/${orderId}/status`, token, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: apiStatus })
      });
      const payload = await parseJsonSafely(response);
      if (!response.ok || !payload?.success) {
        throw new Error(getApiErrorMessage(payload, 'Failed to update booking status'));
      }
      const updatedStatus = normalizeOrderStatus(payload?.data?.order?.status || fallbackStatus);

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status: updatedStatus } : order))
      );
    } catch (statusError: any) {
      setError(statusError?.message || 'Failed to update booking status');
    }
  };

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
          <p className="text-rose-300 mb-4">Please log in to view your bookings.</p>
          <button
            onClick={() => (window.location.href = '/auth')}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
          >
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
          <h1 className="text-2xl font-semibold text-white">Bookings</h1>
          <p className="text-sm text-slate-400">Track and manage all incoming customer jobs.</p>
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

      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === status ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {status === 'all' ? 'All' : statusLabel(status)}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <p className="text-white font-medium">No bookings found</p>
          <p className="text-sm text-slate-400 mt-1">
            {filter === 'all' ? 'Bookings will appear here once customers book services.' : `No ${filter} bookings.`}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
          {filteredOrders.map((order) => (
            <div key={order.id} className="p-4 sm:p-5 flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-semibold">{order.serviceName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{order.customerName}</p>
                  {order.customerPhone && <p className="text-xs text-slate-400 mt-0.5">{order.customerPhone}</p>}
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm text-white font-medium">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(order.bookingDate || order.createdAt, order.bookingTime)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400">Order ID</p>
                  <p className="text-slate-200 mt-1">{order.orderNumber}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400">Booking Time</p>
                  <p className="text-slate-200 mt-1">{formatDateTime(order.bookingDate || order.createdAt, order.bookingTime)}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 md:col-span-2">
                  <p className="text-xs text-slate-400">Location</p>
                  <p className="text-slate-200 mt-1">{order.address || 'Location not provided'}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 md:col-span-2">
                  <p className="text-xs text-slate-400">Issue</p>
                  <p className="text-slate-200 mt-1 whitespace-pre-wrap">
                    {order.issueDescription || 'Customer did not add issue details.'}
                  </p>
                </div>
              </div>

              {order.issuePhotos.length > 0 && (
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400 mb-2">Issue Images</p>
                  <div className="flex flex-wrap gap-2">
                    {order.issuePhotos.map((photo, index) => {
                      const src = resolveMediaUrl(photo);
                      return (
                        <a
                          key={`${order.id}-issue-${index}`}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-20 h-20 rounded-md overflow-hidden border border-slate-700 hover:border-cyan-500 transition-colors"
                          title="Open issue image"
                        >
                          <img src={src} alt={`Issue ${index + 1}`} className="w-full h-full object-cover" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'accepted', 'accepted')}
                      className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'rejected', 'rejected')}
                      className="px-3 py-1.5 text-sm rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Reject
                    </button>
                  </>
                )}
                {order.status === 'accepted' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'in_progress', 'in_progress')}
                    className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Start Work
                  </button>
                )}
                {order.status === 'in_progress' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed', 'completed')}
                    className="px-3 py-1.5 text-sm rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
