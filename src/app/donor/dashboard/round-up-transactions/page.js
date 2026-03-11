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
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/donor/login'; return; }

        const res = await fetch('/api/donor/roundup-records', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to load round-up records');
        setRecords(data.records || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const total = records.reduce((sum, r) => sum + (r.trx_amount || 0), 0);

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Round-Up Donations</h1>
        <p className="text-gray-500 mt-1">Your ACH round-up charges sent to organisations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Records List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Banknote className="w-10 h-10 mb-3 text-gray-300" />
          <p className="text-sm font-medium">No round-up donations yet</p>
          <p className="text-xs mt-1">Your ACH round-up charges will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 font-semibold border-b border-gray-100">
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Organization</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Method</th>
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
                    <td className="px-5 py-4 text-gray-500 uppercase text-xs hidden md:table-cell">
                      {record.trx_method || 'ach'}
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
    </div>
  );
}
