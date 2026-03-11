import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CreditCard,
  MoreVertical,
  QrCode,
  Wallet,
  Landmark
} from 'lucide-react';
import {
  getApiErrorMessage,
  getProviderAuthToken,
  parseJsonSafely,
  providerFetchWithFallback
} from '../utils/providerApi';

type MethodType = 'bank' | 'card' | 'upi';

type TransactionStatus = 'completed' | 'pending' | 'failed';

interface PaymentMethod {
  id: string;
  type: MethodType;
  name: string;
  last4: string;
  isDefault: boolean;
  upiId?: string;
}

interface WalletTransaction {
  id: string;
  description: string;
  amount: number;
  createdAt: string;
  status?: string;
}

const formatCurrency = (value: number) =>
  `?${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatCompactCurrency = (value: number) =>
  `?${Number(value || 0).toLocaleString('en-IN')}`;

const getStatusMeta = (status: TransactionStatus) => {
  if (status === 'completed') return { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' };
  if (status === 'pending') return { label: 'Pending', className: 'bg-amber-100 text-amber-700' };
  return { label: 'Failed', className: 'bg-rose-100 text-rose-700' };
};

const resolveTransactionStatus = (tx: WalletTransaction): TransactionStatus => {
  const raw = String(tx.status || '').toLowerCase();
  if (raw === 'completed' || raw === 'success' || raw === 'paid') return 'completed';
  if (raw === 'failed' || raw === 'rejected' || raw === 'cancelled') return 'failed';
  if (raw === 'pending' || raw === 'processing') return 'pending';
  return tx.amount >= 0 ? 'completed' : 'pending';
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date not available';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getFallbackTransactions = (): WalletTransaction[] => [
  {
    id: 'tx-1',
    description: 'Service Payment',
    amount: 450,
    createdAt: '2023-10-24T14:30:00Z',
    status: 'completed'
  },
  {
    id: 'tx-2',
    description: 'Wallet Withdrawal',
    amount: -1200,
    createdAt: '2023-10-23T09:15:00Z',
    status: 'pending'
  },
  {
    id: 'tx-3',
    description: 'Bonus Transfer',
    amount: -50,
    createdAt: '2023-10-21T11:45:00Z',
    status: 'failed'
  }
];

export default function ProviderWallet() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [balance, setBalance] = useState(0);
  const [withdrawable, setWithdrawable] = useState(0);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getProviderAuthToken();
      if (!token) {
        setAuthRequired(true);
        return;
      }
      setAuthRequired(false);

      const [walletRes, methodsRes, txRes] = await Promise.all([
        providerFetchWithFallback('/api/provider/wallet', token),
        providerFetchWithFallback('/api/provider/payment-methods', token),
        providerFetchWithFallback('/api/provider/transactions', token)
      ]);

      const walletPayload = await parseJsonSafely(walletRes);
      const methodsPayload = await parseJsonSafely(methodsRes);
      const txPayload = await parseJsonSafely(txRes);

      if (!walletRes.ok || !walletPayload?.success) {
        throw new Error(getApiErrorMessage(walletPayload, 'Failed to load wallet balance'));
      }
      if (!methodsRes.ok || !methodsPayload?.success) {
        throw new Error(getApiErrorMessage(methodsPayload, 'Failed to load payout methods'));
      }
      if (!txRes.ok || !txPayload?.success) {
        throw new Error(getApiErrorMessage(txPayload, 'Failed to load transactions'));
      }

      const nextBalance = Number(walletPayload?.data?.balance || 0);
      setBalance(nextBalance);
      setWithdrawable(Number(walletPayload?.data?.withdrawable ?? nextBalance));

      const loadedMethods: PaymentMethod[] = Array.isArray(methodsPayload?.data?.paymentMethods)
        ? methodsPayload.data.paymentMethods.map((method: any) => ({
            id: String(method.id || ''),
            type: (method.type || 'bank') as MethodType,
            name: method.name || 'Payment method',
            last4: method.last4 || '',
            isDefault: Boolean(method.isDefault),
            upiId: method.upiId || ''
          }))
        : [];
      setMethods(loadedMethods);

      const loadedTransactions: WalletTransaction[] = Array.isArray(txPayload?.data?.transactions)
        ? txPayload.data.transactions.map((tx: any) => ({
            id: String(tx.id || ''),
            description: tx.description || 'Transaction',
            amount: Number(tx.amount || 0),
            createdAt: tx.created_at || tx.createdAt || '',
            status: tx.status
          }))
        : [];
      setTransactions(loadedTransactions);
    } catch (loadError: any) {
      setError(loadError?.message || 'Failed to load payout details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const transactionList = useMemo(() => {
    if (transactions.length > 0) {
      return [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return getFallbackTransactions();
  }, [transactions]);

  const earningsData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - 6 + index);
      return {
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        key: date.toDateString()
      };
    });

    const totals = days.map((day) =>
      transactions
        .filter((tx) => tx.amount > 0 && new Date(tx.createdAt).toDateString() === day.key)
        .reduce((sum, tx) => sum + tx.amount, 0)
    );

    const hasReal = totals.some((value) => value > 0);
    const fallback = [1200, 1800, 1400, 2200, 1600, 2600, 2000];
    const values = hasReal ? totals : fallback;
    const max = Math.max(...values, 1);

    return { days, values, max };
  }, [transactions]);

  const handleWithdraw = async () => {
    try {
      setError('');
      setInfo('');
      const token = getProviderAuthToken();
      if (!token) {
        setAuthRequired(true);
        return;
      }
      if (methods.length === 0) {
        setError('Add a payout method before withdrawing.');
        return;
      }
      const amountRaw = window.prompt('Enter withdrawal amount', String(Math.min(withdrawable, balance)));
      if (!amountRaw) return;
      const amount = Number(amountRaw);
      if (!Number.isFinite(amount) || amount <= 0) {
        setError('Enter a valid amount.');
        return;
      }
      if (amount > balance) {
        setError('Insufficient balance.');
        return;
      }
      const method = methods.find((item) => item.isDefault) || methods[0];
      const response = await providerFetchWithFallback('/api/provider/withdraw', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethodId: method.id })
      });
      const data = await parseJsonSafely(response);
      if (!response.ok || !data?.success) {
        throw new Error(getApiErrorMessage(data, 'Failed to create withdrawal request'));
      }
      setInfo('Withdrawal request submitted successfully.');
      await loadData();
    } catch (withdrawError: any) {
      setError(withdrawError?.message || 'Failed to create withdrawal request');
    }
  };

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
          <p className="text-rose-500 mb-4">Please log in to view payouts.</p>
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
    <div className="min-h-screen bg-[#fbf6f4]">
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/provider/dashboard')}
          className="h-10 w-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h1 className="text-base font-semibold text-slate-900">Financial Hub</h1>
        <button
          type="button"
          onClick={() => navigate('/provider/settings')}
          className="h-10 w-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center"
        >
          <MoreVertical className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      <div className="px-5 pb-6">
        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {info}
          </div>
        )}

        <div className="rounded-3xl bg-[#c54c11] text-white p-5 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-[0.35em] uppercase text-white/70">Total Balance</p>
              <p className="mt-2 text-3xl font-semibold">{formatCurrency(balance)}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-5 h-px w-full bg-white/25" />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/70">Withdrawable</p>
              <p className="text-lg font-semibold">{formatCurrency(withdrawable)}</p>
            </div>
            <button
              type="button"
              onClick={handleWithdraw}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#c54c11] shadow"
            >
              Withdraw Funds
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white border border-orange-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-[0.25em] text-slate-500">Earnings (Last 7 Days)</p>
            <p className="text-sm font-semibold text-emerald-600">+12%</p>
          </div>
          <div className="mt-6 grid grid-cols-7 gap-3 items-end h-28">
            {earningsData.values.map((value, index) => {
              const height = Math.max(12, Math.round((value / earningsData.max) * 100));
              const isHighlight = index >= 5;
              return (
                <div key={earningsData.days[index].label} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-xl ${isHighlight ? 'bg-orange-500' : 'bg-orange-200'}`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-slate-400">{earningsData.days[index].label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold tracking-[0.25em] text-slate-500">PAYMENT METHODS</p>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => navigate('/provider/settings')}
              className="w-full flex items-center justify-between rounded-2xl border border-orange-300 bg-white px-4 py-4 text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Add Bank Account</p>
                  <p className="text-xs text-slate-500">Securely link your savings or current account</p>
                </div>
              </div>
              <span className="text-slate-400">›</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/provider/settings')}
              className="w-full flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-4 text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">UPI Details</p>
                  <p className="text-xs text-slate-500">Manage your VPA and UPI identifiers</p>
                </div>
              </div>
              <span className="text-slate-400">›</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/provider/settings')}
              className="w-full flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-4 text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Saved Cards</p>
                  <p className="text-xs text-slate-500">Manage your credit and debit cards</p>
                </div>
              </div>
              <span className="text-slate-400">›</span>
            </button>

            {methods.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                <p className="text-xs text-slate-400 mb-2">Linked methods</p>
                <div className="space-y-2">
                  {methods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between text-sm text-slate-700">
                      <span>
                        {method.name} {method.type === 'upi' ? `• ${method.upiId || 'UPI'}` : `• ****${method.last4}`}
                      </span>
                      {method.isDefault && <span className="text-xs text-emerald-600 font-semibold">Default</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-slate-900">Transaction History</p>
            <button type="button" className="text-sm font-semibold text-orange-600">
              View All
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {transactionList.slice(0, 5).map((tx) => {
              const status = resolveTransactionStatus(tx);
              const meta = getStatusMeta(status);
              const isCredit = tx.amount >= 0;
              return (
                <div key={tx.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                          isCredit ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                        }`}
                      >
                        {isCredit ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{tx.description}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isCredit ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {isCredit ? '+' : '-'}
                        {formatCompactCurrency(Math.abs(tx.amount))}
                      </p>
                      <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
