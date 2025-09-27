import GHLClient from '../../../lib/ghl-client';

export async function POST() {
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

    console.log('=== GHL API TEST START ===');
    console.log('Test Data:', JSON.stringify(testData, null, 2));
    console.log('Environment Check:', {
      hasApiKey: !!process.env.GHL_API_KEY,
      apiKeyLength: process.env.GHL_API_KEY ? process.env.GHL_API_KEY.length : 0,
      baseUrl: process.env.GHL_BASE_URL
    });

    // Create GHL client and make the request
    const ghlClient = new GHLClient();
    const result = await ghlClient.createSubAccount(testData);

    console.log('=== GHL API RESPONSE ===');
    console.log('Success:', result.success);
    console.log('Full Result:', JSON.stringify(result, null, 2));

    return Response.json({
      message: 'GHL API Response Analysis',
      testData,
      environment: {
        hasApiKey: !!process.env.GHL_API_KEY,
        apiKeyLength: process.env.GHL_API_KEY ? process.env.GHL_API_KEY.length : 0,
        baseUrl: process.env.GHL_BASE_URL,
        correctBaseUrl: process.env.GHL_BASE_URL === 'https://rest.gohighlevel.com/v1'
      },
      ghlResponse: result,
      analysis: {
        success: result.success,
        hasLocationId: !!result.locationId,
        hasData: !!result.data,
        errorDetails: result.error || null,
        statusCode: result.statusCode || null
      }
    });
  } catch (error) {
    console.error('=== GHL API ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    return Response.json({
      message: 'GHL API Error',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
