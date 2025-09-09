export async function GET() {
  const currentConfig = {
    hasApiKey: !!process.env.GHL_API_KEY,
    apiKeyLength: process.env.GHL_API_KEY ? process.env.GHL_API_KEY.length : 0,
    currentBaseUrl: process.env.GHL_BASE_URL,
    correctBaseUrl: 'https://services.leadconnectorhq.com',
    isBaseUrlCorrect: process.env.GHL_BASE_URL === 'https://services.leadconnectorhq.com'
  };

  return Response.json({
    message: 'GHL Configuration Check',
    currentConfig,
    issues: [
      ...(currentConfig.currentBaseUrl !== 'https://services.leadconnectorhq.com' ? [
        `❌ Wrong Base URL: "${currentConfig.currentBaseUrl}" should be "https://services.leadconnectorhq.com"`
      ] : []),
      ...(currentConfig.apiKeyLength < 200 ? [
        `⚠️ API Key seems short (${currentConfig.apiKeyLength} chars). Agency API keys are typically 250+ characters.`
      ] : []),
      ...(!currentConfig.hasApiKey ? [
        '❌ GHL_API_KEY is not set'
      ] : [])
    ],
    fixes: [
      '1. Update your .env.local file:',
      '   GHL_BASE_URL=https://services.leadconnectorhq.com',
      '',
      '2. Find your Company ID from GHL dashboard',
      '3. Restart your development server (npm run dev)',
      '4. Test the API at /organization/dashboard/ghl/debug'
    ]
  });
}
