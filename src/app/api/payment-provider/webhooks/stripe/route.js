export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { constructWebhookEvent, getPaymentIntentWithCharge } from '@/app/lib/payment-provider/stripe';
import {
  getLocationByStripeAccount, upsertPaymentEvent, getPaymentEventByEntityId,
  isWebhookProcessed, createWebhookLog, updateWebhookLog,
} from '@/app/lib/payment-provider/tokenStore';
import { postPaymentUpdateToGHL, postSubscriptionUpdateToGHL } from '@/app/lib/payment-provider/ghl';
import { prisma } from '@/app/lib/prisma';
import { emailService } from '@/app/lib/email-service';

/**
 * After a successful payment, check if the customer email exists as a donor.
 * If not, create a donor account with an auto-generated password and send credentials by email.
 */
async function maybeCreateDonorAccount({ customerEmail, customerName, customerPhone, locationId }) {
  // Only create for GHL-originated payments (locationId identifies the GHL location)
  if (!customerEmail || !locationId) return;

  try {
    // Check if donor already exists
    const existing = await prisma.donor.findFirst({
      where: { email: customerEmail.toLowerCase() },
      select: { id: true },
    });
    if (existing) {
      console.log(`[donor-auto-create] Donor already exists for ${customerEmail} — skipping`);
      return;
    }

    // Resolve organization from locationId
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

    // Generate a random password
    const rawPassword = crypto.randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
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

    console.log(`[donor-auto-create] Created donor account for ${customerEmail} (org: ${organizationId ?? 'none'})`);

    const orgName = organization?.name || 'ChangeWorks';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.changeworksfund.org';
    const loginUrl = `${baseUrl}/donor/login`;
    const logoUrl = emailService.getOrganizationLogoUrl(organization);

    const subject = `Welcome to ${orgName}'s Donation Community`;

    const html = emailService.generateEmailHtml(`
      <div style="text-align:center;margin-bottom:30px;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${orgName}" style="max-height:120px;max-width:250px;height:auto;border:0;display:inline-block;margin-bottom:15px;">` : ''}
        ${!logoUrl ? `<h2 style="color:#302E56;margin:0;font-size:24px;font-weight:700;">${orgName}</h2>` : ''}
      </div>

      <p style="font-size:18px;font-weight:500;color:#212529;margin-bottom:20px;">Hello ${name}</p>

      <p>Thank you for supporting our work financially with your donation. Your generosity truly matters to us, and we want giving to feel simple and effortless.</p>

      <p>That's why you have your own donor dashboard with our trusted donation platform partner, ChangeWorks. It puts everything you need in one place:</p>

      <ul style="color:#495057;">
        <li>See your monthly donation totals whenever you'd like</li>
        <li>Adjust or pause your contributions if your needs change</li>
        <li>Download your donation records for easy reference or tax time</li>
      </ul>

      <p>You can visit your dashboard anytime using the credentials below:</p>

      <div style="background:#f3f4f6;border-radius:8px;padding:20px;margin:24px 0;border-left:4px solid #302E56;">
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Your Login Details</p>
        <p style="margin:0 0 8px;color:#111827;font-size:15px;"><strong>Username:</strong> ${customerEmail}</p>
        <p style="margin:0 0 8px;color:#111827;font-size:15px;"><strong>Login URL:</strong> <a href="${loginUrl}" style="color:#302E56;">${loginUrl}</a></p>
        <p style="margin:0;color:#111827;font-size:15px;"><strong>Temporary Password:</strong> ${rawPassword}</p>
      </div>

      <p>If you ever have a question or just want to reach out, we'd love to hear from you. We're grateful to have you with us.</p>

      <div style="margin-top:30px;font-style:italic;color:#495057;">
        <p>Warm regards,<br><strong>The ${orgName} Team</strong></p>
      </div>

      <p style="margin-top:20px;font-size:14px;color:#6c757d;"><strong>P.S.</strong> At the end of each month, we'll send you an update with your 30-day total, so you can see the difference you've made.</p>

      ${emailService.getFooterHtml()}
    `, null, subject, false, false);

    await emailService.sendEmail({
      to: customerEmail,
      subject,
      html,
      text: `Welcome to ${orgName}'s Donation Community\n\nHello ${name},\n\nThank you for supporting our work financially with your donation. Your generosity truly matters to us, and we want giving to feel simple and effortless.\n\nThat's why you have your own donor dashboard with our trusted donation platform partner, ChangeWorks. It puts everything you need in one place:\n- See your monthly donation totals whenever you'd like\n- Adjust or pause your contributions if your needs change\n- Download your donation records for easy reference or tax time\n\nYou can visit your dashboard anytime using the credentials below:\n\nUsername: ${customerEmail}\nLogin URL: ${loginUrl}\nTemporary Password: ${rawPassword}\n\nIf you ever have a question or just want to reach out, we'd love to hear from you. We're grateful to have you with us.\n\nWarm regards,\nThe ${orgName} Team\n\nP.S. At the end of each month, we'll send you an update with your 30-day total, so you can see the difference you've made.`,
      from: `"${orgName}" <${process.env.EMAIL_FROM || 'info@changeworksfund.org'}>`,
    });

    console.log(`[donor-auto-create] Welcome email sent to ${customerEmail}`);
  } catch (err) {
    // Non-fatal — payment already succeeded
    console.error('[donor-auto-create] Failed:', err.message, err.stack);
  }
}

