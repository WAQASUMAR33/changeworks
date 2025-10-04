import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { payment_intent_id, donor_id, organization_id, amount } = body;

    console.log('🔧 Manual payment confirmation...');
    console.log('Payment Intent ID:', payment_intent_id);
    console.log('Donor ID:', donor_id);
    console.log('Organization ID:', organization_id);
    console.log('Amount:', amount);

    // Validate required fields
    if (!payment_intent_id || !donor_id || !organization_id || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: payment_intent_id, donor_id, organization_id, amount'
      }, { status: 400 });
    }

    const donorId = parseInt(donor_id);
    const organizationId = parseInt(organization_id);
    const amountInDollars = parseFloat(amount);

    // Find the transaction record
    const existingTransaction = await prisma.saveTrRecord.findFirst({
      where: {
        trx_details: {
          contains: payment_intent_id
        }
      }
    });

    if (!existingTransaction) {
      console.log('❌ No transaction record found');
      return NextResponse.json({
        success: false,
        error: 'No transaction record found',
        payment_intent_id
      }, { status: 404 });
    }

    if (existingTransaction.pay_status === 'completed') {
      console.log('⚠️ Transaction already completed');
      return NextResponse.json({
        success: true,
        message: 'Transaction already completed',
        transaction: existingTransaction
      });
    }

    console.log('✅ Found transaction record:', existingTransaction.id);

    // Update transaction record
    const updatedTransaction = await prisma.saveTrRecord.update({
      where: {
        id: existingTransaction.id
      },
      data: {
        pay_status: 'completed',
        trx_recipt_url: 'https://pay.stripe.com/receipts/' + payment_intent_id,
        trx_details: JSON.stringify({
          payment_intent_id: payment_intent_id,
          stripe_payment_method: 'card',
          stripe_status: 'succeeded',
          stripe_amount_received: amountInDollars * 100, // Convert to cents
          stripe_created: new Date(),
          webhook_processed_at: new Date(),
          manually_confirmed: true,
          confirmed_by: 'manual_endpoint'
        }),
        updated_at: new Date()
      }
    });

    // Update organization balance
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        balance: {
          increment: amountInDollars
        }
      }
    });

    console.log(`✅ Updated organization ${organizationId} balance by $${amountInDollars}`);
    console.log(`✅ Updated transaction ${existingTransaction.id} to completed status`);

    return NextResponse.json({
      success: true,
      message: 'Payment manually confirmed successfully',
      transaction: {
        id: updatedTransaction.id,
        status: updatedTransaction.pay_status,
        amount: updatedTransaction.trx_amount
      },
      organization: {
        id: updatedOrganization.id,
        name: updatedOrganization.name,
        balance: updatedOrganization.balance
      }
    });

  } catch (error) {
    console.error('❌ Error in manual payment confirmation:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
