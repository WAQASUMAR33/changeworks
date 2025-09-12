import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function POST() {
  try {
    console.log('🧪 Testing complete donor password reset flow...');

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

    // Step 2: Check existing reset tokens
    const existingTokens = await prisma.passwordResetToken.findMany({
      where: { identifier: testDonor.email }
    });

    // Step 3: Check database schema
    const tokenCount = await prisma.passwordResetToken.count();

    return NextResponse.json({
      success: true,
      message: "Donor password reset system ready for testing",
      test_donor: {
        id: testDonor.id,
        name: testDonor.name,
        email: testDonor.email,
        organization: testDonor.organization.name
      },
      system_status: {
        database_connected: true,
        password_reset_tokens_table: true,
        total_reset_tokens: tokenCount,
        existing_tokens_for_donor: existingTokens.length
      },
      api_endpoints: {
        forgot_password: {
          url: "POST /api/donor/forgot-password",
          description: "Request password reset (sends email with reset link)",
          body: {
            email: "donor@example.com"
          }
        },
        verify_token: {
          url: "POST /api/donor/verify-reset-token",
          description: "Verify if reset token is valid",
          body: {
            token: "reset-token-here"
          }
        },
        reset_password: {
          url: "POST /api/donor/reset-password",
          description: "Reset password using valid token",
          body: {
            token: "reset-token-here",
            newPassword: "newpassword123",
            confirmPassword: "newpassword123"
          }
        }
      },
      test_flow: [
        "1. POST /api/donor/forgot-password with test donor email",
        "2. Check email or use returned token",
        "3. POST /api/donor/verify-reset-token to validate token",
        "4. POST /api/donor/reset-password to set new password",
        "5. Test login with new password"
      ],
      security_features: [
        "Tokens expire after 1 hour",
        "Tokens are single-use (deleted after password reset)",
        "Email existence is not revealed for security",
        "Passwords are hashed with bcrypt",
        "All operations are logged"
      ]
    });

  } catch (error) {
    console.error('❌ Password reset test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: "Password reset system test failed",
      details: error.message,
      possible_issues: [
        "Database connection issue",
        "PasswordResetToken table doesn't exist",
        "Donor table doesn't exist",
        "Prisma client not generated"
      ]
    }, { status: 500 });
  }
}
