import GHLClient from '../../../lib/ghl-client';

export async function POST() {
  try {
    // Test data for creating a sub-account
    const testData = {
      businessName: 'Test Business ' + Date.now(),
      firstName: 'John',
      lastName: 'Doe',
      email: `test+${Date.now()}@example.com`,
      phone: '+447534983788', // UK phone number in E.164 format
      address: '123 Test Street',
      city: 'London',
      state: 'England',
      country: 'GB', // UK uses GB code (ISO-3166-1)
      postalCode: 'SW1A 1AA',
      website: 'https://testbusiness.com',
      timezone: 'Europe/London', // Correct timezone for UK
      companyId: process.env.GHL_COMPANY_ID || 'BWID4bp77xwMfmzh1iud' // From environment or fallback
    };

    // Create GHL client and make the request
    const ghlClient = new GHLClient();
    const result = await ghlClient.createSubAccount(testData);

    // Return the raw response for analysis
    return Response.json({
      message: 'Raw GHL API Response',
      timestamp: new Date().toISOString(),
      testData,
      ghlResponse: result,
      success: result.success,
      locationId: result.locationId,
      error: result.error,
      statusCode: result.statusCode,
      fullResponse: result
    });
  } catch (error) {
    return Response.json({
      message: 'GHL API Error',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
