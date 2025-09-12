import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { hash } from "bcryptjs";

export async function POST() {
  try {
    console.log('🧪 Creating test organization...');

    // Check if test organization already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { email: "testorg@example.com" }
    });

    if (existingOrg) {
      return NextResponse.json({
        success: true,
        message: "Test organization already exists",
        organization: {
          id: existingOrg.id,
          name: existingOrg.name,
          email: existingOrg.email
        }
      });
    }

    // Create test organization
    const hashedPassword = await hash("password123", 10);
    
    const organization = await prisma.organization.create({
      data: {
        name: "Test Organization",
        email: "testorg@example.com",
        password: hashedPassword,
        orgPassword: hashedPassword,
        phone: "+1234567890",
        city: "Test City",
        address: "123 Test Street",
        status: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        address: true
      }
    });

    console.log('✅ Test organization created:', organization.name);

    return NextResponse.json({
      success: true,
      message: "Test organization created successfully",
      organization: organization,
      login_credentials: {
        email: "testorg@example.com",
        password: "password123"
      }
    });

  } catch (error) {
    console.error('❌ Failed to create test organization:', error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to create test organization",
      details: error.message
    }, { status: 500 });
  }
}
