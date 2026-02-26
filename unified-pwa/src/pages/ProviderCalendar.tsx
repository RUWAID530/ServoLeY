import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getApiErrorMessage,
  getProviderAuthToken,
  parseJsonSafely,
  providerFetchWithFallback
} from '../utils/providerApi';

interface Booking {
  id: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  customer: {
    full_name: string;
  };
  service: {
    name: string;
  };
}

const getLocalDateKey = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStatusColor = (status: string) => {
  const value = String(status || '').toLowerCase();
  if (value === 'completed') return 'bg-emerald-500/20 text-emerald-300';
  if (value === 'cancelled' || value === 'rejected') return 'bg-rose-500/20 text-rose-300';
  if (value === 'processing' || value === 'accepted' || value === 'in_progress') return 'bg-blue-500/20 text-blue-300';
  return 'bg-amber-500/20 text-amber-300';
};

export default function ProviderCalendar() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authRequired, setAuthRequired] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getProviderAuthToken();
      if (!token) {
        setAuthRequired(true);
        setBookings([]);
        return;
      }

      setAuthRequired(false);
      const response = await providerFetchWithFallback('/api/provider/bookings', token);
      const payload = await parseJsonSafely(response);

      if (!response.ok || !payload?.success) {
        throw new Error(getApiErrorMessage(payload, `Failed to load bookings (${response.status})`));
      }

      const mapped: Booking[] = Array.isArray(payload?.data?.bookings)
        ? payload.data.bookings.map((booking: any) => ({
            id: String(booking.id || ''),
            bookingDate: booking.bookingDate || booking.serviceDate || booking.createdAt || '',
            bookingTime: booking.bookingTime || '',
            status: String(booking.status || 'pending'),
            customer: {
              full_name: booking?.customer?.full_name || booking?.customerName || 'Customer'
            },
            service: {
              name: booking?.service?.name || booking?.serviceName || 'Service'
            }
          }))
        : [];

      setBookings(mapped);
    } catch (bookingError: any) {
      setError(bookingError?.message || 'Failed to load calendar');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const daysInMonth = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(),
    [currentDate]
  );
  const firstDay = useMemo(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(),
    [currentDate]
  );

  const monthName = useMemo(
    () => currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    [currentDate]
  );

  const getBookingsForDay = (day: number) => {
    const dateKey = getLocalDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    return bookings.filter((booking) => getLocalDateKey(booking.bookingDate) === dateKey);
  };

  const selectedBookings = selectedDay ? getBookingsForDay(selectedDay) : [];

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
          <p className="text-rose-300 mb-4">Please log in to view your calendar.</p>
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
          <h1 className="text-2xl font-semibold text-white">Calendar</h1>
          <p className="text-sm text-slate-400">View all scheduled bookings in one place.</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-white font-medium">{monthName}</p>
          </div>

          <div className="grid grid-cols-7 gap-2 text-xs text-slate-400 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDay }).map((_, index) => (
              <div key={`empty-${index}`} className="rounded-lg bg-slate-800/60 min-h-[84px]" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dayBookings = getBookingsForDay(day);
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay((prev) => (prev === day ? null : day))}
                  className={`rounded-lg border min-h-[84px] p-2 text-left transition-colors ${
                    selectedDay === day
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <p className={`text-xs font-medium ${selectedDay === day ? 'text-cyan-300' : 'text-slate-300'}`}>
                    {day}
                  </p>
                  <div className="mt-1 space-y-1">
                    {dayBookings.slice(0, 2).map((booking) => (
                      <div key={booking.id} className={`px-1.5 py-1 rounded text-[10px] ${getStatusColor(booking.status)}`}>
                        {booking.service.name}
                      </div>
                    ))}
                    {dayBookings.length > 2 && <p className="text-[10px] text-slate-400">+{dayBookings.length - 2} more</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">
            {selectedDay ? `Bookings for ${selectedDay} ${monthName}` : 'Select a day'}
          </h2>
          {selectedDay ? (
            selectedBookings.length > 0 ? (
              <div className="space-y-3">
                {selectedBookings.map((booking) => (
                  <div key={booking.id} className="rounded-xl border border-slate-800 bg-slate-800/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{booking.customer.full_name}</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                        {String(booking.status).toLowerCase()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-1">{booking.service.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{booking.bookingTime || 'Time to be confirmed'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No bookings on this day.</p>
            )
          ) : (
            <p className="text-sm text-slate-400">Choose a date in the calendar to see details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
