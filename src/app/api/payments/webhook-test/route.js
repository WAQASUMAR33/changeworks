import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Test webhook endpoint WITHOUT signature verification for local testing
export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('🔗 Webhook test received:', {
      type: body.type,
      id: body.id,
      created: new Date(body.created * 1000),
    });

    // Handle the event just like the real webhook
    switch (body.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(body.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(body.data.object);
        break;
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(body.data.object);
        break;
      case 'payment_intent.processing':
        await handlePaymentIntentProcessing(body.data.object);
        break;
      default:
        console.log(`❓ Unhandled event type ${body.type}`);
        return NextResponse.json({ 
          received: true, 
          message: `Event type ${body.type} not handled`,
          event_id: body.id 
        });
    }

    return NextResponse.json({ 
      received: true, 
      processed: true,
      event_type: body.type,
      event_id: body.id,
      message: "Webhook processed successfully"
    });

  } catch (error) {
    console.error('❌ Webhook test error:', error);
    return NextResponse.json({
      received: false,
      error: 'Webhook handler failed',
      details: error.message
    }, { status: 500 });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log('✅ Processing payment_intent.succeeded:', paymentIntent.id);

    const donorId = parseInt(paymentIntent.metadata.donor_id);
    const organizationId = parseInt(paymentIntent.metadata.organization_id);
    const amount = paymentIntent.amount_received / 100; // Convert from cents

    // First, try to find existing transaction
    const existingTransaction = await prisma.saveTrRecord.findFirst({
      where: {
        trx_details: {
          contains: paymentIntent.id
        }
      }
    });

    if (existingTransaction) {
      console.log('📝 Updating existing transaction:', existingTransaction.id);
      
      // Update existing transaction
      await prisma.saveTrRecord.update({
        where: { id: existingTransaction.id },
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
    } else {
      console.log('📝 Creating new transaction record');
      
      // Create new transaction record
      await prisma.saveTrRecord.create({
        data: {
          trx_id: `webhook_${paymentIntent.id}_${Date.now()}`,
          trx_date: new Date(paymentIntent.created * 1000),
          trx_amount: amount,
          trx_method: 'stripe',
          trx_recipt_url: paymentIntent.receipt_url,
          trx_donor_id: donorId,
          trx_organization_id: organizationId,
          trx_details: JSON.stringify({
            payment_intent_id: paymentIntent.id,
            stripe_payment_method: paymentIntent.payment_method,
            stripe_status: paymentIntent.status,
            stripe_amount_received: paymentIntent.amount_received,
            stripe_created: new Date(paymentIntent.created * 1000),
            webhook_processed_at: new Date()
          }),
          pay_status: 'completed'
        }
      });
    }

    // Update organization balance
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        balance: {
          increment: amount
        }
      }
    });

    console.log(`💰 Updated organization ${organizationId} balance by $${amount}`);

  } catch (error) {
    console.error('❌ Error handling payment_intent.succeeded:', error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log('❌ Processing payment_intent.payment_failed:', paymentIntent.id);

    // Update or create transaction record
    const existingTransaction = await prisma.saveTrRecord.findFirst({
      where: {
        trx_details: {
          contains: paymentIntent.id
        }
      }
    });

    if (existingTransaction) {
      await prisma.saveTrRecord.update({
        where: { id: existingTransaction.id },
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
    }

    console.log('💔 Payment failed - transaction updated');

  } catch (error) {
    console.error('❌ Error handling payment_intent.payment_failed:', error);
    throw error;
  }
}

async function handlePaymentIntentCanceled(paymentIntent) {
  try {
    console.log('🚫 Processing payment_intent.canceled:', paymentIntent.id);

    const existingTransaction = await prisma.saveTrRecord.findFirst({
      where: {
        trx_details: {
          contains: paymentIntent.id
        }
      }
    });

    if (existingTransaction) {
      await prisma.saveTrRecord.update({
        where: { id: existingTransaction.id },
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
    }

    console.log('🚫 Payment canceled - transaction updated');

  } catch (error) {
    console.error('❌ Error handling payment_intent.canceled:', error);
    throw error;
  }
}

async function handlePaymentIntentProcessing(paymentIntent) {
  try {
    console.log('⏳ Processing payment_intent.processing:', paymentIntent.id);

    const existingTransaction = await prisma.saveTrRecord.findFirst({
      where: {
        trx_details: {
          contains: paymentIntent.id
        }
      }
    });

    if (existingTransaction) {
      await prisma.saveTrRecord.update({
        where: { id: existingTransaction.id },
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
    }

    console.log('⏳ Payment processing - transaction updated');

  } catch (error) {
    console.error('❌ Error handling payment_intent.processing:', error);
    throw error;
  }
}
