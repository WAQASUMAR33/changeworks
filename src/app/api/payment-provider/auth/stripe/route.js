export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { buildStripeConnectOAuthUrl } from '@/app/lib/payment-provider/stripe';
import { generateStateToken } from '@/app/lib/payment-provider/crypto';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId');
  const email      = searchParams.get('email') ?? undefined;

  if (!locationId) {
    return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
  }

  const state   = generateStateToken({ locationId, source: 'stripe-connect' });
  const authUrl = buildStripeConnectOAuthUrl(state, email);
  return NextResponse.redirect(authUrl);
}
