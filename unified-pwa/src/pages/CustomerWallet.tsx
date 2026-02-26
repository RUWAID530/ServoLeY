import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import CustomerHeader from '../components/CustomerHeader';
import { useUserImage } from '../hooks/useUserImage';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

interface SavedPaymentMethod {
  id: string;
  type: 'UPI' | 'CARD' | 'NET_BANKING';
  provider: string;
  upiId: string;
  cardName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  last4: string;
  isDefault: boolean;
}

interface AddMethodForm {
  type: 'UPI' | 'CARD' | 'NET_BANKING';
  upiProvider: string;
  upiId: string;
  cardName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cardCvv: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifsc: string;
  isDefault: boolean;
}

const INITIAL_FORM: AddMethodForm = {
  type: 'UPI',
  upiProvider: 'GPay',
  upiId: '',
  cardName: '',
  cardNumber: '',
  expiryMonth: '',
  expiryYear: '',
  cardCvv: '',
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  confirmAccountNumber: '',
  ifsc: '',
  isDefault: false
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

const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken') || '';

const buildApiBases = () => {
  const configuredBase = (import.meta.env.VITE_API_URL || API_BASE || '').replace(/\/$/, '');
  const defaults = ['http://localhost:8086', 'http://localhost:8084', 'http://localhost:8083'];
  const all = [configuredBase, ...defaults].filter(Boolean);
  return Array.from(new Set(all));
};

const fetchWithFallback = async (path: string, token: string, options: RequestInit = {}) => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const absoluteEndpoints = buildApiBases().map((base) => `${base}${normalized}`);
  const endpoints = [...absoluteEndpoints, normalized];
  let lastError: any = null;

  const method = (options.method || 'GET').toUpperCase();
  const isMutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  if (isMutating && !headers.has('Idempotency-Key')) {
    const generatedKey =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    headers.set('Idempotency-Key', generatedKey);
  }

  for (let i = 0; i < endpoints.length; i += 1) {
    const endpoint = endpoints[i];
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers
      });

      if (response.status === 404 && i < endpoints.length - 1) {
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Network error. Backend not running or wrong port.');
};

const maskCardPreview = (last4: string) => `**** **** **** ${last4 || '0000'}`;
const onlyDigits = (value: string) => value.replace(/\D/g, '');

const detectCardProvider = (cardNumber: string) => {
  const digits = onlyDigits(cardNumber);
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^(34|37)/.test(digits)) return 'Amex';
  if (/^60/.test(digits)) return 'RuPay';
  return 'Card';
};

const getApiErrorMessage = (payload: any, fallback: string) => {
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    const first = payload.errors[0];
    if (typeof first === 'string' && first.trim()) return first;
    if (first?.msg) return String(first.msg);
    if (first?.message) return String(first.message);
  }
  return payload?.message || fallback;
};

const methodTitle = (method: SavedPaymentMethod) => {
  if (method.type === 'UPI') return method.provider || 'UPI';
  if (method.type === 'CARD') return method.provider || 'Card';
  return method.provider || 'Net Banking';
};

const methodSubtitle = (method: SavedPaymentMethod) => {
  if (method.type === 'UPI') return method.upiId || 'UPI account';
  if (method.type === 'CARD') return `${maskCardPreview(method.last4)}${method.expiryMonth && method.expiryYear ? ` • ${method.expiryMonth}/${method.expiryYear.slice(-2)}` : ''}`;
  return `A/C ••••${method.last4 || '0000'}`;
};

const methodIcon = (type: SavedPaymentMethod['type']) => {
  if (type === 'UPI') return <Smartphone className="w-5 h-5 text-emerald-400" />;
  if (type === 'CARD') return <CreditCard className="w-5 h-5 text-cyan-400" />;
  return <Building2 className="w-5 h-5 text-amber-400" />;
};

const mapMethodFromApi = (method: any): SavedPaymentMethod => ({
  id: String(method?.id || ''),
  type: String(method?.type || 'UPI').toUpperCase() as SavedPaymentMethod['type'],
  provider: method?.provider || '',
  upiId: method?.upiId || '',
  cardName: method?.cardName || '',
  cardNumber: method?.cardNumber || '',
  expiryMonth: method?.expiryMonth || '',
  expiryYear: method?.expiryYear || '',
  last4: method?.last4 || '',
  isDefault: Boolean(method?.isDefault)
});

