// Test updated welcome email with new format
const BASE_URL = 'https://app.changeworksfund.org';

async function testUpdatedWelcomeEmail() {
  console.log('🧪 Testing Updated Welcome Email Service');
  console.log('📧 New beautiful HTML format with updated contact info');
  console.log('=' .repeat(60));

  try {
    // Test 1: Check email configuration
    console.log('\n📋 Step 1: Check email configuration');
    console.log('-' .repeat(40));
    
    const configResponse = await fetch(`${BASE_URL}/api/email/send-welcome`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const configResult = await configResponse.json();
    
    console.log('Status:', configResponse.status);
    console.log('Email Config:', configResult.emailConfig);
    console.log('Connection Test:', configResult.connectionTest);

    if (!configResult.success) {
      console.log('❌ Configuration check failed');
      return;
    }

    // Test 2: Send updated welcome email
    console.log('\n📋 Step 2: Send updated welcome email');
    console.log('-' .repeat(40));
    
    const emailResponse = await fetch(`${BASE_URL}/api/email/send-welcome`, {
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

    const emailResult = await emailResponse.json();
    
    console.log('Status:', emailResponse.status);
    console.log('Response:', JSON.stringify(emailResult, null, 2));

    if (emailResult.success) {
      console.log('\n✅ UPDATED WELCOME EMAIL SENT SUCCESSFULLY!');
      console.log('📧 Message ID:', emailResult.emailResult.messageId);
      console.log('📧 Sent to:', emailResult.emailResult.donor.email);
      console.log('📧 Donor Name:', emailResult.emailResult.donor.name);
      console.log('📧 Organization:', emailResult.emailResult.organization.name);
      console.log('📧 Dashboard Link:', emailResult.emailResult.dashboardLink);
      console.log('📧 Sent at:', emailResult.sentAt);
      console.log('\n🎉 Please check the donor\'s email inbox for the beautiful welcome email!');
      console.log('\n📋 Email Features:');
      console.log('   ✅ Beautiful HTML design with gradients');
      console.log('   ✅ Professional styling and typography');
      console.log('   ✅ Responsive layout');
      console.log('   ✅ Updated contact information');
      console.log('   ✅ Call-to-action button');
      console.log('   ✅ Organization name from database');
    } else {
      console.log('\n❌ WELCOME EMAIL FAILED TO SEND');
      console.log('Error:', emailResult.error);
      console.log('Details:', emailResult.details);
      if (emailResult.donor) {
        console.log('Donor:', emailResult.donor);
      }
      if (emailResult.organization) {
        console.log('Organization:', emailResult.organization);
      }
    }

  } catch (error) {
    console.error('❌ Error testing updated welcome email:', error.message);
  }
}

// Run the test
testUpdatedWelcomeEmail();
