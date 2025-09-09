'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function GHLTestPage() {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runDiagnostics = async () => {
    setLoading(true);
    setError('');
    setTestResults(null);

    try {
      // Test configuration
      const configResponse = await fetch('/api/debug/ghl-config');
      const configData = await configResponse.json();

      // Test GHL API
      const testResponse = await fetch('/api/test/ghl-subaccount', {
        method: 'POST'
      });
      const testData = await testResponse.json();

      setTestResults({
        config: configData,
        test: testData
      });
    } catch (err) {
      setError('Failed to run diagnostics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (success) => {
    if (success === true) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (success === false) return <XCircle className="w-5 h-5 text-red-500" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusColor = (success) => {
    if (success === true) return 'text-green-700 bg-green-50 border-green-200';
    if (success === false) return 'text-red-700 bg-red-50 border-red-200';
    return 'text-yellow-700 bg-yellow-50 border-yellow-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/organization/dashboard/ghl/manage" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            ← Back to Manage GHL Accounts
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GHL Integration Diagnostics</h1>
          <p className="text-gray-600">
            Test your GoHighLevel API configuration and troubleshoot integration issues.
          </p>
        </div>

        {/* Quick Setup Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Quick Setup Checklist</h2>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>You need an <strong>Agency API Key</strong> (250+ characters)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>You need <strong>Agency Pro plan</strong> ($497/month)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>API endpoint should be: <code>https://rest.gohighlevel.com/v1</code></span>
            </div>
          </div>
          <div className="mt-4">
            <a 
              href="https://app.gohighlevel.com/agency/settings/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              Get Agency API Key <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>

        {/* Test Button */}
        <div className="text-center mb-8">
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center space-x-2 mx-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Running Diagnostics...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Run Diagnostics</span>
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
              {/* Configuration Results */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration Check</h2>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${getStatusColor(testResults.config.config.hasApiKey)}`}>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(testResults.config.config.hasApiKey)}
                      <div>
                        <h3 className="font-medium">API Key Present</h3>
                        <p className="text-sm opacity-75">
                          {testResults.config.config.hasApiKey ? 'API key is configured' : 'API key is missing'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${getStatusColor(testResults.config.config.apiKeyLength >= 200)}`}>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(testResults.config.config.apiKeyLength >= 200)}
                      <div>
                        <h3 className="font-medium">API Key Length</h3>
                        <p className="text-sm opacity-75">
                          Length: {testResults.config.config.apiKeyLength} characters
                          {testResults.config.config.apiKeyLength < 200 && ' (Should be 250+ for Agency API Key)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border ${getStatusColor(testResults.config.config.baseUrl === 'https://rest.gohighlevel.com/v1')}`}>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(testResults.config.config.baseUrl === 'https://rest.gohighlevel.com/v1')}
                      <div>
                        <h3 className="font-medium">API Endpoint</h3>
                        <p className="text-sm opacity-75">
                          {testResults.config.config.baseUrl}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* GHL API Test Results */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">GHL API Test</h2>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${getStatusColor(testResults.test.directGHLResult?.success)}`}>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(testResults.test.directGHLResult?.success)}
                      <div>
                        <h3 className="font-medium">Direct GHL API Call</h3>
                        <p className="text-sm opacity-75">
                          {testResults.test.directGHLResult?.success 
                            ? 'Successfully created test sub-account' 
                            : testResults.test.directGHLResult?.error || 'Failed to create sub-account'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {testResults.test.directGHLResult?.fullError && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Error Details:</h4>
                      <pre className="text-xs text-gray-600 overflow-auto">
                        {JSON.stringify(testResults.test.directGHLResult.fullError, null, 2)}
                      </pre>
                    </div>
                  )}

                  {testResults.test.directGHLResult?.success && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Success Details:</h4>
                      <pre className="text-xs text-green-700 overflow-auto">
                        {JSON.stringify(testResults.test.directGHLResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
                <div className="space-y-3 text-sm">
                  {!testResults.config.config.hasApiKey && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700">❌ Add your GHL API key to the .env.local file</p>
                    </div>
                  )}
                  {testResults.config.config.apiKeyLength < 200 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-700">⚠️ Your API key seems short. You need an Agency API Key (250+ characters)</p>
                    </div>
                  )}
                  {testResults.config.config.baseUrl !== 'https://rest.gohighlevel.com/v1' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-700">⚠️ Update your API endpoint to: https://rest.gohighlevel.com/v1</p>
                    </div>
                  )}
                  {testResults.test.directGHLResult?.success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700">✅ GHL integration is working correctly!</p>
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
