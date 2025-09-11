import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    // Get recent webhook-created transactions (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentWebhookTransactions = await prisma.saveTrRecord.findMany({
      where: {
        created_at: {
          gte: twentyFourHoursAgo
        },
        trx_details: {
          contains: 'webhook_processed_at'
        }
      },
      include: {
        donor: { select: { name: true, email: true } },
        organization: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    // Get webhook processing statistics
    const webhookStats = {
      total_webhook_transactions: recentWebhookTransactions.length,
      successful_payments: recentWebhookTransactions.filter(t => t.pay_status === 'completed').length,
      failed_payments: recentWebhookTransactions.filter(t => t.pay_status === 'failed').length,
      pending_payments: recentWebhookTransactions.filter(t => t.pay_status === 'pending').length,
      total_amount_processed: recentWebhookTransactions
        .filter(t => t.pay_status === 'completed')
        .reduce((sum, t) => sum + t.trx_amount, 0)
    };

    return NextResponse.json({
      success: true,
      message: "Webhook status retrieved successfully",
      stats: webhookStats,
      recent_transactions: recentWebhookTransactions.map(t => ({
        id: t.id,
        transaction_id: t.trx_id,
        amount: t.trx_amount,
        status: t.pay_status,
        donor_name: t.donor.name,
        organization_name: t.organization.name,
        processed_at: t.created_at,
        webhook_data: t.trx_details ? JSON.parse(t.trx_details) : null
      })),
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching webhook status:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch webhook status",
      details: error.message
    }, { status: 500 });
  }
}
