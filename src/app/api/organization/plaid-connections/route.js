import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET_KEY = process.env.PLAID_SECRET_KEY;
const PLAID_ENV = process.env.NEXT_PUBLIC_PLAID_ENV || 'sandbox';

const PLAID_BASE_URL = `https://${PLAID_ENV}.plaid.com`;

export const dynamic = 'force-dynamic';

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

    // Fetch all active Plaid connections for this organization
    const connections = await prisma.plaidConnection.findMany({
      where: {
        organization_id: organizationId,
        status: 'ACTIVE',
      },
      include: {
        donor: {
          select: { id: true, name: true, email: true, phone: true, imageUrl: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // For each connection, fetch Plaid transactions
    const enrichedConnections = await Promise.all(
      connections.map(async (conn) => {
        let accounts = [];
        try {
          accounts = conn.accounts ? JSON.parse(conn.accounts) : [];
        } catch {
          accounts = [];
        }

        const plaidData = await fetchPlaidTransactions(conn.access_token, startDate, endDate);

        return {
          id: conn.id,
          status: conn.status,
          institution_name: conn.institution_name,
          institution_id: conn.institution_id,
          connected_at: conn.created_at,
          updated_at: conn.updated_at,
          donor: conn.donor,
          accounts: accounts.map((a) => ({
            account_id: a.account_id,
            name: a.name,
            official_name: a.official_name,
            type: a.type,
            subtype: a.subtype,
            mask: a.mask,
            balances: a.balances,
          })),
          transactions: plaidData.transactions,
          total_transactions: plaidData.total_transactions,
          transactions_error: plaidData.error || null,
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