export const CustomerWallet: React.FC = () => {
  const navigate = useNavigate();
  const userImage = useUserImage();

  const [balance, setBalance] = useState(0);
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMethod, setSavingMethod] = useState(false);
  const [processingTopup, setProcessingTopup] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [amount, setAmount] = useState('1000');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [newMethod, setNewMethod] = useState<AddMethodForm>(INITIAL_FORM);

  const quickAmounts = ['200', '500', '1000', '2000'];

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

  const selectedMethod = useMemo(
    () => methods.find((method) => method.id === selectedMethodId) || null,
    [methods, selectedMethodId]
  );

  const loadWalletData = async (options?: { suppressBalanceError?: boolean }) => {
    try {
      setLoading(true);
      setError('');
      const token = getAuthToken();
      if (!token) {
        setError('Please login again to use wallet.');
        return;
      }

      const [balanceResult, methodsResult] = await Promise.allSettled([
        fetchWithFallback('/api/wallet/balance', token),
        fetchWithFallback('/api/wallet/payment-methods', token)
      ]);

      let methodsLoaded = false;
      let balanceErrorMessage = '';
      let methodsErrorMessage = '';

      if (methodsResult.status === 'fulfilled') {
        const methodsRes = methodsResult.value;
        const methodsPayload = await parseJsonSafely(methodsRes);

        if (methodsRes.ok) {
          const mapped: SavedPaymentMethod[] = Array.isArray(methodsPayload?.data?.paymentMethods)
            ? methodsPayload.data.paymentMethods.map(mapMethodFromApi)
            : [];

          setMethods(mapped);
          const defaultMethod = mapped.find((method) => method.isDefault) || mapped[0];
          setSelectedMethodId(defaultMethod?.id || '');
          methodsLoaded = true;
        } else {
          methodsErrorMessage = methodsPayload?.message || `Failed to load payment methods (${methodsRes.status})`;
        }
      } else {
        methodsErrorMessage = methodsResult.reason?.message || 'Failed to load payment methods';
      }

      if (balanceResult.status === 'fulfilled') {
        const balanceRes = balanceResult.value;
        const balancePayload = await parseJsonSafely(balanceRes);

        if (balanceRes.ok) {
          setBalance(Number(balancePayload?.data?.balance || 0));
        } else {
          balanceErrorMessage = balancePayload?.message || `Failed to get wallet balance (${balanceRes.status})`;
        }
      } else {
        balanceErrorMessage = balanceResult.reason?.message || 'Failed to get wallet balance';
      }

      if (!methodsLoaded && methodsErrorMessage) {
        setError(methodsErrorMessage);
      } else if (!options?.suppressBalanceError && balanceErrorMessage) {
        setError(balanceErrorMessage);
      }
    } catch (loadError: any) {
      setError(loadError?.message || 'Failed to load wallet details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const validateMethodForm = () => {
    if (newMethod.type === 'UPI') {
      if (!newMethod.upiId.trim() || !newMethod.upiId.includes('@')) {
        return 'Enter a valid UPI ID (example: yourname@okicici).';
      }
      return '';
    }

    if (newMethod.type === 'CARD') {
      const cardDigits = onlyDigits(newMethod.cardNumber);
      if (cardDigits.length < 12 || cardDigits.length > 19) {
        return 'Enter a valid card number.';
      }
      if (!newMethod.cardName.trim()) {
        return 'Enter card holder name.';
      }
      const mm = Number(newMethod.expiryMonth);
      if (!newMethod.expiryMonth || !Number.isInteger(mm) || mm < 1 || mm > 12) {
        return 'Enter valid expiry month.';
      }
      if (!newMethod.expiryYear.trim() || !/^\d{2,4}$/.test(newMethod.expiryYear.trim())) {
        return 'Enter valid expiry year.';
      }
      if (!/^\d{3,4}$/.test(newMethod.cardCvv.trim())) {
        return 'Enter valid CVV.';
      }
      return '';
    }

    if (!newMethod.bankName.trim()) {
      return 'Enter bank name.';
    }
    if (!newMethod.accountHolderName.trim()) {
      return 'Enter account holder name.';
    }
    const accountDigits = onlyDigits(newMethod.accountNumber);
    if (accountDigits.length < 6 || accountDigits.length > 18) {
      return 'Enter valid account number.';
    }
    const confirmDigits = onlyDigits(newMethod.confirmAccountNumber);
    if (confirmDigits !== accountDigits) {
      return 'Account number and confirm account number must match.';
    }
    return '';
  };

  const handleSavePaymentMethod = async () => {
    try {
      setSavingMethod(true);
      setError('');
      setInfo('');

      const validationMessage = validateMethodForm();
      if (validationMessage) {
        setError(validationMessage);
        return;
      }

      const token = getAuthToken();
      if (!token) {
        setError('Please login again to save payment method.');
        return;
      }

      let payload: any = {
        type: newMethod.type,
        isDefault: newMethod.isDefault
      };

      if (newMethod.type === 'UPI') {
        payload = {
          ...payload,
          provider: newMethod.upiProvider,
          upiId: newMethod.upiId.trim().toLowerCase()
        };
      } else if (newMethod.type === 'CARD') {
        payload = {
          ...payload,
          provider: detectCardProvider(newMethod.cardNumber),
          cardName: newMethod.cardName.trim(),
          cardNumber: onlyDigits(newMethod.cardNumber),
          expiryMonth: newMethod.expiryMonth.trim(),
          expiryYear: newMethod.expiryYear.trim()
        };
      } else {
        payload = {
          ...payload,
          bankName: newMethod.bankName.trim(),
          accountHolderName: newMethod.accountHolderName.trim(),
          accountNumber: onlyDigits(newMethod.accountNumber),
          ifsc: newMethod.ifsc.trim().toUpperCase()
        };
      }

      const response = await fetchWithFallback('/api/wallet/payment-methods', token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await parseJsonSafely(response);
      if (!response.ok || !data?.success) {
        throw new Error(getApiErrorMessage(data, `Failed to add payment method (${response.status})`));
      }

      const createdMethod = data?.data ? mapMethodFromApi(data.data) : null;
      if (createdMethod?.id) {
        setMethods((prev) => {
          const filtered = prev.filter((method) => method.id !== createdMethod.id);
          const next = [createdMethod, ...filtered];
          return next.map((method) =>
            createdMethod.isDefault ? { ...method, isDefault: method.id === createdMethod.id } : method
          );
        });
        setSelectedMethodId(createdMethod.id);
      }

      setInfo('Payment method added successfully.');
      setNewMethod(INITIAL_FORM);
      setShowAddPaymentModal(false);
      await loadWalletData({ suppressBalanceError: true });
    } catch (saveError: any) {
      setError(saveError?.message || 'Failed to add payment method');
    } finally {
      setSavingMethod(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      setError('');
      const token = getAuthToken();
      if (!token) {
        setError('Please login again to update default method.');
        return;
      }

      const response = await fetchWithFallback(`/api/wallet/payment-methods/${methodId}/set-default`, token, {
        method: 'PUT'
      });
      const data = await parseJsonSafely(response);

      if (!response.ok || !data?.success) {
        throw new Error(getApiErrorMessage(data, 'Failed to update default method'));
      }

      setInfo('Default payment method updated.');
      await loadWalletData();
    } catch (setDefaultError: any) {
      setError(setDefaultError?.message || 'Failed to update default method');
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    try {
      setError('');
      const token = getAuthToken();
      if (!token) {
        setError('Please login again to remove payment method.');
        return;
      }

      const response = await fetchWithFallback(`/api/wallet/payment-methods/${methodId}`, token, {
        method: 'DELETE'
      });
      const data = await parseJsonSafely(response);

      if (!response.ok || !data?.success) {
        throw new Error(getApiErrorMessage(data, 'Failed to remove payment method'));
      }

      setInfo('Payment method removed.');
      await loadWalletData();
    } catch (deleteError: any) {
      setError(deleteError?.message || 'Failed to remove payment method');
    }
  };

  const handleAddMoney = async () => {
    try {
      setError('');
      setInfo('');

      const token = getAuthToken();
      if (!token) {
        setError('Please login again to add money.');
        return;
      }

      const amountValue = Number(amount);
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        setError('Enter a valid amount.');
        return;
      }

      if (!selectedMethod) {
        setError('Select a payment method first.');
        return;
      }

      setProcessingTopup(true);

      const response = await fetchWithFallback('/api/wallet/topup/create-order', token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountValue,
          paymentMethod: selectedMethod.type
        })
      });

      const data = await parseJsonSafely(response);
      if (!response.ok || !data?.success) {
        throw new Error(getApiErrorMessage(data, 'Failed to initiate top-up'));
      }

      const credited = Boolean(data?.data?.credited);
      if (credited) {
        const latestBalance = Number(data?.data?.newBalance);
        if (Number.isFinite(latestBalance)) {
          setBalance(latestBalance);
        } else {
          await loadWalletData({ suppressBalanceError: true });
        }
        setInfo(`Rs ${amountValue.toLocaleString('en-IN')} added to wallet. New balance updated.`);
      } else {
        setInfo(`Top-up initiated for Rs ${amountValue.toLocaleString('en-IN')}. Order ID: ${data?.data?.orderId || 'created'}`);
      }
    } catch (topupError: any) {
      setError(topupError?.message || 'Failed to initiate top-up');
    } finally {
      setProcessingTopup(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <CustomerHeader userImage={userImage} />
      <Navigation active="wallet" onNavigate={handleNavigate} />

      <div className="pb-24 pt-4 px-4 max-w-6xl mx-auto">
        <div className="mb-6">
          <span className="text-pink-400 text-sm font-medium">/ Wallet</span>
          <h1 className="text-2xl font-bold text-white mt-1">Add Money & Payment Methods</h1>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-red-600/40 bg-red-600/10 text-red-300 text-sm">
            {error}
          </div>
        )}

        {info && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-emerald-600/40 bg-emerald-600/10 text-emerald-300 text-sm">
            {info}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-2xl p-6 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Wallet className="w-28 h-28 text-white" />
              </div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <p className="text-white/80 text-sm font-medium">Wallet Balance</p>
                  <h2 className="text-4xl font-bold text-white mt-2">
                    {loading ? 'Loading...' : `Rs ${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </h2>
                  <p className="text-white/60 text-xs mt-1">Secure top-up with saved methods</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-semibold text-white flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Secure Payment
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-lg font-semibold text-white">Add Money</h3>

              <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                {quickAmounts.map((value) => (
                  <button
                    key={value}
                    onClick={() => setAmount(value)}
                    className={`min-w-[90px] py-2.5 rounded-full border text-sm font-medium transition-colors ${
                      amount === value
                        ? 'bg-pink-100 border-pink-200 text-pink-900'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    Rs {value}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-2">Custom Amount</label>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-2">Select Payment Method</label>
                {methods.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                    No saved methods. Add one to continue.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {methods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethodId(method.id)}
                        className={`w-full rounded-xl border p-3 text-left transition-colors ${
                          selectedMethodId === method.id
                            ? 'border-pink-500 bg-pink-500/10'
                            : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                              {methodIcon(method.type)}
                            </div>
                            <div>
                              <p className="text-white text-sm font-semibold">{methodTitle(method)}</p>
                              <p className="text-slate-400 text-xs">{methodSubtitle(method)}</p>
                            </div>
                          </div>
                          {method.isDefault && (
                            <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">Default</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleAddMoney}
                disabled={processingTopup || !selectedMethodId || loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 text-white font-bold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingTopup && <Loader2 className="w-4 h-4 animate-spin" />}
                {processingTopup ? 'Processing...' : `Add Money Rs ${Number(amount || 0).toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-white">Saved Methods</h4>
                <button
                  onClick={() => {
                    setError('');
                    setInfo('');
                    setShowAddPaymentModal(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {loading ? (
                <div className="text-sm text-slate-400">Loading methods...</div>
              ) : methods.length === 0 ? (
                <p className="text-sm text-slate-400">No payment methods added yet.</p>
              ) : (
                <div className="space-y-3">
                  {methods.map((method) => (
                    <div key={method.id} className="rounded-xl border border-slate-800 bg-slate-800/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                            {methodTitle(method)}
                            {method.isDefault && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{methodSubtitle(method)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {!method.isDefault && (
                          <button
                            onClick={() => handleSetDefault(method.id)}
                            className="flex-1 text-xs py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMethod(method.id)}
                          className="text-xs py-1.5 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {showAddPaymentModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Add Payment Method</h3>
                <button
                  onClick={() => setShowAddPaymentModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  X
                </button>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-slate-300 mb-2 block">Method Type</label>
                <select
                  value={newMethod.type}
                  onChange={(e) => setNewMethod({ ...newMethod, type: e.target.value as AddMethodForm['type'] })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="UPI">UPI</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>

              {newMethod.type === 'UPI' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">UPI App</label>
                    <select
                      value={newMethod.upiProvider}
                      onChange={(e) => setNewMethod({ ...newMethod, upiProvider: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="GPay">Google Pay</option>
                      <option value="PhonePe">PhonePe</option>
                      <option value="Paytm">Paytm</option>
                      <option value="BHIM">BHIM</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">UPI ID</label>
                    <input
                      type="text"
                      value={newMethod.upiId}
                      onChange={(e) => setNewMethod({ ...newMethod, upiId: e.target.value })}
                      placeholder="yourname@okicici"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              {newMethod.type === 'CARD' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Card Holder Name</label>
                    <input
                      type="text"
                      value={newMethod.cardName}
                      onChange={(e) => setNewMethod({ ...newMethod, cardName: e.target.value })}
                      placeholder="Name on card"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Card Number</label>
                    <input
                      type="text"
                      value={newMethod.cardNumber}
                      onChange={(e) => setNewMethod({ ...newMethod, cardNumber: e.target.value })}
                      placeholder="1234 5678 9012 3456"
                      inputMode="numeric"
                      maxLength={23}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">Expiry Month</label>
                      <input
                        type="text"
                        value={newMethod.expiryMonth}
                        onChange={(e) => setNewMethod({ ...newMethod, expiryMonth: e.target.value })}
                        placeholder="MM"
                        inputMode="numeric"
                        maxLength={2}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">Expiry Year</label>
                      <input
                        type="text"
                        value={newMethod.expiryYear}
                        onChange={(e) => setNewMethod({ ...newMethod, expiryYear: e.target.value })}
                        placeholder="YYYY or YY"
                        inputMode="numeric"
                        maxLength={4}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">CVV</label>
                      <input
                        type="password"
                        value={newMethod.cardCvv}
                        onChange={(e) => setNewMethod({ ...newMethod, cardCvv: e.target.value })}
                        placeholder="123"
                        inputMode="numeric"
                        maxLength={4}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {newMethod.type === 'NET_BANKING' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Bank Name</label>
                    <input
                      type="text"
                      value={newMethod.bankName}
                      onChange={(e) => setNewMethod({ ...newMethod, bankName: e.target.value })}
                      placeholder="State Bank of India"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Account Holder Name</label>
                    <input
                      type="text"
                      value={newMethod.accountHolderName}
                      onChange={(e) => setNewMethod({ ...newMethod, accountHolderName: e.target.value })}
                      placeholder="Account holder name"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Account Number</label>
                    <input
                      type="text"
                      value={newMethod.accountNumber}
                      onChange={(e) => setNewMethod({ ...newMethod, accountNumber: e.target.value })}
                      placeholder="Account number"
                      inputMode="numeric"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Confirm Account Number</label>
                    <input
                      type="text"
                      value={newMethod.confirmAccountNumber}
                      onChange={(e) => setNewMethod({ ...newMethod, confirmAccountNumber: e.target.value })}
                      placeholder="Re-enter account number"
                      inputMode="numeric"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">IFSC Code (optional)</label>
                    <input
                      type="text"
                      value={newMethod.ifsc}
                      onChange={(e) => setNewMethod({ ...newMethod, ifsc: e.target.value })}
                      placeholder="SBIN0000001"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 mt-4 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={newMethod.isDefault}
                  onChange={(e) => setNewMethod({ ...newMethod, isDefault: e.target.checked })}
                  className="w-4 h-4"
                />
                Set as default payment method
              </label>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddPaymentModal(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePaymentMethod}
                  disabled={savingMethod}
                  className="flex-1 py-2 rounded-lg bg-pink-600 text-white font-medium hover:bg-pink-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingMethod && <Loader2 className="w-4 h-4 animate-spin" />}
                  {savingMethod ? 'Saving...' : 'Save Method'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
