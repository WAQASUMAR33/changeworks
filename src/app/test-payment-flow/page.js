'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  CreditCard, 
  Database,
  ArrowRight,
  AlertTriangle,
  DollarSign,
  User,
  Building2
} from 'lucide-react';

export default function TestPaymentFlowPage() {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');

  const runPaymentFlowTest = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      setStep('Creating test data...');
      
      // First, ensure we have test data
      const testDataResponse = await fetch('/api/create-test-data', {
        method: 'POST'
      });
      const testDataResult = await testDataResponse.json();
      
      if (!testDataResult.success && !testDataResult.message?.includes('already exists')) {
        throw new Error(`Test data creation failed: ${testDataResult.error}`);
      }

      setStep('Running payment flow test...');
      
      // Run the comprehensive payment flow test
      const response = await fetch('/api/test-payment-flow', {
        method: 'POST'
      });
      
      const data = await response.json();
      setTestResult(data);
      
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
        step: step
      });
    } finally {
      setLoading(false);
      setStep('');
    }
  };

  const getStepIcon = (status) => {
    if (status === '✅ PASSED') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === '❌ FAILED') return <XCircle className="w-5 h-5 text-red-500" />;
    if (status === '⚠️ NO CHANGE' || status === '⚠️ NOT FOUND') return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
  };

  const getStepColor = (status) => {
    if (status === '✅ PASSED') return 'border-green-200 bg-green-50';
    if (status === '❌ FAILED') return 'border-red-200 bg-red-50';
    if (status === '⚠️ NO CHANGE' || status === '⚠️ NOT FOUND') return 'border-yellow-200 bg-yellow-50';
    return 'border-gray-200 bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Flow Integration Test
          </h1>
          <p className="text-gray-600">
            Test the complete payment creation and database storage flow
          </p>
        </div>

        {/* Test Button */}
        <div className="text-center mb-8">
          <button
            onClick={runPaymentFlowTest}
            disabled={loading}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-3 mx-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>{step || 'Running Test...'}</span>
              </>
            ) : (
              <>
                <CreditCard className="w-6 h-6" />
                <span>Run Payment Flow Test</span>
              </>
            )}
          </button>
        </div>

        {/* Test Results */}
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Overall Result */}
            <div className={`p-6 rounded-lg border-2 ${
              testResult.success 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                {testResult.success ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500" />
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {testResult.success ? 'Payment Flow Test Passed!' : 'Payment Flow Test Failed'}
                  </h2>
                  <p className="text-gray-600">
                    {testResult.message || testResult.error}
                  </p>
                </div>
              </div>
            </div>

            {/* Test Steps Results */}
            {testResult.success && testResult.test_results && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Test Steps Results</h3>
                </div>
                <div className="p-6 space-y-4">
                  {Object.entries(testResult.test_results).map(([step, status]) => (
                    <div key={step} className={`p-4 rounded-lg border ${getStepColor(status)}`}>
                      <div className="flex items-center space-x-3">
                        {getStepIcon(status)}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 capitalize">
                            {step.replace(/_/g, ' ')}
                          </h4>
                          <p className="text-sm text-gray-600">{status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Data Used */}
            {testResult.success && testResult.test_data && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Donor Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <User className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Test Donor</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">ID:</span> {testResult.test_data.donor.id}</p>
                    <p><span className="font-medium">Name:</span> {testResult.test_data.donor.name}</p>
                    <p><span className="font-medium">Email:</span> {testResult.test_data.donor.email}</p>
                  </div>
                </div>

                {/* Organization Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Building2 className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Test Organization</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">ID:</span> {testResult.test_data.organization.id}</p>
                    <p><span className="font-medium">Name:</span> {testResult.test_data.organization.name}</p>
                    <p><span className="font-medium">Email:</span> {testResult.test_data.organization.email}</p>
                    <p><span className="font-medium">Balance Before:</span> ${testResult.test_data.organization.balance_before}</p>
                    <p><span className="font-medium">Balance After:</span> ${testResult.test_data.organization.balance_after}</p>
                    <p className={`font-medium ${testResult.test_data.organization.balance_increased ? 'text-green-600' : 'text-yellow-600'}`}>
                      {testResult.test_data.organization.balance_increased ? '✅ Balance Updated' : '⚠️ No Balance Change'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details */}
            {testResult.success && testResult.test_data?.payment && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Payment Intent ID:</span></p>
                    <p className="text-blue-600 font-mono text-xs break-all">{testResult.test_data.payment.payment_intent_id}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Transaction ID:</span></p>
                    <p className="text-purple-600 font-mono text-xs">{testResult.test_data.payment.transaction_id}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Amount:</span> ${testResult.test_data.payment.amount}</p>
                    <p><span className="font-medium">Currency:</span> {testResult.test_data.payment.currency}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Status:</span> {testResult.test_data.payment.status}</p>
                    <p><span className="font-medium">Created:</span> {new Date(testResult.test_data.payment.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* API Endpoints Tested */}
            {testResult.success && testResult.api_endpoints_tested && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">API Endpoints Tested</h3>
                <div className="space-y-2">
                  {testResult.api_endpoints_tested.map((endpoint, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-mono text-gray-700">{endpoint}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Details */}
            {!testResult.success && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4">Error Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Error:</span> {testResult.error}</p>
                  {testResult.step && <p><span className="font-medium">Failed at:</span> {testResult.step}</p>}
                  {testResult.details && (
                    <div>
                      <p className="font-medium mb-2">Details:</p>
                      <pre className="bg-white p-3 rounded border text-xs overflow-auto">
                        {JSON.stringify(testResult.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">What This Test Does:</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <ArrowRight className="w-4 h-4" />
              <span>1. Checks if test donor and organization exist</span>
            </div>
            <div className="flex items-center space-x-2">
              <ArrowRight className="w-4 h-4" />
              <span>2. Creates a Stripe payment intent ($5.00)</span>
            </div>
            <div className="flex items-center space-x-2">
              <ArrowRight className="w-4 h-4" />
              <span>3. Saves the payment record to database</span>
            </div>
            <div className="flex items-center space-x-2">
              <ArrowRight className="w-4 h-4" />
              <span>4. Verifies database record was created</span>
            </div>
            <div className="flex items-center space-x-2">
              <ArrowRight className="w-4 h-4" />
              <span>5. Checks organization balance update</span>
            </div>
            <div className="flex items-center space-x-2">
              <ArrowRight className="w-4 h-4" />
              <span>6. Tests payment history retrieval</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
