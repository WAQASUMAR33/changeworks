'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Get the Stripe publishable key from environment variables
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Initialize global promise for platform account (optimization)
let platformStripePromise = null;
if (stripePublishableKey && stripePublishableKey.trim().startsWith('pk_')) {
  platformStripePromise = loadStripe(stripePublishableKey);
}

export default function StripeProvider({ children, stripeAccount }) {
  // Initialize state based on the initial prop to avoid race conditions
  const [stripePromise, setStripePromise] = useState(() => {
    if (stripeAccount && stripePublishableKey && stripePublishableKey.trim().startsWith('pk_')) {
      console.log(`🏦 Initializing Stripe for connected account (Sync): ${stripeAccount}`);
      return loadStripe(stripePublishableKey, { stripeAccount });
    }
    return platformStripePromise;
  });

  useEffect(() => {
    if (!stripePublishableKey || !stripePublishableKey.trim().startsWith('pk_')) return;

    if (stripeAccount) {
      console.log(`🏦 Switching Stripe to connected account: ${stripeAccount}`);
      const connectedPromise = loadStripe(stripePublishableKey, { stripeAccount });
      setStripePromise(connectedPromise);
    } else {
      console.log('🏦 Switching Stripe to platform account');
      setStripePromise(platformStripePromise);
    }
  }, [stripeAccount]);

  // Handle missing key
  if (!stripePublishableKey || !stripePublishableKey.trim()) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-700 font-semibold mb-2">Payment system not configured.</p>
        <p className="text-red-600 text-sm">Stripe publishable key is missing.</p>
      </div>
    );
  }

  // Handle invalid key format
  if (!stripePublishableKey.trim().startsWith('pk_')) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-700 font-semibold mb-2">Invalid Configuration.</p>
        <p className="text-red-600 text-sm">Stripe publishable key must start with 'pk_'.</p>
      </div>
    );
  }

  // Handle loading/failure
  if (!stripePromise) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[100px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-gray-500 text-sm font-medium">Initializing secure gateway...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} key={stripeAccount || 'platform'}>
      {children}
    </Elements>
  );
}
