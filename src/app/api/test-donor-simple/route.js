import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    console.log('🔍 Simple donor API check...');

    // Step 1: Check database connection
    const donorCount = await prisma.donor.count();
    const organizationCount = await prisma.organization.count();
    
    console.log(`📊 Database: ${donorCount} donors, ${organizationCount} organizations`);

    // Step 2: Get sample data
    const sampleDonor = await prisma.donor.findFirst({
      include: {
        organization: { select: { id: true, name: true } }
      }
    });

    const sampleOrganization = await prisma.organization.findFirst({
      select: { id: true, name: true, email: true }
    });

    // Step 3: Check donor verification tokens
    const verificationTokenCount = await prisma.donorVerificationToken.count();

    return NextResponse.json({
      success: true,
      message: "✅ Donor API database check successful",
      database_status: {
        connected: true,
        donor_count: donorCount,
        organization_count: organizationCount,
        verification_token_count: verificationTokenCount
      },
      sample_data: {
        donor: sampleDonor ? {
          id: sampleDonor.id,
          name: sampleDonor.name,
          email: sampleDonor.email,
          organization: sampleDonor.organization
        } : null,
        organization: sampleOrganization
      },
      api_endpoints: {
        donor_signup: "POST /api/donor",
        donor_login: "POST /api/donor/login",
        donor_list: "GET /api/donor",
        donor_verification: "GET /api/verify-donor"
      },
      required_fields_for_signup: [
        "name (required)",
        "email (required, unique)",
        "password (required, min 6 chars)",
        "organization_id (required, must exist)",
        "phone (optional)",
        "city (optional)",
        "address (optional)",
        "imageUrl (optional)"
      ],
      test_ready: donorCount >= 0 && organizationCount > 0
    });

  } catch (error) {
    console.error('❌ Donor API check failed:', error);
    
    return NextResponse.json({
      success: false,
      error: "Database connection or schema issue",
      details: error.message,
      possible_issues: [
        "Database not connected",
        "Donor table doesn't exist",
        "Organization table doesn't exist", 
        "DonorVerificationToken table doesn't exist",
        "Prisma client not generated"
      ],
      solutions: [
        "Check DATABASE_URL environment variable",
        "Run 'npx prisma generate'",
        "Run 'npx prisma db push'",
        "Verify database server is running"
      ]
    }, { status: 500 });
  }
}
