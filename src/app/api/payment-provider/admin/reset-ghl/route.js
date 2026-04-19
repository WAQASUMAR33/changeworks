export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

/**
 * DELETE /api/payment-provider/admin/reset-ghl
 * Removes all GHL OAuth connections and their linked Stripe accounts.
 * Pass ?locationId=xxx to remove a single location, or omit to remove all.
 */
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId') ?? null;

  try {
    if (locationId) {
      const [ghl, stripe] = await Promise.all([
        prisma.ghlConnection.deleteMany({ where: { locationId } }),
        prisma.ghlStripeConnection.deleteMany({ where: { locationId } }),
      ]);
      console.log(`[reset-ghl] Removed locationId=${locationId} | ghlRows=${ghl.count} | stripeRows=${stripe.count}`);
      return NextResponse.json({ success: true, locationId, ghlRows: ghl.count, stripeRows: stripe.count });
    }

    // Remove ALL
    const [ghl, stripe] = await Promise.all([
      prisma.ghlConnection.deleteMany({}),
      prisma.ghlStripeConnection.deleteMany({}),
    ]);
    console.log(`[reset-ghl] Removed ALL | ghlRows=${ghl.count} | stripeRows=${stripe.count}`);
    return NextResponse.json({ success: true, ghlRows: ghl.count, stripeRows: stripe.count });
  } catch (err) {
    console.error('[reset-ghl] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
