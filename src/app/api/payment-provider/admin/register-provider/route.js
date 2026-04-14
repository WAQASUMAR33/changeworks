export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { ghlClient, getValidAccessToken } from '@/app/lib/payment-provider/ghl';
import { getStripeAccount } from '@/app/lib/payment-provider/tokenStore';

export async function POST(request) {
  const { locationId } = await request.json();
  if (!locationId) return NextResponse.json({ error: 'locationId required' }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const results = {};

  try {
    const token = await getValidAccessToken(locationId);
    results.token = token ? `ok (${token.slice(0, 12)}...)` : 'missing';
  } catch (err) {
    results.token = `ERROR: ${err.message}`;
    return NextResponse.json({ step: 'get-token', results }, { status: 500 });
  }

  const client = await ghlClient(locationId);
  const providerBody = {
    name:        'ChangeWorks',
    description: 'Accept payments via Stripe Connect',
    paymentsUrl: `${appUrl}/payment-provider/checkout`,
    queryUrl:    `${appUrl}/api/payment-provider/payments/status`,
    imageUrl:    'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg',
  };

  try {
    const { data } = await client.post(`/payments/custom-provider/provider?locationId=${locationId}`, providerBody);
    results.createProvider = { ok: true, data };
  } catch (err) {
    results.createProvider = { ok: false, status: err.response?.status, error: err.response?.data ?? err.message };
  }

  if (!results.createProvider.ok) {
    try {
      const { data } = await client.post('/payments/integrations/provider/whitelabel', providerBody);
      results.createProviderAlt = { ok: true, data };
    } catch (err) {
      results.createProviderAlt = { ok: false, status: err.response?.status, error: err.response?.data ?? err.message };
    }
  }

  const stripeAccount  = await getStripeAccount(locationId);
  const apiKey         = process.env.GHL_CLIENT_SECRET;
  const livePubKey     = process.env.STRIPE_PUBLISHABLE_KEY_LIVE    || '';
  const testPubKey     = process.env.STRIPE_PUBLISHABLE_KEY_SANDBOX || '';

  results.envCheck = {
    hasGhlClientSecret:   !!apiKey,
    hasLivePubKey:        !!livePubKey,
    hasTestPubKey:        !!testPubKey,
    hasStripeAccount:     !!stripeAccount,
    stripeAccountId:      stripeAccount?.stripeAccountId ?? null,
    storedPkPrefix:       stripeAccount?.publishableKey?.slice(0, 7) ?? null,
  };

  if (!apiKey) {
    results.connect = { ok: false, error: 'GHL_CLIENT_SECRET missing from env vars' };
    return NextResponse.json(results, { status: 200 });
  }

  const connectBody = {
    live: { liveMode: true,  apiKey, publishableKey: livePubKey, enabled: true },
    test: { liveMode: false, apiKey, publishableKey: testPubKey, enabled: true },
  };

  try {
    const { data } = await client.post(`/payments/custom-provider/connect?locationId=${locationId}`, connectBody);
    results.connect = { ok: true, data };
  } catch (err) {
    results.connect = { ok: false, status: err.response?.status, error: err.response?.data ?? err.message };
  }

  return NextResponse.json(results, { status: 200 });
}
