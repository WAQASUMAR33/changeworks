export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { buildGHLOAuthUrl } from '@/app/lib/payment-provider/ghl';
import { generateStateToken } from '@/app/lib/payment-provider/crypto';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId') ?? '';
  const state = generateStateToken({ locationId, source: 'ghl-oauth' });
  const authUrl = buildGHLOAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
