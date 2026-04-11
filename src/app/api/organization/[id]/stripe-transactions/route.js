import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getStripe } from "../../../../../lib/stripe";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const organizationIdInt = parseInt(id);
    if (isNaN(organizationIdInt)) {
        return NextResponse.json({ error: "Invalid organization ID format" }, { status: 400 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationIdInt },
      select: { stripeAccountId: true, name: true }
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (!organization.stripeAccountId) {
      // Return empty list if no Stripe account is connected
      return NextResponse.json({ 
        success: true, 
        transactions: [], 
        organization: { name: organization.name },
        message: "No Stripe account connected" 
      });
    }

    const stripe = await getStripe();

    // Helper: treat empty/whitespace strings as missing
    const val = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

    // Use paymentIntents.list so py_/Link payments are fully represented
    const paymentIntents = await stripe.paymentIntents.list(
      { limit: 100, expand: ['data.customer', 'data.latest_charge'] },
      { stripeAccount: organization.stripeAccountId }
    );

    const transactions = paymentIntents.data
      .filter(pi => pi.status !== 'canceled')
      .map(pi => {
        const customer = typeof pi.customer === 'object' && pi.customer ? pi.customer : null;
        const charge   = typeof pi.latest_charge === 'object' && pi.latest_charge ? pi.latest_charge : null;
        const billing  = charge?.billing_details ?? {};

        const donorName =
          val(billing.name)                  ||
          val(pi.metadata?.customerName)     ||
          val(pi.metadata?.donor_name)       ||
          val(customer?.name)                ||
          null;

        const donorEmail =
          val(billing.email)                 ||
          val(charge?.receipt_email)         ||
          val(pi.receipt_email)              ||
          val(pi.metadata?.customerEmail)    ||
          val(pi.metadata?.donor_email)      ||
          val(customer?.email)               ||
          null;

        const status = pi.status === 'succeeded' ? 'completed'
          : pi.status === 'requires_payment_method' ? 'failed'
          : pi.status === 'processing' ? 'pending'
          : pi.status;

        return {
          id: pi.id,
          transaction_id: charge?.id || pi.id,
          amount: pi.amount / 100,
          currency: pi.currency,
          status,
          transaction_date: new Date(pi.created * 1000).toISOString(),
          description: pi.description || charge?.description || charge?.statement_descriptor || 'Stripe Payment',
          donor: { name: donorName, email: donorEmail },
          method: 'stripe',
          card_brand: charge?.payment_method_details?.card?.brand,
          card_last4: charge?.payment_method_details?.card?.last4,
          receipt_url: charge?.receipt_url,
          ghl_id: pi.metadata?.ghl_id,
        };
      });

    return NextResponse.json({
      success: true,
      transactions,
      organization: { name: organization.name }
    });

  } catch (error) {
    console.error("Error fetching Stripe transactions:", error);
    return NextResponse.json({ 
        success: false, 
        error: error.message || "Failed to fetch transactions" 
    }, { status: 500 });
  }
}
