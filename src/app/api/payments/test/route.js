import { NextResponse } from "next/server";
import Stripe from 'stripe';

// Initialize Stripe with proper error handling
let stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY environment variable is not set');
  } else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
}

export async function GET() {
  try {
    // Check if Stripe is properly initialized
    if (!stripe) {
      return NextResponse.json({
        success: false,
        error: "Stripe integration test failed",
        details: "STRIPE_SECRET_KEY environment variable is not set",
        suggestions: [
          "Set STRIPE_SECRET_KEY in your environment variables",
          "Verify that the Stripe secret key is valid",
          "Check your deployment environment configuration"
        ]
      }, { status: 503 });
    }

    // Test Stripe connection by retrieving account information
    const account = await stripe.accounts.retrieve();
    
    return NextResponse.json({
      success: true,
      message: "Stripe integration is working correctly",
      account: {
        id: account.id,
        country: account.country,
        default_currency: account.default_currency,
        email: account.email,
        business_profile: account.business_profile
      },
      stripe_version: stripe.VERSION,
      environment: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'live'
    });

  } catch (error) {
    console.error('Stripe test error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Stripe integration test failed",
      details: error.message,
      suggestions: [
        "Check if STRIPE_SECRET_KEY is set in environment variables",
        "Verify that the Stripe secret key is valid",
        "Ensure you have network connectivity to Stripe's API"
      ]
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Check if Stripe is properly initialized
    if (!stripe) {
      return NextResponse.json({
        success: false,
        error: "Payment service not available",
        details: "Stripe configuration is missing"
      }, { status: 503 });
    }

    // Create a test payment intent with minimal amount
    const testPaymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00 in cents
      currency: 'usd',
      payment_method_types: ['card'],
      description: 'Test payment intent - ChangeWorks API',
      metadata: {
        test: 'true',
        created_by: 'changewords_api_test'
      }
    });

    return NextResponse.json({
      success: true,
      message: "Test payment intent created successfully",
      payment_intent: {
        id: testPaymentIntent.id,
        amount: testPaymentIntent.amount,
        currency: testPaymentIntent.currency,
        status: testPaymentIntent.status,
        client_secret: testPaymentIntent.client_secret
      }
    });

  } catch (error) {
    console.error('Test payment intent creation error:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to create test payment intent",
      details: error.message
    }, { status: 500 });
  }
}
