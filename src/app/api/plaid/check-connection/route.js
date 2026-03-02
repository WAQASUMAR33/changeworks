import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const dynamic = 'force-dynamic';

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

async function verifyPlaidConnection(accessToken) {
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
      if (errorCode === 'INVALID_ACCESS_TOKEN') return { valid: false, status: 'INVALID' };
      if (errorCode === 'ITEM_LOGIN_REQUIRED') return { valid: true, status: 'LOGIN_REQUIRED' };
      return { valid: false, status: 'ERROR' };
    }

    return { valid: true, status: 'ACTIVE', accounts: data.accounts || [] };
  } catch {
    return { valid: false, status: 'ERROR' };
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const donorIdParam = searchParams.get('donor_id');

    if (!donorIdParam) {
      return NextResponse.json(
        { success: false, error: 'donor_id query parameter is required' },
        { status: 400 }
      );
    }

    const donorId = parseInt(donorIdParam);
    if (isNaN(donorId)) {
      return NextResponse.json(
        { success: false, error: 'donor_id must be a valid number' },
        { status: 400 }
      );
    }

    // Fetch all connections from DB for this donor
    const dbConnections = await prisma.plaidConnection.findMany({
      where: { donor_id: donorId },
      select: {
        id: true,
        access_token: true,
        institution_name: true,
        institution_id: true,
        accounts: true,
        created_at: true,
        organization: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const validConnections = [];
    const invalidIds = [];

    // Verify each connection live against Plaid
    await Promise.all(
      dbConnections.map(async (conn) => {
        const result = await verifyPlaidConnection(conn.access_token);

        if (result.status === 'INVALID') {
          // Fake/mock token — mark for deletion
          invalidIds.push(conn.id);
          return;
        }

        validConnections.push({
          id: conn.id,
          institution_name: conn.institution_name,
          institution_id: conn.institution_id,
          status: result.status,        // ACTIVE or LOGIN_REQUIRED — from Plaid live
          accounts: conn.accounts,
          created_at: conn.created_at,
          organization: conn.organization,
        });
      })
    );

    // Auto-delete invalid (mock) connections
    if (invalidIds.length > 0) {
      await prisma.plaidConnection.deleteMany({
        where: { id: { in: invalidIds } },
      });
    }

    const isConnected = validConnections.some((c) => c.status === 'ACTIVE');

    return NextResponse.json({
      success: true,
      is_connected: isConnected,
      connections: validConnections,
      connection_count: validConnections.length,
      donor_id: donorId,
    });
  } catch (error) {
    console.error('Error checking Plaid connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check Plaid connection', details: error.message },
      { status: 500 }
    );
  }
}
