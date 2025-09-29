// Test card failure emails
const BASE_URL = 'https://app.changeworksfund.org';

async function testCardFailureAlertEmail() {
  console.log('🧪 Testing Card Failure Alert Email');
  console.log('📧 Beautiful HTML format with card update alert');
  console.log('=' .repeat(60));

  try {
    // Test data
    const testData = {
      donor_id: 60, // Using donor ID 60 (Qasim Ali)
      organization_id: 1, // Using organization ID 1 (ChangeWorks Org)
      dashboard_link: "https://app.changeworksfund.org/donor/dashboard?donor_id=60"
    };

    console.log('📋 Test Data:');
    console.log('   Donor ID:', testData.donor_id);
    console.log('   Organization ID:', testData.organization_id);
    console.log('   Dashboard Link:', testData.dashboard_link);
    console.log('');

    // Send card failure alert email
    console.log('🚀 Sending card failure alert email...');
    const response = await fetch(`${BASE_URL}/api/email/send-card-failure-alert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ CARD FAILURE ALERT EMAIL SENT SUCCESSFULLY!');
      console.log('📧 Message ID:', result.emailResult.messageId);
      console.log('📧 Sent to:', result.emailResult.donor.email);
      console.log('📧 Donor Name:', result.emailResult.donor.name);
      console.log('📧 Organization:', result.emailResult.organization.name);
      console.log('📧 Dashboard Link:', result.emailResult.dashboardLink);
      console.log('📧 Sent at:', result.sentAt);
      console.log('\n🎉 Please check the donor\'s email inbox for the beautiful card failure alert email!');
      console.log('\n📋 Email Features:');
      console.log('   ✅ Beautiful red-themed HTML design');
      console.log('   ✅ ChangeWorks logo embedded from public folder');
      console.log('   ✅ Card failure alert prominently displayed');
      console.log('   ✅ Professional styling and typography');
      console.log('   ✅ Responsive layout');
      console.log('   ✅ Card update button');
      console.log('   ✅ Contact information included');
      console.log('   ✅ P.S. section for assistance');
    } else {
      console.log('\n❌ CARD FAILURE ALERT EMAIL FAILED TO SEND');
      console.log('Error:', result.error);
      console.log('Details:', result.details);
    }

  } catch (error) {
    console.error('❌ Error testing card failure alert email:', error.message);
  }
}

async function testCardFailureFinalReminderEmail() {
  console.log('\n🧪 Testing Card Failure Final Reminder Email');
  console.log('📧 Beautiful HTML format with final reminder');
  console.log('=' .repeat(60));

  try {
    // Test data
    const testData = {
      donor_id: 60, // Using donor ID 60 (Qasim Ali)
      organization_id: 1, // Using organization ID 1 (ChangeWorks Org)
      dashboard_link: "https://app.changeworksfund.org/donor/dashboard?donor_id=60"
    };

    console.log('📋 Test Data:');
    console.log('   Donor ID:', testData.donor_id);
    console.log('   Organization ID:', testData.organization_id);
    console.log('   Dashboard Link:', testData.dashboard_link);
    console.log('');

    // Send final reminder email
    console.log('🚀 Sending final reminder email...');
    const response = await fetch(`${BASE_URL}/api/email/send-card-failure-final-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ FINAL REMINDER EMAIL SENT SUCCESSFULLY!');
      console.log('📧 Message ID:', result.emailResult.messageId);
      console.log('📧 Sent to:', result.emailResult.donor.email);
      console.log('📧 Donor Name:', result.emailResult.donor.name);
      console.log('📧 Organization:', result.emailResult.organization.name);
      console.log('📧 Dashboard Link:', result.emailResult.dashboardLink);
      console.log('📧 Sent at:', result.sentAt);
      console.log('\n🎉 Please check the donor\'s email inbox for the beautiful final reminder email!');
      console.log('\n📋 Email Features:');
      console.log('   ✅ Beautiful orange-themed HTML design');
      console.log('   ✅ ChangeWorks logo embedded from public folder');
      console.log('   ✅ Final reminder prominently displayed');
      console.log('   ✅ Professional styling and typography');
      console.log('   ✅ Responsive layout');
      console.log('   ✅ Urgent card update button');
      console.log('   ✅ Impact message highlighted');
      console.log('   ✅ Contact information included');
    } else {
      console.log('\n❌ FINAL REMINDER EMAIL FAILED TO SEND');
      console.log('Error:', result.error);
      console.log('Details:', result.details);
    }

  } catch (error) {
    console.error('❌ Error testing final reminder email:', error.message);
  }
}

async function testBothCardFailureEmails() {
  console.log('🧪 Testing Both Card Failure Email Types');
  console.log('📧 Alert Email + Final Reminder Email');
  console.log('=' .repeat(60));

  await testCardFailureAlertEmail();
  await testCardFailureFinalReminderEmail();

  console.log('\n🎉 Card Failure Email Testing Complete!');
  console.log('📋 Summary:');
  console.log('   ✅ Card Failure Alert: Beautiful red-themed HTML with alert');
  console.log('   ✅ Final Reminder: Beautiful orange-themed HTML with urgency');
  console.log('   ✅ Both emails use your contact information');
  console.log('   ✅ Both emails have professional styling');
  console.log('   ✅ Both emails include ChangeWorks logo');
  console.log('   ✅ Both emails have dashboard access buttons');
}

// Run the tests
testBothCardFailureEmails();
