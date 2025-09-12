import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Simple test without initializing full Stripe client
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) {
      return NextResponse.json({
        success: false,
        error: "No Stripe key found"
      });
    }

    // Basic validation
    const isValidFormat = stripeKey.startsWith('sk_test_') || stripeKey.startsWith('sk_live_');
    const hasCorrectLength = stripeKey.length > 50;

    return NextResponse.json({
      success: true,
      validation: {
        has_stripe_key: true,
        key_length: stripeKey.length,
        valid_format: isValidFormat,
        correct_length: hasCorrectLength,
        key_type: stripeKey.startsWith('sk_test_') ? 'test' : 'live',
        first_10_chars: stripeKey.substring(0, 10),
        last_4_chars: stripeKey.substring(stripeKey.length - 4)
      },
      next_step: isValidFormat && hasCorrectLength ? 
        "Key format looks good - try testing Stripe API connection" :
        "Key format is invalid - check your Stripe dashboard for correct keys"
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Test failed",
      details: error.message
    }, { status: 500 });
  }
}
