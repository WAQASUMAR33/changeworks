export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { deauthorizeStripeAccount } from '@/app/lib/payment-provider/stripe';
import { getStripeAccount, saveStripeAccount } from '@/app/lib/payment-provider/tokenStore';

export async function POST(request) {
  const { locationId } = await request.json();
  if (!locationId) {
    return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
  }
  const account = await getStripeAccount(locationId);
  if (!account) {
    return NextResponse.json({ error: 'No Stripe account found for this location' }, { status: 404 });
  }
  try {
    await deauthorizeStripeAccount(account.stripeAccountId);
  } catch (err) {
    console.error('[Stripe Disconnect]', err.message);
  }
  await saveStripeAccount(locationId, null);
  return NextResponse.json({ success: true });
}
