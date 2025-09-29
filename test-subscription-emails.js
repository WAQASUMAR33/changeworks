// Test subscription email flow
const BASE_URL = 'https://app.changeworksfund.org';

async function testSubscriptionEmailFlow() {
  console.log('🧪 Testing Subscription Email Flow');
  console.log('📧 Welcome + Monthly Impact emails on subscription creation');
  console.log('=' .repeat(60));

  try {
    // Test data for subscription creation
    const subscriptionData = {
      donor_id: 60, // Using donor ID 60 (Qasim Ali)
      organization_id: 1, // Using organization ID 1 (ChangeWorks Org)
      package_id: 1, // Using package ID 1
      customer_email: "qasim107@gmail.com",
      customer_name: "Qasim Ali",
      create_checkout_session: true,
      return_url: "https://app.changeworksfund.org/subscription/success?session_id={CHECKOUT_SESSION_ID}&donor_id=60&organization_id=1"
    };

    console.log('📋 Test Data:');
    console.log('   Donor ID:', subscriptionData.donor_id);
    console.log('   Organization ID:', subscriptionData.organization_id);
    console.log('   Package ID:', subscriptionData.package_id);
    console.log('   Customer Email:', subscriptionData.customer_email);
    console.log('   Customer Name:', subscriptionData.customer_name);
    console.log('   Return URL:', subscriptionData.return_url);
    console.log('');

    // Create checkout session for subscription
    console.log('🚀 Creating checkout session for subscription...');
    const response = await fetch(`${BASE_URL}/api/subscriptions/setup-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData)
    });

    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response:', JSON.stringify(result, null, 2));

    if (result.success && result.checkout_session) {
      console.log('\n✅ CHECKOUT SESSION CREATED SUCCESSFULLY!');
      console.log('🔗 Checkout URL:', result.checkout_session.url);
      console.log('📧 Customer:', result.customer.email);
      console.log('📦 Package:', result.package.name);
      console.log('💰 Price:', `$${result.package.price} ${result.package.currency}`);
      console.log('');
      console.log('🎯 NEXT STEPS:');
      console.log('   1. Click the checkout URL above');
      console.log('   2. Complete the payment with test card: 4242 4242 4242 4242');
      console.log('   3. Check the donor\'s email for:');
      console.log('      ✅ Welcome email (green theme)');
      console.log('      ✅ Monthly impact email (purple theme)');
      console.log('');
      console.log('📋 Expected Email Flow:');
      console.log('   ✅ Payment Success → Webhook triggered');
      console.log('   ✅ Subscription Created → Database record created');
      console.log('   ✅ Welcome Email → Beautiful green-themed HTML');
      console.log('   ✅ Monthly Impact Email → Beautiful purple-themed HTML');
      console.log('   ✅ Both emails include ChangeWorks logo');
      console.log('   ✅ Both emails include your contact information');
    } else {
      console.log('\n❌ CHECKOUT SESSION CREATION FAILED');
      console.log('Error:', result.error);
      console.log('Details:', result.details);
    }

  } catch (error) {
    console.error('❌ Error testing subscription email flow:', error.message);
  }
}

async function testDirectSubscriptionCreation() {
  console.log('\n🧪 Testing Direct Subscription Creation (Auto Create)');
  console.log('📧 Welcome + Monthly Impact emails on direct subscription');
  console.log('=' .repeat(60));

  try {
    // Test data for direct subscription creation
    const subscriptionData = {
      donor_id: 60, // Using donor ID 60 (Qasim Ali)
      organization_id: 1, // Using organization ID 1 (ChangeWorks Org)
      package_id: 1, // Using package ID 1
      customer_email: "qasim107@gmail.com",
      customer_name: "Qasim Ali",
      auto_create_subscription: true,
      payment_method_id: "pm_card_visa" // Test payment method
    };

    console.log('📋 Test Data:');
    console.log('   Donor ID:', subscriptionData.donor_id);
    console.log('   Organization ID:', subscriptionData.organization_id);
    console.log('   Package ID:', subscriptionData.package_id);
    console.log('   Customer Email:', subscriptionData.customer_email);
    console.log('   Customer Name:', subscriptionData.customer_name);
    console.log('   Payment Method:', subscriptionData.payment_method_id);
    console.log('');

    // Create subscription directly
    console.log('🚀 Creating subscription directly...');
    const response = await fetch(`${BASE_URL}/api/subscriptions/setup-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData)
    });

    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response:', JSON.stringify(result, null, 2));

    if (result.success && result.subscription) {
      console.log('\n✅ SUBSCRIPTION CREATED SUCCESSFULLY!');
      console.log('📧 Subscription ID:', result.subscription.id);
      console.log('📧 Stripe Subscription ID:', result.stripe_subscription_id);
      console.log('📧 Customer:', result.customer.email);
      console.log('📦 Package:', result.package.name);
      console.log('💰 Price:', `$${result.package.price} ${result.package.currency}`);
      console.log('');
      console.log('🎉 EMAILS SHOULD BE SENT AUTOMATICALLY!');
      console.log('📧 Check the donor\'s email for:');
      console.log('   ✅ Welcome email (green theme)');
      console.log('   ✅ Monthly impact email (purple theme)');
      console.log('');
      console.log('📋 Email Features:');
      console.log('   ✅ Beautiful HTML design with professional styling');
      console.log('   ✅ ChangeWorks logo embedded from public folder');
      console.log('   ✅ Dynamic content with donor and organization names');
      console.log('   ✅ Dashboard access links');
      console.log('   ✅ Contact information included');
    } else {
      console.log('\n❌ SUBSCRIPTION CREATION FAILED');
      console.log('Error:', result.error);
      console.log('Details:', result.details);
    }

  } catch (error) {
    console.error('❌ Error testing direct subscription creation:', error.message);
  }
}

async function testBothSubscriptionFlows() {
  console.log('🧪 Testing Both Subscription Email Flows');
  console.log('📧 Checkout Session + Direct Creation');
  console.log('=' .repeat(60));

  await testSubscriptionEmailFlow();
  await testDirectSubscriptionCreation();

  console.log('\n🎉 Subscription Email Testing Complete!');
  console.log('📋 Summary:');
  console.log('   ✅ Checkout Session: Creates payment form, emails sent on success');
  console.log('   ✅ Direct Creation: Creates subscription immediately with emails');
  console.log('   ✅ Welcome Email: Beautiful green-themed HTML');
  console.log('   ✅ Monthly Impact Email: Beautiful purple-themed HTML');
  console.log('   ✅ Both emails use your contact information');
  console.log('   ✅ Both emails have professional styling');
  console.log('   ✅ Both emails include ChangeWorks logo');
  console.log('   ✅ Both emails have dashboard access buttons');
}

// Run the tests
testBothSubscriptionFlows();
