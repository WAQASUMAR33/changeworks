// Test Hostinger email via production API
const BASE_URL = 'https://app.changeworksfund.org';

async function testProductionHostinger() {
  console.log('🧪 Testing Hostinger Email via Production API');
  console.log('📧 Sending test email to: theitxprts@gmail.com');
  console.log('=' .repeat(60));

  try {
    // Test 1: Check email configuration
    console.log('\n📋 Step 1: Check email configuration');
    console.log('-' .repeat(40));
    
    const configResponse = await fetch(`${BASE_URL}/api/test-mailgun`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const configResult = await configResponse.json();
    
    console.log('Status:', configResponse.status);
    console.log('Configuration:', JSON.stringify(configResult, null, 2));

    if (!configResult.success) {
      console.log('❌ Configuration check failed');
      return;
    }

    // Test 2: Send test email
    console.log('\n📋 Step 2: Send test email');
    console.log('-' .repeat(40));
    
    const emailResponse = await fetch(`${BASE_URL}/api/test-mailgun`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'theitxprts@gmail.com',
        subject: 'ChangeWorks Hostinger Production Test',
        message: `
Hello!

This is a test email from ChangeWorks Fund to verify that our Hostinger email integration is working correctly in production.

Email Details:
- Sent from: ChangeWorks Fund
- Provider: Hostinger
- Server: smtp.hostinger.com:587
- From: noreply@rapidtechpro.com
- Sent at: ${new Date().toISOString()}

If you receive this email, the Hostinger integration is working perfectly in production! 🎉

Best regards,
ChangeWorks Fund Team
        `
      })
    });

    const emailResult = await emailResponse.json();
    
    console.log('Status:', emailResponse.status);
    console.log('Response:', JSON.stringify(emailResult, null, 2));

    if (emailResult.success) {
      console.log('\n✅ EMAIL SENT SUCCESSFULLY VIA PRODUCTION API!');
      console.log('📧 Message ID:', emailResult.messageId);
      console.log('📧 Sent to:', emailResult.emailConfig.to);
      console.log('📧 From:', emailResult.emailConfig.from);
      console.log('📧 Server:', emailResult.emailConfig.host + ':' + emailResult.emailConfig.port);
      console.log('📧 Sent at:', emailResult.sentAt);
      console.log('\n🎉 Please check theitxprts@gmail.com inbox for the test email!');
    } else {
      console.log('\n❌ EMAIL FAILED TO SEND VIA PRODUCTION API');
      console.log('Error:', emailResult.error);
      console.log('Details:', emailResult.details);
      console.log('Email Config:', emailResult.emailConfig);
    }

  } catch (error) {
    console.error('❌ Error testing Hostinger email:', error.message);
  }
}

// Run the test
testProductionHostinger();
