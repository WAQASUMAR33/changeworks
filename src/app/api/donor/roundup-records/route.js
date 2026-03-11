import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const donorId = decoded.id;

    const records = await prisma.saveTrRecord.findMany({
      where: {
        trx_donor_id: donorId,
        trx_method: 'ach',
      },
      orderBy: { trx_date: 'desc' },
      select: {
        id: true,
        trx_date: true,
        trx_amount: true,
        trx_method: true,
        pay_status: true,
        organization: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, records });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    console.error('roundup-records error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load records' }, { status: 500 });
  }
}
