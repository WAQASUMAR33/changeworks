export async function GET() {
  try {
    // Check your current configuration
    const config = {
      hasApiKey: !!process.env.GHL_API_KEY,
      apiKeyLength: process.env.GHL_API_KEY ? process.env.GHL_API_KEY.length : 0,
      apiKeyType: process.env.GHL_API_KEY ? (process.env.GHL_API_KEY.startsWith('eyJ') ? 'JWT Token (Regular API Key)' : 'Unknown') : 'Not set',
      baseUrl: process.env.GHL_BASE_URL,
      correctEndpoint: process.env.GHL_BASE_URL === 'https://services.leadconnectorhq.com'
    };

    // Test the API call with your current credentials
    let apiTest = null;
    if (process.env.GHL_API_KEY && process.env.GHL_BASE_URL) {
      try {
        const axios = require('axios');
        const response = await axios.post(`${process.env.GHL_BASE_URL}/locations/`, {
          name: 'Test Business',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '+1234567890',
          address: '123 Test St',
          city: 'Test City',
          state: 'CA',
          country: 'US',
          postalCode: '12345'
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        });
        
        apiTest = {
          success: true,
          status: response.status,
          data: response.data
        };
      } catch (error) {
        apiTest = {
          success: false,
          status: error.response?.status,
          error: error.response?.data || error.message,
          details: {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          }
        };
      }
    }

    return Response.json({
      message: 'GHL Configuration Analysis',
      yourConfig: config,
      apiTest,
      issues: [
        config.apiKeyType === 'JWT Token (Regular API Key)' ? '❌ You are using a JWT token (regular API key) instead of an Agency API Key' : null,
        config.apiKeyLength < 200 ? '❌ Your API key is too short. Agency API keys are 250+ characters' : null,
        !config.correctEndpoint ? '❌ Wrong API endpoint. Should be: https://rest.gohighlevel.com/v1' : null,
        config.apiKeyType === 'JWT Token (Regular API Key)' ? '❌ Regular API keys cannot create sub-accounts. You need an Agency API Key' : null
      ].filter(Boolean),
      solutions: [
        '1. Go to https://app.gohighlevel.com/agency/settings/api-keys',
        '2. Generate an "Agency API Key" (not regular API key)',
        '3. Copy the Agency API key (250+ characters)',
        '4. Update your .env.local file with the new key',
        '5. Change GHL_BASE_URL to: https://rest.gohighlevel.com/v1',
        '6. Make sure you have Agency Pro plan ($497/month)'
      ]
    });
  } catch (error) {
    return Response.json({
      error: 'Failed to analyze configuration',
      message: error.message
    }, { status: 500 });
  }
}
