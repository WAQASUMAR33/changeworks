/**
 * GHL Marketplace App - Uninstall Webhook
 *
 * GHL sends a POST here when a user uninstalls the app.
 * Body: { companyId, locationId, userId, appId }
 *
 * You should revoke / delete stored tokens for this location.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { companyId, locationId, userId, appId } = body;

    console.log('GHL app uninstall received', { companyId, locationId, userId, appId });

    // TODO: remove stored OAuth tokens and Stripe Connect account for this location

    return Response.json({ success: true, message: 'Uninstall acknowledged' });
  } catch (error) {
    console.error('GHL uninstall webhook error', error.message);
    return Response.json(
      { success: false, message: 'Uninstall handler failed', error: error.message },
      { status: 500 }
    );
  }
}
