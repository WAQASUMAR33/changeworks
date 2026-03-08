import { NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET_KEY = process.env.PLAID_SECRET_KEY;
const PLAID_ENV = (process.env.NEXT_PUBLIC_PLAID_ENV || 'sandbox').toLowerCase();

function getPlaidBaseUrl(env) {
  switch (env) {
    case 'production': return 'https://production.plaid.com';
    case 'development': return 'https://development.plaid.com';
    default: return 'https://sandbox.plaid.com';
  }
}

const PLAID_BASE_URL = getPlaidBaseUrl(PLAID_ENV);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

const schema = z.object({
  account_id:          z.string().min(1, 'account_id is required'),  // Plaid account_id to debit
  plaid_connection_id: z.number().int().positive(),
  start_date:          z.string().min(1),
  end_date:            z.string().min(1),
});

// Round-up calculation: e.g. $4.30 → $0.70
function calcRoundUp(amount) {
  if (!amount || amount <= 0) return 0;
  const cents = Math.round(amount * 100) % 100;
  return cents === 0 ? 0 : parseFloat(((100 - cents) / 100).toFixed(2));
}

// ── Step 1: Fetch transactions from Plaid ────────────────────────────────────
async function fetchTransactions(accessToken, startDate, endDate) {
  const response = await fetch(`${PLAID_BASE_URL}/transactions/get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET_KEY,
    },
    body: JSON.stringify({
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET_KEY,
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: { count: 500, offset: 0 },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error_message || 'Failed to fetch Plaid transactions');
  }

  const data = await response.json();
  return data.transactions || [];
}

// ── Step 2: Get a fresh Stripe bank account token from Plaid ─────────────────
// The Plaid processor token is single-use — a new one is created per charge.
async function getStripeBankToken(accessToken, accountId) {
  const response = await fetch(`${PLAID_BASE_URL}/processor/stripe/bank_account_token/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET_KEY,
    },
    body: JSON.stringify({
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET_KEY,
      access_token: accessToken,
      account_id: accountId,
    }),
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error_message || `Plaid processor token error: ${data?.error_code}`);
  }

  return data.stripe_bank_account_token; // btok_xxx (single-use)
}

