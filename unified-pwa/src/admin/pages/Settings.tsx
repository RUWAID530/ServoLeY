import { useEffect, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';

interface SettingsPayload {
  account: {
    id: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
  };
  preferences: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    orderUpdates: boolean;
    messages: boolean;
    promotions: boolean;
    systemAlerts: boolean;
  };
  platform: {
    name: string;
    supportEmail: string;
    timezone: string;
  };
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

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

const parseJsonSafely = async (response: Response) => {
  const raw = await response.text();
  if (!raw || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [data, setData] = useState<SettingsPayload | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferences, setPreferences] = useState<SettingsPayload['preferences']>({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: true,
    orderUpdates: true,
    messages: true,
    promotions: false,
    systemAlerts: true
  });

  const hydrate = (payload: SettingsPayload) => {
    setData(payload);
    setFirstName(payload.account.firstName || '');
    setLastName(payload.account.lastName || '');
    setPhone(payload.account.phone || '');
    setPreferences(payload.preferences);
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const token = localStorage.getItem('adminToken');

      if (!token) {
        setError('Admin session not found. Please login again.');
        return;
      }

      const response = await fetchWithFallback('/api/admin/settings', token);
      const payload = await parseJsonSafely(response);

      if (!response.ok) {
        throw new Error(payload?.message || `Failed to load settings (${response.status})`);
      }

      if (!payload?.success) {
        throw new Error(payload?.message || 'Failed to load settings');
      }

      hydrate(payload.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load settings');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const onTogglePreference = (key: keyof SettingsPayload['preferences']) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const token = localStorage.getItem('adminToken');

      if (!token) {
        setError('Admin session not found. Please login again.');
        return;
      }

      const response = await fetchWithFallback('/api/admin/settings', token, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          preferences
        })
      });

      const payload = await parseJsonSafely(response);

      if (!response.ok) {
        throw new Error(payload?.message || `Failed to save settings (${response.status})`);
      }

      if (!payload?.success) {
        throw new Error(payload?.message || 'Failed to save settings');
      }

      if (payload?.data) {
        hydrate(payload.data);
      }
      setSuccess(payload?.message || 'Settings updated successfully');
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">Manage your admin account and notification preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadSettings}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={saveSettings}
            disabled={loading || saving}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-600/40 bg-red-600/10 text-red-300 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-emerald-600/40 bg-emerald-600/10 text-emerald-300 text-sm">
          {success}
        </div>
      )}

      {loading ? (
        <div className="bg-slate-800/50 rounded-xl p-10 border border-slate-700 text-center text-slate-400">
          Loading settings...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">Admin Account</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">First Name</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Last Name</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Email</label>
                  <input
                    value={data?.account.email || ''}
                    disabled
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="+91..."
                  />
                </div>
              </div>
            </section>

            <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">Notifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(
                  [
                    ['pushEnabled', 'Push Notifications'],
                    ['emailEnabled', 'Email Notifications'],
                    ['smsEnabled', 'SMS Notifications'],
                    ['orderUpdates', 'Order Updates'],
                    ['messages', 'Messages'],
                    ['promotions', 'Promotions'],
                    ['systemAlerts', 'System Alerts']
                  ] as Array<[keyof SettingsPayload['preferences'], string]>
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/40 border border-slate-600/50">
                    <span className="text-slate-200 text-sm">{label}</span>
                    <input
                      type="checkbox"
                      checked={preferences[key]}
                      onChange={() => onTogglePreference(key)}
                      className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>
                ))}
              </div>
            </section>
          </div>

          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 h-fit">
            <h2 className="text-lg font-semibold text-white mb-4">Platform</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400">Name</p>
                <p className="text-white">{data?.platform.name || 'Servoley'}</p>
              </div>
              <div>
                <p className="text-slate-400">Support Email</p>
                <p className="text-white">{data?.platform.supportEmail || '-'}</p>
              </div>
              <div>
                <p className="text-slate-400">Timezone</p>
                <p className="text-white">{data?.platform.timezone || '-'}</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
