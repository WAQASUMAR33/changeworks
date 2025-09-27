import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    // Test database connection and check for required data
    const [donorCount, organizationCount, sampleDonor, sampleOrganization] = await Promise.all([
      prisma.donor.count(),
      prisma.organization.count(),
      prisma.donor.findFirst({
        select: { id: true, name: true, email: true, organization_id: true }
      }),
      prisma.organization.findFirst({
        select: { id: true, name: true, email: true }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: {
        donor_count: donorCount,
        organization_count: organizationCount,
        sample_donor: sampleDonor,
        sample_organization: sampleOrganization,
        has_test_data: donorCount > 0 && organizationCount > 0
      },
      suggestions: donorCount === 0 || organizationCount === 0 ? [
        "Create at least one donor and one organization to test payments",
        "Use the admin panel to add test data",
        "Or use the organization signup to create test accounts"
      ] : []
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: "Database connection failed",
      details: error.message,
      suggestions: [
        "Check if DATABASE_URL is set correctly",
        "Verify database server is running",
        "Run 'npx prisma generate' and 'npx prisma db push'",
        "Check network connectivity to database"
      ]
    }, { status: 500 });
  }
}
