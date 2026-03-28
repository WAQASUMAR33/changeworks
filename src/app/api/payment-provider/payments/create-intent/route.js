export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import {
  createPaymentIntent, createCustomer, createSubscription,
  createInlineSubscription, updatePaymentIntentMetadata, getPrice,
} from '@/app/lib/payment-provider/stripe';
import { getStripeAccount, saveStripeAccount, upsertPaymentEvent, getPriceSync } from '@/app/lib/payment-provider/tokenStore';
import { getTransaction } from '@/app/lib/payment-provider/ghl';
import { prisma } from '@/app/lib/prisma';

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    locationId, amount, currency = 'usd', priceId, entityId, entityType,
    interval, isRecurring: isRecurringFlag, ghlSubscriptionId,
    applicationFeeRate = 0, metadata = {},
  } = body;

  if (!locationId) return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
  if (!priceId && !amount) return NextResponse.json({ error: 'Either priceId or amount is required' }, { status: 400 });

  const finalEntityId   = entityId   || `ghl-${Date.now()}`;
  const finalEntityType = entityType || 'invoice';

  const RECURRING_ENTITY_TYPES = new Set(['subscription', 'subscription_order', 'recurring', 'recurring_order', 'subscriptions']);
  const entityTypeIsRecurring  = RECURRING_ENTITY_TYPES.has((entityType ?? '').toLowerCase());
  let resolvedInterval = interval || 'month';

  let ghlTransactionIsSubscription = false;
  const ghlTransactionId = metadata?.ghlTransactionId ?? null;
  if (ghlTransactionId && locationId) {
    const txn = await getTransaction(locationId, ghlTransactionId);
    if (txn) {
      const sourceType = (txn.entitySourceType ?? '').toLowerCase();
      ghlTransactionIsSubscription = sourceType === 'subscriptions' || sourceType === 'subscription';
      if (txn.interval) resolvedInterval = txn.interval;
    }
  }

  let stripeAccount = await getStripeAccount(locationId);
  if (!stripeAccount) {
    // Fallback: auto-connect from org's stripeAccountId
    try {
      const org = await prisma.organization.findFirst({
        where: {
          OR: [
            { ghlId: locationId },
            { ghlAccounts: { some: { ghl_location_id: locationId } } },
          ],
        },
        select: { stripeAccountId: true },
      });
      if (org?.stripeAccountId) {
        await saveStripeAccount(locationId, {
          stripeAccountId: org.stripeAccountId,
          accessToken:     'direct',
          refreshToken:    null,
          publishableKey:  '',
          livemode:        true,
          tokenType:       'direct',
          scope:           null,
        });
        stripeAccount = await getStripeAccount(locationId);
        console.log(`[create-intent] Auto-connected Stripe ${org.stripeAccountId} for location ${locationId}`);
      }
    } catch (err) {
      console.warn('[create-intent] Auto-connect fallback failed:', err.message);
    }
  }
  if (!stripeAccount) {
    return NextResponse.json({ error: 'This location has not connected a Stripe account yet' }, { status: 404 });
  }

  const sharedMeta = { locationId, entityId: finalEntityId, entityType: finalEntityType, ...metadata };

  if (priceId) {
    let resolvedPriceId = priceId;
    try {
      const priceSync = await getPriceSync(locationId, priceId);
      if (priceSync?.stripePriceId) resolvedPriceId = priceSync.stripePriceId;
    } catch {}

    let price;
    try {
      price = await getPrice(resolvedPriceId, stripeAccount.stripeAccountId);
    } catch (err) {
      return NextResponse.json({ error: `Invalid price: ${err.message}` }, { status: 400 });
    }

    if (price.recurring) {
      const customer = await createCustomer({
        stripeAccountId: stripeAccount.stripeAccountId,
        email: metadata.customerEmail ?? null, name: metadata.customerName ?? null,
        phone: metadata.customerPhone ?? null,
        metadata: { locationId, entityId: finalEntityId },
      });
      const applicationFeePercent = applicationFeeRate > 0 ? applicationFeeRate * 100 : undefined;
      const subscription = await createSubscription({
        stripeAccountId: stripeAccount.stripeAccountId, customerId: customer.id, priceId,
        applicationFeePercent, metadata: { ...sharedMeta, entityType: 'subscription' },
      });
      const paymentIntent = subscription.latest_invoice?.payment_intent;
      if (!paymentIntent?.client_secret) {
        return NextResponse.json({ error: 'Subscription created but no payment required yet' }, { status: 422 });
      }
      return NextResponse.json({
        clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id,
        subscriptionId: subscription.id, publishableKey: stripeAccount.publishableKey,
        stripeAccountId: stripeAccount.stripeAccountId, mode: 'subscription',
      });
    }

    const priceAmount  = price.unit_amount ?? amount;
    const priceCurrency = price.currency ?? currency;
    const applicationFeeAmount = applicationFeeRate > 0 ? Math.round(priceAmount * applicationFeeRate) : 0;
    const intent = await createPaymentIntent({
      amount: priceAmount, currency: priceCurrency, stripeAccountId: stripeAccount.stripeAccountId,
      applicationFeeAmount: applicationFeeAmount || undefined, metadata: sharedMeta,
    });
    return NextResponse.json({
      clientSecret: intent.client_secret, paymentIntentId: intent.id,
      publishableKey: stripeAccount.publishableKey, stripeAccountId: stripeAccount.stripeAccountId, mode: 'payment',
    });
  }

  const shouldCreateSubscription = !!ghlSubscriptionId || isRecurringFlag || entityTypeIsRecurring || ghlTransactionIsSubscription;

  if (shouldCreateSubscription && amount) {
    const customer = await createCustomer({
      stripeAccountId: stripeAccount.stripeAccountId,
      email: metadata.customerEmail ?? null, name: metadata.customerName ?? null,
      phone: metadata.customerPhone ?? null,
      metadata: { locationId, entityId: finalEntityId },
    });
    const subscription = await createInlineSubscription({
      stripeAccountId: stripeAccount.stripeAccountId, customerId: customer.id,
      amount, currency, interval: resolvedInterval, productName: 'Subscription',
      metadata: { ...sharedMeta, entityType: 'subscription', ghlSubscriptionId: ghlSubscriptionId ?? null },
    });
    const paymentIntent = subscription.latest_invoice?.payment_intent;
    if (!paymentIntent?.client_secret) {
      return NextResponse.json({ error: 'Subscription created but no payment required yet' }, { status: 422 });
    }
    try {
      await updatePaymentIntentMetadata(paymentIntent.id, {
        ...sharedMeta, entityType: 'subscription', ghlSubscriptionId: ghlSubscriptionId ?? null,
      }, stripeAccount.stripeAccountId);
    } catch {}
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id,
      subscriptionId: subscription.id, publishableKey: stripeAccount.publishableKey,
      stripeAccountId: stripeAccount.stripeAccountId, mode: 'subscription',
    });
  }

  const applicationFeeAmount = applicationFeeRate > 0 ? Math.round(amount * applicationFeeRate) : 0;
  let intent;
  try {
    intent = await createPaymentIntent({
      amount, currency, stripeAccountId: stripeAccount.stripeAccountId,
      applicationFeeAmount: applicationFeeAmount || undefined, metadata: sharedMeta,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  try {
    await upsertPaymentEvent({
      locationId, stripeAccountId: stripeAccount.stripeAccountId, paymentIntentId: intent.id,
      entityId: finalEntityId, entityType: finalEntityType, amount, currency, status: 'PENDING',
      customerName: metadata.customerName ?? null, customerEmail: metadata.customerEmail ?? null,
      customerPhone: metadata.customerPhone ?? null,
    });
  } catch (dbErr) {
    console.warn('[create-intent] Failed to pre-save payment event (non-fatal):', dbErr.message);
  }

  return NextResponse.json({
    clientSecret: intent.client_secret, paymentIntentId: intent.id,
    publishableKey: stripeAccount.publishableKey, stripeAccountId: stripeAccount.stripeAccountId, mode: 'payment',
  });
}
