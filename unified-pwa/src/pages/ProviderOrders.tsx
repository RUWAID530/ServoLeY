import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, Clock, Eye, LayoutGrid, MessageSquare } from 'lucide-react';
import {
  getApiErrorMessage,
  getProviderAuthToken,
  parseJsonSafely,
  providerFetchWithFallback
} from '../utils/providerApi';

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

const getStatusMeta = (status: ProviderOrderStatus) => {
  if (status === 'in_progress') {
    return { label: 'In Progress', className: 'bg-orange-100 text-orange-600' };
  }
  if (status === 'pending') {
    return { label: 'Awaiting Approval', className: 'bg-amber-100 text-amber-600' };
  }
  if (status === 'accepted') {
    return { label: 'Scheduled', className: 'bg-blue-100 text-blue-600' };
  }
  if (status === 'completed') {
    return { label: 'Completed', className: 'bg-emerald-100 text-emerald-600' };
  }
  if (status === 'rejected') {
    return { label: 'Rejected', className: 'bg-rose-100 text-rose-600' };
  }
  return { label: 'Cancelled', className: 'bg-slate-200 text-slate-600' };
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

export default function ProviderOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ProviderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authRequired, setAuthRequired] = useState(false);
  const [filter, setFilter] = useState<'active' | 'pending' | 'completed'>('active');
  const handleNotifications = () => {
    navigate('/provider/notification');
  };

  const handleViewDetails = (orderId: string) => {
    navigate('/provider/bookings', { state: { orderId } });
  };

  const handleChat = (orderId: string) => {
    navigate('/provider/messages', { state: { orderId } });
  };

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
      const candidates = ['/api/provider/orders', '/api/provider/bookings'];
      let payload: any = null;
      let response: Response | null = null;

      for (const endpoint of candidates) {
        response = await providerFetchWithFallback(endpoint, token);
        const parsed = await parseJsonSafely(response);
        if (response.ok && parsed?.success) {
          payload = parsed;
          break;
        }
      }

      if (!response || !payload?.success) {
        throw new Error(getApiErrorMessage(payload, `Failed to load orders (${response?.status || 0})`));
      }

      const rawOrders = Array.isArray(payload?.data?.orders)
        ? payload.data.orders
        : Array.isArray(payload?.data?.bookings)
          ? payload.data.bookings
          : [];

      const mapped: ProviderOrder[] = Array.isArray(rawOrders)
        ? rawOrders.map((order: any) => ({
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
    if (filter === 'pending') {
      return orders.filter((order) => order.status === 'pending');
    }
    if (filter === 'completed') {
      return orders.filter((order) => order.status === 'completed');
    }
    return orders.filter((order) => order.status === 'accepted' || order.status === 'in_progress');
  }, [filter, orders]);

  const upcomingSchedule = useMemo(() => {
    const upcoming = orders
      .filter((order) => order.status === 'accepted' || order.status === 'in_progress')
      .sort((a, b) => new Date(a.bookingDate || a.createdAt).getTime() - new Date(b.bookingDate || b.createdAt).getTime());
    return upcoming.slice(0, 3);
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf6f4] px-5 py-8">
        <div className="flex items-center justify-center h-56">
          <div className="h-9 w-9 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (authRequired) {
    return (
      <div className="min-h-screen bg-[#fbf6f4] px-5 py-8">
        <div className="bg-white border border-rose-200 rounded-2xl p-6 text-center shadow-sm">
          <p className="text-rose-500 mb-4">Please log in to view your bookings.</p>
          <button
            onClick={() => (window.location.href = '/auth')}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf6f4] px-5 py-8 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Manage Jobs</h1>
            <p className="text-sm text-slate-500">Track active requests and schedules.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleNotifications}
          className="relative h-10 w-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center"
        >
          <Bell className="h-5 w-5 text-slate-500" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500" />
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center gap-8 text-sm font-semibold text-slate-400">
        {(['active', 'pending', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`pb-3 transition ${
              filter === tab ? 'text-orange-600 border-b-2 border-orange-500' : 'hover:text-slate-600'
            }`}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-3xl bg-white border border-slate-100 p-8 text-center text-slate-500 shadow-sm">
            No jobs found for this tab.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusMeta = getStatusMeta(order.status);
            return (
              <div key={order.id} className="rounded-3xl bg-white border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.className}`}>
                    {statusMeta.label}
                  </span>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-orange-600">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Total Earnings</p>
                  </div>
                </div>

                <h3 className="mt-3 text-lg font-semibold text-slate-900">{order.serviceName}</h3>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-semibold">
                      {order.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Client</p>
                      <p className="font-semibold text-slate-800">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Scheduled</p>
                    <p className="font-semibold text-slate-800">
                      {formatDateTime(order.bookingDate || order.createdAt, order.bookingTime)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleViewDetails(order.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 text-white py-3 text-sm font-semibold shadow-sm hover:bg-orange-600"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChat(order.id)}
                    className="h-12 w-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-10">
        <p className="text-xs font-semibold tracking-[0.3em] text-slate-400">UPCOMING SCHEDULE</p>
        <div className="mt-4 space-y-3">
          {upcomingSchedule.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-100 p-4 text-sm text-slate-500 shadow-sm">
              No upcoming appointments.
            </div>
          ) : (
            upcomingSchedule.map((order) => (
              <div key={`upcoming-${order.id}`} className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{order.serviceName}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDateTime(order.bookingDate || order.createdAt, order.bookingTime)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-orange-600">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Details</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
