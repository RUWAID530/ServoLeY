import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, Loader2, MessageCircle, Search, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
}

interface TicketTimelineEvent {
  id: string;
  type: 'CREATED' | 'UPDATE';
  title: string;
  message: string;
  createdAt: string;
  actor?: {
    id?: string;
    name?: string;
    role?: string;
  };
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken') || '';

const fetchWithFallback = async (path: string, token?: string, options: RequestInit = {}) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const baseCandidates = [API_BASE, 'http://localhost:8086', 'http://localhost:8084', 'http://localhost:8083']
    .filter(Boolean)
    .map((item) => item.replace(/\/$/, ''));
  const urls = [...new Set(baseCandidates)].map((base) => `${base}${normalized}`);

  let lastError: any = null;
  for (const url of urls) {
    try {
      return await fetch(url, {
        ...options,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {})
        }
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Network error. Backend not running or wrong port.');
};

const parseJsonSafely = async (response: Response) => {
  const text = await response.text();
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const ticketRef = (id: string) => `#SL-${String(id || '').replace(/-/g, '').slice(0, 6).toUpperCase()}`;

const statusClass = (status: TicketStatus) => {
  if (status === 'RESOLVED' || status === 'CLOSED') {
    return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
  }
  if (status === 'IN_PROGRESS') {
    return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
  }
  return 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30';
};

const formatWhen = (dateStr: string) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'just now';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const CustomerSupportDashboard: React.FC<{ onOpenChat: () => void }> = ({ onOpenChat }) => {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTicketId, setUpdatingTicketId] = useState('');
  const [timelineLoadingId, setTimelineLoadingId] = useState('');
  const [timelineByTicket, setTimelineByTicket] = useState<Record<string, TicketTimelineEvent[]>>({});
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [error, setError] = useState('');

  const handleNavigate = (page: 'home' | 'services' | 'wallet' | 'support' | 'profile') => {
    switch (page) {
      case 'home':
        navigate('/customer/home');
        break;
      case 'services':
        navigate('/customer/services');
        break;
      case 'wallet':
        navigate('/customer/wallet');
        break;
      case 'support':
        navigate('/customer/support/dashboard');
        break;
      case 'profile':
        navigate('/customer/profile');
        break;
    }
  };

  const loadSupportData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getAuthToken();
      if (!token) {
        setError('Please login again to use support.');
        return;
      }

      const [ticketRes, faqRes, categoryRes] = await Promise.all([
        fetchWithFallback('/api/support/tickets?limit=10', token),
        fetchWithFallback('/api/support/faq', token),
        fetchWithFallback('/api/support/faq/categories', token)
      ]);

      const [ticketPayload, faqPayload, categoryPayload] = await Promise.all([
        parseJsonSafely(ticketRes),
        parseJsonSafely(faqRes),
        parseJsonSafely(categoryRes)
      ]);

      if (!ticketRes.ok) {
        throw new Error(ticketPayload?.message || 'Failed to load support tickets');
      }
      if (!faqRes.ok) {
        throw new Error(faqPayload?.message || 'Failed to load FAQ');
      }
      if (!categoryRes.ok) {
        throw new Error(categoryPayload?.message || 'Failed to load FAQ categories');
      }

      setTickets(Array.isArray(ticketPayload?.data?.tickets) ? ticketPayload.data.tickets : []);
      setFaqs(Array.isArray(faqPayload?.data?.faqs) ? faqPayload.data.faqs : []);
      setCategories(Array.isArray(categoryPayload?.data?.categories) ? categoryPayload.data.categories : []);
    } catch (loadError: any) {
      setError(loadError?.message || 'Failed to load support data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupportData();
  }, []);

  const visibleFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((faq) => {
      const categoryOk = selectedCategory === 'All' || faq.category === selectedCategory;
      if (!categoryOk) return false;
      if (!q) return true;
      return faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q);
    });
  }, [faqs, query, selectedCategory]);

  const ticketOverview = useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status === 'OPEN').length;
    const progress = tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length;
    const resolved = tickets.filter((ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED').length;
    return { open, progress, resolved, total: tickets.length };
  }, [tickets]);

  const closeTicket = async (ticketId: string) => {
    try {
      setUpdatingTicketId(ticketId);
      setError('');
      const token = getAuthToken();
      if (!token) {
        setError('Please login again to update ticket.');
        return;
      }

      const response = await fetchWithFallback(`/api/support/tickets/${ticketId}/status`, token, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' })
      });
      const payload = await parseJsonSafely(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to update ticket');
      }

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status: 'CLOSED', updatedAt: new Date().toISOString() } : ticket
        )
      );
    } catch (updateError: any) {
      setError(updateError?.message || 'Failed to update ticket');
    } finally {
      setUpdatingTicketId('');
    }
  };

  const toggleTimeline = async (ticketId: string) => {
    if (timelineByTicket[ticketId]) {
      setTimelineByTicket((prev) => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
      return;
    }

    try {
      setTimelineLoadingId(ticketId);
      setError('');
      const token = getAuthToken();
      if (!token) {
        setError('Please login again to view ticket timeline.');
        return;
      }

      const response = await fetchWithFallback(`/api/support/tickets/${ticketId}/timeline`, token);
      const payload = await parseJsonSafely(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to load timeline');
      }

      setTimelineByTicket((prev) => ({
        ...prev,
        [ticketId]: Array.isArray(payload?.data?.timeline) ? payload.data.timeline : []
      }));
    } catch (timelineError: any) {
      setError(timelineError?.message || 'Failed to load timeline');
    } finally {
      setTimelineLoadingId('');
    }
  };

  return (
    <div className="pb-24 pt-0 max-w-5xl mx-auto">
      <Navigation active="support" onNavigate={handleNavigate} />

      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Support Center</h1>
        <p className="text-white/85 text-sm mt-2">Raise tickets, track progress, and find instant answers in FAQ.</p>
        <p className="text-white/75 text-xs mt-1">Every submitted ticket goes to the Admin Support Queue for action.</p>
        <div className="flex flex-wrap gap-3 mt-5">
          <button
            onClick={() => navigate('/customer/support/ticket')}
            className="bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50"
          >
            Raise New Ticket
          </button>
          <button
            onClick={onOpenChat}
            className="bg-blue-500/40 text-white border border-blue-200/30 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-500/55"
          >
            Open Live Chat
          </button>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-600/40 bg-red-600/10 px-4 py-3 text-sm text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400">Total Tickets</p>
            <p className="text-xl font-bold text-white mt-1">{ticketOverview.total}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400">Open</p>
            <p className="text-xl font-bold text-cyan-300 mt-1">{ticketOverview.open}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400">In Progress</p>
            <p className="text-xl font-bold text-amber-300 mt-1">{ticketOverview.progress}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400">Resolved/Closed</p>
            <p className="text-xl font-bold text-emerald-300 mt-1">{ticketOverview.resolved}</p>
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search FAQ by keywords"
              className="w-full bg-transparent text-white text-sm focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-full text-xs ${
                selectedCategory === 'All'
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200'
                  : 'bg-slate-800 border border-slate-700 text-slate-300'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs ${
                  selectedCategory === category
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200'
                    : 'bg-slate-800 border border-slate-700 text-slate-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">FAQ</h3>
          {loading ? (
            <div className="text-sm text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading FAQ...
            </div>
          ) : visibleFaqs.length === 0 ? (
            <div className="text-sm text-slate-400">No FAQ found for your search.</div>
          ) : (
            <div className="space-y-3">
              {visibleFaqs.slice(0, 8).map((faq) => (
                <div key={faq.id} className="border border-slate-800 rounded-xl p-3 bg-slate-800/40">
                  <p className="text-sm text-white font-medium">{faq.question}</p>
                  <p className="text-xs text-slate-300 mt-1">{faq.answer}</p>
                  <p className="text-[11px] text-slate-500 mt-2">{faq.category}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">Your Support Tickets</h3>
            <button
              onClick={() => navigate('/customer/support/ticket')}
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
            >
              + Raise Ticket
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
              No support tickets yet. Create your first ticket for quick help.
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-slate-800 p-3 bg-slate-800/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white text-sm font-medium">{ticketRef(ticket.id)} - {ticket.subject}</p>
                      <p className="text-xs text-slate-400 mt-1">Updated {formatWhen(ticket.updatedAt)}</p>
                    </div>
                    <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${statusClass(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 line-clamp-2">{ticket.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                      <button
                        onClick={() => closeTicket(ticket.id)}
                        disabled={updatingTicketId === ticket.id}
                        className="text-xs font-semibold text-slate-200 hover:text-white disabled:opacity-60 inline-flex items-center gap-1"
                      >
                        {updatingTicketId === ticket.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Mark as Closed
                      </button>
                    )}
                    <button
                      onClick={() => toggleTimeline(ticket.id)}
                      disabled={timelineLoadingId === ticket.id}
                      className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 disabled:opacity-60 inline-flex items-center gap-1"
                    >
                      {timelineLoadingId === ticket.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                      {timelineByTicket[ticket.id] ? 'Hide Updates' : 'View Updates'}
                    </button>
                  </div>

                  {timelineByTicket[ticket.id] && (
                    <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/60 p-3 space-y-2">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Ticket Timeline</p>
                      {timelineByTicket[ticket.id].length === 0 ? (
                        <p className="text-xs text-slate-400">No updates yet. Ticket is waiting in queue.</p>
                      ) : (
                        timelineByTicket[ticket.id].map((event) => (
                          <div key={event.id} className="border border-slate-800 rounded-md p-2 bg-slate-950/40">
                            <p className="text-xs font-semibold text-white">{event.title}</p>
                            <p className="text-xs text-slate-300 mt-1">{event.message}</p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              {formatWhen(event.createdAt)}{event.actor?.name ? ` - ${event.actor.name}` : ''}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Contact Support</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={onOpenChat}
              className="rounded-xl bg-slate-800 border border-slate-700 p-4 text-left hover:border-slate-500"
            >
              <MessageCircle className="w-4 h-4 text-cyan-300" />
              <p className="text-sm text-white font-semibold mt-2">Live Chat</p>
              <p className="text-xs text-slate-400 mt-1">Fastest support channel.</p>
            </button>
            <button
              onClick={() => navigate('/customer/support/ticket')}
              className="rounded-xl bg-slate-800 border border-slate-700 p-4 text-left hover:border-slate-500"
            >
              <Ticket className="w-4 h-4 text-cyan-300" />
              <p className="text-sm text-white font-semibold mt-2">Ticket Support</p>
              <p className="text-xs text-slate-400 mt-1">Track every update in one place.</p>
            </button>
            <div className="rounded-xl bg-slate-800 border border-slate-700 p-4">
              <HelpCircle className="w-4 h-4 text-cyan-300" />
              <p className="text-sm text-white font-semibold mt-2">Self Help</p>
              <p className="text-xs text-slate-400 mt-1">Use FAQ above for common issues.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
