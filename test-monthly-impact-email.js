// Test monthly impact email
const BASE_URL = 'https://app.changeworksfund.org';

async function testMonthlyImpactEmail() {
  console.log('🧪 Testing Monthly Impact Email');
  console.log('📧 Beautiful HTML format with impact details');
  console.log('=' .repeat(60));

  try {
    // Test data
    const testData = {
      donor_id: 60, // Using donor ID 60 (Qasim Ali)
      organization_id: 1, // Using organization ID 1 (ChangeWorks Org)
      month: "December",
      total_amount: "25.50",
      dashboard_link: "https://app.changeworksfund.org/donor/dashboard?donor_id=60"
    };

    console.log('📋 Test Data:');
    console.log('   Donor ID:', testData.donor_id);
    console.log('   Organization ID:', testData.organization_id);
    console.log('   Month:', testData.month);
    console.log('   Total Amount:', testData.total_amount);
    console.log('   Dashboard Link:', testData.dashboard_link);
    console.log('');

    // Send monthly impact email
    console.log('🚀 Sending monthly impact email...');
    const response = await fetch(`${BASE_URL}/api/email/send-monthly-impact`, {
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
      console.log('\n✅ MONTHLY IMPACT EMAIL SENT SUCCESSFULLY!');
      console.log('📧 Message ID:', result.emailResult.messageId);
      console.log('📧 Sent to:', result.emailResult.donor.email);
      console.log('📧 Donor Name:', result.emailResult.donor.name);
      console.log('📧 Organization:', result.emailResult.organization.name);
      console.log('📧 Month:', result.emailResult.month);
      console.log('📧 Total Amount:', result.emailResult.totalAmount);
      console.log('📧 Dashboard Link:', result.emailResult.dashboardLink);
      console.log('📧 Sent at:', result.sentAt);
      console.log('\n🎉 Please check the donor\'s email inbox for the beautiful monthly impact email!');
      console.log('\n📋 Email Features:');
      console.log('   ✅ Beautiful purple-themed HTML design');
      console.log('   ✅ ChangeWorks logo embedded from public folder');
      console.log('   ✅ Impact amount prominently displayed');
      console.log('   ✅ Professional styling and typography');
      console.log('   ✅ Responsive layout');
      console.log('   ✅ Dashboard access button');
      console.log('   ✅ Contact information included');
      console.log('   ✅ Gratitude message highlighted');
    } else {
      console.log('\n❌ MONTHLY IMPACT EMAIL FAILED TO SEND');
      console.log('Error:', result.error);
      console.log('Details:', result.details);
    }

  } catch (error) {
    console.error('❌ Error testing monthly impact email:', error.message);
  }
}

// Run the test
testMonthlyImpactEmail();
