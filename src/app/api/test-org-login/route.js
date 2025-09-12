import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    console.log('🧪 Testing organization login system...');

    // Get first organization for testing
    const organization = await prisma.organization.findFirst({
      select: {
        id: true,
        name: true,
        email: true,
        status: true
      }
    });

    if (!organization) {
      return NextResponse.json({
        success: false,
        error: "No organizations found",
        suggestion: "Create an organization first"
      });
    }

    return NextResponse.json({
      success: true,
      message: "Organization found for testing",
      test_organization: organization,
      login_test: {
        url: "POST /api/organization/login",
        body: {
          email: organization.email,
          password: "password123" // Default password
        }
      }
    });

  } catch (error) {
    console.error('❌ Organization test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: "Organization test failed",
      details: error.message
    }, { status: 500 });
  }
}
