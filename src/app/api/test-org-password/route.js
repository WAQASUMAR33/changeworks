import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { compare } from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🔍 Testing organization password for:', email);

    // Find organization
    const organization = await prisma.organization.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        orgPassword: true,
        status: true
      }
    });

    if (!organization) {
      return NextResponse.json({
        success: false,
        error: "Organization not found"
      });
    }

    console.log('✅ Organization found:', organization.name);

    // Test password comparison
    const passwordMatch = await compare(password, organization.password || '');
    const orgPasswordMatch = await compare(password, organization.orgPassword || '');

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.email,
        status: organization.status
      },
      password_tests: {
        password_field_exists: !!organization.password,
        orgPassword_field_exists: !!organization.orgPassword,
        password_matches: passwordMatch,
        orgPassword_matches: orgPasswordMatch,
        either_matches: passwordMatch || orgPasswordMatch
      }
    });

  } catch (error) {
    console.error('❌ Password test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: "Password test failed",
      details: error.message
    }, { status: 500 });
  }
}
