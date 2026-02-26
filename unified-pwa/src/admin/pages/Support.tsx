import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Loader2, MessageSquare, RefreshCw, Search, Send } from 'lucide-react';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface AdminSupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  users?: {
    profiles?: {
      firstName?: string;
      lastName?: string;
      email?: string;
    } | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

interface ChatPartner {
  id?: string;
  email?: string | null;
  phone?: string | null;
  userType?: string | null;
  profiles?: {
    firstName?: string;
    lastName?: string;
  } | null;
  profile?: {
    firstName?: string;
    lastName?: string;
  } | null;
}

interface SupportConversation {
  partnerId: string;
  partner?: ChatPartner | null;
  lastMessage?: {
    content?: string;
    createdAt?: string;
  } | null;
  unreadCount?: number;
}

interface SupportMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

const parseJsonSafely = async (response: Response) => {
  const text = await response.text();
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const fetchWithFallback = async (path: string, token: string, options: RequestInit = {}) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const endpoints = [`${API_BASE}${normalizedPath}`, normalizedPath];
  let lastError: any = null;

  for (let i = 0; i < endpoints.length; i += 1) {
    const endpoint = endpoints[i];
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options.headers || {})
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

const ticketRef = (id: string) => `#SL-${String(id || '').replace(/-/g, '').slice(0, 8).toUpperCase()}`;

const statusBadge = (status: TicketStatus) => {
  switch (status) {
    case 'OPEN':
      return 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40';
    case 'IN_PROGRESS':
      return 'bg-amber-500/20 text-amber-200 border border-amber-500/40';
    case 'RESOLVED':
      return 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40';
    case 'CLOSED':
      return 'bg-slate-500/20 text-slate-200 border border-slate-500/40';
    default:
      return 'bg-slate-500/20 text-slate-200 border border-slate-500/40';
  }
};

const priorityBadge = (priority: TicketPriority) => {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-500/20 text-red-200 border border-red-500/40';
    case 'HIGH':
      return 'bg-orange-500/20 text-orange-200 border border-orange-500/40';
    case 'MEDIUM':
      return 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/40';
    case 'LOW':
      return 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40';
    default:
      return 'bg-slate-500/20 text-slate-200 border border-slate-500/40';
  }
};

const customerName = (ticket: AdminSupportTicket) => {
  const first = ticket.users?.profiles?.firstName || '';
  const last = ticket.users?.profiles?.lastName || '';
  const full = `${first} ${last}`.trim();
  if (full) return full;
  return ticket.users?.email || ticket.userId;
};

const partnerName = (partner: ChatPartner | null | undefined, fallback = '') => {
  const first = String(partner?.profiles?.firstName || partner?.profile?.firstName || '').trim();
  const last = String(partner?.profiles?.lastName || partner?.profile?.lastName || '').trim();
  const full = `${first} ${last}`.trim();
  if (full) return full;
  return String(partner?.email || partner?.phone || fallback || 'Unknown user');
};

const isProviderConversation = (conversation: SupportConversation) =>
  String(conversation?.partner?.userType || '').toUpperCase() === 'PROVIDER';

export default function Support() {
  const [activeView, setActiveView] = useState<'tickets' | 'live-chat'>('tickets');
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TicketPriority>('ALL');
  const [updatingId, setUpdatingId] = useState('');
  const [noteByTicket, setNoteByTicket] = useState<Record<string, string>>({});

  const [chatSearch, setChatSearch] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [chatConversations, setChatConversations] = useState<SupportConversation[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadTickets = async () => {
    try {
      setError('');
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        setError('Admin session not found. Please login again.');
        return;
      }

      const response = await fetchWithFallback('/api/support/admin/tickets?limit=200', token);
      const payload = await parseJsonSafely(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || `Failed to load support queue (${response.status})`);
      }

      const list = Array.isArray(payload?.data?.tickets) ? payload.data.tickets : [];
      setTickets(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load support queue');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadChatConversations = async (silent = false) => {
    try {
      if (!silent) setChatLoading(true);
      setChatError('');
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setChatError('Admin session not found. Please login again.');
        return;
      }

      const response = await fetchWithFallback('/api/communication/messages/conversations?limit=200', token);
      const payload = await parseJsonSafely(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || `Failed to load live chat conversations (${response.status})`);
      }

      const raw = Array.isArray(payload?.data?.conversations) ? payload.data.conversations : [];
      const conversations = raw.filter(isProviderConversation);
      setChatConversations(conversations);

      if (conversations.length === 0) {
        setSelectedPartnerId('');
        return;
      }

      const selectedExists = conversations.some((item: SupportConversation) => item.partnerId === selectedPartnerId);
      if (!selectedPartnerId || !selectedExists) {
        setSelectedPartnerId(conversations[0].partnerId);
      }
    } catch (err: any) {
      setChatError(err?.message || 'Failed to load live chat conversations');
      if (!silent) setChatConversations([]);
    } finally {
      if (!silent) setChatLoading(false);
    }
  };

  const loadChatMessages = async (partnerId: string, silent = false) => {
    if (!partnerId) return;

    try {
      if (!silent) setChatLoading(true);
      setChatError('');
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setChatError('Admin session not found. Please login again.');
        return;
      }

      const response = await fetchWithFallback(
        `/api/communication/messages/conversation/${encodeURIComponent(partnerId)}?limit=200`,
        token
      );
      const payload = await parseJsonSafely(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || `Failed to load conversation (${response.status})`);
      }

      const list = Array.isArray(payload?.data?.messages) ? payload.data.messages : [];
      setChatMessages(list);
    } catch (err: any) {
      setChatError(err?.message || 'Failed to load conversation');
      if (!silent) setChatMessages([]);
    } finally {
      if (!silent) setChatLoading(false);
    }
  };

  const sendChatMessage = async () => {
    const token = localStorage.getItem('adminToken');
    const content = chatDraft.trim();

    if (!token) {
      setChatError('Admin session not found. Please login again.');
      return;
    }

    if (!selectedPartnerId || !content) return;

    try {
      setChatSending(true);
      const response = await fetchWithFallback('/api/communication/messages', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedPartnerId,
          content
        })
      });
      const payload = await parseJsonSafely(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || `Failed to send message (${response.status})`);
      }

      const created = payload?.data?.message;
      setChatDraft('');
      setChatError('');

      if (created?.id) {
        setChatMessages((prev) => [...prev, created]);
      } else {
        await loadChatMessages(selectedPartnerId, true);
      }
      await loadChatConversations(true);
    } catch (err: any) {
      setChatError(err?.message || 'Failed to send message');
    } finally {
      setChatSending(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (activeView !== 'live-chat') return;
    loadChatConversations();
  }, [activeView]);

  useEffect(() => {
    if (activeView !== 'live-chat' || !selectedPartnerId) return;
    loadChatMessages(selectedPartnerId);
  }, [activeView, selectedPartnerId]);

  useEffect(() => {
    if (activeView !== 'live-chat') return;

    const interval = window.setInterval(() => {
      loadChatConversations(true);
      if (selectedPartnerId) {
        loadChatMessages(selectedPartnerId, true);
      }
    }, 15000);

    return () => window.clearInterval(interval);
  }, [activeView, selectedPartnerId]);

  useEffect(() => {
    if (activeView !== 'live-chat') return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeView]);

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (statusFilter !== 'ALL' && ticket.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && ticket.priority !== priorityFilter) return false;
      if (!q) return true;

      return (
        ticket.id.toLowerCase().includes(q) ||
        ticket.subject.toLowerCase().includes(q) ||
        ticket.description.toLowerCase().includes(q) ||
        customerName(ticket).toLowerCase().includes(q) ||
        String(ticket.users?.email || '').toLowerCase().includes(q)
      );
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  const filteredConversations = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    if (!q) return chatConversations;

    return chatConversations.filter((conversation) => {
      const name = partnerName(conversation.partner, conversation.partnerId).toLowerCase();
      const email = String(conversation.partner?.email || '').toLowerCase();
      const last = String(conversation.lastMessage?.content || '').toLowerCase();
      return name.includes(q) || email.includes(q) || last.includes(q) || conversation.partnerId.toLowerCase().includes(q);
    });
  }, [chatConversations, chatSearch]);

  const stats = useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status === 'OPEN').length;
    const progress = tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length;
    const resolved = tickets.filter((ticket) => ticket.status === 'RESOLVED').length;
    const closed = tickets.filter((ticket) => ticket.status === 'CLOSED').length;
    return { open, progress, resolved, closed, total: tickets.length };
  }, [tickets]);

  const selectedConversation = useMemo(
    () => chatConversations.find((item) => item.partnerId === selectedPartnerId) || null,
    [chatConversations, selectedPartnerId]
  );

  const updateTicket = async (
    ticketId: string,
    patch: Partial<Pick<AdminSupportTicket, 'status' | 'priority'>>,
    note = ''
  ) => {
    try {
      setUpdatingId(ticketId);
      setError('');
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Admin session not found. Please login again.');
        return;
      }

      const response = await fetchWithFallback(`/api/support/admin/tickets/${ticketId}`, token, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...patch,
          ...(note.trim() ? { note: note.trim() } : {})
        })
      });
      const payload = await parseJsonSafely(response);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to update ticket');
      }

      const updated = payload?.data?.ticket;
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                status: updated?.status || ticket.status,
                priority: updated?.priority || ticket.priority,
                updatedAt: updated?.updatedAt || new Date().toISOString()
              }
            : ticket
        )
      );
      setNoteByTicket((prev) => ({ ...prev, [ticketId]: '' }));
    } catch (err: any) {
      setError(err?.message || 'Failed to update ticket');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {activeView === 'tickets' ? 'Support Queue' : 'Provider Live Chat'}
          </h1>
          <p className="text-slate-400">
            {activeView === 'tickets'
              ? 'All submitted customer tickets land here for processing.'
              : 'Direct support chat between providers and admins.'}
          </p>
        </div>
        <button
          onClick={() => (activeView === 'tickets' ? loadTickets() : loadChatConversations())}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveView('tickets')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeView === 'tickets'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          Tickets
        </button>
        <button
          onClick={() => setActiveView('live-chat')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeView === 'live-chat'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Live Chat
        </button>
      </div>

      {error && activeView === 'tickets' && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-600/40 bg-red-600/10 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {chatError && activeView === 'live-chat' && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-600/40 bg-red-600/10 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{chatError}</span>
        </div>
      )}

      {activeView === 'tickets' ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-slate-400">Open</p>
              <p className="text-xl font-bold text-cyan-300 mt-1">{stats.open}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-slate-400">In Progress</p>
              <p className="text-xl font-bold text-amber-300 mt-1">{stats.progress}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-slate-400">Resolved</p>
              <p className="text-xl font-bold text-emerald-300 mt-1">{stats.resolved}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-xs text-slate-400">Closed</p>
              <p className="text-xl font-bold text-slate-300 mt-1">{stats.closed}</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ticket ID, subject, customer..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | TicketStatus)}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'ALL' | TicketPriority)}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">All Priority</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-8 text-slate-400 text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading support queue...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/20 px-4 py-8 text-slate-400 text-sm">
                No tickets found for current filters.
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {ticketRef(ticket.id)} - {ticket.subject}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Customer: {customerName(ticket)}
                        {ticket.users?.email ? ` - ${ticket.users.email}` : ''}
                      </p>
                      <p className="text-xs text-slate-300 mt-2 whitespace-pre-wrap">{ticket.description}</p>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Created: {new Date(ticket.createdAt).toLocaleString()} | Updated:{' '}
                        {new Date(ticket.updatedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-[180px]">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full text-center ${statusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-1 rounded-full text-center ${priorityBadge(ticket.priority)}`}
                      >
                        {ticket.priority}
                      </span>
                      <select
                        value={ticket.status}
                        onChange={(e) => updateTicket(ticket.id, { status: e.target.value as TicketStatus })}
                        disabled={updatingId === ticket.id}
                        className="text-xs px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                      <select
                        value={ticket.priority}
                        onChange={(e) => updateTicket(ticket.id, { priority: e.target.value as TicketPriority })}
                        disabled={updatingId === ticket.id}
                        className="text-xs px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none"
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                      <textarea
                        value={noteByTicket[ticket.id] || ''}
                        onChange={(e) => setNoteByTicket((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                        placeholder="Add support update note for customer"
                        rows={2}
                        className="text-xs px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none"
                      />
                      <button
                        onClick={() => updateTicket(ticket.id, {}, noteByTicket[ticket.id] || '')}
                        disabled={updatingId === ticket.id || !(noteByTicket[ticket.id] || '').trim()}
                        className="text-xs px-2 py-1.5 rounded bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send Update
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Search providers..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {chatLoading && filteredConversations.length === 0 ? (
                <div className="px-3 py-6 text-sm text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading provider chats...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="px-3 py-6 text-sm text-slate-400">No provider chats yet.</div>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.partnerId}
                    onClick={() => setSelectedPartnerId(conversation.partnerId)}
                    className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                      selectedPartnerId === conversation.partnerId
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/40 hover:bg-slate-700/40'
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">
                      {partnerName(conversation.partner, conversation.partnerId)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {conversation.lastMessage?.createdAt
                        ? new Date(conversation.lastMessage.createdAt).toLocaleString()
                        : 'Waiting for first message'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-800/40 p-4">
            {!selectedPartnerId ? (
              <div className="h-full min-h-[520px] flex items-center justify-center text-slate-400 text-sm">
                Select a provider conversation to begin.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {partnerName(selectedConversation?.partner, selectedPartnerId)}
                    </p>
                    <p className="text-xs text-slate-400">{selectedConversation?.partner?.email || selectedPartnerId}</p>
                  </div>
                  <button
                    onClick={() => loadChatMessages(selectedPartnerId)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    Refresh Messages
                  </button>
                </div>

                <div className="h-[420px] overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/40 p-3 space-y-3">
                  {chatLoading && chatMessages.length === 0 ? (
                    <p className="text-sm text-slate-400">Loading conversation...</p>
                  ) : chatMessages.length === 0 ? (
                    <p className="text-sm text-slate-400">No messages in this conversation.</p>
                  ) : (
                    chatMessages.map((message) => {
                      const isMine = message.senderId !== selectedPartnerId;
                      return (
                        <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] rounded-lg px-3 py-2 ${
                              isMine ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-100'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            <p className={`text-[11px] mt-1 ${isMine ? 'text-cyan-100' : 'text-slate-300'}`}>
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="mt-3 flex gap-2">
                  <textarea
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!chatSending) sendChatMessage();
                      }
                    }}
                    rows={2}
                    placeholder="Type your response to provider..."
                    className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!chatDraft.trim() || chatSending}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 flex items-center gap-2"
                  >
                    {chatSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
