export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getConnectedAccount } from '@/app/lib/payment-provider/stripe';
import { getStripeAccount, saveStripeAccount } from '@/app/lib/payment-provider/tokenStore';
import { prisma } from '@/app/lib/prisma';
import { createStripeClient } from '@/app/lib/payment-mode';
const getStripe = () => createStripeClient();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId');

  if (!locationId) {
    return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
  }

  let stored = await getStripeAccount(locationId);
  console.log(`[connect/account] getStripeAccount(${locationId}):`, stored ? `found ${stored.stripeAccountId}` : 'null — attempting auto-connect');

  if (!stored) {
    try {
      // Try 3 lookup paths: org.ghlId, ghlAccounts.ghl_location_id, ghlAppInstallations.location_id→ghl_id→org.ghlId
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
          console.log(`[connect/account] Found install ghl_id=${install.ghl_id} for locationId=${locationId}`);
          org = await prisma.organization.findFirst({
            where: { ghlId: install.ghl_id },
            select: { stripeAccountId: true },
          });
        }
      }

      const stripeAccountId = org?.stripeAccountId ?? null;
      console.log(`[connect/account] Auto-connect org lookup for ${locationId}: stripeAccountId=${stripeAccountId}`);

      if (stripeAccountId) {
        try {
          await saveStripeAccount(locationId, {
            stripeAccountId,
            accessToken:    'direct',
            refreshToken:   null,
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
            livemode:       true,
            tokenType:      'direct',
            scope:          null,
          });
          stored = await getStripeAccount(locationId);
          console.log(`[connect/account] Auto-connected Stripe ${stripeAccountId} for location ${locationId}`);
        } catch (saveErr) {
          console.error(`[connect/account] saveStripeAccount failed (code=${saveErr.code}):`, saveErr.message);
        }
      } else {
        console.warn(`[connect/account] No org with stripeAccountId found for locationId=${locationId}`);
      }
    } catch (err) {
      console.warn('[connect/account] Auto-connect fallback failed:', err.message);
    }
  }

  if (!stored) {
    return NextResponse.json({ connected: false });
  }

  try {
    const stripe  = getStripe();
    const account = await getConnectedAccount(stored.stripeAccountId);
    const [balance, recentIntents] = await Promise.all([
      stripe.balance.retrieve({ stripeAccount: stored.stripeAccountId }),
      stripe.paymentIntents.list({ limit: 100 }, { stripeAccount: stored.stripeAccountId }),
    ]);
    const availableBalance = balance.available?.reduce((sum, b) => sum + b.amount, 0) ?? 0;
    const pendingBalance   = balance.pending?.reduce((sum, b) => sum + b.amount, 0) ?? 0;
    const balanceCurrency  = balance.available?.[0]?.currency ?? account.default_currency ?? 'usd';
    const succeededCount   = recentIntents.data.filter(p => p.status === 'succeeded').length;

    return NextResponse.json({
      connected:        true,
      stripeAccountId:  account.id,
      displayName:      account.display_name || account.business_profile?.name || '',
      email:            account.email,
      website:          account.business_profile?.url || null,
      country:          account.country,
      currency:         account.default_currency,
      createdAt:        account.created,
      livemode:         stored.livemode,
      chargesEnabled:   account.charges_enabled,
      payoutsEnabled:   account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      availableBalance,
      pendingBalance,
      balanceCurrency,
      recentTxCount:    recentIntents.data.length,
      succeededTxCount: succeededCount,
      hasMore:          recentIntents.has_more,
    });
  } catch (err) {
    console.error('[connect/account]', err.message);
    // Still show as connected if we have a stored account — API key issue shouldn't hide connection
    return NextResponse.json({
      connected:        true,
      stripeAccountId:  stored.stripeAccountId,
      livemode:         stored.livemode,
      chargesEnabled:   false,
      payoutsEnabled:   false,
      detailsSubmitted: false,
      displayName:      '',
      error:            err.message,
    });
  }
}