export async function POST(request) {
  const rawBody   = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event;
  try {
    event = constructWebhookEvent(rawBody, signature);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (await isWebhookProcessed(event.id)) {
    return NextResponse.json({ received: true, skipped: true });
  }

  const stripeAccountId = event.account;
  const locationId = stripeAccountId ? await getLocationByStripeAccount(stripeAccountId) : null;

  await createWebhookLog({ source: 'STRIPE', eventId: event.id, eventType: event.type, locationId: locationId ?? undefined, payload: event });

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object;
        let customerName  = intent.metadata?.customerName  ?? null;
        let customerEmail = intent.metadata?.customerEmail ?? intent.receipt_email ?? null;
        let customerPhone = intent.metadata?.customerPhone ?? null;
        try {
          const full    = await getPaymentIntentWithCharge(intent.id, stripeAccountId);
          const billing = full.latest_charge?.billing_details ?? {};
          customerName  = billing.name  || customerName;
          customerEmail = billing.email || customerEmail;
          customerPhone = billing.phone || customerPhone;
        } catch {}
        await upsertPaymentEvent({
          locationId: locationId ?? intent.metadata?.locationId, stripeAccountId: stripeAccountId ?? '',
          paymentIntentId: intent.id, entityId: intent.metadata?.entityId,
          entityType: intent.metadata?.entityType ?? 'invoice', amount: intent.amount, currency: intent.currency,
          status: 'SUCCESS', customerName, customerEmail, customerPhone, metadata: intent.metadata,
        });

        // Auto-create donor account only for confirmed GHL payments
        if (intent.status === 'succeeded') {
          await maybeCreateDonorAccount({ customerEmail, customerName, customerPhone, locationId: locationId ?? intent.metadata?.locationId });
        }

        if (locationId) {
          let chargeId = intent.id;
          if (intent.metadata?.entityId) {
            try {
              const pi1Event = await getPaymentEventByEntityId(locationId, intent.metadata.entityId);
              if (pi1Event && pi1Event.paymentIntentId !== intent.id) chargeId = pi1Event.paymentIntentId;
            } catch {}
          }
          const ghlTransactionId = intent.metadata?.ghlTransactionId ?? intent.metadata?.entityId ?? null;
          try {
            await postPaymentUpdateToGHL(locationId, { chargeId, ghlTransactionId, amount: intent.amount });
          } catch (ghlErr) {
            console.error('[Stripe Webhook] GHL payment update failed:', ghlErr.response?.status, JSON.stringify(ghlErr.response?.data ?? ghlErr.message));
          }
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        await upsertPaymentEvent({
          locationId: locationId ?? intent.metadata?.locationId, stripeAccountId: stripeAccountId ?? '',
          paymentIntentId: intent.id, entityId: intent.metadata?.entityId,
          entityType: intent.metadata?.entityType ?? 'invoice', amount: intent.amount, currency: intent.currency,
          status: 'FAILED', failureReason: intent.last_payment_error?.message ?? null,
          customerName: intent.metadata?.customerName ?? null,
          customerEmail: intent.metadata?.customerEmail ?? intent.receipt_email ?? null,
          customerPhone: intent.metadata?.customerPhone ?? null, metadata: intent.metadata,
        });
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        await upsertPaymentEvent({
          locationId: locationId ?? charge.metadata?.locationId, stripeAccountId: stripeAccountId ?? '',
          paymentIntentId: charge.payment_intent, entityId: charge.metadata?.entityId,
          entityType: charge.metadata?.entityType ?? 'invoice', amount: charge.amount, currency: charge.currency,
          status: charge.amount_refunded === charge.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refundedAmount: charge.amount_refunded, metadata: charge.metadata,
        });
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        if (locationId) {
          const ghlSubscriptionId = sub.metadata?.ghlSubscriptionId ?? sub.metadata?.entityId;
          try {
            await postSubscriptionUpdateToGHL(locationId, { externalSubscriptionId: sub.id, status: sub.status, entityId: ghlSubscriptionId });
          } catch (ghlErr) {
            console.error('[Stripe Webhook] GHL subscription update failed:', ghlErr.response?.status, JSON.stringify(ghlErr.response?.data ?? ghlErr.message));
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        if (locationId) {
          const ghlSubscriptionId = sub.metadata?.ghlSubscriptionId ?? sub.metadata?.entityId;
          try {
            await postSubscriptionUpdateToGHL(locationId, { externalSubscriptionId: sub.id, status: 'canceled', entityId: ghlSubscriptionId });
          } catch {}
        }
        break;
      }
      default:
        await updateWebhookLog(event.id, 'SKIPPED');
        return NextResponse.json({ received: true });
    }
    await updateWebhookLog(event.id, 'PROCESSED');
  } catch (err) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err.message);
    await updateWebhookLog(event.id, 'FAILED', err.message);
  }

  return NextResponse.json({ received: true });
}
