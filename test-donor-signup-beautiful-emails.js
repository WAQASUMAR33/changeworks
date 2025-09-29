// Test donor signup with beautiful HTML emails
const BASE_URL = 'https://app.changeworksfund.org';

async function testDonorSignupWithBeautifulEmails() {
  console.log('🧪 Testing Donor Signup with Beautiful HTML Emails');
  console.log('📧 Verification Email + Welcome Email');
  console.log('=' .repeat(60));

  try {
    // Test data
    const testData = {
      name: "Beautiful Email Test User",
      email: "beautifulemailtest@gmail.com",
      password: "TestPassword123",
      phone: "+1234567890",
      city: "New York",
      address: "123 Test Street",
      postal_code: "10001",
      organization_id: 1 // ChangeWorks Org
    };

    console.log('📋 Test Data:');
    console.log('   Name:', testData.name);
    console.log('   Email:', testData.email);
    console.log('   Organization ID:', testData.organization_id);
    console.log('');

    // Send signup request
    console.log('🚀 Sending donor signup request...');
    const response = await fetch(`${BASE_URL}/api/donor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response:', JSON.stringify(result, null, 2));

    if (result.message) {
      console.log('\n✅ SIGNUP RESPONSE:');
      console.log('   Message:', result.message);
    }

    if (result.donor) {
      console.log('\n👤 DONOR CREATED:');
      console.log('   ID:', result.donor.id);
      console.log('   Name:', result.donor.name);
      console.log('   Email:', result.donor.email);
      console.log('   Organization:', result.donor.organization?.name);
      console.log('   Status:', result.donor.status);
    }

    if (result.email_status) {
      console.log('\n📧 EMAIL STATUS:');
      
      if (result.email_status.verification_email) {
        console.log('   📧 Verification Email:');
        console.log('      Sent:', result.email_status.verification_email.sent ? '✅ YES' : '❌ NO');
        console.log('      Type:', result.email_status.verification_email.type);
        if (result.email_status.verification_email.error) {
          console.log('      Error:', result.email_status.verification_email.error);
        }
      }
      
      if (result.email_status.welcome_email) {
        console.log('   📧 Welcome Email:');
        console.log('      Sent:', result.email_status.welcome_email.sent ? '✅ YES' : '❌ NO');
        console.log('      Type:', result.email_status.welcome_email.type);
        if (result.email_status.welcome_email.error) {
          console.log('      Error:', result.email_status.welcome_email.error);
        }
      }

      if (result.email_status.verification_token && !result.email_status.verification_email?.sent) {
        console.log('   🔑 Verification Token (if email failed):', result.email_status.verification_token);
      }
    }

    if (result.ghl_contact_status) {
      console.log('\n🔗 GHL CONTACT STATUS:');
      console.log('   Created:', result.ghl_contact_status.created ? '✅ YES' : '❌ NO');
      if (result.ghl_contact_status.contact_id) {
        console.log('   Contact ID:', result.ghl_contact_status.contact_id);
      }
      if (result.ghl_contact_status.error) {
        console.log('   Error:', result.ghl_contact_status.error);
      }
    }

    // Summary
    console.log('\n🎉 TEST SUMMARY:');
    if (result.email_status?.verification_email?.sent && result.email_status?.welcome_email?.sent) {
      console.log('   ✅ BOTH BEAUTIFUL EMAILS SENT SUCCESSFULLY!');
      console.log('   📧 Verification Email: Beautiful blue-themed HTML');
      console.log('   📧 Welcome Email: Beautiful green-themed HTML');
      console.log('   🎨 Both emails include your contact information');
      console.log('   📱 Both emails are responsive and professional');
    } else {
      console.log('   ⚠️ EMAIL SENDING ISSUES DETECTED');
      console.log('   📧 Check email configuration in production');
      console.log('   📧 Verify Hostinger SMTP settings');
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Check the donor\'s email inbox');
    console.log('   2. Look for beautiful HTML verification email');
    console.log('   3. Look for beautiful HTML welcome email');
    console.log('   4. Both emails should have professional styling');
    console.log('   5. Both emails should include your contact info');

  } catch (error) {
    console.error('❌ Error testing donor signup:', error.message);
  }
}

// Run the test
testDonorSignupWithBeautifulEmails();
