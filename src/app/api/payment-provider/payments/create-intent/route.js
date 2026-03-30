export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import {
  createPaymentIntent, createCustomer, createSubscription,
  createInlineSubscription, updatePaymentIntentMetadata, getPrice,
} from '@/app/lib/payment-provider/stripe';
import { getStripeAccount, saveStripeAccount, upsertPaymentEvent, getPriceSync } from '@/app/lib/payment-provider/tokenStore';
import { getTransaction } from '@/app/lib/payment-provider/ghl';
import { prisma } from '@/app/lib/prisma';
import { emailService } from '@/app/lib/email-service';

async function maybeCreateDonorAccount({ customerEmail, customerName, customerPhone, locationId }) {
  if (!customerEmail) return;
  try {
    const existing = await prisma.donor.findFirst({
      where: { email: customerEmail.toLowerCase() },
      select: { id: true },
    });
    if (existing) {
      console.log(`[donor-auto-create] Already exists: ${customerEmail}`);
      return;
    }

    let organizationId = null;
    if (locationId) {
      const org = await prisma.organization.findFirst({
        where: {
          OR: [
            { ghlId: locationId },
            { ghlAccounts: { some: { ghl_location_id: locationId } } },
          ],
        },
        select: { id: true },
      });
      if (org) organizationId = org.id;
    }

    const rawPassword = randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
    const hashedPassword = await bcrypt.hash(rawPassword, 12);
    const name = customerName?.trim() || customerEmail.split('@')[0];

    await prisma.donor.create({
      data: {
        name,
        email: customerEmail.toLowerCase().trim(),
        password: hashedPassword,
        phone: customerPhone || null,
        country: 'US',
        status: true,
        ...(organizationId ? { organization_id: organizationId } : {}),
      },
    });

    console.log(`[donor-auto-create] Created donor for ${customerEmail} (org: ${organizationId ?? 'none'})`);

    await emailService.sendEmail({
      to: customerEmail,
      subject: 'Your ChangeWorks Donor Account',
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
          <h2 style="color:#0E0061;margin-bottom:8px;">Welcome to ChangeWorks!</h2>
          <p style="color:#374151;margin-bottom:20px;">A donor account has been created for you after your payment. Use these credentials to log in and track your donations.</p>
          <div style="background:#f3f4f6;border-radius:8px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Your Login Details</p>
            <p style="margin:0 0 6px;color:#111827;font-size:15px;"><strong>Email:</strong> ${customerEmail}</p>
            <p style="margin:0;color:#111827;font-size:15px;"><strong>Password:</strong> ${rawPassword}</p>
          </div>
          <a href="https://app.changeworksfund.org/donor/login" style="display:inline-block;background:#0E0061;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;">Log In to Your Account</a>
          <p style="margin-top:24px;color:#9ca3af;font-size:12px;">Please change your password after logging in. If you did not make a payment through ChangeWorks, please ignore this email.</p>
        </div>
      `,
      text: `Welcome to ChangeWorks!\n\nEmail: ${customerEmail}\nPassword: ${rawPassword}\n\nLog in: https://app.changeworksfund.org/donor/login`,
    });

    console.log(`[donor-auto-create] Credentials email sent to ${customerEmail}`);
  } catch (err) {
    console.error('[donor-auto-create] Failed:', err.message, err.stack);
  }
}

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
  console.log(`[create-intent] getStripeAccount(${locationId}):`, stripeAccount ? `found ${stripeAccount.stripeAccountId}` : 'null — attempting auto-connect');

  if (!stripeAccount) {
    // Fallback: auto-connect from org's stripeAccountId
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
          console.log(`[create-intent] Found install ghl_id=${install.ghl_id} for locationId=${locationId}`);
          org = await prisma.organization.findFirst({
            where: { ghlId: install.ghl_id },
            select: { stripeAccountId: true },
          });
        }
      }

      console.log(`[create-intent] Auto-connect org lookup for ${locationId}: stripeAccountId=${org?.stripeAccountId ?? null}`);
      if (org?.stripeAccountId) {
        try {
          await saveStripeAccount(locationId, {
            stripeAccountId: org.stripeAccountId,
            accessToken:     'direct',
            refreshToken:    null,
            publishableKey:  process.env.STRIPE_PUBLISHABLE_KEY ?? '',
            livemode:        true,
            tokenType:       'direct',
            scope:           null,
          });
          stripeAccount = await getStripeAccount(locationId);
          console.log(`[create-intent] Auto-connected Stripe ${org.stripeAccountId} for location ${locationId}`);
        } catch (saveErr) {
          console.error(`[create-intent] saveStripeAccount failed (code=${saveErr.code}):`, saveErr.message);
        }
      } else {
        console.warn(`[create-intent] No org with stripeAccountId found for locationId=${locationId}`);
      }
    } catch (err) {
      console.warn('[create-intent] Auto-connect fallback failed:', err.message);
    }
  }
  if (!stripeAccount) {
    return NextResponse.json({ error: 'This location has not connected a Stripe account yet' }, { status: 404 });
  }

  const sharedMeta = { locationId, entityId: finalEntityId, entityType: finalEntityType, ...metadata };

  // Auto-create donor account for GHL payments
  const customerEmail = metadata?.customerEmail ?? metadata?.email ?? null;
  const customerName  = metadata?.customerName  ?? metadata?.name  ?? null;
  const customerPhone = metadata?.customerPhone ?? metadata?.phone ?? null;
  if (customerEmail) {
    await maybeCreateDonorAccount({ customerEmail, customerName, customerPhone, locationId });
  }

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
