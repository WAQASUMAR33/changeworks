import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifyAdminToken } from '../../../lib/admin-auth';

export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAdminToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has admin role
    if (!['ADMIN', 'SUPERADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }
    // Workaround for broken Prisma Client
    const donorsRaw = await prisma.$queryRaw`
      SELECT d.id, d.name, d.email, d.phone, o.id as organization_id, o.name as organization_name 
      FROM donors d 
      LEFT JOIN organizations o ON d.organization_id = o.id 
      ORDER BY d.name ASC
    `;
    
    const donors = donorsRaw.map(d => ({
        id: d.id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        organization: d.organization_id ? {
            id: d.organization_id,
            name: d.organization_name
        } : null
    }));

    return NextResponse.json({
      success: true,
      donors: donors
    });
  } catch (error) {
    console.error('Error fetching donors:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch donors',
      details: error.message
    }, { status: 500 });
  }
}
