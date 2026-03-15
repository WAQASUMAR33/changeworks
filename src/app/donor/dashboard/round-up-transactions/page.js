'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Banknote,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  TrendingUp,
  Calendar,
  CreditCard,
  Heart,
  Link2,
  RefreshCw,
} from 'lucide-react';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function DonorRoundUpTransactionsPage() {
  const [connections, setConnections] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectionsLoading, setConnectionsLoading] = useState(true);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Load bank connections on mount (lightweight)
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/donor/login'; return; }

        const res = await fetch('/api/donor/bank-connections', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setConnections(data.connections || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setConnectionsLoading(false);
      }
    };
    loadConnections();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) { window.location.href = '/donor/login'; return; }

      const res = await fetch('/api/donor/roundup-records', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        setLoaded(true);
      } else {
        setError(data.error || 'Failed to load transactions');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const total = records.reduce((sum, r) => sum + (r.trx_amount || 0), 0);

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Round-Up Program</h1>
        <p className="text-gray-500 mt-1">Your connected bank accounts and round-up donation history</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Connected Banks ─────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-blue-600" />
          Connected Bank Accounts
        </h2>

        {connectionsLoading ? (
          <div className="flex items-center justify-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Loading bank accounts...</span>
          </div>
        ) : connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
            <Building2 className="w-10 h-10 mb-3 text-gray-300" />
            <p className="text-sm font-medium">No bank accounts connected</p>
            <p className="text-xs mt-1">Connect your bank from the dashboard to start round-ups</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((conn, idx) => {
              const accounts = (() => {
                try { return JSON.parse(conn.accounts || '[]'); } catch { return []; }
              })();

              return (
                <motion.div
                  key={conn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4"
                >
                  {/* Institution */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {conn.institution_name || 'Bank Account'}
                      </p>
                      <p className="text-xs text-gray-400">Connected {formatDate(conn.created_at)}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                      conn.status === 'ACTIVE'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {conn.status === 'ACTIVE'
                        ? <><CheckCircle className="w-3 h-3" /> Active</>
                        : <><AlertCircle className="w-3 h-3" /> {conn.status}</>
                      }
                    </span>
                  </div>

                  {/* Organisation */}
                  {conn.organization && (
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <Heart className="w-4 h-4 text-pink-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Donating to</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{conn.organization.name}</p>
                      </div>
                    </div>
                  )}

                  {/* Linked Accounts */}
                  {accounts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Linked Accounts</p>
                      {accounts.map((acc) => (
                        <div key={acc.account_id || acc.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {acc.name || acc.official_name || 'Account'}
                              </p>
                              <p className="text-xs text-gray-400 capitalize">{acc.subtype || acc.type || ''}</p>
                            </div>
                          </div>
                          {acc.mask && (
                            <span className="text-xs text-gray-400">••••{acc.mask}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Donation History ───────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-600" />
            Round-Up Donation History
          </h2>
          <button
            onClick={loadTransactions}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors duration-200"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
            ) : (
              <><RefreshCw className="w-4 h-4" /> {loaded ? 'Refresh' : 'Show Transactions'}</>
            )}
          </button>
        </div>

        {!loaded && !loading && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
            <Banknote className="w-10 h-10 mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">Click &quot;Show Transactions&quot; to load your round-up history</p>
          </div>
        )}

        {loaded && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-5">
                <div className="inline-flex p-2 rounded-xl bg-emerald-50 mb-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</div>
                <div className="text-xs text-gray-500 mt-1">Total Round-Ups Donated</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5">
                <div className="inline-flex p-2 rounded-xl bg-blue-50 mb-3">
                  <Banknote className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{records.length}</div>
                <div className="text-xs text-gray-500 mt-1">Total Charges</div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-purple-200 shadow-sm p-5">
                <div className="inline-flex p-2 rounded-xl bg-purple-50 mb-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {records.length > 0 ? formatDate(records[0].trx_date) : '—'}
                </div>
                <div className="text-xs text-gray-500 mt-1">Last Charge Date</div>
              </motion.div>
            </div>

            {records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400">
                <Banknote className="w-10 h-10 mb-3 text-gray-300" />
                <p className="text-sm font-medium">No round-up donations yet</p>
                <p className="text-xs mt-1">Your round-up charges will appear here</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500 font-semibold border-b border-gray-100">
                        <th className="text-left px-5 py-3">Date</th>
                        <th className="text-left px-5 py-3 hidden sm:table-cell">Organization</th>
                        <th className="text-right px-5 py-3">Amount</th>
                        <th className="text-left px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                            {formatDate(record.trx_date)}
                          </td>
                          <td className="px-5 py-4 hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-800 font-medium truncate max-w-[180px]">
                                {record.organization?.name || '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                            {formatCurrency(record.trx_amount)}
                          </td>
                          <td className="px-5 py-4">
                            {record.pay_status === 'completed' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3" /> Completed
                              </span>
                            ) : record.pay_status === 'pending' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                                <Loader2 className="w-3 h-3 animate-spin" /> Pending
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-full">
                                <AlertCircle className="w-3 h-3" /> {record.pay_status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