export async function POST(req) {
  try {
    if (!stripe) {
      return NextResponse.json({ success: false, error: 'Stripe not configured' }, { status: 503 });
    }

    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const donorId = decoded.id;
    const body    = await req.json();
    const { account_id, plaid_connection_id, start_date, end_date } = schema.parse(body);

    // ── Load PlaidConnection with org's Stripe sub-account ───────────────────
    const connection = await prisma.plaidConnection.findFirst({
      where: { id: plaid_connection_id, donor_id: donorId },
      include: {
        donor:        { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true, email: true, stripeAccountId: true } },
      },
    });

    if (!connection) {
      return NextResponse.json({ success: false, error: 'Plaid connection not found' }, { status: 404 });
    }

    // The org's Stripe Connect sub-account (already stored in organizations table)
    if (!connection.organization.stripeAccountId) {
      return NextResponse.json(
        { success: false, error: 'Organization Stripe sub-account not connected' },
        { status: 400 }
      );
    }

    const orgStripeAccountId = connection.organization.stripeAccountId.trim();

    // ── Step 1: Calculate round-up total from Plaid transactions ─────────────
    const transactions      = await fetchTransactions(connection.access_token, start_date, end_date);
    const purchases         = transactions.filter((t) => t.amount > 0); // debits only
    const totalRoundUpDollars = parseFloat(
      purchases.reduce((sum, t) => sum + calcRoundUp(t.amount), 0).toFixed(2)
    );

    if (totalRoundUpDollars <= 0) {
      return NextResponse.json(
        { success: false, error: 'No round-up amount to charge for this period' },
        { status: 400 }
      );
    }

    const amountInCents = Math.round(totalRoundUpDollars * 100);
    console.log(`💰 Round-up: $${totalRoundUpDollars} (${amountInCents}¢) → org ${orgStripeAccountId}`);

    // ── Step 2: Get fresh Plaid → Stripe bank account token ──────────────────
    let stripeBankToken;
    try {
      stripeBankToken = await getStripeBankToken(connection.access_token, account_id);
      console.log(`🏦 Plaid processor token created for account ${account_id}`);
    } catch (plaidErr) {
      console.error('Plaid processor token error:', plaidErr.message);
      return NextResponse.json(
        { success: false, error: 'Failed to get bank token from Plaid', details: plaidErr.message },
        { status: 400 }
      );
    }

    // ── Step 3: Attach bank token to a temporary Stripe Customer ─────────────
    // Stripe ACH requires a Customer object to hold the bank account source.
    // This customer is created per-charge and not stored — it is a billing
    // intermediary only, not a Connect account.
    let tempCustomer;
    try {
      tempCustomer = await stripe.customers.create(
        {
          email:  connection.donor.email,
          name:   connection.donor.name,
          source: stripeBankToken,          // attach Plaid bank token as payment source
          metadata: {
            donor_id:            donorId.toString(),
            organization_id:     connection.organization.id.toString(),
            plaid_connection_id: plaid_connection_id.toString(),
            charge_period:       `${start_date}_to_${end_date}`,
          },
        },
        { stripeAccount: orgStripeAccountId }  // created ON the org's sub-account
      );
      console.log(`✅ Temporary Stripe customer created: ${tempCustomer.id} on ${orgStripeAccountId}`);
    } catch (stripeErr) {
      console.error('Stripe customer create error:', stripeErr.message);
      return NextResponse.json(
        { success: false, error: 'Failed to attach bank account', details: stripeErr.message },
        { status: 400 }
      );
    }

    // ── Step 4: Platform fee calculation (same formula as rest of app) ────────
    const SPECIAL_ORG_EMAIL    = 'frankie@vallartacares.com';
    const isSpecialOrg         = connection.organization.email?.toLowerCase() === SPECIAL_ORG_EMAIL.toLowerCase();
    const platformBudget       = Math.round(amountInCents * 0.10);
    const estimatedStripeFee   = 80; // ACH flat fee ~$0.80
    const applicationFeeAmount = isSpecialOrg ? 0 : Math.max(0, platformBudget - estimatedStripeFee);

    // ── Step 5: ACH charge from donor's bank → org's Stripe sub-account ──────
    let charge;
    try {
      charge = await stripe.charges.create(
        {
          amount:                 amountInCents,
          currency:               'usd',
          customer:               tempCustomer.id,
          application_fee_amount: applicationFeeAmount,
          description:            `Monthly round-up donation (${start_date} → ${end_date}), ${purchases.length} transactions`,
          receipt_email:          connection.donor.email,
          metadata: {
            donor_id:            donorId.toString(),
            organization_id:     connection.organization.id.toString(),
            plaid_connection_id: plaid_connection_id.toString(),
            plaid_account_id:    account_id,
            start_date,
            end_date,
            transaction_count:   purchases.length.toString(),
            round_up_dollars:    totalRoundUpDollars.toString(),
            transaction_type:    'round_up_ach',
          },
        },
        { stripeAccount: orgStripeAccountId }
      );
      console.log(`✅ ACH charge ${charge.id} — status: ${charge.status} → ${orgStripeAccountId}`);
    } catch (stripeErr) {
      console.error('Stripe ACH charge error:', stripeErr.message);
      return NextResponse.json(
        { success: false, error: 'ACH charge failed', details: stripeErr.message },
        { status: 400 }
      );
    }

    // ── Step 6: Record in DB ──────────────────────────────────────────────────
    const trxRecord = await prisma.saveTrRecord.create({
      data: {
        trx_id:              `ach_${charge.id}_${Date.now()}`,
        trx_date:            new Date(),
        trx_amount:          totalRoundUpDollars,
        trx_method:          'ach',
        trx_donor_id:        donorId,
        trx_organization_id: connection.organization.id,
        trx_details: JSON.stringify({
          charge_id:           charge.id,
          stripe_status:       charge.status,
          org_stripe_account:  orgStripeAccountId,
          plaid_account_id:    account_id,
          plaid_connection_id,
          start_date,
          end_date,
          transaction_count:   purchases.length,
          round_up_dollars:    totalRoundUpDollars,
          platform_fee_cents:  applicationFeeAmount,
          transaction_type:    'round_up_ach',
        }),
        pay_status: charge.status === 'succeeded' ? 'completed' : 'pending',
      },
    });

    return NextResponse.json({
      success:           true,
      charge_id:         charge.id,
      status:            charge.status,
      amount_dollars:    totalRoundUpDollars,
      transaction_count: purchases.length,
      transaction_id:    trxRecord.id,
      org_stripe_account: orgStripeAccountId,
      message:
        charge.status === 'pending'
          ? 'ACH payment initiated — clears in 3–5 business days'
          : 'Payment completed',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('charge-roundup error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
