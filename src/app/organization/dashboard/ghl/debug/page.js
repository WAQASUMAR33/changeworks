'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function GHLDebugPage() {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runGHLTest = async () => {
    setLoading(true);
    setError('');
    setTestResults(null);

    try {
      const response = await fetch('/api/debug/ghl-raw', {
        method: 'POST'
      });
      const data = await response.json();

      setTestResults(data);
    } catch (err) {
      setError('Failed to test GHL API: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/organization/dashboard/ghl/manage" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            ← Back to Manage GHL Accounts
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GHL API Debug</h1>
          <p className="text-gray-600">
            Test the GoHighLevel API and see the raw response from GHL servers.
          </p>
        </div>

        {/* Test Button */}
        <div className="text-center mb-8">
          <button
            onClick={runGHLTest}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Testing GHL API...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Test GHL API</span>
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
            >
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Test Results */}
        <AnimatePresence>
          {testResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg border ${testResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center space-x-3">
                      {testResults.success ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                      <div>
                        <h3 className="font-medium">API Call</h3>
                        <p className="text-sm opacity-75">
                          {testResults.success ? 'Success' : 'Failed'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${testResults.locationId ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-center space-x-3">
                      {testResults.locationId ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                      <div>
                        <h3 className="font-medium">Location ID</h3>
                        <p className="text-sm opacity-75">
                          {testResults.locationId ? testResults.locationId : 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${testResults.statusCode === 201 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center space-x-3">
                      {testResults.statusCode === 201 ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                      <div>
                        <h3 className="font-medium">Status Code</h3>
                        <p className="text-sm opacity-75">
                          {testResults.statusCode || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw Response */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Raw GHL Response</h2>
                  <button
                    onClick={() => copyToClipboard(testResults)}
                    className="flex items-center space-x-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Analysis */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis</h2>
                <div className="space-y-3">
                  {testResults.success ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700">✅ <strong>Success!</strong> GHL API call was successful.</p>
                      {testResults.locationId && (
                        <p className="text-green-700 mt-1">✅ Location ID: {testResults.locationId}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700">❌ <strong>Failed!</strong> GHL API call failed.</p>
                      {testResults.error && (
                        <p className="text-red-700 mt-1">Error: {testResults.error}</p>
                      )}
                    </div>
                  )}

                  {testResults.statusCode && testResults.statusCode !== 201 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-700">⚠️ Status Code: {testResults.statusCode}</p>
                      <p className="text-yellow-700 text-sm mt-1">Expected: 201 (Created)</p>
                    </div>
                  )}

                  {testResults.ghlResponse?.fullError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700">❌ <strong>Detailed Error:</strong></p>
                      <pre className="text-red-700 text-sm mt-2 whitespace-pre-wrap">
                        {JSON.stringify(testResults.ghlResponse.fullError, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
