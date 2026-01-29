import { NextResponse } from 'next/server';
import { emailService } from '../../lib/email-service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to');

    if (!to) {
      return NextResponse.json({ 
        error: 'Missing "to" query parameter',
        usage: '/api/test-email?to=your-email@example.com' 
      }, { status: 400 });
    }

    // Attempt to verify connection first
    const connectionStatus = await emailService.verifyConnection();
    if (!connectionStatus.success) {
      return NextResponse.json({ 
        error: 'SMTP Connection failed', 
        details: connectionStatus.error 
      }, { status: 500 });
    }

    // Send a test email
    const result = await emailService.sendEmail({
      to,
      subject: 'ChangeWorks Test Email',
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #302E56;">Test Email</h1>
            <p>This is a test email from your ChangeWorks application.</p>
            <p>If you are reading this, your email configuration is working correctly!</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              Sent from: ${process.env.EMAIL_FROM || 'configured address'}<br>
              Time: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
      text: `This is a test email from ChangeWorks. If you are reading this, your email configuration is working correctly! Sent at ${new Date().toLocaleString()}`
    });

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test email sent successfully',
        details: result 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send email', 
        details: result.error 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Test email route error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
