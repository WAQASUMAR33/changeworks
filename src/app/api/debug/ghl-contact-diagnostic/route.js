import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import GHLClient from "../../../lib/ghl-client";

export async function POST(request) {
  try {
    const body = await request.json();
    const { organization_id, location_id } = body;

    console.log('🔍 GHL Contact Creation Diagnostic Starting...');
    console.log('Organization ID:', organization_id);
    console.log('Location ID:', location_id);

    const diagnostic = {
      timestamp: new Date().toISOString(),
      organization_id: organization_id,
      location_id: location_id,
      tests: {}
    };

    // Test 1: Check Organization and GHL Account
    try {
      const ghlAccount = await prisma.gHLAccount.findFirst({
        where: { 
          organization_id: organization_id,
          ...(location_id && { ghl_location_id: location_id })
        },
        select: { 
          id: true,
          ghl_location_id: true, 
          business_name: true,
          status: true,
          organization: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      diagnostic.tests.organization_ghl_check = {
        status: ghlAccount ? "✅ PASSED" : "❌ FAILED",
        data: ghlAccount,
        message: ghlAccount 
          ? `Found GHL account: ${ghlAccount.business_name} (Location ID: ${ghlAccount.ghl_location_id})`
          : "No GHL account found for this organization"
      };

      if (!ghlAccount) {
        return NextResponse.json({
          success: false,
          message: "No GHL account found for organization",
          diagnostic
        }, { status: 404 });
      }

      // Test 2: Check GHL API Key Configuration
      const ghlClient = new GHLClient();
      const apiKeyLength = process.env.GHL_API_KEY?.length || 0;
      const hasApiKey = !!process.env.GHL_API_KEY;

      diagnostic.tests.api_key_check = {
        status: hasApiKey ? "✅ PASSED" : "❌ FAILED",
        data: {
          has_api_key: hasApiKey,
          key_length: apiKeyLength,
          key_type: apiKeyLength > 200 ? "Agency Key (Good)" : "Location Key (Limited)",
          key_prefix: process.env.GHL_API_KEY?.substring(0, 10) || "N/A"
        },
        message: hasApiKey 
          ? `API key found (${apiKeyLength} chars) - ${apiKeyLength > 200 ? "Agency key" : "Location key"}`
          : "No GHL API key configured"
      };

      // Test 3: Test GHL API Connection
      try {
        const testResult = await ghlClient.getSubAccount(ghlAccount.ghl_location_id);
        
        diagnostic.tests.ghl_api_connection = {
          status: testResult.success ? "✅ PASSED" : "❌ FAILED",
          data: testResult,
          message: testResult.success 
            ? "GHL API connection successful"
            : `GHL API connection failed: ${testResult.error}`
        };
      } catch (apiError) {
        diagnostic.tests.ghl_api_connection = {
          status: "❌ FAILED",
          error: apiError.message,
          message: `GHL API connection error: ${apiError.message}`
        };
      }

      // Test 4: Test Contact Creation with Minimal Data
      try {
        const testContactData = {
          firstName: "Test",
          lastName: "Contact",
          email: `test-${Date.now()}@example.com`,
          phone: "+1234567890",
          source: "ChangeWorks Diagnostic Test"
        };

        console.log('🧪 Testing contact creation with minimal data...');
        const contactResult = await ghlClient.createContact(ghlAccount.ghl_location_id, testContactData);

        diagnostic.tests.contact_creation_test = {
          status: contactResult.success ? "✅ PASSED" : "❌ FAILED",
          data: contactResult,
          message: contactResult.success 
            ? `Contact created successfully (ID: ${contactResult.contactId})`
            : `Contact creation failed: ${contactResult.error}`
        };

        // If contact was created successfully, clean it up
        if (contactResult.success && contactResult.contactId) {
          console.log('🧹 Cleaning up test contact...');
          // Note: GHL doesn't have a direct delete contact API, so we'll just log it
          console.log(`Test contact created with ID: ${contactResult.contactId} - please delete manually if needed`);
        }

      } catch (contactError) {
        diagnostic.tests.contact_creation_test = {
          status: "❌ FAILED",
          error: contactError.message,
          message: `Contact creation test failed: ${contactError.message}`
        };
      }

      // Test 5: Check API Scopes and Permissions
      diagnostic.tests.api_scopes = {
        status: "⚠️ INFO",
        data: {
          required_scopes: [
            "contacts.write",
            "contacts.read",
            "locations.read"
          ],
          current_api_key_type: apiKeyLength > 200 ? "Agency" : "Location",
          scope_limitation: apiKeyLength <= 200 ? "Location keys have limited scopes" : "Agency keys have full scopes"
        },
        message: apiKeyLength <= 200 
          ? "⚠️ Location API key detected - may have limited scopes for contact creation"
          : "✅ Agency API key detected - should have full scopes"
      };

    } catch (error) {
      diagnostic.tests.general_error = {
        status: "❌ FAILED",
        error: error.message,
        message: `Diagnostic failed: ${error.message}`
      };
    }

    // Generate recommendations
    const recommendations = [];
    
    if (!diagnostic.tests.organization_ghl_check?.data) {
      recommendations.push("❌ Set up a GHL account for this organization first");
    }
    
    if (!diagnostic.tests.api_key_check?.data?.has_api_key) {
      recommendations.push("❌ Configure GHL_API_KEY in environment variables");
    }
    
    if (diagnostic.tests.api_key_check?.data?.key_length <= 200) {
      recommendations.push("⚠️ Consider using an Agency API key for full contact creation permissions");
    }
    
    if (diagnostic.tests.ghl_api_connection?.status === "❌ FAILED") {
      recommendations.push("❌ Check GHL API key validity and network connectivity");
    }
    
    if (diagnostic.tests.contact_creation_test?.status === "❌ FAILED") {
      recommendations.push("❌ Contact creation failed - check API scopes and permissions");
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ All tests passed - contact creation should work");
    }

    return NextResponse.json({
      success: true,
      message: "GHL Contact Creation Diagnostic Complete",
      diagnostic,
      recommendations,
      summary: {
        organization_ready: !!diagnostic.tests.organization_ghl_check?.data,
        api_configured: !!diagnostic.tests.api_key_check?.data?.has_api_key,
        api_connection_working: diagnostic.tests.ghl_api_connection?.status === "✅ PASSED",
        contact_creation_working: diagnostic.tests.contact_creation_test?.status === "✅ PASSED"
      }
    });

  } catch (error) {
    console.error("❌ GHL Contact Diagnostic failed:", error);

    return NextResponse.json({
      success: false,
      error: "Diagnostic failed",
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const organization_id = searchParams.get('organization_id');

    if (!organization_id) {
      return NextResponse.json({
        success: false,
        message: "organization_id parameter is required"
      }, { status: 400 });
    }

    // Quick check for organization GHL status
    const ghlAccount = await prisma.gHLAccount.findFirst({
      where: { organization_id: parseInt(organization_id) },
      select: { 
        id: true,
        ghl_location_id: true, 
        business_name: true,
        status: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Quick GHL Account Check",
      organization_id: parseInt(organization_id),
      ghl_account: ghlAccount,
      has_ghl_account: !!ghlAccount,
      ready_for_contacts: !!ghlAccount && ghlAccount.status === "active"
    });

  } catch (error) {
    console.error("❌ Quick GHL check failed:", error);

    return NextResponse.json({
      success: false,
      error: "Quick check failed",
      details: error.message
    }, { status: 500 });
  }
}

