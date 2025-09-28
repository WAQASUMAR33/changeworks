import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/test/create-payment-method - Create a test payment method for testing
export async function POST(request) {
  try {
    const body = await request.json();
    const { customer_id, test_card = "4242424242424242" } = body;

    if (!customer_id) {
      return NextResponse.json(
        { success: false, error: 'customer_id is required' },
        { status: 400 }
      );
    }

    // For testing, we'll use Stripe's test payment method tokens
    // These are special test tokens that Stripe provides for testing
    const testPaymentMethodTokens = {
      "4242424242424242": "pm_card_visa", // Visa
      "4000000000000002": "pm_card_visa_debit", // Visa Debit
      "4000000000009995": "pm_card_visa_debit", // Visa Debit
      "5555555555554444": "pm_card_mastercard", // Mastercard
      "2223003122003222": "pm_card_mastercard", // Mastercard
    };

    const paymentMethodToken = testPaymentMethodTokens[test_card] || "pm_card_visa";

    // Create a payment method using the test token
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: paymentMethodToken,
      },
    });

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer_id,
    });

    // Set as default payment method
    await stripe.customers.update(customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    return NextResponse.json({
      success: true,
      payment_method: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        }
      },
      customer_id: customer_id,
      message: 'Test payment method created and attached successfully'
    });

  } catch (error) {
    console.error('Error creating test payment method:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create test payment method',
        details: {
          type: error.type,
          code: error.code,
          message: error.message,
          param: error.param
        }
      },
      { status: 500 }
    );
  }
}
