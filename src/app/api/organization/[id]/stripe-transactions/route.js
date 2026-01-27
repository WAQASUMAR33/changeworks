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

    const stripe = getStripe();
    
    // Fetch charges (payments) from the connected account
    const charges = await stripe.charges.list(
      { limit: 100 },
      { stripeAccount: organization.stripeAccountId }
    );

    // Map to a common format
    const transactions = charges.data.map(charge => ({
      id: charge.id,
      transaction_id: charge.id, 
      amount: charge.amount / 100, // Stripe uses cents
      currency: charge.currency,
      status: charge.status === 'succeeded' ? 'completed' : charge.status,
      transaction_date: new Date(charge.created * 1000).toISOString(),
      description: charge.description || charge.statement_descriptor || 'Stripe Payment',
      donor: {
          name: charge.billing_details?.name || charge.metadata?.donor_name || 'Unknown',
          email: charge.billing_details?.email || charge.receipt_email || charge.metadata?.donor_email || 'Unknown'
      },
      method: 'stripe',
      card_brand: charge.payment_method_details?.card?.brand,
      card_last4: charge.payment_method_details?.card?.last4,
      receipt_url: charge.receipt_url,
      ghl_id: charge.metadata?.ghl_id
    }));

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
