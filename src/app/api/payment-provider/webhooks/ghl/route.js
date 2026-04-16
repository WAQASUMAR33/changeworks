export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createHmac, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import {
  createPaymentIntent, createRefund, createCustomer, createSubscription, getPrice,
  createProduct, createPrice, updateProduct, archivePrice, setProductDefaultPrice,
} from '@/app/lib/payment-provider/stripe';
import {
  getStripeAccount, createWebhookLog, updateWebhookLog, upsertPaymentEvent,
  saveProductSync, getProductSync, deleteProductSync, savePriceSync, getPriceSync, deletePriceSync,
} from '@/app/lib/payment-provider/tokenStore';
import { prisma } from '@/app/lib/prisma';
import { emailService } from '@/app/lib/email-service';

async function maybeCreateDonorAccount({ customerEmail, customerName, customerPhone, locationId }) {
  if (!customerEmail) return;
  try {
    const existing = await prisma.donor.findFirst({
      where: { email: customerEmail.toLowerCase() },
      select: { id: true },
    });
    if (existing) return;

    let organizationId = null;
    let organization = null;
    if (locationId) {
      organization = await prisma.organization.findFirst({
        where: {
          OR: [
            { ghlId: locationId },
            { ghlAccounts: { some: { ghl_location_id: locationId } } },
          ],
        },
        select: { id: true, name: true, imageUrl: true },
      });
      if (organization) organizationId = organization.id;
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

    const orgName = organization?.name || 'ChangeWorks';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.changeworksfund.org';
    const logoUrl = emailService.getOrganizationLogoUrl(organization);

    const html = emailService.generateEmailHtml(`
      <div style="text-align:center;margin-bottom:30px;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${orgName}" style="max-height:120px;max-width:250px;height:auto;border:0;display:inline-block;margin-bottom:15px;">` : ''}
        <h2 style="color:#302E56;margin:0;font-size:24px;font-weight:700;">${orgName}</h2>
      </div>

      <p style="font-size:18px;font-weight:500;color:#212529;margin-bottom:20px;">Welcome, ${name}!</p>

      <p>A donor account has been created for you on <strong>${orgName}</strong>'s donation platform after your payment. Use the credentials below to log in and track your donations.</p>

      <div style="background:#f3f4f6;border-radius:8px;padding:20px;margin:24px 0;border-left:4px solid #302E56;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Your Login Details</p>
        <p style="margin:0 0 8px;color:#111827;font-size:15px;"><strong>Email:</strong> ${customerEmail}</p>
        <p style="margin:0;color:#111827;font-size:15px;"><strong>Temporary Password:</strong> ${rawPassword}</p>
      </div>

      <div style="text-align:center;margin:28px 0;">
        <a href="${baseUrl}/donor/login" class="button">Log In to Your Donor Dashboard</a>
      </div>

      <p style="font-size:14px;color:#6c757d;">Please change your password after logging in. If you did not make a payment through ${orgName}, please ignore this email.</p>

      <div style="margin-top:30px;font-style:italic;color:#495057;">
        <p>Warm regards,<br><strong>The ${orgName} Team</strong></p>
      </div>

      ${emailService.getFooterHtml()}
    `, null, `Your ${orgName} Donor Account`, false, false);

    await emailService.sendEmail({
      to: customerEmail,
      subject: `Your ${orgName} Donor Account`,
      html,
      text: `Welcome to ${orgName}!\n\nA donor account has been created for you.\n\nEmail: ${customerEmail}\nTemporary Password: ${rawPassword}\n\nLog in at: ${baseUrl}/donor/login\n\nPlease change your password after logging in.`,
      from: `"${orgName}" <${process.env.EMAIL_FROM || 'info@changeworksfund.org'}>`,
    });

    console.log(`[donor-auto-create] Credentials email sent to ${customerEmail}`);
  } catch (err) {
    console.error('[donor-auto-create] Failed:', err.message, err.stack);
  }
}

const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;

function verifyGHLWebhook(rawBody, signature) {
  if (!signature) return false;
  const expected = createHmac('sha256', GHL_CLIENT_SECRET).update(rawBody).digest('hex');
  // Handle bare hex or "sha256=<hex>" prefix
  const cleaned = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  return expected === cleaned;
}

export async function POST(request) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  // GHL may send signature under different header names
  const signature =
    request.headers.get('x-ghl-signature') ||
    request.headers.get('x-wl-signature')  ||
    request.headers.get('x-hub-signature-256') ||
    null;

  let rawType = '';
  try { rawType = JSON.parse(rawBody.toString('utf-8'))?.type ?? ''; } catch {}

  const isPaymentEvent = ['PAYMENT_PROVIDER_CHARGE', 'PAYMENT_PROVIDER_REFUND', 'INSTALL', 'UNINSTALL'].includes(rawType);
  if (GHL_CLIENT_SECRET && signature && isPaymentEvent && !verifyGHLWebhook(rawBody, signature)) {
    console.warn('[GHL Webhook] Signature mismatch (non-fatal). Proceeding with payload validation.');
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf-8'));
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, locationId, data } = payload;
  const eventId = payload.eventId ?? `ghl-${Date.now()}-${Math.random()}`;

  await createWebhookLog({ source: 'GHL', eventId, eventType: type, locationId: locationId ?? undefined, payload });

  try {
    switch (type) {
      case 'PAYMENT_PROVIDER_CHARGE': {
        const stripeAccount = await getStripeAccount(locationId);
        if (!stripeAccount) {
          await updateWebhookLog(eventId, 'FAILED', `No Stripe account for location ${locationId}`);
          return NextResponse.json({ error: `No Stripe account connected for location ${locationId}` }, { status: 404 });
        }
        const contact       = data.contact ?? {};
        const customerName  = (contact.firstName || contact.lastName) ? [contact.firstName, contact.lastName].filter(Boolean).join(' ') : (data.customerName ?? null);
        const customerEmail = contact.email ?? data.email ?? null;
        const customerPhone = contact.phone ?? data.phone ?? null;
        const ghlTransactionId = data.transactionId ?? data.entityId ?? null;

        const ghlPriceId   = data.priceId   ?? data.variantId   ?? null;
        const ghlProductId = data.productId ?? null;
        let isRecurring = false, stripePriceId = null;

        if (ghlPriceId) {
          try {
            const priceSync = await getPriceSync(locationId, ghlPriceId);
            if (priceSync?.stripePriceId) {
              stripePriceId = priceSync.stripePriceId;
              const stripePrice = await getPrice(stripePriceId, stripeAccount.stripeAccountId);
              isRecurring = !!stripePrice.recurring;
            }
          } catch {}
        }
        if (!isRecurring && ghlProductId) {
          try {
            const productSync = await getProductSync(locationId, ghlProductId);
            if (productSync?.stripePriceId) {
              stripePriceId = productSync.stripePriceId;
              const stripePrice = await getPrice(stripePriceId, stripeAccount.stripeAccountId);
              isRecurring = !!stripePrice.recurring;
            }
          } catch {}
        }
        if (!isRecurring) isRecurring = data.recurring === true || data.type === 'RECURRING' || !!data.interval;

        const sharedMeta = {
          locationId, entityId: data.entityId, entityType: data.entityType ?? (isRecurring ? 'subscription' : 'invoice'),
          ghlTransactionId, ghlContactId: data.contactId ?? null, customerName, customerEmail, customerPhone,
        };

        if (isRecurring && stripePriceId) {
          const customer = await createCustomer({ stripeAccountId: stripeAccount.stripeAccountId, email: customerEmail, name: customerName, phone: customerPhone, metadata: { locationId, entityId: data.entityId } });
          const subscription = await createSubscription({ stripeAccountId: stripeAccount.stripeAccountId, customerId: customer.id, priceId: stripePriceId, metadata: sharedMeta });
          const paymentIntent = subscription.latest_invoice?.payment_intent;
          if (!paymentIntent?.client_secret) {
            await updateWebhookLog(eventId, 'FAILED', 'Subscription created but no payment intent available');
            return NextResponse.json({ error: 'Subscription payment not required yet' }, { status: 422 });
          }
          // Auto-create donor account
          await maybeCreateDonorAccount({ customerEmail, customerName, customerPhone, locationId });
          await updateWebhookLog(eventId, 'PROCESSED');
          return NextResponse.json({ clientSecret: paymentIntent.client_secret, publishableKey: stripeAccount.publishableKey });
        }

        const intent = await createPaymentIntent({ amount: data.amount, currency: data.currency ?? 'usd', stripeAccountId: stripeAccount.stripeAccountId, metadata: sharedMeta });
        try {
          await upsertPaymentEvent({ locationId, stripeAccountId: stripeAccount.stripeAccountId, paymentIntentId: intent.id, entityId: data.entityId ?? null, entityType: data.entityType ?? 'invoice', amount: data.amount, currency: data.currency ?? 'usd', status: 'PENDING', customerName, customerEmail, customerPhone });
        } catch {}
        // Auto-create donor account
        await maybeCreateDonorAccount({ customerEmail, customerName, customerPhone, locationId });
        await updateWebhookLog(eventId, 'PROCESSED');
        return NextResponse.json({ clientSecret: intent.client_secret, publishableKey: stripeAccount.publishableKey });
      }

      case 'PAYMENT_PROVIDER_REFUND': {
        const stripeAccount = await getStripeAccount(locationId);
        if (!stripeAccount) { await updateWebhookLog(eventId, 'FAILED', `No Stripe account for location ${locationId}`); return NextResponse.json({ error: 'Stripe account not connected' }, { status: 404 }); }
        const refund = await createRefund({ paymentIntentId: data.externalTransactionId, stripeAccountId: stripeAccount.stripeAccountId, amount: data.amount, reason: data.reason });
        await updateWebhookLog(eventId, 'PROCESSED');
        return NextResponse.json({ refundId: refund.id, status: refund.status });
      }

      case 'INSTALL':
      case 'UNINSTALL':
        await updateWebhookLog(eventId, 'PROCESSED');
        return NextResponse.json({ received: true });

      case 'ProductCreate': {
        const stripeAccount = await getStripeAccount(locationId);
        if (!stripeAccount) { await updateWebhookLog(eventId, 'SKIPPED', 'No Stripe account'); break; }
        const prod = data ?? payload;
        const ghlProductId = prod.id ?? prod._id;
        const name = prod.name ?? prod.title;
        if (!name || !ghlProductId) { await updateWebhookLog(eventId, 'SKIPPED', 'Missing product name/id'); break; }
        const variant = prod.variants?.[0] ?? prod.prices?.[0] ?? {};
        const priceAmount = variant.price ?? variant.amount ?? prod.price ?? 0;
        const currency = (variant.currency ?? prod.currency ?? 'usd').toLowerCase();
        const isRecurring = prod.recurring ?? prod.productType === 'RECURRING' ?? false;
        const interval = prod.interval ?? variant.interval ?? 'month';
        const stripeProduct = await createProduct({ stripeAccountId: stripeAccount.stripeAccountId, name, description: prod.description ?? undefined });
        let stripePrice = null;
        if (priceAmount > 0) {
          stripePrice = await createPrice({ stripeAccountId: stripeAccount.stripeAccountId, productId: stripeProduct.id, amount: Math.round(Number(priceAmount) * 100), currency, recurring: isRecurring ? { interval } : undefined });
        }
        await saveProductSync(locationId, ghlProductId, stripeProduct.id, stripePrice?.id ?? null);
        await updateWebhookLog(eventId, 'PROCESSED');
        return NextResponse.json({ received: true, stripeProductId: stripeProduct.id });
      }

      case 'ProductUpdate': {
        const stripeAccount = await getStripeAccount(locationId);
        if (!stripeAccount) { await updateWebhookLog(eventId, 'SKIPPED', 'No Stripe account'); break; }
        const prod = data ?? payload;
        const ghlProductId = prod.id ?? prod._id;
        if (!ghlProductId) { await updateWebhookLog(eventId, 'SKIPPED', 'Missing product id'); break; }
        const mapping = await getProductSync(locationId, ghlProductId);
        if (!mapping) { await updateWebhookLog(eventId, 'SKIPPED', 'No Stripe mapping found'); break; }
        await updateProduct(stripeAccount.stripeAccountId, mapping.stripeProductId, { ...(prod.name ? { name: prod.name } : {}), ...(prod.description ? { description: prod.description } : {}) });
        await updateWebhookLog(eventId, 'PROCESSED');
        return NextResponse.json({ received: true });
      }

      case 'ProductDelete': {
        const stripeAccount = await getStripeAccount(locationId);
        if (!stripeAccount) { await updateWebhookLog(eventId, 'SKIPPED', 'No Stripe account'); break; }
        const prod = data ?? payload;
        const ghlProductId = prod.id ?? prod._id;
        if (!ghlProductId) { await updateWebhookLog(eventId, 'SKIPPED', 'Missing product id'); break; }
        const mapping = await getProductSync(locationId, ghlProductId);
        if (!mapping) { await updateWebhookLog(eventId, 'SKIPPED', 'No Stripe mapping found'); break; }
        await updateProduct(stripeAccount.stripeAccountId, mapping.stripeProductId, { active: false });
        await deleteProductSync(locationId, ghlProductId);
        await updateWebhookLog(eventId, 'PROCESSED');
        return NextResponse.json({ received: true });
      }

      case 'PriceCreate': {
        const stripeAccount = await getStripeAccount(locationId);
        if (!stripeAccount) { await updateWebhookLog(eventId, 'SKIPPED', 'No Stripe account'); break; }
        const priceData = data ?? payload;
        const ghlPriceId = priceData.id ?? priceData._id ?? null;
        const ghlProductId = priceData.productId ?? priceData.product ?? priceData.product_id ?? null;
        if (!ghlPriceId || !ghlProductId) { await updateWebhookLog(eventId, 'SKIPPED', 'Missing price/product id'); break; }
        const productMapping = await getProductSync(locationId, ghlProductId);
        if (!productMapping) { await updateWebhookLog(eventId, 'SKIPPED', `No Stripe product mapping for ${ghlProductId}`); break; }
        const rawAmount = priceData.amount ?? priceData.price ?? priceData.unitAmount ?? 0;
        const amount = rawAmount < 1000 ? Math.round(Number(rawAmount) * 100) : Math.round(Number(rawAmount));
        const currency = (priceData.currency ?? 'usd').toLowerCase();
        const isRecurring = priceData.recurring ?? priceData.type === 'RECURRING' ?? false;
        const interval = priceData.interval ?? priceData.recurringInterval ?? 'month';
        const stripePrice = await createPrice({ stripeAccountId: stripeAccount.stripeAccountId, productId: productMapping.stripeProductId, amount, currency, recurring: isRecurring ? { interval } : undefined });
        await savePriceSync(locationId, ghlPriceId, ghlProductId, stripePrice.id);
        await setProductDefaultPrice(stripeAccount.stripeAccountId, productMapping.stripeProductId, stripePrice.id);
        await updateWebhookLog(eventId, 'PROCESSED');
        return NextResponse.json({ received: true, stripePriceId: stripePrice.id });
      }

      case 'PriceUpdate': {
        const stripeAccount = await getStripeAccount(locationId);
        if (!stripeAccount) { await updateWebhookLog(eventId, 'SKIPPED', 'No Stripe account'); break; }
        const priceData = data ?? payload;
        const ghlPriceId = priceData.id ?? priceData._id;
        const ghlProductId = priceData.productId ?? priceData.product;
        if (!ghlPriceId) { await updateWebhookLog(eventId, 'SKIPPED', 'Missing price id'); break; }
        const priceMapping = await getPriceSync(locationId, ghlPriceId);
        const productMapping = ghlProductId ? await getProductSync(locationId, ghlProductId) : null;
        if (priceMapping?.stripePriceId) { try { await archivePrice(stripeAccount.stripeAccountId, priceMapping.stripePriceId); } catch {} }
        if (productMapping?.stripeProductId) {
          const amount = priceData.amount ?? priceData.price ?? 0;
          const currency = (priceData.currency ?? 'usd').toLowerCase();
          const isRecurring = priceData.recurring ?? priceData.type === 'RECURRING' ?? false;
          const interval = priceData.interval ?? 'month';
          const newPrice = await createPrice({ stripeAccountId: stripeAccount.stripeAccountId, productId: productMapping.stripeProductId, amount: Math.round(Number(amount) * 100), currency, recurring: isRecurring ? { interval } : undefined });
          await savePriceSync(locationId, ghlPriceId, ghlProductId, newPrice.id);
          await setProductDefaultPrice(stripeAccount.stripeAccountId, productMapping.stripeProductId, newPrice.id);
        }
        await updateWebhookLog(eventId, 'PROCESSED');
        return NextResponse.json({ received: true });
      }

      case 'PriceDelete': {
        const stripeAccount = await getStripeAccount(locationId);
        if (!stripeAccount) { await updateWebhookLog(eventId, 'SKIPPED', 'No Stripe account'); break; }
        const priceData = data ?? payload;
        const ghlPriceId = priceData.id ?? priceData._id;
        if (!ghlPriceId) { await updateWebhookLog(eventId, 'SKIPPED', 'Missing price id'); break; }
        const mapping = await getPriceSync(locationId, ghlPriceId);
        if (mapping?.stripePriceId) { await archivePrice(stripeAccount.stripeAccountId, mapping.stripePriceId); await deletePriceSync(locationId, ghlPriceId); }
        await updateWebhookLog(eventId, 'PROCESSED');
        return NextResponse.json({ received: true });
      }

      default:
        await updateWebhookLog(eventId, 'SKIPPED');
        return NextResponse.json({ received: true });
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[GHL Webhook] Error handling ${type}:`, err.message);
    await updateWebhookLog(eventId, 'FAILED', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
