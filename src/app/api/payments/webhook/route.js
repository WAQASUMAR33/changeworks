import { NextResponse } from "next/server";
import Stripe from 'stripe';
import { prisma } from "../../../lib/prisma";

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({
        error: 'Webhook signature verification failed'
      }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;
      case 'payment_intent.processing':
        await handlePaymentIntentProcessing(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({
      error: 'Webhook handler failed'
    }, { status: 500 });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('Payment succeeded:', paymentIntent.id);

    const donorId = parseInt(paymentIntent.metadata.donor_id);
    const organizationId = parseInt(paymentIntent.metadata.organization_id);
    const amount = paymentIntent.amount_received / 100; // Convert from cents

    // Update transaction record
    await prisma.saveTrRecord.updateMany({
      where: {
        trx_details: {
          contains: paymentIntent.id
        }
      },
      data: {
        pay_status: 'completed',
        trx_recipt_url: paymentIntent.receipt_url,
        trx_details: JSON.stringify({
          payment_intent_id: paymentIntent.id,
          stripe_payment_method: paymentIntent.payment_method,
          stripe_status: paymentIntent.status,
          stripe_amount_received: paymentIntent.amount_received,
          stripe_created: new Date(paymentIntent.created * 1000),
          webhook_processed_at: new Date()
        }),
        updated_at: new Date()
      }
    });

    // Update organization balance
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        balance: {
          increment: amount
        }
      }
    });

    console.log(`Updated organization ${organizationId} balance by $${amount}`);

  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log('Payment failed:', paymentIntent.id);

    // Update transaction record
    await prisma.saveTrRecord.updateMany({
      where: {
        trx_details: {
          contains: paymentIntent.id
        }
      },
      data: {
        pay_status: 'failed',
        trx_details: JSON.stringify({
          payment_intent_id: paymentIntent.id,
          stripe_status: paymentIntent.status,
          stripe_last_payment_error: paymentIntent.last_payment_error,
          webhook_processed_at: new Date()
        }),
        updated_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent) {
  try {
    console.log('Payment canceled:', paymentIntent.id);

    // Update transaction record
    await prisma.saveTrRecord.updateMany({
      where: {
        trx_details: {
          contains: paymentIntent.id
        }
      },
      data: {
        pay_status: 'cancelled',
        trx_details: JSON.stringify({
          payment_intent_id: paymentIntent.id,
          stripe_status: paymentIntent.status,
          webhook_processed_at: new Date()
        }),
        updated_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error handling payment_intent.canceled:', error);
  }
}

async function handlePaymentIntentProcessing(paymentIntent) {
  try {
    console.log('Payment processing:', paymentIntent.id);

    // Update transaction record
    await prisma.saveTrRecord.updateMany({
      where: {
        trx_details: {
          contains: paymentIntent.id
        }
      },
      data: {
        pay_status: 'pending',
        trx_details: JSON.stringify({
          payment_intent_id: paymentIntent.id,
          stripe_status: paymentIntent.status,
          webhook_processed_at: new Date()
        }),
        updated_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error handling payment_intent.processing:', error);
  }
}
