import GHLClient from '../../../lib/ghl-client';

export async function POST(req) {
  try {
    // Test data for creating a sub-account
    const testData = {
      businessName: 'Test Business ' + Date.now(),
      firstName: 'John',
      lastName: 'Doe',
      email: `test+${Date.now()}@example.com`,
      phone: '+1234567890',
      address: '123 Test Street',
      city: 'Test City',
      state: 'CA',
      country: 'US',
      postalCode: '12345',
      website: 'https://testbusiness.com',
      timezone: 'America/Los_Angeles'
    };

    // Check environment variables
    const envCheck = {
      hasApiKey: !!process.env.GHL_API_KEY,
      hasBaseUrl: !!process.env.GHL_BASE_URL,
      baseUrl: process.env.GHL_BASE_URL,
      apiKeyLength: process.env.GHL_API_KEY ? process.env.GHL_API_KEY.length : 0
    };

    // Test direct GHL API call
    const ghlClient = new GHLClient();
    const ghlResult = await ghlClient.createSubAccount(testData);

    // Also test our API endpoint
    const apiResponse = await fetch(`${req.headers.origin}/api/ghl/subaccount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const apiResult = await apiResponse.json();

    return Response.json({
      message: 'GHL Test Results',
      environment: envCheck,
      testData,
      directGHLResult: ghlResult,
      apiEndpointResult: {
        status: apiResponse.status,
        data: apiResult
      },
      comparison: {
        directSuccess: ghlResult.success,
        apiSuccess: apiResponse.ok,
        sameResult: JSON.stringify(ghlResult) === JSON.stringify(apiResult)
      }
    }, { status: 200 });
  } catch (error) {
    return Response.json({
      message: 'Test failed',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
