import axios from 'axios';

/**
 * GHL Marketplace App - Install / OAuth Authorization Endpoint
 *
 * GHL redirects here after the user clicks "Install" in the marketplace.
 * Query params: ?code=<auth_code>&companyId=<id>&userId=<id>
 *
 * Flow:
 *  1. Exchange `code` for access_token + refresh_token via GHL OAuth
 *  2. Store tokens against the companyId / locationId in your DB
 *  3. Redirect the user back to GHL or show a success screen
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code       = searchParams.get('code');
  const companyId  = searchParams.get('companyId');
  const userId     = searchParams.get('userId');

  // Custom payment / product params
  const ghlId     = searchParams.get('ghl_id');
  const amount    = searchParams.get('amount');
  const productId = searchParams.get('product_id');
  const type      = searchParams.get('type');

  if (!code) {
    return Response.json(
      { success: false, message: 'Missing authorization code' },
      { status: 400 }
    );
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post(
      'https://services.leadconnectorhq.com/oauth/token',
      new URLSearchParams({
        client_id:     process.env.GHL_APP_CLIENT_ID,
        client_secret: process.env.GHL_APP_CLIENT_SECRET,
        grant_type:    'authorization_code',
        code,
        redirect_uri:  process.env.GHL_APP_REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in, locationId, scope } =
      tokenResponse.data;

    // TODO: persist to DB keyed by locationId / companyId
    // Record should include: access_token, refresh_token, expires_in,
    //   locationId, companyId, userId, ghlId, amount, productId, type
    console.log('GHL OAuth install success', {
      locationId,
      companyId,
      userId,
      ghlId,
      amount,
      productId,
      type,
      scope,
      expires_in,
      accessTokenPreview: access_token?.substring(0, 20) + '...',
    });

    // Redirect back to GHL dashboard after install
    const redirectUrl =
      process.env.GHL_POST_INSTALL_REDIRECT ||
      `https://app.gohighlevel.com/location/${locationId}/dashboard`;

    return Response.redirect(redirectUrl, 302);
  } catch (error) {
    console.error('GHL install OAuth error', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Response.json(
      {
        success: false,
        message: 'OAuth token exchange failed',
        error: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
