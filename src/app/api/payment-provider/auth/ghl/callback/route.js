export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { exchangeGHLCode, connectGHLPaymentProvider } from '@/app/lib/payment-provider/ghl';
import { saveGHLTokens, saveStripeAccount } from '@/app/lib/payment-provider/tokenStore';
import { verifyStateToken } from '@/app/lib/payment-provider/crypto';
import { getConnectedAccount } from '@/app/lib/payment-provider/stripe';
import { prisma } from '@/app/lib/prisma';

export async function GET(request) {
  const reqUrl  = new URL(request.url);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${reqUrl.protocol}//${reqUrl.host}`;
  const successUrl  = `${baseUrl}/payment-provider/ghl-connected`;
  const dashboardUrl = `${baseUrl}/organization/dashboard/payment-provider`;

  const { searchParams } = reqUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  try {
    if (error) {
      return NextResponse.redirect(`${successUrl}?error=ghl_denied`);
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
      return NextResponse.redirect(`${successUrl}?error=ghl_token_exchange&detail=${encodeURIComponent(detail)}`);
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
      await connectGHLPaymentProvider(locationId);
    } catch (err) {
      console.warn('[GHL callback] connectGHLPaymentProvider failed (non-fatal):', err.message);
    }

    // Auto-connect Stripe from org's stripeAccountId
    try {
      let org = await prisma.organization.findFirst({
        where: {
          OR: [
            { ghlId: locationId },
            { ghlAccounts: { some: { ghl_location_id: locationId } } },
          ],
        },
        select: { stripeAccountId: true },
      });
      // Fallback: look up via ghlAppInstallations (location_id → ghl_id → org.ghlId)
      if (!org?.stripeAccountId) {
        const install = await prisma.gHLAppInstallation.findUnique({
          where: { location_id: locationId },
          select: { ghl_id: true },
        });
        if (install?.ghl_id) {
          org = await prisma.organization.findFirst({
            where: { ghlId: install.ghl_id },
            select: { stripeAccountId: true },
          });
          console.log(`[GHL callback] Install lookup ghl_id=${install.ghl_id} → stripeAccountId=${org?.stripeAccountId ?? null}`);
        }
      }
      if (org?.stripeAccountId) {
        const account = await getConnectedAccount(org.stripeAccountId);
        await saveStripeAccount(locationId, {
          stripeAccountId: account.id,
          accessToken:     'direct',
          refreshToken:    null,
          publishableKey:  '',
          livemode:        account.livemode ?? false,
          tokenType:       'direct',
          scope:           null,
        });
        console.log(`[GHL callback] Auto-connected Stripe account ${account.id} for location ${locationId}`);
      }
    } catch (err) {
      console.warn('[GHL callback] Auto-connect Stripe failed (non-fatal):', err.message);
    }

    return NextResponse.redirect(`${dashboardUrl}?connected=ghl&locationId=${locationId}`);
  } catch (err) {
    console.error('[GHL callback] Unhandled error:', err.message);
    return NextResponse.redirect(`${successUrl}?error=ghl_callback_error&detail=${encodeURIComponent(err.message)}`);
  }
}
