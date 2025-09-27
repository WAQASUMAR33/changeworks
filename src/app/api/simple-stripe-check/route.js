import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    console.log('🔍 Simple check: Looking for Stripe transactions in database...');

    // Check for any transactions with stripe method
    const stripeTransactions = await prisma.saveTrRecord.findMany({
      where: {
        OR: [
          { trx_method: 'stripe' },
          { trx_details: { contains: 'payment_intent' } },
          { trx_details: { contains: 'stripe' } }
        ]
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 10,
      include: {
        donor: { 
          select: { id: true, name: true, email: true } 
        },
        organization: { 
          select: { id: true, name: true, balance: true } 
        }
      }
    });

    // Get total counts
    const totalStripeCount = await prisma.saveTrRecord.count({
      where: {
        OR: [
          { trx_method: 'stripe' },
          { trx_details: { contains: 'payment_intent' } }
        ]
      }
    });

    const totalTransactions = await prisma.saveTrRecord.count();

    // Check what's in the database
    const allTransactions = await prisma.saveTrRecord.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        trx_id: true,
        trx_amount: true,
        trx_method: true,
        pay_status: true,
        trx_details: true,
        created_at: true
      }
    });

    return NextResponse.json({
      success: true,
      message: totalStripeCount > 0 
        ? `✅ Found ${totalStripeCount} Stripe transactions in database`
        : `❌ No Stripe transactions found. Found ${totalTransactions} total transactions.`,
      stripe_transactions_found: totalStripeCount > 0,
      summary: {
        stripe_transactions: totalStripeCount,
        total_transactions: totalTransactions,
        database_connected: true
      },
      stripe_transactions: stripeTransactions.map(txn => ({
        id: txn.id,
        transaction_id: txn.trx_id,
        amount: txn.trx_amount,
        method: txn.trx_method,
        status: txn.pay_status,
        created_at: txn.created_at,
        donor_name: txn.donor?.name,
        organization_name: txn.organization?.name,
        has_stripe_details: txn.trx_details?.includes('payment_intent') || false
      })),
      all_recent_transactions: allTransactions.map(txn => ({
        id: txn.trx_id,
        amount: txn.trx_amount,
        method: txn.trx_method,
        status: txn.pay_status,
        has_details: !!txn.trx_details,
        created: txn.created_at
      })),
      database_info: {
        table: "saveTrRecord",
        search_criteria: [
          "trx_method = 'stripe'",
          "trx_details contains 'payment_intent'",
          "trx_details contains 'stripe'"
        ]
      }
    });

  } catch (error) {
    console.error('❌ Database check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: "Database check failed",
      details: error.message,
      possible_causes: [
        "Database connection issue",
        "saveTrRecord table doesn't exist",
        "Prisma client not generated",
        "Database permissions issue"
      ],
      solutions: [
        "Check DATABASE_URL in environment",
        "Run 'npx prisma generate'", 
        "Run 'npx prisma db push'",
        "Verify database server is running"
      ]
    }, { status: 500 });
  }
}
