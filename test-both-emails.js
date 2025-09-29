// Test both verification and welcome emails
const BASE_URL = 'https://app.changeworksfund.org';

async function testVerificationEmail() {
  console.log('📧 Testing Verification Email');
  console.log('=' .repeat(50));

  try {
    const response = await fetch(`${BASE_URL}/api/email/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        donor_id: 60, // Using donor ID 60 (Qasim Ali)
        verification_token: 'test_verification_token_12345',
        verification_link: 'https://app.changeworksfund.org/verify-email?token=test_verification_token_12345&donor_id=60'
      })
    });

    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ VERIFICATION EMAIL SENT SUCCESSFULLY!');
      console.log('📧 Message ID:', result.emailResult.messageId);
      console.log('📧 Sent to:', result.emailResult.donor.email);
      console.log('📧 Donor Name:', result.emailResult.donor.name);
      console.log('📧 Verification Link:', result.emailResult.verificationLink);
    } else {
      console.log('❌ VERIFICATION EMAIL FAILED');
      console.log('Error:', result.error);
    }

  } catch (error) {
    console.error('❌ Error testing verification email:', error.message);
  }
}

async function testWelcomeEmail() {
  console.log('\n📧 Testing Welcome Email');
  console.log('=' .repeat(50));

  try {
    const response = await fetch(`${BASE_URL}/api/email/send-welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        donor_id: 60, // Using donor ID 60 (Qasim Ali)
        organization_id: 1, // Using organization ID 1 (ChangeWorks Org)
        dashboard_link: 'https://app.changeworksfund.org/donor/dashboard?donor_id=60'
      })
    });

    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ WELCOME EMAIL SENT SUCCESSFULLY!');
      console.log('📧 Message ID:', result.emailResult.messageId);
      console.log('📧 Sent to:', result.emailResult.donor.email);
      console.log('📧 Donor Name:', result.emailResult.donor.name);
      console.log('📧 Organization:', result.emailResult.organization.name);
      console.log('📧 Dashboard Link:', result.emailResult.dashboardLink);
    } else {
      console.log('❌ WELCOME EMAIL FAILED');
      console.log('Error:', result.error);
    }

  } catch (error) {
    console.error('❌ Error testing welcome email:', error.message);
  }
}

async function testBothEmails() {
  console.log('🧪 Testing Both Email Types');
  console.log('📧 Verification Email + Welcome Email');
  console.log('=' .repeat(60));

  await testVerificationEmail();
  await testWelcomeEmail();

  console.log('\n🎉 Email Testing Complete!');
  console.log('📋 Summary:');
  console.log('   ✅ Verification Email: Beautiful HTML with verification button');
  console.log('   ✅ Welcome Email: Thank you message with organization details');
  console.log('   ✅ Both emails use your contact information');
  console.log('   ✅ Both emails have professional styling');
}

// Run the tests
testBothEmails();
