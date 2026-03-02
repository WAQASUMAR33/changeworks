'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote,
  Users,
  ArrowUpDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  CheckCircle,
  AlertCircle,
  Building2,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  Loader2,
} from 'lucide-react';

const formatCurrency = (amount, iso_currency_code = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: iso_currency_code || 'USD',
  }).format(amount || 0);
};

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

export default function RoundUpDonorsPage() {
  const [connections, setConnections] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedDonor, setExpandedDonor] = useState(null);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(daysAgo(30));
  const [endDate, setEndDate] = useState(today());
  const [cleaning, setCleaning] = useState(false);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError('');

      const token = sessionStorage.getItem('orgToken');
      if (!token) {
        window.location.href = '/organization/login';
        return;
      }

      const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
      const response = await fetch(`/api/organization/plaid-connections?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Round-Up donors');
      }

      setConnections(data.connections || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredConnections = connections.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.donor?.name?.toLowerCase().includes(q) ||
      c.donor?.email?.toLowerCase().includes(q) ||
      c.institution_name?.toLowerCase().includes(q)
    );
  });

  const toggleDonor = (id) => setExpandedDonor((prev) => (prev === id ? null : id));

  const hasMockConnections = connections.some(
    (c) => c.status === 'ERROR' || c.institution_name === 'Mock Bank'
  );

  const cleanupMockConnections = async () => {
    if (!confirm('This will permanently delete all mock/invalid bank connections. Affected donors will need to reconnect. Continue?')) return;
    try {
      setCleaning(true);
      const token = sessionStorage.getItem('orgToken');
      const res = await fetch('/api/plaid/cleanup-mock', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
      fetchConnections();
    } catch (err) {
      alert('Cleanup failed: ' + err.message);
    } finally {
      setCleaning(false);
    }
  };

  const statCards = [
    {
      label: 'Round-Up Donors',
      value: summary?.total_donors ?? '—',
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Total Transactions',
      value: summary?.total_transactions ?? '—',
      icon: ArrowUpDown,
      color: 'green',
    },
    {
      label: 'Date Range',
      value: summary ? `${formatDate(summary.start_date)} – ${formatDate(summary.end_date)}` : '—',
      icon: Calendar,
      color: 'purple',
    },
    {
      label: 'Institutions',
      value: summary
        ? new Set(connections.map((c) => c.institution_name).filter(Boolean)).size
        : '—',
      icon: Building2,
      color: 'orange',
    },
  ];

  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-200' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' },
  };

  return (
    <div className="space-y-6 p-2">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Round-Up Donors</h1>
          <p className="text-gray-500 mt-1">
            Donors who connected their bank accounts via Plaid for round-up donations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasMockConnections && (
            <button
              onClick={cleanupMockConnections}
              disabled={cleaning}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {cleaning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
              Remove Mock Connections
            </button>
          )}
          <button
            onClick={fetchConnections}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#0E0061] text-white rounded-xl hover:bg-[#1a0099] transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
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
            onClick={fetchConnections}
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
          placeholder="Search by donor name, email, or institution..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0E0061]/30 bg-white"
        />
      </div>

      {/* Connections List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <span className="text-sm">Loading round-up donors...</span>
        </div>
      ) : filteredConnections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Banknote className="w-10 h-10 mb-3 text-gray-300" />
          <p className="text-sm font-medium">No round-up donors found</p>
          <p className="text-xs mt-1">
            {search ? 'Try a different search term' : 'No donors have connected their bank accounts yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConnections.map((conn, idx) => (
            <motion.div
              key={conn.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Donor Row */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleDonor(conn.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#0E0061] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {conn.donor?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  {/* Institution Logo */}
                  {conn.institution_logo && (
                    <img
                      src={`data:image/png;base64,${conn.institution_logo}`}
                      alt={conn.institution_name || 'Bank'}
                      className="w-8 h-8 rounded-lg object-contain border border-gray-100 bg-white p-0.5 flex-shrink-0"
                    />
                  )}

                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{conn.donor?.name || 'Unknown Donor'}</div>
                    <div className="text-xs text-gray-500">{conn.donor?.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Institution */}
                  <div className="hidden sm:block text-right">
                    <div className="text-xs text-gray-500 font-medium">Institution</div>
                    <div className="text-sm text-gray-800 font-semibold">
                      {conn.institution_name || '—'}
                    </div>
                  </div>

                  {/* Transactions count */}
                  <div className="text-right">
                    <div className="text-xs text-gray-500 font-medium">Transactions</div>
                    <div className="text-sm font-bold text-gray-900">{conn.total_transactions}</div>
                  </div>

                  {/* Status */}
                  <div className="hidden md:flex items-center gap-1.5">
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

                  {/* Connected date */}
                  <div className="hidden lg:block text-right">
                    <div className="text-xs text-gray-500 font-medium">Connected</div>
                    <div className="text-xs text-gray-700">{formatDate(conn.connected_at)}</div>
                  </div>

                  {/* Expand icon */}
                  {expandedDonor === conn.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Detail */}
              <AnimatePresence>
                {expandedDonor === conn.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-100 px-5 py-4 space-y-5 bg-gray-50">

                      {/* Accounts */}
                      {conn.accounts?.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5" />
                            Bank Accounts
                          </h3>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {conn.accounts.map((acc) => (
                              <div
                                key={acc.account_id}
                                className="bg-white rounded-xl border border-gray-200 p-3"
                              >
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
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transactions */}
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          Transactions ({conn.transactions?.length || 0} shown)
                        </h3>

                        {conn.transactions_error && (
                          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            {conn.transactions_error}
                          </div>
                        )}

                        {conn.transactions?.length === 0 ? (
                          <div className="text-xs text-gray-400 text-center py-6 bg-white rounded-xl border border-gray-100">
                            No transactions in selected date range
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
                                  <th className="text-left px-4 py-3 hidden md:table-cell">Account</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {conn.transactions.map((txn) => (
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
                                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${txn.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {txn.amount > 0 ? '-' : '+'}
                                      {formatCurrency(Math.abs(txn.amount), txn.iso_currency_code)}
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
          ))}
        </div>
      )}
    </div>
  );
}
