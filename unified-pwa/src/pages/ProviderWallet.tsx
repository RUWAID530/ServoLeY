import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CreditCard, Trash2, Wallet } from 'lucide-react';
import {
  getApiErrorMessage,
  getProviderAuthToken,
  parseJsonSafely,
  providerFetchWithFallback
} from '../utils/providerApi';

type MethodType = 'bank' | 'card' | 'upi';

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
}

const formatCurrency = (value: number) =>
  `Rs ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const methodLabel = (method: PaymentMethod) => {
  if (method.type === 'upi') return method.upiId || 'UPI';
  return `****${String(method.last4 || '').slice(-4)}`;
};

export default function ProviderWallet() {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [balance, setBalance] = useState(0);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethodId, setWithdrawMethodId] = useState('');

  const [methodType, setMethodType] = useState<MethodType>('bank');
  const [methodName, setMethodName] = useState('');
  const [methodValue, setMethodValue] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);

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

      setBalance(Number(walletPayload?.data?.balance || 0));
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
      setWithdrawMethodId((current) => current || loadedMethods.find((method) => method.isDefault)?.id || loadedMethods[0]?.id || '');

      const loadedTransactions: WalletTransaction[] = Array.isArray(txPayload?.data?.transactions)
        ? txPayload.data.transactions.map((tx: any) => ({
            id: String(tx.id || ''),
            description: tx.description || 'Transaction',
            amount: Number(tx.amount || 0),
            createdAt: tx.created_at || tx.createdAt || ''
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

  const totalCredits = useMemo(
    () => transactions.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0),
    [transactions]
  );

  const addMethod = async () => {
    try {
      setError('');
      setInfo('');
      const token = getProviderAuthToken();
      if (!token) {
        setAuthRequired(true);
        return;
      }
      if (!methodName.trim() || !methodValue.trim()) {
        setError('Enter all payout method details.');
        return;
      }
      const payload: any = {
        type: methodType,
        name: methodName.trim(),
        isDefault: setAsDefault
      };
      if (methodType === 'upi') payload.upiId = methodValue.trim();
      if (methodType === 'card') payload.cardNumber = methodValue.replace(/\D/g, '');
      if (methodType === 'bank') payload.accountNumber = methodValue.replace(/\D/g, '');

      const response = await providerFetchWithFallback('/api/provider/payment-methods', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await parseJsonSafely(response);
      if (!response.ok || !data?.success) {
        throw new Error(getApiErrorMessage(data, 'Failed to add payout method'));
      }
      setInfo('Payout method added.');
      setMethodName('');
      setMethodValue('');
      setSetAsDefault(false);
      await loadData();
    } catch (methodError: any) {
      setError(methodError?.message || 'Failed to add payout method');
    }
  };

  const setDefault = async (id: string) => {
    try {
      const token = getProviderAuthToken();
      if (!token) return;
      const response = await providerFetchWithFallback(`/api/provider/payment-methods/${id}/set-default`, token, { method: 'PUT' });
      const data = await parseJsonSafely(response);
      if (!response.ok || !data?.success) throw new Error(getApiErrorMessage(data, 'Failed to set default method'));
      setInfo('Default payout method updated.');
      await loadData();
    } catch (setDefaultError: any) {
      setError(setDefaultError?.message || 'Failed to set default method');
    }
  };

  const removeMethod = async (id: string) => {
    try {
      const token = getProviderAuthToken();
      if (!token) return;
      const response = await providerFetchWithFallback(`/api/provider/payment-methods/${id}`, token, { method: 'DELETE' });
      const data = await parseJsonSafely(response);
      if (!response.ok || !data?.success) throw new Error(getApiErrorMessage(data, 'Failed to remove method'));
      setInfo('Payout method removed.');
      await loadData();
    } catch (removeError: any) {
      setError(removeError?.message || 'Failed to remove payout method');
    }
  };

  const submitWithdrawal = async () => {
    try {
      setError('');
      setInfo('');
      const token = getProviderAuthToken();
      if (!token) {
        setAuthRequired(true);
        return;
      }
      const amount = Number(withdrawAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setError('Enter a valid amount.');
        return;
      }
      if (amount > balance) {
        setError('Insufficient balance.');
        return;
      }
      if (!withdrawMethodId) {
        setError('Select a payout method.');
        return;
      }

      const response = await providerFetchWithFallback('/api/provider/withdraw', token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethodId: withdrawMethodId })
      });
      const data = await parseJsonSafely(response);
      if (!response.ok || !data?.success) {
        throw new Error(getApiErrorMessage(data, 'Failed to create withdrawal request'));
      }
      setInfo('Withdrawal request submitted successfully.');
      setWithdrawAmount('');
      await loadData();
    } catch (withdrawError: any) {
      setError(withdrawError?.message || 'Failed to create withdrawal request');
    }
  };

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
          <p className="text-rose-300 mb-4">Please log in to view payouts.</p>
          <button onClick={() => (window.location.href = '/auth')} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg">
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
          <h1 className="text-2xl font-semibold text-white">Payouts</h1>
          <p className="text-sm text-slate-400">Manage your payout balance and methods.</p>
        </div>
        <Link to="/provider/dashboard" className="text-cyan-400 hover:text-cyan-300 text-sm">Back to Dashboard</Link>
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}
      {info && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{info}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-sm text-slate-400">Available Balance</p>
          <p className="text-2xl text-white font-semibold mt-2">{formatCurrency(balance)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-sm text-slate-400">Total Credits</p>
          <p className="text-2xl text-emerald-300 font-semibold mt-2">{formatCurrency(totalCredits)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Methods</p>
            <Wallet className="w-5 h-5 text-cyan-300" />
          </div>
          <p className="text-2xl text-white font-semibold mt-2">{methods.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold">Withdraw Funds</h2>
          <div>
            <label className="text-sm text-slate-300 block mb-2">Amount</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(event) => setWithdrawAmount(event.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="Enter amount"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 block mb-2">Payout Method</label>
            <select
              value={withdrawMethodId}
              onChange={(event) => setWithdrawMethodId(event.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="">Select method</option>
              {methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name} - {methodLabel(method)}
                </option>
              ))}
            </select>
          </div>
          <button onClick={submitWithdrawal} className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white font-medium">
            Confirm Withdrawal
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-semibold">Add Payout Method</h2>
          <div className="grid grid-cols-1 gap-3">
            <select value={methodType} onChange={(event) => setMethodType(event.target.value as MethodType)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
              <option value="bank">Bank Account</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
            <input value={methodName} onChange={(event) => setMethodName(event.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="Account holder / method name" />
            <input
              value={methodValue}
              onChange={(event) => setMethodValue(event.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
              placeholder={methodType === 'upi' ? 'UPI ID' : methodType === 'card' ? 'Card number' : 'Account number'}
            />
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={setAsDefault} onChange={(event) => setSetAsDefault(event.target.checked)} />
              Set as default method
            </label>
            <button onClick={addMethod} className="py-2.5 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white font-medium">
              Add Method
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h2 className="text-white font-semibold">Saved Methods</h2>
        {methods.length === 0 ? (
          <p className="text-sm text-slate-400">No payout methods yet.</p>
        ) : (
          methods.map((method) => (
            <div key={method.id} className="rounded-xl border border-slate-800 bg-slate-800/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-cyan-300" />
                <div>
                  <p className="text-sm text-white flex items-center gap-2">
                    {method.name}
                    {method.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">{methodLabel(method)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!method.isDefault && <button onClick={() => setDefault(method.id)} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-white">Set Default</button>}
                <button onClick={() => removeMethod(method.id)} className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs inline-flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead className="border-b border-slate-800">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">Description</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-400">No transactions yet.</td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-800">
                  <td className="px-4 py-3 text-sm text-slate-300">{new Date(tx.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-white">{tx.description}</td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${tx.amount >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {tx.amount >= 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(tx.amount))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
