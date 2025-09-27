import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    console.log('🔍 Checking available organizations...');

    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        created_at: true,
        _count: {
          select: {
            donors: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log(`📊 Found ${organizations.length} organizations`);

    return NextResponse.json({
      success: true,
      message: "Organizations retrieved successfully",
      count: organizations.length,
      organizations: organizations,
      usage: {
        note: "Use organization.id for donor signup",
        example: "POST /api/donor/signup-test with organization_id: 1"
      }
    });

  } catch (error) {
    console.error('❌ Error fetching organizations:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch organizations",
      details: error.message,
      possible_causes: [
        "Database connection issue",
        "Organization table doesn't exist",
        "Prisma client not generated"
      ]
    }, { status: 500 });
  }
}
