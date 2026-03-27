export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = parseInt(searchParams.get('organizationId'));

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        stripeAccountId: true,
        ghlId: true,
        ghlAccounts: {
          select: { ghl_location_id: true },
          where: { status: 'active' },
          take: 1,
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const ghlLocationId = org.ghlAccounts?.[0]?.ghl_location_id || org.ghlId || null;

    return NextResponse.json({
      success: true,
      stripeAccountId: org.stripeAccountId || null,
      ghlLocationId,
    });
  } catch (error) {
    console.error('Error fetching connection info:', error);
    return NextResponse.json({ error: 'Failed to fetch connection info' }, { status: 500 });
  }
}
