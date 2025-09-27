import axios from 'axios';

export async function GET() {
  try {
    // Try to get locations which should include company info
    const response = await axios.get('https://services.leadconnectorhq.com/locations/', {
      headers: {
        'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });

    return Response.json({
      message: 'Locations Retrieved',
      success: true,
      locations: response.data,
      firstLocation: response.data[0] || null,
      companyId: response.data[0]?.companyId || null,
      totalLocations: response.data.length
    });
  } catch (error) {
    return Response.json({
      message: 'Failed to get locations',
      success: false,
      error: error.response?.data?.message || error.message,
      statusCode: error.response?.status || 500,
      details: error.response?.data || null,
      fullError: error.response?.data
    }, { status: 500 });
  }
}
