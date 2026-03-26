import { NextResponse } from 'next/server';
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
      const errorCode = data?.error_code;
      if (errorCode === 'INVALID_ACCESS_TOKEN') return { accounts: [], status: 'INVALID', errorCode };
      if (errorCode === 'ITEM_LOGIN_REQUIRED') return { accounts: [], status: 'LOGIN_REQUIRED', errorCode };
      return { accounts: [], status: 'ERROR', errorCode, error: data?.error_message };
    }

    return { accounts: data.accounts || [], status: 'ACTIVE' };
  } catch (err) {
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

    if (!response.ok) return null;
    const data = await response.json();
    return data.institution || null;
  } catch {
    return null;
  }
}

async function checkFundingSource(accessToken) {
  try {
    const response = await fetch(`${PLAID_BASE_URL}/auth/get`, {
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
      return { ready: false, ach_count: 0, error: data?.error_message || data?.error_code };
    }

    const achNumbers = data?.numbers?.ach || [];
    return {
      ready: achNumbers.length > 0,
      ach_count: achNumbers.length,
      ach_details: achNumbers.map((n) => ({
        account_id: n.account_id,
        account_last4: n.account?.slice(-4),
        routing: n.routing,
      })),
    };
  } catch {
    return { ready: false, ach_count: 0, error: 'Failed to check auth' };
  }
}

export async function GET(req) {
  try {
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

    const connections = await prisma.plaidConnection.findMany({
      where: { organization_id: organizationId },
      include: {
        donor: {
          select: { id: true, name: true, email: true, phone: true, imageUrl: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const enrichedConnections = [];

    await Promise.all(
      connections.map(async (conn) => {
        const accountsData = await fetchPlaidAccounts(conn.access_token);

        const [institutionData, fundingSource] = await Promise.all([
          fetchPlaidInstitution(conn.institution_id),
          checkFundingSource(conn.access_token),
        ]);

        enrichedConnections.push({
          id: conn.id,
          status: accountsData.status,
          institution_name: institutionData?.name || conn.institution_name || null,
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
          funding_source: fundingSource,
        });
      })
    );

    enrichedConnections.sort((a, b) => new Date(b.connected_at) - new Date(a.connected_at));

    const fundingReadyCount = enrichedConnections.filter((c) => c.funding_source?.ready).length;

    return NextResponse.json({
      success: true,
      connections: enrichedConnections,
      summary: {
        total_donors: enrichedConnections.length,
        funding_ready: fundingReadyCount,
        institutions: new Set(enrichedConnections.map((c) => c.institution_id).filter(Boolean)).size,
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
