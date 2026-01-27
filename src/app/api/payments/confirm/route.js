import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from 'stripe';
import { prisma } from "../../../lib/prisma";

// Initialize Stripe
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  }
} catch (e) {
  console.error('Stripe init error:', e);
}

const schema = z.object({
  payment_intent_id: z.string().min(1),
});

export async function POST(request) {
  try {
    if (!stripe) {
      return NextResponse.json({ success: false, error: 'Stripe not configured' }, { status: 503 });
    }

    const body = await request.json();
    const { payment_intent_id } = schema.parse(body);

    console.log(`🔍 Confirming payment for intent: ${payment_intent_id}`);

    // 1. Retrieve the PaymentIntent from Stripe
    let pi;
    try {
      pi = await stripe.paymentIntents.retrieve(payment_intent_id);
    } catch (stripeError) {
      console.error('❌ Error retrieving payment intent:', stripeError);
      return NextResponse.json({ 
        success: false, 
        error: stripeError.message 
      }, { status: 400 });
    }

    if (pi.status !== 'succeeded') {
      return NextResponse.json({ 
        success: false, 
        error: `Payment not succeeded. Status: ${pi.status}` 
      }, { status: 400 });
    }

    // 2. Find the pending transaction in the database
    // We search by trx_id (which usually contains the PI ID) or trx_details
    const transaction = await prisma.saveTrRecord.findFirst({
      where: {
        OR: [
          { trx_id: { contains: payment_intent_id } },
          { trx_details: { contains: payment_intent_id } }
        ]
      }
    });

    if (!transaction) {
      console.error(`❌ Transaction record not found for PI: ${payment_intent_id}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction record not found' 
      }, { status: 404 });
    }

    if (transaction.pay_status === 'completed') {
      console.log(`✅ Transaction ${transaction.id} already completed`);
      return NextResponse.json({ success: true, transaction });
    }

    // 3. Update the transaction record
    const updatedTransaction = await prisma.saveTrRecord.update({
      where: { id: transaction.id },
      data: {
        pay_status: 'completed',
        trx_recipt_url: pi.receipt_url || `https://pay.stripe.com/receipts/${pi.id}`,
        trx_details: JSON.stringify({
          ...JSON.parse(transaction.trx_details || '{}'),
          payment_intent_id: pi.id,
          stripe_status: pi.status,
          stripe_payment_method: pi.payment_method,
          updated_at: new Date()
        }),
        updated_at: new Date()
      }
    });

    // 4. Update Organization Balance
    // Calculate amount in dollars (Stripe amount is in cents)
    const amountDollars = (pi.amount_received || pi.amount) / 100;
    const organizationAmount = amountDollars * 0.9; // 90% share

    await prisma.organization.update({
      where: { id: transaction.trx_organization_id },
      data: {
        balance: {
          increment: organizationAmount
        }
      }
    });

    console.log(`✅ Payment confirmed and recorded for PI: ${payment_intent_id}`);

    return NextResponse.json({ 
      success: true, 
      transaction: updatedTransaction 
    });

  } catch (error) {
    console.error('Confirmation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
