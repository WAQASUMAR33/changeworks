import axios from 'axios';

export async function GET() {
  try {
    // Make a call to get company information
    const response = await axios.get('https://services.leadconnectorhq.com/companies/me', {
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });

    return Response.json({
      message: 'Company Information Retrieved',
      success: true,
      companyInfo: response.data,
      companyId: response.data.id || response.data.companyId,
      companyName: response.data.name
    });
  } catch (error) {
    return Response.json({
      message: 'Failed to get company information',
      success: false,
      error: error.response?.data?.message || error.message,
      statusCode: error.response?.status || 500,
      details: error.response?.data || null
    }, { status: 500 });
  }
}
