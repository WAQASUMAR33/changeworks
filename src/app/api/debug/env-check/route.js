import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    return NextResponse.json({
      success: true,
      env_check: {
        stripe_key_exists: !!stripeKey,
        stripe_key_length: stripeKey ? stripeKey.length : 0,
        stripe_key_prefix: stripeKey ? stripeKey.substring(0, 7) : 'not_set',
        stripe_key_suffix: stripeKey ? stripeKey.substring(stripeKey.length - 4) : 'not_set',
        is_live_key: stripeKey ? stripeKey.startsWith('sk_live_') : false,
        is_test_key: stripeKey ? stripeKey.startsWith('sk_test_') : false,
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Failed to check environment",
      details: error.message
    }, { status: 500 });
  }
}
