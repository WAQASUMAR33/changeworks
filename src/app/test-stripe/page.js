'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, CreditCard, User, Building2 } from 'lucide-react';

export default function StripeTestPage() {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState({});
  const [paymentTest, setPaymentTest] = useState({
    amount: 10.00,
    donor_id: 1,
    organization_id: 1,
    description: 'Test donation'
  });

  const runTest = async (testName, apiEndpoint, method = 'GET', body = null) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(apiEndpoint, options);
      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: response.ok && data.success !== false,
          status: response.status,
          data: data,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          status: 'ERROR',
          data: { error: error.message },
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const tests = [
    {
      name: 'stripe_config',
      title: 'Stripe Configuration Test',
      description: 'Check if Stripe is properly configured',
      endpoint: '/api/payments/test',
      method: 'GET'
    },
    {
      name: 'create_intent',
      title: 'Create Payment Intent',
      description: 'Test creating a payment intent',
      endpoint: '/api/payments/create-intent',
      method: 'POST',
      body: paymentTest
    },
    {
      name: 'payment_history',
      title: 'Payment History',
      description: 'Test fetching payment history',
      endpoint: '/api/payments/history/1',
      method: 'GET'
    }
  ];

  const getStatusIcon = (result) => {
    if (!result) return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    return result.success ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = (result) => {
    if (!result) return 'border-gray-200 bg-gray-50';
    return result.success ? 
      'border-green-200 bg-green-50' : 
      'border-red-200 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Stripe Integration Test
          </h1>
          <p className="text-gray-600">
            Test your Stripe payment integration to ensure everything is working correctly
          </p>
        </div>

        {/* Test Configuration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Test Payment Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={paymentTest.amount}
                onChange={(e) => setPaymentTest(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Donor ID</label>
              <input
                type="number"
                value={paymentTest.donor_id}
                onChange={(e) => setPaymentTest(prev => ({ ...prev, donor_id: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization ID</label>
              <input
                type="number"
                value={paymentTest.organization_id}
                onChange={(e) => setPaymentTest(prev => ({ ...prev, organization_id: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={paymentTest.description}
                onChange={(e) => setPaymentTest(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Test Cases */}
        <div className="space-y-4">
          {tests.map((test) => {
            const result = testResults[test.name];
            const isLoading = loading[test.name];
            
            return (
              <motion.div
                key={test.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-lg shadow-sm border p-6 ${getStatusColor(result)}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{test.title}</h3>
                      <p className="text-sm text-gray-600">{test.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => runTest(test.name, test.endpoint, test.method, test.body)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <span>Run Test</span>
                    )}
                  </button>
                </div>

                {result && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Status: {result.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <pre className="text-xs text-gray-800 bg-white p-3 rounded border overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Run All Tests Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              tests.forEach(test => {
                setTimeout(() => {
                  runTest(test.name, test.endpoint, test.method, test.body);
                }, tests.indexOf(test) * 1000); // Stagger tests by 1 second
              });
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
          >
            Run All Tests
          </button>
        </div>

        {/* Environment Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Environment Information</h3>
          <div className="text-sm text-blue-800">
            <p>• Base URL: app.changeworksfund.org</p>
            <p>• Stripe Mode: Live (Production)</p>
            <p>• Test Page: /test-stripe</p>
          </div>
        </div>
      </div>
    </div>
  );
}
