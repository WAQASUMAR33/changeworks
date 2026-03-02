import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET_KEY = process.env.PLAID_SECRET_KEY;
const PLAID_ENV = process.env.NEXT_PUBLIC_PLAID_ENV || 'sandbox';

const PLAID_BASE_URL = `https://${PLAID_ENV}.plaid.com`;

export const dynamic = 'force-dynamic';

async function fetchPlaidAccounts(accessToken) {
  try {
    const response = await fetch(`${PLAID_BASE_URL}/accounts/get`, {
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
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Plaid] accounts/get error:', JSON.stringify(data));
      const status = data?.error_code === 'ITEM_LOGIN_REQUIRED' ? 'LOGIN_REQUIRED' : 'ERROR';
      return { accounts: [], status, error: data?.error_message || 'Failed to fetch accounts' };
    }

    return { accounts: data.accounts || [], status: 'ACTIVE' };
  } catch (err) {
    console.error('fetchPlaidAccounts error:', err.message);
    return { accounts: [], status: 'ERROR', error: err.message };
  }
}

async function fetchPlaidInstitution(institutionId) {
  if (!institutionId) return null;
  try {
    const response = await fetch(`${PLAID_BASE_URL}/institutions/get_by_id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET_KEY,
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET_KEY,
        institution_id: institutionId,
        country_codes: ['US'],
        options: { include_optional_metadata: true },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('[Plaid] institutions/get_by_id error:', JSON.stringify(errData));
      return null;
    }

    const data = await response.json();
    return data.institution || null;
  } catch (err) {
    console.error('fetchPlaidInstitution error:', err.message);
    return null;
  }
}

async function fetchPlaidTransactions(accessToken, startDate, endDate) {
  try {
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
        options: { count: 100, offset: 0 },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Plaid transactions error:', errData);
      return { transactions: [], total_transactions: 0, error: errData?.error_message || 'Plaid API error' };
    }

    const data = await response.json();
    return { transactions: data.transactions || [], total_transactions: data.total_transactions || 0 };
  } catch (err) {
    console.error('fetchPlaidTransactions error:', err.message);
    return { transactions: [], total_transactions: 0, error: err.message };
  }
}

export async function GET(req) {
  try {
    // Authenticate org via JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const organizationId = decoded.id;

    // Build date range from query params (default: last 30 days)
    const { searchParams } = new URL(req.url);
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(today.getDate() - 30);

    const startDate = searchParams.get('start_date') || defaultStart.toISOString().split('T')[0];
    const endDate = searchParams.get('end_date') || today.toISOString().split('T')[0];

    // Fetch all Plaid connections for this org from DB (only need access_token, institution_id, donor)
    const connections = await prisma.plaidConnection.findMany({
      where: { organization_id: organizationId },
      include: {
        donor: {
          select: { id: true, name: true, email: true, phone: true, imageUrl: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // For each connection, fetch all data live from Plaid in parallel
    const enrichedConnections = await Promise.all(
      connections.map(async (conn) => {
        const [accountsData, institutionData, plaidTransactions] = await Promise.all([
          fetchPlaidAccounts(conn.access_token),
          fetchPlaidInstitution(conn.institution_id),
          fetchPlaidTransactions(conn.access_token, startDate, endDate),
        ]);

        return {
          id: conn.id,
          status: accountsData.status,
          institution_name: institutionData?.name || conn.institution_name,
          institution_id: conn.institution_id,
          institution_logo: institutionData?.logo || null,
          institution_primary_color: institutionData?.primary_color || null,
          connected_at: conn.created_at,
          updated_at: conn.updated_at,
          donor: conn.donor,
          accounts: accountsData.accounts.map((a) => ({
            account_id: a.account_id,
            name: a.name,
            official_name: a.official_name,
            type: a.type,
            subtype: a.subtype,
            mask: a.mask,
            balances: a.balances,
          })),
          accounts_error: accountsData.error || null,
          transactions: plaidTransactions.transactions,
          total_transactions: plaidTransactions.total_transactions,
          transactions_error: plaidTransactions.error || null,
        };
      })
    );

    const totalTransactions = enrichedConnections.reduce((sum, c) => sum + (c.total_transactions || 0), 0);

    return NextResponse.json({
      success: true,
      connections: enrichedConnections,
      summary: {
        total_donors: enrichedConnections.length,
        total_transactions: totalTransactions,
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error) {
    console.error('Error fetching org Plaid connections:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
