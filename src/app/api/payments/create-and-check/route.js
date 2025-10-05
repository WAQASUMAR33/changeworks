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

// Validation schema for payment intent creation
const paymentIntentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().min(3).max(3).default("USD"),
  donor_id: z.number().int().positive("Donor ID is required"),
  organization_id: z.number().int().positive("Organization ID is required"),
  description: z.string().optional(),
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
    console.log('🔍 Payment Intent Request Body:', body);
    
    const { amount, currency, donor_id, organization_id, description } = paymentIntentSchema.parse(body);

    // Verify donor exists
    const donor = await prisma.donor.findUnique({
      where: { id: donor_id },
      select: { id: true, name: true, email: true }
    });
    
    if (!donor) {
      return NextResponse.json({
        success: false,
        error: "Invalid donor ID"
      }, { status: 400 });
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organization_id },
      select: { id: true, name: true, email: true }
    });
    
    if (!organization) {
      return NextResponse.json({
        success: false,
        error: "Invalid organization ID"
      }, { status: 400 });
    }

    // Convert dollars to cents for Stripe
    const amountInCents = Math.round(amount * 100);
    console.log(`💰 Payment amount: $${amount} = ${amountInCents} cents`);

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      payment_method_types: ['card'],
      description: description || `Donation to ${organization.name}`,
      metadata: {
        donor_id: donor_id.toString(),
        organization_id: organization_id.toString(),
        donor_name: donor.name,
        organization_name: organization.name,
      },
      receipt_email: donor.email,
    });

    // Create a transaction record in the database
    const transactionId = `pi_${paymentIntent.id}_${Date.now()}`;
    
    const transaction = await prisma.saveTrRecord.create({
      data: {
        trx_id: transactionId,
        trx_date: new Date(),
        trx_amount: amount,
        trx_method: 'stripe',
        trx_donor_id: donor_id,
        trx_organization_id: organization_id,
        trx_details: JSON.stringify({
          payment_intent_id: paymentIntent.id,
          description: description || `Donation to ${organization.name}`,
          stripe_metadata: paymentIntent.metadata
        }),
        pay_status: 'pending'
      }
    });

    // Immediately check the payment status
    console.log(`🔍 Immediately checking payment status for ${paymentIntent.id}...`);
    
    try {
      const currentStripePayment = await stripe.paymentIntents.retrieve(paymentIntent.id);
      console.log(`📊 Current Stripe status: ${currentStripePayment.status}`);
      
      if (currentStripePayment.status === 'succeeded') {
        // Payment already succeeded, update to completed
        const updatedTransaction = await prisma.saveTrRecord.update({
          where: { id: transaction.id },
          data: {
            pay_status: 'completed',
            trx_recipt_url: currentStripePayment.receipt_url || `https://pay.stripe.com/receipts/${paymentIntent.id}`,
            trx_details: JSON.stringify({
              payment_intent_id: paymentIntent.id,
              description: description || `Donation to ${organization.name}`,
              stripe_metadata: paymentIntent.metadata,
              stripe_status: currentStripePayment.status,
              stripe_amount_received: currentStripePayment.amount_received,
              stripe_payment_method: currentStripePayment.payment_method,
              stripe_created: new Date(currentStripePayment.created * 1000),
              immediately_updated_at: new Date()
            }),
            updated_at: new Date()
          }
        });

        // Update organization balance
        await prisma.organization.update({
          where: { id: organization_id },
          data: {
            balance: {
              increment: amount
            }
          }
        });

        console.log(`✅ Immediately updated payment to completed status`);
        
        return NextResponse.json({
          success: true,
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
          amount: amount,
          currency: currency,
          transaction_id: transactionId,
          transaction_db_id: transaction.id,
          status: 'completed',
          message: "Payment intent created and immediately completed",
          organization_balance_updated: true
        });

      } else if (currentStripePayment.status === 'payment_failed') {
        // Payment failed, update to failed
        await prisma.saveTrRecord.update({
          where: { id: transaction.id },
          data: {
            pay_status: 'failed',
            trx_details: JSON.stringify({
              payment_intent_id: paymentIntent.id,
              description: description || `Donation to ${organization.name}`,
              stripe_metadata: paymentIntent.metadata,
              stripe_status: currentStripePayment.status,
              stripe_last_payment_error: currentStripePayment.last_payment_error,
              immediately_updated_at: new Date()
            }),
            updated_at: new Date()
          }
        });

        console.log(`❌ Payment failed immediately`);
        
        return NextResponse.json({
          success: true,
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
          amount: amount,
          currency: currency,
          transaction_id: transactionId,
          transaction_db_id: transaction.id,
          status: 'failed',
          message: "Payment intent created but payment failed",
          error: currentStripePayment.last_payment_error?.message || 'Payment failed'
        });

      } else {
        // Payment still pending
        console.log(`⏳ Payment still pending: ${currentStripePayment.status}`);
        
        return NextResponse.json({
          success: true,
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id,
          amount: amount,
          currency: currency,
          transaction_id: transactionId,
          transaction_db_id: transaction.id,
          status: 'pending',
          message: "Payment intent created, waiting for payment completion",
          stripe_status: currentStripePayment.status
        });
      }

    } catch (stripeError) {
      console.error(`❌ Error checking Stripe status:`, stripeError);
      
      return NextResponse.json({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: amount,
        currency: currency,
        transaction_id: transactionId,
        transaction_db_id: transaction.id,
        status: 'pending',
        message: "Payment intent created, status check failed",
        stripe_error: stripeError.message
      });
    }

  } catch (error) {
    console.error('Error creating payment intent:', error);
    
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
        details: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: "Failed to create payment intent",
      details: error.message
    }, { status: 500 });
  }
}
