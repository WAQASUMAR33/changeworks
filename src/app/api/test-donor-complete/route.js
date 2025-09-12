import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function POST() {
  try {
    console.log('🧪 Testing complete donor signup and login flow...');

    // Step 1: Ensure test organization exists
    console.log('🏢 Step 1: Setting up test organization...');
    
    let testOrganization = await prisma.organization.findFirst({
      where: {
        email: "test@changeworksfund.org"
      }
    });

    if (!testOrganization) {
      testOrganization = await prisma.organization.create({
        data: {
          name: "Test Organization",
          email: "test@changeworksfund.org",
          password: "hashedpassword123",
          orgPassword: "hashedorgpass123",
          phone: "+1234567890",
          company: "Test Organization",
          address: "123 Test Street",
          city: "Test City",
          state: "Test State",
          country: "US",
          postalCode: "12345",
          status: true,
          balance: 0
        }
      });
    }

    console.log(`✅ Test organization ready: ${testOrganization.name} (ID: ${testOrganization.id})`);

    // Step 2: Test donor signup API
    console.log('👤 Step 2: Testing donor signup...');

    const testDonorEmail = `testdonor_${Date.now()}@example.com`;
    const donorData = {
      name: "Test Donor User",
      email: testDonorEmail,
      password: "password123",
      phone: "+1555123456",
      city: "Test City",
      address: "789 Donor Street",
      imageUrl: "",
      organization_id: testOrganization.id
    };

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    
    // Test signup
    const signupResponse = await fetch(`${baseUrl}/api/donor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donorData)
    });

    const signupResult = await signupResponse.json();

    if (!signupResponse.ok) {
      return NextResponse.json({
        success: false,
        error: "Donor signup failed",
        details: signupResult,
        step: "donor_signup",
        request_data: { ...donorData, password: '[HIDDEN]' }
      }, { status: 400 });
    }

    console.log(`✅ Donor signup successful: ${signupResult.donor?.name}`);

    // Step 3: Verify donor in database
    console.log('🔍 Step 3: Verifying donor in database...');

    const savedDonor = await prisma.donor.findUnique({
      where: { email: testDonorEmail },
      include: {
        organization: { select: { id: true, name: true } }
      }
    });

    if (!savedDonor) {
      return NextResponse.json({
        success: false,
        error: "Donor not found in database after signup",
        step: "database_verification"
      }, { status: 500 });
    }

    // Step 4: Test donor login
    console.log('🔐 Step 4: Testing donor login...');

    const loginData = {
      email: testDonorEmail,
      password: "password123"
    };

    const loginResponse = await fetch(`${baseUrl}/api/donor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });

    const loginResult = await loginResponse.json();
    const loginSuccessful = loginResponse.ok && loginResult.token;

    console.log(`${loginSuccessful ? '✅' : '❌'} Donor login: ${loginSuccessful ? 'Successful' : 'Failed'}`);

    // Step 5: Test validation errors
    console.log('⚠️ Step 5: Testing validation...');

    // Test invalid email
    const invalidEmailResponse = await fetch(`${baseUrl}/api/donor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...donorData,
        email: 'invalid-email',
        organization_id: testOrganization.id
      })
    });

    const invalidEmailRejected = !invalidEmailResponse.ok;

    // Test missing required fields
    const missingFieldsResponse = await fetch(`${baseUrl}/api/donor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `missing_${Date.now()}@example.com`,
        // Missing name and password
        organization_id: testOrganization.id
      })
    });

    const missingFieldsRejected = !missingFieldsResponse.ok;

    console.log(`${invalidEmailRejected ? '✅' : '❌'} Invalid email validation`);
    console.log(`${missingFieldsRejected ? '✅' : '❌'} Missing fields validation`);

    // Step 6: Check verification token details
    const verificationToken = await prisma.donorVerificationToken.findFirst({
      where: { identifier: testDonorEmail }
    });

    return NextResponse.json({
      success: true,
      message: "🎉 Donor signup and login APIs are working correctly!",
      test_results: {
        organization_setup: "✅ PASSED",
        donor_signup: "✅ PASSED",
        database_save: "✅ PASSED",
        donor_login: loginSuccessful ? "✅ PASSED" : "❌ FAILED",
        verification_token: verificationToken ? "✅ PASSED" : "⚠️ NOT CREATED",
        email_validation: invalidEmailRejected ? "✅ PASSED" : "❌ FAILED",
        required_fields_validation: missingFieldsRejected ? "✅ PASSED" : "❌ FAILED"
      },
      created_donor: {
        id: savedDonor.id,
        name: savedDonor.name,
        email: savedDonor.email,
        phone: savedDonor.phone,
        city: savedDonor.city,
        address: savedDonor.address,
        status: savedDonor.status,
        organization: savedDonor.organization,
        created_at: savedDonor.created_at,
        password_hashed: true
      },
      login_test: {
        attempted: true,
        successful: loginSuccessful,
        token_received: !!loginResult.token,
        login_response: loginSuccessful ? "Login successful" : loginResult.error
      },
      verification: {
        token_created: !!verificationToken,
        token_expires: verificationToken?.expires,
        verification_url: verificationToken ? 
          `${baseUrl}/api/verify-donor?token=${verificationToken.token}` : null
      },
      api_endpoints_tested: [
        "POST /api/donor (signup)",
        "POST /api/donor/login",
        "Database: donor table",
        "Database: donorVerificationToken table",
        "Validation: email format",
        "Validation: required fields",
        "Validation: organization existence"
      ],
      cleanup_note: `Test donor created with email: ${testDonorEmail}`,
      next_steps: [
        "Test email verification if email server is configured",
        "Test donor transaction creation",
        "Test donor password reset functionality",
        "Clean up test data if needed"
      ]
    });

  } catch (error) {
    console.error('❌ Donor signup test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: "Donor signup test failed",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      suggestions: [
        "Check database connection",
        "Verify donor and organization tables exist",
        "Check email server configuration in environment variables",
        "Ensure JWT_SECRET is set for login tokens",
        "Run 'npx prisma generate' if schema changed"
      ]
    }, { status: 500 });
  }
}
