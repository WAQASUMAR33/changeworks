import { NextResponse } from "next/server";

// Test Mailgun API (not SMTP) for sending emails
export async function POST(request) {
  try {
    const body = await request.json();
    const { to, subject = "Test Email from ChangeWorks", message = "This is a test email from ChangeWorks using Mailgun API." } = body;

    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Mailgun API configuration
    const MAILGUN_API_KEY = process.env.EMAIL_SERVER_PASSWORD; // Using the same password as API key
    const MAILGUN_DOMAIN = 'mg.changeworksfund.org';
    const MAILGUN_API_URL = `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;

    // Email data
    const emailData = {
      from: process.env.EMAIL_FROM || `noreply@${MAILGUN_DOMAIN}`,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            ChangeWorks Email Test
          </h2>
          <p style="color: #666; line-height: 1.6;">
            ${message}
          </p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">Email Configuration Details:</h3>
            <ul style="color: #666;">
              <li><strong>Method:</strong> Mailgun API</li>
              <li><strong>Domain:</strong> ${MAILGUN_DOMAIN}</li>
              <li><strong>From:</strong> ${process.env.EMAIL_FROM || `noreply@${MAILGUN_DOMAIN}`}</li>
              <li><strong>Sent At:</strong> ${new Date().toISOString()}</li>
            </ul>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            This email was sent from ChangeWorks Fund using Mailgun API service.
          </p>
        </div>
      `,
      text: `${message}\n\nEmail Configuration:\n- Method: Mailgun API\n- Domain: ${MAILGUN_DOMAIN}\n- From: ${process.env.EMAIL_FROM || `noreply@${MAILGUN_DOMAIN}`}\n- Sent At: ${new Date().toISOString()}`
    };

    // Send email via Mailgun API
    const response = await fetch(MAILGUN_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(emailData)
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully via Mailgun API',
        messageId: result.id,
        emailConfig: {
          method: 'Mailgun API',
          domain: MAILGUN_DOMAIN,
          from: emailData.from,
          to: to
        },
        sentAt: new Date().toISOString(),
        mailgunResponse: result
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send email via Mailgun API', 
          details: result.message || 'Unknown error',
          status: response.status,
          mailgunResponse: result
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Mailgun API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send email via Mailgun API', 
        details: error.message
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check Mailgun API configuration
export async function GET(request) {
  try {
    const MAILGUN_DOMAIN = 'mg.changeworksfund.org';
    const MAILGUN_API_KEY = process.env.EMAIL_SERVER_PASSWORD;
    
    return NextResponse.json({
      success: true,
      message: 'Mailgun API configuration check',
      emailConfig: {
        method: 'Mailgun API',
        domain: MAILGUN_DOMAIN,
        apiKey: MAILGUN_API_KEY ? '***SET***' : 'NOT SET',
        from: process.env.EMAIL_FROM || `noreply@${MAILGUN_DOMAIN}`,
        configured: !!(MAILGUN_API_KEY && MAILGUN_DOMAIN)
      },
      apiUrl: `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Mailgun API config check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check Mailgun API configuration', details: error.message },
      { status: 500 }
    );
  }
}
