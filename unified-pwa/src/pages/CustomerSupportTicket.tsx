import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Send } from 'lucide-react';

interface TicketFormState {
  subject: string;
  category: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken') || '';

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
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const urls = [...new Set([API_BASE, 'http://localhost:8086', 'http://localhost:8084', 'http://localhost:8083'])]
    .map((base) => `${String(base).replace(/\/$/, '')}${normalized}`);

  let lastError: any = null;
  for (const url of urls) {
    try {
      return await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options.headers || {})
        }
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Network error. Backend not running or wrong port.');
};

const CustomerSupportTicket: React.FC = () => {
  const navigate = useNavigate();
  const [createdTicketId, setCreatedTicketId] = useState('');
  const [formState, setFormState] = useState<TicketFormState>({
    subject: '',
    category: 'GENERAL',
    description: '',
    priority: 'MEDIUM'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { value: 'GENERAL', label: 'General Inquiry' },
    { value: 'PAYMENT', label: 'Payment or Wallet Issue' },
    { value: 'SERVICE', label: 'Service Provider Issue' },
    { value: 'BOOKING', label: 'Booking Issue' },
    { value: 'ACCOUNT', label: 'Account or App Issue' }
  ];

  const priorities: Array<{ value: TicketFormState['priority']; label: string }> = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' }
  ];

  const updateField = (field: keyof TicketFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value as any }));
  };

  const buildSubject = () => {
    const category = formState.category.trim();
    const subject = formState.subject.trim();
    return category ? `[${category}] ${subject}` : subject;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Please login again to create a support ticket.');
      }

      if (!formState.subject.trim() || !formState.description.trim()) {
        throw new Error('Subject and description are required.');
      }

      const response = await fetchWithFallback('/api/support/tickets', token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: buildSubject(),
          description: formState.description.trim(),
          priority: formState.priority
        })
      });

      const payload = await parseJsonSafely(response);

      if (!response.ok || !payload?.success) {
        const firstError = Array.isArray(payload?.errors) ? payload.errors[0]?.msg : '';
        throw new Error(firstError || payload?.message || 'Failed to submit support ticket.');
      }

      const ticketId = String(payload?.data?.ticket?.id || '');
      setCreatedTicketId(ticketId);
      setSubmitSuccess(true);
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Ticket Submitted</h2>
          <p className="text-slate-300 text-sm">Your ticket is added to Admin Support Queue for processing.</p>
          {createdTicketId && (
            <p className="text-cyan-300 text-sm mt-3 font-semibold">
              Reference ID: #{createdTicketId.replace(/-/g, '').slice(0, 8).toUpperCase()}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-2">Lifecycle: OPEN - IN_PROGRESS - RESOLVED - CLOSED</p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              onClick={() => navigate('/customer/support/dashboard')}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-700"
            >
              Track Ticket
            </button>
            <button
              onClick={() => navigate('/customer/support/ticket')}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Raise Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/customer/support/dashboard')}
              className="mr-3 p-2 rounded-full hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <h1 className="text-2xl font-bold text-white">Raise a Support Ticket</h1>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-600/10 border border-red-600/40 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-300" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                id="category"
                value={formState.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-1">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                value={formState.subject}
                onChange={(e) => updateField('subject', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Briefly describe your issue"
                required
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-slate-300 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={formState.priority}
                onChange={(e) => updateField('priority', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formState.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Write full details so support can resolve quickly"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/customer/support/dashboard')}
                className="px-4 py-2 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupportTicket;
