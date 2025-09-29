// Test Hostinger email configuration
const nodemailer = require('nodemailer');
require('dotenv').config();

async function testHostingerEmail() {
  console.log('🧪 Testing Hostinger Email Configuration');
  console.log('📧 Sending test email to: theitxprts@gmail.com');
  console.log('=' .repeat(60));

  // Check environment variables
  console.log('\n📋 Environment Variables:');
  console.log('EMAIL_SERVER_HOST:', process.env.EMAIL_SERVER_HOST);
  console.log('EMAIL_SERVER_PORT:', process.env.EMAIL_SERVER_PORT);
  console.log('EMAIL_SERVER_USER:', process.env.EMAIL_SERVER_USER);
  console.log('EMAIL_SERVER_PASSWORD:', process.env.EMAIL_SERVER_PASSWORD ? '***SET***' : 'NOT SET');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

  if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    console.log('\n❌ Missing required environment variables!');
    return;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
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

    console.log('\n📧 Testing SMTP connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    // Send test email
    console.log('\n📧 Sending test email...');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: 'theitxprts@gmail.com',
      subject: 'ChangeWorks Hostinger Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            ChangeWorks Hostinger Email Test
          </h2>
          <p style="color: #666; line-height: 1.6;">
            This is a test email from ChangeWorks Fund using Hostinger email service.
          </p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #007bff; margin-top: 0;">Email Configuration:</h3>
            <ul style="color: #666;">
              <li><strong>Provider:</strong> Hostinger</li>
              <li><strong>Server:</strong> ${process.env.EMAIL_SERVER_HOST}</li>
              <li><strong>Port:</strong> ${process.env.EMAIL_SERVER_PORT}</li>
              <li><strong>From:</strong> ${process.env.EMAIL_FROM}</li>
              <li><strong>Sent At:</strong> ${new Date().toISOString()}</li>
              <li><strong>Test Type:</strong> Local Test</li>
            </ul>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            This email was sent from ChangeWorks Fund using Hostinger email service.
          </p>
        </div>
      `,
      text: `ChangeWorks Hostinger Email Test\n\nThis is a test email from ChangeWorks Fund using Hostinger email service.\n\nEmail Configuration:\n- Provider: Hostinger\n- Server: ${process.env.EMAIL_SERVER_HOST}\n- Port: ${process.env.EMAIL_SERVER_PORT}\n- From: ${process.env.EMAIL_FROM}\n- Sent At: ${new Date().toISOString()}\n- Test Type: Local Test`
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Sent to: theitxprts@gmail.com');
    console.log('📧 From:', process.env.EMAIL_FROM);
    console.log('📧 Server:', process.env.EMAIL_SERVER_HOST + ':' + process.env.EMAIL_SERVER_PORT);
    console.log('\n🎉 Please check theitxprts@gmail.com inbox for the test email!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testHostingerEmail();
