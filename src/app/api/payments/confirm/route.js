import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from 'stripe';
import { prisma } from "../../../lib/prisma";

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

// Validation schema for payment confirmation
const confirmPaymentSchema = z.object({
  payment_intent_id: z.string().min(1, "Payment intent ID is required"),
  payment_method_id: z.string().optional(),
});

export async function POST(request) {
  try {
    // Check if Stripe is properly initialized
    if (!stripe) {
      return NextResponse.json({
        success: false,
        error: "Payment service not available",
        details: "Stripe configuration is missing"
      }, { status: 503 });
    }

    const body = await request.json();
    const { payment_intent_id, payment_method_id } = confirmPaymentSchema.parse(body);

    // Retrieve the payment intent from Stripe
    let paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (!paymentIntent) {
      return NextResponse.json({
        success: false,
        error: "Payment intent not found"
      }, { status: 404 });
    }

    // If payment method is provided and payment intent requires confirmation
    if (payment_method_id && paymentIntent.status === 'requires_payment_method') {
      // Confirm the payment intent with the payment method
      paymentIntent = await stripe.paymentIntents.confirm(payment_intent_id, {
        payment_method: payment_method_id,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`, // You might want to configure this
      });
    } else if (paymentIntent.status === 'requires_confirmation') {
      // Confirm the payment intent
      paymentIntent = await stripe.paymentIntents.confirm(payment_intent_id);
    }

    // Get donor and organization IDs from payment intent metadata
    const donorId = parseInt(paymentIntent.metadata.donor_id);
    const organizationId = parseInt(paymentIntent.metadata.organization_id);

    // Update the transaction record in the database
    const updatedTransaction = await prisma.saveTrRecord.updateMany({
      where: {
        trx_details: {
          contains: payment_intent_id
        }
      },
      data: {
        pay_status: paymentIntent.status === 'succeeded' ? 'completed' : 
                   paymentIntent.status === 'processing' ? 'pending' : 
                   paymentIntent.status === 'requires_action' ? 'pending' :
                   paymentIntent.status === 'canceled' ? 'cancelled' : 'failed',
        trx_recipt_url: paymentIntent.receipt_url,
        trx_details: JSON.stringify({
          payment_intent_id: payment_intent_id,
          stripe_payment_method: paymentIntent.payment_method,
          stripe_status: paymentIntent.status,
          stripe_amount_received: paymentIntent.amount_received,
          stripe_created: new Date(paymentIntent.created * 1000),
          confirmed_at: new Date()
        }),
        updated_at: new Date()
      }
    });

    // If payment was successful, update organization balance
    if (paymentIntent.status === 'succeeded') {
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          balance: {
            increment: paymentIntent.amount_received / 100 // Convert from cents
          }
        }
      });
    }

    // Determine response based on payment intent status
    let responseData = {
      success: true,
      payment_intent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        receipt_url: paymentIntent.receipt_url,
      }
    };

    // Handle different payment statuses
    switch (paymentIntent.status) {
      case 'succeeded':
        responseData.message = 'Payment successful!';
        break;
      case 'processing':
        responseData.message = 'Payment is being processed';
        break;
      case 'requires_action':
        responseData.message = 'Payment requires additional action';
        responseData.requires_action = true;
        responseData.next_action = paymentIntent.next_action;
        break;
      case 'requires_payment_method':
        responseData.message = 'Payment requires a valid payment method';
        responseData.requires_payment_method = true;
        break;
      case 'canceled':
        responseData.success = false;
        responseData.message = 'Payment was canceled';
        break;
      default:
        responseData.success = false;
        responseData.message = 'Payment failed';
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error confirming payment:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Validation error",
        details: error.errors
      }, { status: 400 });
    }

    if (error.type === 'StripeError') {
      return NextResponse.json({
        success: false,
        error: "Payment processing error",
        details: error.message,
        decline_code: error.decline_code,
        payment_intent_status: error.payment_intent?.status
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: "Failed to confirm payment",
      details: error.message
    }, { status: 500 });
  }
}
