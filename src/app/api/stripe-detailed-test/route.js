import { NextResponse } from "next/server";
import Stripe from 'stripe';

export async function GET() {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) {
      return NextResponse.json({
        success: false,
        error: "No Stripe key found"
      });
    }

    // Try to initialize Stripe with detailed error handling
    let stripe;
    try {
      stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
      });
    } catch (initError) {
      return NextResponse.json({
        success: false,
        error: "Failed to initialize Stripe client",
        details: initError.message,
        key_info: {
          length: stripeKey.length,
          prefix: stripeKey.substring(0, 10),
          suffix: stripeKey.substring(stripeKey.length - 4)
        }
      });
    }

    // Test 1: Try to retrieve account info (simplest test)
    try {
      const account = await stripe.accounts.retrieve();
      return NextResponse.json({
        success: true,
        message: "Stripe API connection successful",
        test_results: {
          account_test: "✅ PASSED",
          account_id: account.id,
          country: account.country,
          default_currency: account.default_currency,
          environment: stripeKey.startsWith('sk_test_') ? 'test' : 'live'
        }
      });
    } catch (accountError) {
      // Test 2: Try creating a simple payment intent if account fails
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 100, // $1.00
          currency: 'usd',
          payment_method_types: ['card'],
          description: 'API validation test'
        });

        return NextResponse.json({
          success: true,
          message: "Stripe API working (payment intent created)",
          test_results: {
            account_test: "❌ FAILED",
            payment_intent_test: "✅ PASSED",
            payment_intent_id: paymentIntent.id,
            environment: stripeKey.startsWith('sk_test_') ? 'test' : 'live'
          },
          note: "Account retrieval failed but payment intent creation works"
        });
      } catch (paymentError) {
        return NextResponse.json({
          success: false,
          error: "Stripe API key is invalid",
          details: {
            account_error: accountError.message,
            payment_error: paymentError.message,
            error_type: paymentError.type,
            error_code: paymentError.code
          },
          key_info: {
            length: stripeKey.length,
            prefix: stripeKey.substring(0, 10),
            suffix: stripeKey.substring(stripeKey.length - 4),
            environment: stripeKey.startsWith('sk_test_') ? 'test' : 'live'
          },
          suggestions: [
            "The API key format is correct but Stripe is rejecting it",
            "This usually means the key is expired, revoked, or from wrong account",
            "Go to Stripe Dashboard > Developers > API Keys",
            "Generate fresh test keys and update your .env.local file",
            "Make sure you're copying from the correct Stripe account"
          ]
        }, { status: 401 });
      }
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Unexpected error during Stripe test",
      details: error.message
    }, { status: 500 });
  }
}
