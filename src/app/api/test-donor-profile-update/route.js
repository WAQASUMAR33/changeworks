import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import jwt from "jsonwebtoken";

export async function POST() {
  try {
    console.log('🧪 Testing donor profile update system...');

    // Step 1: Check if we have donors to test with
    const donors = await prisma.donor.findMany({
      take: 1,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        address: true,
        imageUrl: true,
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
        id: testDonor.id,
        email: testDonor.email,
        role: 'DONOR'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return NextResponse.json({
      success: true,
      message: "Donor profile update system ready for testing",
      current_profile: {
        id: testDonor.id,
        name: testDonor.name,
        email: testDonor.email,
        phone: testDonor.phone,
        city: testDonor.city,
        address: testDonor.address,
        imageUrl: testDonor.imageUrl,
        organization: testDonor.organization.name
      },
      test_token: testToken,
      api_endpoint: {
        url: "PUT /api/donor/update-profile",
        description: "Update donor profile (phone, city, address, imageUrl only)",
        headers: {
          "Authorization": "Bearer YOUR_JWT_TOKEN",
          "Content-Type": "application/json"
        },
        body: {
          phone: "new_phone_number",
          city: "new_city",
          address: "new_address",
          imageUrl: "https://example.com/new-image.jpg"
        }
      },
      editable_fields: {
        phone: "Phone number (optional, can be cleared by sending empty string)",
        city: "City name (optional, can be cleared by sending empty string)",
        address: "Street address (optional, can be cleared by sending empty string)",
        imageUrl: "Profile image URL (optional, must be valid URL or empty string)"
      },
      protected_fields: {
        name: "Cannot be updated (protected for security)",
        email: "Cannot be updated (protected for security)"
      },
      test_flow: [
        "1. Login as donor to get JWT token (POST /api/donor/login)",
        "2. Use JWT token in Authorization header",
        "3. PUT /api/donor/update-profile with new profile data",
        "4. Verify profile was updated by checking response"
      ],
      security_features: [
        "Requires valid JWT token (user must be logged in)",
        "Only allows updating specific fields (phone, city, address, imageUrl)",
        "Prevents updating name and email for security",
        "Input validation with Zod schema",
        "URL validation for imageUrl field",
        "Allows clearing fields by sending empty strings"
      ],
      validation_rules: [
        "phone: optional string",
        "city: optional string", 
        "address: optional string",
        "imageUrl: optional valid URL or empty string"
      ],
      example_usage: {
        headers: {
          "Authorization": `Bearer ${testToken}`,
          "Content-Type": "application/json"
        },
        body: {
          phone: "+1234567890",
          city: "New York",
          address: "123 Main Street",
          imageUrl: "https://example.com/profile.jpg"
        }
      },
      example_partial_update: {
        headers: {
          "Authorization": `Bearer ${testToken}`,
          "Content-Type": "application/json"
        },
        body: {
          phone: "+9876543210"
        }
      }
    });

  } catch (error) {
    console.error('❌ Profile update test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: "Profile update system test failed",
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
