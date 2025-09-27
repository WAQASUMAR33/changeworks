import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import jwt from "jsonwebtoken";

export async function POST() {
  try {
    console.log('🧪 Testing donor change password system...');

    // Step 1: Check if we have donors to test with
    const donors = await prisma.donor.findMany({
      take: 1,
      select: {
        id: true,
        name: true,
        email: true,
        organization: {
          select: { name: true }
        }
      }
    });

    if (donors.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No donors found for testing",
        suggestion: "Create a donor first using POST /api/donor"
      });
    }

    const testDonor = donors[0];
    console.log('✅ Test donor found:', testDonor.name);

    // Step 2: Generate a test JWT token for the donor
    const testToken = jwt.sign(
      { 
        donorId: testDonor.id,
        email: testDonor.email,
        type: 'donor'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return NextResponse.json({
      success: true,
      message: "Donor change password system ready for testing",
      test_donor: {
        id: testDonor.id,
        name: testDonor.name,
        email: testDonor.email,
        organization: testDonor.organization.name
      },
      test_token: testToken,
      api_endpoint: {
        url: "POST /api/donor/change-password",
        description: "Change password when user knows current password",
        headers: {
          "Authorization": "Bearer YOUR_JWT_TOKEN",
          "Content-Type": "application/json"
        },
        body: {
          currentPassword: "current_password_here",
          newPassword: "new_password_here",
          confirmPassword: "new_password_here"
        }
      },
      test_flow: [
        "1. Login as donor to get JWT token (POST /api/donor/login)",
        "2. Use JWT token in Authorization header",
        "3. POST /api/donor/change-password with current and new passwords",
        "4. Verify password was changed by trying to login with new password"
      ],
      security_features: [
        "Requires valid JWT token (user must be logged in)",
        "Verifies current password before changing",
        "New password must be different from current password",
        "Passwords are hashed with bcrypt",
        "Input validation with Zod schema",
        "Password confirmation must match"
      ],
      validation_rules: [
        "currentPassword: required, must match existing password",
        "newPassword: required, minimum 6 characters",
        "confirmPassword: required, must match newPassword"
      ],
      example_usage: {
        headers: {
          "Authorization": `Bearer ${testToken}`,
          "Content-Type": "application/json"
        },
        body: {
          currentPassword: "password123",
          newPassword: "newpassword456",
          confirmPassword: "newpassword456"
        }
      }
    });

  } catch (error) {
    console.error('❌ Change password test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: "Change password system test failed",
      details: error.message,
      possible_issues: [
        "Database connection issue",
        "JWT_SECRET not configured",
        "Donor table doesn't exist",
        "Prisma client not generated"
      ]
    }, { status: 500 });
  }
}
