export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { exchangeGHLCode, createGHLPaymentProvider } from '@/app/lib/payment-provider/ghl';
import { saveGHLTokens } from '@/app/lib/payment-provider/tokenStore';
import { verifyStateToken } from '@/app/lib/payment-provider/crypto';

export async function GET(request) {
  const reqUrl  = new URL(request.url);
  const baseUrl = process.env.GHL_APP_URL || process.env.NEXT_PUBLIC_APP_URL || `${reqUrl.protocol}//${reqUrl.host}`;
  const dashboardUrl = `${baseUrl}/organization/dashboard/payment-provider`;

  const { searchParams } = reqUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  try {
    if (error) {
      return NextResponse.redirect(`${dashboardUrl}?error=ghl_denied`);
    }
    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    let stateData;
    if (state) {
      try {
        stateData = verifyStateToken(state);
      } catch {
        return NextResponse.json({ error: 'Invalid state token' }, { status: 400 });
      }
    }

    let tokenData;
    try {
      tokenData = await exchangeGHLCode(code);
    } catch (err) {
      const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      console.error('[GHL OAuth] Token exchange failed:', detail);
      return NextResponse.redirect(`${dashboardUrl}?error=ghl_token_exchange&detail=${encodeURIComponent(detail)}`);
    }

    const locationId = tokenData.locationId ?? stateData?.locationId;
    if (!locationId) {
      return NextResponse.json({ error: 'No locationId in token response' }, { status: 400 });
    }

    await saveGHLTokens(locationId, {
      access_token:  tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at:    Date.now() + (tokenData.expires_in ?? 86400) * 1000,
      companyId:     tokenData.companyId,
      userId:        tokenData.userId,
      locationId,
    });

    try {
      await createGHLPaymentProvider(locationId);
    } catch (err) {
      console.warn('[GHL callback] createGHLPaymentProvider failed (non-fatal):', err.message);
    }

    return NextResponse.redirect(`${dashboardUrl}?locationId=${locationId}&connected=ghl`);
  } catch (err) {
    console.error('[GHL callback] Unhandled error:', err.message);
    return NextResponse.redirect(`${dashboardUrl}?error=ghl_callback_error&detail=${encodeURIComponent(err.message)}`);
  }
}
