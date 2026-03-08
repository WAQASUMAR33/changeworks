'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote,
  ArrowUpDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Loader2,
  Building2,
  TrendingUp,
  Heart,
  X,
} from 'lucide-react';

const formatCurrency = (amount, iso_currency_code = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: iso_currency_code || 'USD',
  }).format(amount || 0);

// Round-up = cents needed to reach the next whole dollar
// Only applies to purchases (amount > 0 in Plaid = debit/spend)
const calcRoundUp = (amount) => {
  if (!amount || amount <= 0) return 0;
  const cents = Math.round(amount * 100) % 100;
  return cents === 0 ? 0 : parseFloat(((100 - cents) / 100).toFixed(2));
};

const totalRoundUp = (transactions) =>
  parseFloat(
    (transactions || [])
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + calcRoundUp(t.amount), 0)
      .toFixed(2)
  );

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const today = () => new Date().toISOString().split('T')[0];
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

export default function DonorRoundUpTransactionsPage() {
  const [connections, setConnections] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedConn, setExpandedConn] = useState(null);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(daysAgo(30));
  const [endDate, setEndDate] = useState(today());

  // Donate modal state
  const [donateModal, setDonateModal] = useState(null); // { conn, account }
  const [donating, setDonating] = useState(false);
  const [donateResult, setDonateResult] = useState(null); // { success, message, amount }

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/donor/login';
        return;
      }

      const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
      const response = await fetch(`/api/plaid/donor-transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch round-up transactions');
      }

      setConnections(data.connections || []);
      setSummary(data.summary || null);

      // Auto-expand if only one connection
      if (data.connections?.length === 1) {
        setExpandedConn(data.connections[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDonate = async () => {
    if (!donateModal) return;
    try {
      setDonating(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/plaid/charge-roundup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          account_id: donateModal.account.account_id,
          plaid_connection_id: donateModal.conn.id,
          start_date: startDate,
          end_date: endDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Charge failed');
      setDonateResult({ success: true, message: data.message, amount: data.amount_dollars });
    } catch (err) {
      setDonateResult({ success: false, message: err.message });
    } finally {
      setDonating(false);
    }
  };

  const closeDonateModal = () => {
    setDonateModal(null);
    setDonateResult(null);
  };

  const filteredTransactions = (conn) => {
    const q = search.toLowerCase();
    if (!q) return conn.transactions || [];
    return (conn.transactions || []).filter(
      (txn) =>
        (txn.merchant_name || txn.name || '').toLowerCase().includes(q) ||
        (txn.category?.[txn.category.length - 1] || '').toLowerCase().includes(q)
    );
  };

  const allTransactions = connections.flatMap((c) => c.transactions || []);
  const grandTotalRoundUp = totalRoundUp(allTransactions);

  const statCards = [
    {
      label: 'Bank Connections',
      value: summary?.total_connections ?? '—',
      icon: Building2,
      color: 'blue',
    },
    {
      label: 'Total Transactions',
      value: summary?.total_transactions ?? '—',
      icon: ArrowUpDown,
      color: 'green',
    },
    {
      label: 'Total Round-Up',
      value: summary ? formatCurrency(grandTotalRoundUp) : '—',
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      label: 'Date Range',
      value: summary
        ? `${formatDate(summary.start_date)} – ${formatDate(summary.end_date)}`
        : '—',
      icon: Calendar,
      color: 'purple',
    },
  ];

  const colorMap = {
    blue:    { bg: 'bg-blue-50',    icon: 'text-blue-600',    border: 'border-blue-200' },
    green:   { bg: 'bg-green-50',   icon: 'text-green-600',   border: 'border-green-200' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200' },
    purple:  { bg: 'bg-purple-50',  icon: 'text-purple-600',  border: 'border-purple-200' },
  };

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Round-Up Transactions</h1>
          <p className="text-gray-500 mt-1">Your bank transactions from connected accounts</p>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#0E0061] text-white rounded-xl hover:bg-[#1a0099] transition-colors disabled:opacity-50 text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0E0061]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0E0061]/30"
            />
          </div>
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="px-4 py-2 bg-[#0E0061] text-white rounded-xl hover:bg-[#1a0099] transition-colors disabled:opacity-50 text-sm font-medium"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const colors = colorMap[card.color];
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-2xl border ${colors.border} shadow-sm p-5`}
            >
              <div className={`inline-flex p-2 rounded-xl ${colors.bg} mb-3`}>
                <card.icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <div className="text-xs text-gray-500 mt-1">{card.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by merchant name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0E0061]/30 bg-white"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <span className="text-sm">Loading your round-up transactions...</span>
        </div>
      ) : connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Banknote className="w-10 h-10 mb-3 text-gray-300" />
          <p className="text-sm font-medium">No bank accounts connected</p>
          <p className="text-xs mt-1">Connect your bank account from the dashboard to see round-up transactions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((conn, idx) => {
            const txns = filteredTransactions(conn);
            const connRoundUp = totalRoundUp(conn.transactions);
            return (
              <motion.div
                key={conn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Connection Header Row */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedConn((prev) => (prev === conn.id ? null : conn.id))}
                >
                  <div className="flex items-center gap-4">
                    {conn.institution_logo && (
                      <img
                        src={`data:image/png;base64,${conn.institution_logo}`}
                        alt={conn.institution_name || 'Bank'}
                        className="w-10 h-10 rounded-xl object-contain border border-gray-100 bg-white p-1 flex-shrink-0"
                      />
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">
                        {conn.institution_name || 'Bank Account'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Connected {formatDate(conn.connected_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    {/* Status */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      {conn.status === 'ACTIVE' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-xs font-semibold text-green-600">Active</span>
                        </>
                      ) : conn.status === 'LOGIN_REQUIRED' ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-semibold text-amber-600">Re-login Required</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-semibold text-red-500">{conn.status}</span>
                        </>
                      )}
                    </div>

                    {/* Round-Up Total */}
                    <div className="hidden sm:block text-right">
                      <div className="text-xs text-gray-500 font-medium">Round-Up Total</div>
                      <div className="text-sm font-bold text-emerald-600">{formatCurrency(connRoundUp)}</div>
                    </div>

                    {/* Transaction count */}
                    <div className="text-right">
                      <div className="text-xs text-gray-500 font-medium">Transactions</div>
                      <div className="text-sm font-bold text-gray-900">{conn.total_transactions}</div>
                    </div>

                    {expandedConn === conn.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                <AnimatePresence>
                  {expandedConn === conn.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-100 px-5 py-4 space-y-5 bg-gray-50">

                        {/* Bank Accounts */}
                        {conn.accounts?.length > 0 && (
                          <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <CreditCard className="w-3.5 h-3.5" />
                              Bank Accounts
                            </h3>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {conn.accounts.map((acc) => (
                                <div key={acc.account_id} className="bg-white rounded-xl border border-gray-200 p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-semibold text-gray-800">
                                      {acc.name || acc.official_name || 'Account'}
                                    </span>
                                    <span className="text-xs text-gray-400">••••{acc.mask}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 capitalize">
                                    {acc.subtype || acc.type}
                                  </div>
                                  {acc.balances?.current != null && (
                                    <div className="mt-2 text-sm font-bold text-gray-900">
                                      {formatCurrency(acc.balances.current, acc.balances.iso_currency_code)}
                                      <span className="text-xs text-gray-400 font-normal ml-1">balance</span>
                                    </div>
                                  )}
                                  {connRoundUp > 0 && (
                                    <button
                                      onClick={() => setDonateModal({ conn, account: acc })}
                                      className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                      <Heart className="w-3.5 h-3.5" />
                                      Donate {formatCurrency(connRoundUp)} Round-Ups
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Transactions */}
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            Transactions ({txns.length} shown)
                          </h3>

                          {conn.transactions_error && (
                            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              {conn.transactions_error}
                            </div>
                          )}

                          {txns.length === 0 ? (
                            <div className="text-xs text-gray-400 text-center py-6 bg-white rounded-xl border border-gray-100">
                              {search ? 'No transactions match your search' : 'No transactions in selected date range'}
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-100 text-xs text-gray-500 font-semibold">
                                    <th className="text-left px-4 py-3">Date</th>
                                    <th className="text-left px-4 py-3">Description</th>
                                    <th className="text-left px-4 py-3 hidden sm:table-cell">Category</th>
                                    <th className="text-right px-4 py-3">Amount</th>
                                    <th className="text-right px-4 py-3">Round-Up</th>
                                    <th className="text-left px-4 py-3 hidden md:table-cell">Account</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                  {txns.map((txn) => (
                                    <tr key={txn.transaction_id} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                        {formatDate(txn.date)}
                                      </td>
                                      <td className="px-4 py-3 text-gray-800 font-medium max-w-[200px] truncate">
                                        {txn.merchant_name || txn.name}
                                      </td>
                                      <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                                        {txn.category?.[txn.category.length - 1] || '—'}
                                      </td>
                                      <td
                                        className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                                          txn.amount > 0 ? 'text-red-600' : 'text-green-600'
                                        }`}
                                      >
                                        {txn.amount > 0 ? '-' : '+'}
                                        {formatCurrency(Math.abs(txn.amount), txn.iso_currency_code)}
                                      </td>
                                      <td className="px-4 py-3 text-right whitespace-nowrap">
                                        {txn.amount > 0 && calcRoundUp(txn.amount) > 0 ? (
                                          <span className="font-semibold text-emerald-600">
                                            +{formatCurrency(calcRoundUp(txn.amount), txn.iso_currency_code)}
                                          </span>
                                        ) : (
                                          <span className="text-gray-300 text-xs">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                                        ••••{txn.account_id?.slice(-4)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Donate Round-Ups Modal */}
      <AnimatePresence>
        {donateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeDonateModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Donate Round-Ups</h3>
                    <p className="text-xs text-gray-500">ACH bank transfer</p>
                  </div>
                </div>
                <button onClick={closeDonateModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {donateResult ? (
                /* Result screen */
                <div className="text-center py-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${donateResult.success ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {donateResult.success
                      ? <CheckCircle className="w-7 h-7 text-emerald-600" />
                      : <AlertCircle className="w-7 h-7 text-red-600" />
                    }
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    {donateResult.success ? 'Donation Initiated!' : 'Donation Failed'}
                  </h4>
                  {donateResult.success && (
                    <p className="text-2xl font-bold text-emerald-600 mb-2">
                      {formatCurrency(donateResult.amount)}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mb-6">{donateResult.message}</p>
                  <button
                    onClick={closeDonateModal}
                    className="w-full py-3 bg-[#0E0061] text-white rounded-xl font-semibold hover:bg-[#1a0099] transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                /* Confirmation screen */
                <>
                  <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Bank</span>
                      <span className="font-semibold text-gray-900">{donateModal.conn.institution_name || 'Bank'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Account</span>
                      <span className="font-semibold text-gray-900">
                        {donateModal.account.name || 'Account'} ••••{donateModal.account.mask}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Period</span>
                      <span className="font-semibold text-gray-900">{formatDate(startDate)} – {formatDate(endDate)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between">
                      <span className="text-gray-700 font-medium">Round-Up Total</span>
                      <span className="text-emerald-600 font-bold text-lg">
                        {formatCurrency(totalRoundUp(donateModal.conn.transactions))}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mb-5 text-center">
                    This initiates an ACH bank transfer. Funds typically clear in 3–5 business days.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={closeDonateModal}
                      disabled={donating}
                      className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-gray-300 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDonate}
                      disabled={donating}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {donating ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                      ) : (
                        <><Heart className="w-4 h-4" /> Confirm Donation</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
