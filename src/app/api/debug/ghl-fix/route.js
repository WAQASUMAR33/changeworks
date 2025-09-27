export async function GET() {
  try {
    // Check your current configuration
    const currentConfig = {
      hasApiKey: !!process.env.GHL_API_KEY,
      apiKeyLength: process.env.GHL_API_KEY ? process.env.GHL_API_KEY.length : 0,
      apiKeyType: process.env.GHL_API_KEY ? (process.env.GHL_API_KEY.startsWith('eyJ') ? 'JWT Token (Regular API Key)' : 'Agency API Key') : 'Not set',
      baseUrl: process.env.GHL_BASE_URL,
      correctEndpoint: process.env.GHL_BASE_URL === 'https://rest.gohighlevel.com/v1'
    };

    // Test the API call with corrected URL
    let apiTest = null;
    if (process.env.GHL_API_KEY) {
      try {
        const axios = require('axios');
        
        // Use the correct base URL (without /locations)
        const correctBaseUrl = 'https://rest.gohighlevel.com/v1';
        
        const response = await axios.post(`${correctBaseUrl}/locations/`, {
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
          data: response.data,
          message: 'SUCCESS! GHL API is working correctly'
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
      message: 'GHL Configuration Fix Analysis',
      currentConfig,
      apiTest,
      issues: [
        currentConfig.baseUrl === 'https://rest.gohighlevel.com/v1/locations' ? '❌ Your base URL includes /locations - this causes double path' : null,
        currentConfig.apiKeyType === 'JWT Token (Regular API Key)' ? '❌ You are using a JWT token instead of an Agency API Key' : null,
        currentConfig.apiKeyLength < 200 ? '❌ Your API key is too short. Agency API keys are 250+ characters' : null
      ].filter(Boolean),
      solution: {
        correctBaseUrl: 'https://rest.gohighlevel.com/v1',
        yourCurrentUrl: currentConfig.baseUrl,
        explanation: 'The base URL should NOT include /locations. The GHL client adds /locations/ automatically.',
        fix: 'Update your .env.local file: GHL_BASE_URL=https://rest.gohighlevel.com/v1'
      }
    });
  } catch (error) {
    return Response.json({
      error: 'Failed to analyze configuration',
      message: error.message
    }, { status: 500 });
  }
}
