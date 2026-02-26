import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  targetId: string;
  details: any;
  createdAt: string;
  admin: {
    id: string;
    email: string;
    phone?: string;
  };
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

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');

      if (!token) {
        setError('Admin session not found. Please login again.');
        return;
      }

      const response = await fetchWithFallback('/api/admin/audit-logs?limit=100', token);
      const payload = await parseJsonSafely(response);

      if (!response.ok) {
        throw new Error(payload?.message || `Failed to load audit logs (${response.status})`);
      }

      if (!payload?.success) {
        throw new Error(payload?.message || 'Failed to load audit logs');
      }

      setLogs(Array.isArray(payload?.data?.logs) ? payload.data.logs : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;

    return logs.filter((log) => {
      const detailsText = log.details ? JSON.stringify(log.details).toLowerCase() : '';
      return (
        log.action.toLowerCase().includes(query) ||
        (log.targetId || '').toLowerCase().includes(query) ||
        (log.admin?.email || '').toLowerCase().includes(query) ||
        detailsText.includes(query)
      );
    });
  }, [logs, search]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400">Track admin actions and system operations</p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search action, target, admin email..."
          className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
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
                <th className="px-4 py-3 text-left text-xs uppercase text-slate-300">Time</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-slate-300">Admin</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-slate-300">Action</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-slate-300">Target</th>
                <th className="px-4 py-3 text-left text-xs uppercase text-slate-300">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">Loading audit logs...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">No audit logs found</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-sm text-slate-300">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-white">{log.admin?.email || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm text-cyan-300">{log.action}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{log.targetId || '-'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-xl truncate">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
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
