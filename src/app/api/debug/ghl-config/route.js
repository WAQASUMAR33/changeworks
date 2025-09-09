export async function GET() {
  // This endpoint helps debug GHL configuration
  const config = {
    hasApiKey: !!process.env.GHL_API_KEY,
    hasBaseUrl: !!process.env.GHL_BASE_URL,
    baseUrl: process.env.GHL_BASE_URL,
    apiKeyLength: process.env.GHL_API_KEY ? process.env.GHL_API_KEY.length : 0,
    apiKeyPrefix: process.env.GHL_API_KEY ? process.env.GHL_API_KEY.substring(0, 10) + '...' : 'Not set'
  };

  return Response.json({
    message: 'GHL Configuration Debug',
    config,
    note: 'This endpoint shows configuration status. Never expose this in production!'
  });
}
