import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Ticket,
  User,
  Users
} from 'lucide-react';
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

const supportEmail = (import.meta.env.VITE_SUPPORT_EMAIL || 'support@servoley.com').trim();
const supportPhone = (import.meta.env.VITE_SUPPORT_PHONE || '').trim();
const supportPhoneDigits = supportPhone.replace(/\D/g, '');
const hasValidPhone = supportPhoneDigits.length >= 10;

const statusClass = (status: TicketStatus) => {
  if (status === 'RESOLVED' || status === 'CLOSED') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
  if (status === 'IN_PROGRESS') {
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  }
  return 'bg-blue-50 text-blue-700 border border-blue-200';
};

const priorityClass = (priority: SupportTicket['priority']) => {
  if (priority === 'URGENT') {
    return 'text-rose-700 bg-rose-50 border border-rose-200';
  }
  if (priority === 'HIGH') {
    return 'text-amber-700 bg-amber-50 border border-amber-200';
  }
  if (priority === 'MEDIUM') {
    return 'text-blue-700 bg-blue-50 border border-blue-200';
  }
  return 'text-slate-700 bg-slate-100 border border-slate-200';
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
  const [showAllTickets, setShowAllTickets] = useState(false);

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

  const categoryCards = useMemo(() => {
    const fallback = ['Payments', 'Bookings', 'Account', 'Safety'];
    const derived = Array.from(new Set(faqs.map((faq) => faq.category).filter(Boolean)));
    const source = categories.length ? categories : derived.length ? derived : fallback;
    const themes = [
      { icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
      { icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
      { icon: User, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50' }
    ];

    return source.slice(0, 4).map((category, index) => {
      const label = category || 'General';
      const name = String(category || '').toLowerCase();
      if (name.includes('payment') || name.includes('billing')) {
        return { key: label, label, ...themes[0] };
      }
      if (name.includes('booking') || name.includes('schedule')) {
        return { key: label, label, ...themes[1] };
      }
      if (name.includes('account') || name.includes('profile')) {
        return { key: label, label, ...themes[2] };
      }
      if (name.includes('safety') || name.includes('security')) {
        return { key: label, label, ...themes[3] };
      }
      const theme = themes[index % themes.length];
      return { key: label, label, ...theme };
    });
  }, [categories, faqs]);

  const displayedTickets = useMemo(
    () => (showAllTickets ? tickets : tickets.slice(0, 3)),
    [tickets, showAllTickets]
  );

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

  const handleSupportCall = () => {
    if (!hasValidPhone) return;
    window.location.href = `tel:${supportPhone}`;
  };

  const handleSupportEmail = () => {
    if (!supportEmail) return;
    window.location.href = `mailto:${supportEmail}`;
  };

  const handleSupportWhatsApp = () => {
    if (!hasValidPhone) return;
    window.location.href = `https://wa.me/${supportPhoneDigits}`;
  };

  const handleCommunityForum = () => {
    window.location.href = '/customer/support/dashboard#support-search';
  };

  const handleSafetyCenter = () => {
    window.location.href = '/customer/profile#security-settings';
  };

  const contactActions = [
    { label: 'Live Chat', icon: MessageCircle, onClick: onOpenChat, disabled: false },
    { label: 'Call Us', icon: Phone, onClick: handleSupportCall, disabled: !hasValidPhone },
    { label: 'Email', icon: Mail, onClick: handleSupportEmail, disabled: !supportEmail },
    { label: 'WhatsApp', icon: MessageSquare, onClick: handleSupportWhatsApp, disabled: !hasValidPhone }
  ];

  const showFaqResults = query.trim().length > 0 || selectedCategory !== 'All';

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <Navigation active="support" onNavigate={handleNavigate} variant="light" />

      <div className="max-w-md mx-auto">
        <header className="flex items-center justify-between px-4 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 mx-auto" />
          </button>
          <h1 className="text-base font-semibold text-slate-900">Support Center</h1>
          <button
            className="relative h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 mx-auto" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
          </button>
        </header>

        <div className="px-4 pb-6 space-y-6">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <section id="support-search" className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search FAQs or tickets"
              className="w-full bg-transparent text-sm text-slate-700 focus:outline-none"
            />
          </section>

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-blue-500 p-5 text-white shadow-lg">
            <div className="absolute -right-10 -bottom-12 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute right-5 top-5 h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/70">Have a specific issue?</p>
            <h2 className="text-lg font-semibold mt-2">We are here to help you.</h2>
            <p className="text-sm text-white/80 mt-2">
              Raise a ticket to get fast assistance from our support team.
            </p>
            <button
              onClick={() => navigate('/customer/support/ticket')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
            >
              <Ticket className="w-4 h-4" />
              Raise a Ticket
            </button>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Browse by Category</h3>
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {categoryCards.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.label;
                return (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.label)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected ? 'border-blue-500 bg-blue-50/40' : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-2xl ${category.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${category.color}`} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900">{category.label}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {showFaqResults && (
            <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Helpful Answers</h3>
                <button
                  onClick={() => {
                    setQuery('');
                    setSelectedCategory('All');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Reset
                </button>
              </div>
              {loading ? (
                <div className="text-sm text-slate-500 flex items-center gap-2 mt-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading answers...
                </div>
              ) : visibleFaqs.length === 0 ? (
                <div className="text-sm text-slate-500 mt-3">No answers found for this search.</div>
              ) : (
                <div className="mt-3 space-y-3">
                  {visibleFaqs.slice(0, 3).map((faq) => (
                    <div key={faq.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <p className="text-sm font-semibold text-slate-900">{faq.question}</p>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{faq.answer}</p>
                      <p className="text-[11px] text-slate-400 mt-2">{faq.category}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold text-slate-900">Need more help?</h3>
            <div className="grid grid-cols-4 gap-3 mt-3 text-center">
              {contactActions.map((action) => {
                const Icon = action.icon;
                const isDisabled = action.disabled;
                return (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    disabled={isDisabled}
                    className={`flex flex-col items-center gap-2 text-[11px] font-medium ${
                      isDisabled ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    <div
                      className={`h-12 w-12 rounded-full border bg-white flex items-center justify-center ${
                        isDisabled ? 'border-slate-100' : 'border-slate-200'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isDisabled ? 'text-slate-300' : 'text-blue-600'}`} />
                    </div>
                    {action.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section id="support-tickets" className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Recent Tickets</h3>
              {tickets.length > 3 && !showAllTickets && (
                <button
                  onClick={() => setShowAllTickets(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  View All
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-sm text-slate-500 flex items-center gap-2 mt-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading tickets...
              </div>
            ) : displayedTickets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 mt-3">
                No support tickets yet. Create your first ticket for quick help.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {displayedTickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold text-slate-400">{ticketRef(ticket.id)}</p>
                        <p className="text-sm font-semibold text-slate-900 mt-1">{ticket.subject}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${statusClass(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${priorityClass(ticket.priority)}`}>
                        {ticket.priority} PRIORITY
                      </span>
                      <span className="text-[11px] text-slate-500">{formatWhen(ticket.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{ticket.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => toggleTimeline(ticket.id)}
                        disabled={timelineLoadingId === ticket.id}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-60 inline-flex items-center gap-1"
                      >
                        {timelineLoadingId === ticket.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <MessageCircle className="w-3.5 h-3.5" />
                        )}
                        {timelineByTicket[ticket.id] ? 'Hide Updates' : 'View Updates'}
                      </button>
                      {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                        <button
                          onClick={() => closeTicket(ticket.id)}
                          disabled={updatingTicketId === ticket.id}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-60 inline-flex items-center gap-1"
                        >
                          {updatingTicketId === ticket.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Mark as Closed
                        </button>
                      )}
                    </div>

                    {timelineByTicket[ticket.id] && (
                      <div className="mt-3 rounded-lg border border-slate-100 bg-white p-3 space-y-2">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">Ticket Timeline</p>
                        {timelineByTicket[ticket.id].length === 0 ? (
                          <p className="text-xs text-slate-500">No updates yet. Ticket is waiting in queue.</p>
                        ) : (
                          timelineByTicket[ticket.id].map((event) => (
                            <div key={event.id} className="border border-slate-100 rounded-md p-2 bg-slate-50/70">
                              <p className="text-xs font-semibold text-slate-900">{event.title}</p>
                              <p className="text-xs text-slate-600 mt-1">{event.message}</p>
                              <p className="text-[11px] text-slate-400 mt-1">
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

          <section className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-900">More Resources</h3>
            <div className="mt-3 space-y-2">
              <button
                onClick={handleCommunityForum}
                className="w-full flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Community Forum
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={handleSafetyCenter}
                className="w-full flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Safety Center
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
