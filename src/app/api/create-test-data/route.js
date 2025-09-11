import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { hash } from "bcryptjs";

export async function POST() {
  try {
    // Check if test data already exists
    const existingOrg = await prisma.organization.findFirst({
      where: { name: "Test Organization" }
    });

    if (existingOrg) {
      return NextResponse.json({
        success: false,
        message: "Test data already exists",
        data: {
          organization_id: existingOrg.id
        }
      });
    }

    // Create test organization
    const testOrganization = await prisma.organization.create({
      data: {
        name: "Test Organization",
        email: "test@changeworksfund.org",
        password: await hash("password123", 10),
        orgPassword: await hash("orgpass123", 10),
        phone: "+1234567890",
        company: "Test Company",
        address: "123 Test Street",
        city: "Test City",
        state: "Test State",
        country: "US",
        postalCode: "12345",
        website: "https://test.changeworksfund.org",
        status: true,
        balance: 0
      }
    });

    // Create test donor
    const testDonor = await prisma.donor.create({
      data: {
        name: "Test Donor",
        email: "donor@changeworksfund.org",
        password: await hash("password123", 10),
        phone: "+1987654321",
        city: "Donor City",
        address: "456 Donor Avenue",
        status: true,
        organization_id: testOrganization.id
      }
    });

    return NextResponse.json({
      success: true,
      message: "Test data created successfully",
      data: {
        organization: {
          id: testOrganization.id,
          name: testOrganization.name,
          email: testOrganization.email
        },
        donor: {
          id: testDonor.id,
          name: testDonor.name,
          email: testDonor.email
        }
      },
      instructions: [
        `Use Organization ID: ${testOrganization.id} for testing`,
        `Use Donor ID: ${testDonor.id} for testing`,
        "You can now test payment intents with these IDs",
        "Organization login: test@changeworksfund.org / orgpass123",
        "These are test accounts - safe to use for testing"
      ]
    });

  } catch (error) {
    console.error('Error creating test data:', error);
    return NextResponse.json({
      success: false,
      error: "Failed to create test data",
      details: error.message
    }, { status: 500 });
  }
}
