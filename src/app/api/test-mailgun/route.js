import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Test Mailgun email configuration
export async function POST(request) {
  try {
    const body = await request.json();
    const { to, subject = "Test Email from ChangeWorks", message = "This is a test email from ChangeWorks using Mailgun." } = body;

    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    // Create transporter using Mailgun SMTP configuration
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM,
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
              <li><strong>Server:</strong> ${process.env.EMAIL_SERVER_HOST}</li>
              <li><strong>Port:</strong> ${process.env.EMAIL_SERVER_PORT}</li>
              <li><strong>From:</strong> ${process.env.EMAIL_FROM}</li>
              <li><strong>Sent At:</strong> ${new Date().toISOString()}</li>
            </ul>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            This email was sent from ChangeWorks Fund using Mailgun SMTP service.
          </p>
        </div>
      `,
      text: `${message}\n\nEmail Configuration:\n- Server: ${process.env.EMAIL_SERVER_HOST}\n- Port: ${process.env.EMAIL_SERVER_PORT}\n- From: ${process.env.EMAIL_FROM}\n- Sent At: ${new Date().toISOString()}`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      emailConfig: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        from: process.env.EMAIL_FROM,
        to: to
      },
      sentAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Mailgun email error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send email', 
        details: error.message,
        emailConfig: {
          host: process.env.EMAIL_SERVER_HOST,
          port: process.env.EMAIL_SERVER_PORT,
          from: process.env.EMAIL_FROM
        }
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check email configuration
export async function GET(request) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Mailgun email configuration check',
      emailConfig: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        user: process.env.EMAIL_SERVER_USER,
        from: process.env.EMAIL_FROM,
        configured: !!(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_PORT && process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD && process.env.EMAIL_FROM)
      },
      availablePorts: [25, 587, 2525, 465],
      currentPort: process.env.EMAIL_SERVER_PORT,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Email config check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check email configuration', details: error.message },
      { status: 500 }
    );
  }
}
