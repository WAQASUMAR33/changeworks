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

// Validation schema for saving payment record
const savePaymentSchema = z.object({
  payment_intent_id: z.string().min(1, "Payment intent ID is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().min(3).max(3).default("USD"),
  donor_id: z.number().int().positive("Donor ID is required"),
  organization_id: z.number().int().positive("Organization ID is required"),
  status: z.enum(["succeeded", "pending", "failed", "canceled"]),
  payment_method: z.string().default("stripe"),
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
    const { payment_intent_id, amount, currency, donor_id, organization_id, status, payment_method } = savePaymentSchema.parse(body);

    // Retrieve the payment intent from Stripe to verify it exists and get additional details
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (!paymentIntent) {
      return NextResponse.json({
        success: false,
        error: "Payment intent not found"
      }, { status: 404 });
    }

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
      select: { id: true, name: true }
    });
    
    if (!organization) {
      return NextResponse.json({
        success: false,
        error: "Invalid organization ID"
      }, { status: 400 });
    }

    // Create a unique transaction ID
    const transactionId = `stripe_${payment_intent_id}_${Date.now()}`;

    // Check if this payment intent has already been saved
    const existingTransaction = await prisma.saveTrRecord.findFirst({
      where: {
        trx_details: {
          contains: payment_intent_id
        }
      }
    });

    let transaction;

    if (existingTransaction) {
      // Update existing transaction
      transaction = await prisma.saveTrRecord.update({
        where: { id: existingTransaction.id },
        data: {
          pay_status: status === 'succeeded' ? 'completed' : status,
          trx_amount: amount,
          trx_recipt_url: paymentIntent.receipt_url,
          trx_details: JSON.stringify({
            payment_intent_id: payment_intent_id,
            stripe_payment_method: paymentIntent.payment_method,
            stripe_status: paymentIntent.status,
            stripe_amount_received: paymentIntent.amount_received,
            stripe_created: new Date(paymentIntent.created * 1000),
            updated_at: new Date()
          }),
          updated_at: new Date()
        },
        include: {
          donor: { select: { id: true, name: true, email: true } },
          organization: { select: { id: true, name: true } }
        }
      });
    } else {
      // Create new transaction record
      transaction = await prisma.saveTrRecord.create({
        data: {
          trx_id: transactionId,
          trx_date: new Date(paymentIntent.created * 1000),
          trx_amount: amount,
          trx_method: payment_method,
          trx_recipt_url: paymentIntent.receipt_url,
          trx_donor_id: donor_id,
          trx_organization_id: organization_id,
          trx_details: JSON.stringify({
            payment_intent_id: payment_intent_id,
            stripe_payment_method: paymentIntent.payment_method,
            stripe_status: paymentIntent.status,
            stripe_amount_received: paymentIntent.amount_received,
            stripe_created: new Date(paymentIntent.created * 1000),
          }),
          pay_status: status === 'succeeded' ? 'completed' : status,
        },
        include: {
          donor: { select: { id: true, name: true, email: true } },
          organization: { select: { id: true, name: true } }
        }
      });
    }

    // If payment was successful, update organization balance
    if (status === 'succeeded') {
      await prisma.organization.update({
        where: { id: organization_id },
        data: {
          balance: {
            increment: amount
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      transaction: transaction,
      message: "Payment record saved successfully"
    });

  } catch (error) {
    console.error('Error saving payment record:', error);
    
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
        error: "Stripe error",
        details: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: "Failed to save payment record",
      details: error.message
    }, { status: 500 });
  }
}
