// Simple Stripe subscription test using existing data
// Using built-in fetch API (Node.js 18+)

const baseUrl = 'http://localhost:3000';

async function testStripeSubscriptionSimple() {
  console.log('🧪 Simple Stripe Subscription Test...\n');

  try {
    // Test 1: Create a test donor first
    console.log('📋 Test 1: Create test donor');
    const donorId = await createTestDonor();

    if (donorId) {
      // Test 2: Create Stripe subscription
      console.log('\n📋 Test 2: Create Stripe subscription');
      await createStripeSubscription(donorId);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function createTestDonor() {
  try {
    const donorData = {
      name: "Stripe Test User",
      email: `stripe.test.${Date.now()}@example.com`,
      password: "password123",
      phone: "+15551234567",
      city: "Test City",
      address: "123 Test Street",
      postal_code: "12345",
      organization_id: 17 // Use existing Corpulate organization
    };

    console.log('Creating test donor...');

    const response = await fetch(`${baseUrl}/api/donor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donorData)
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);

    if (response.ok && data.donor) {
      console.log('✅ Test donor created successfully!');
      console.log(`Donor ID: ${data.donor.id}`);
      console.log(`Name: ${data.donor.name}`);
      console.log(`Email: ${data.donor.email}`);
      console.log(`Organization: ${data.donor.organization.name}`);
      return data.donor.id;
    } else {
      console.log('❌ Test donor creation failed');
      console.log('Response:', JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.error('❌ Test donor creation failed:', error.message);
    return null;
  }
}

async function createStripeSubscription(donorId) {
  try {
    const subscriptionData = {
      donor_id: donorId,
      organization_id: 17, // Corpulate organization
      package_id: 2, // Test package we created
      payment_method_id: 'pm_card_visa', // Stripe test Visa card
      customer_email: `stripe.subscription.${Date.now()}@example.com`,
      customer_name: 'Stripe Subscription Test User',
      trial_period_days: 7
    };

    console.log('Creating Stripe subscription with data:');
    console.log(JSON.stringify(subscriptionData, null, 2));

    const response = await fetch(`${baseUrl}/api/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriptionData)
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);

    if (data.success) {
      console.log('✅ Stripe subscription created successfully!');
      console.log(`Subscription ID: ${data.subscription.id}`);
      console.log(`Stripe Subscription ID: ${data.stripe_subscription_id}`);
      console.log(`Status: ${data.subscription.status}`);
      console.log(`Amount: $${data.subscription.amount} ${data.subscription.currency}`);
      console.log(`Interval: ${data.subscription.interval}`);
      console.log(`Trial Period: ${data.subscription.trial_start ? 'Yes' : 'No'}`);
      console.log(`Client Secret: ${data.client_secret ? 'Present' : 'Not provided'}`);
      console.log(`Message: ${data.message}`);
      
      console.log('\n🎯 Stripe Dashboard Check:');
      console.log(`- Customer ID: Check for customer with email ${subscriptionData.customer_email}`);
      console.log(`- Subscription ID: ${data.stripe_subscription_id}`);
      console.log(`- Payment Method: ${subscriptionData.payment_method_id}`);
      console.log(`- Status: ${data.subscription.status}`);
      
      // Test 3: Get subscription details
      console.log('\n📋 Test 3: Get subscription details');
      await getSubscriptionDetails(data.subscription.id);
      
      // Test 4: Test setup payment flow
      console.log('\n📋 Test 4: Test setup payment flow');
      await testSetupPayment(donorId);
      
    } else {
      console.log('❌ Stripe subscription creation failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Stripe subscription creation failed:', error.message);
  }
}

async function getSubscriptionDetails(subscriptionId) {
  try {
    const response = await fetch(`${baseUrl}/api/subscriptions/${subscriptionId}`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Subscription details retrieved:');
      console.log(`- ID: ${data.subscription.id}`);
      console.log(`- Stripe ID: ${data.subscription.stripe_subscription_id}`);
      console.log(`- Status: ${data.subscription.status}`);
      console.log(`- Amount: $${data.subscription.amount} ${data.subscription.currency}`);
      console.log(`- Current Period: ${data.subscription.current_period_start} to ${data.subscription.current_period_end}`);
      console.log(`- Trial Start: ${data.subscription.trial_start || 'None'}`);
      console.log(`- Trial End: ${data.subscription.trial_end || 'None'}`);
      console.log(`- Donor: ${data.subscription.donor?.name}`);
      console.log(`- Organization: ${data.subscription.organization?.name}`);
      console.log(`- Package: ${data.subscription.package?.name}`);
    } else {
      console.log('❌ Get subscription failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Get subscription failed:', error.message);
  }
}

async function testSetupPayment(donorId) {
  try {
    const setupData = {
      donor_id: donorId,
      organization_id: 17,
      package_id: 2,
      customer_email: `stripe.setup.${Date.now()}@example.com`,
      customer_name: 'Stripe Setup Test User',
      return_url: 'https://yourapp.com/subscription/success'
    };

    console.log('Testing setup payment flow...');

    const response = await fetch(`${baseUrl}/api/subscriptions/setup-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setupData)
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Setup payment flow created successfully!');
      console.log(`Setup Intent ID: ${data.setup_intent.id}`);
      console.log(`Setup Intent Status: ${data.setup_intent.status}`);
      console.log(`Client Secret: ${data.setup_intent.client_secret ? 'Present' : 'Not provided'}`);
      console.log(`Checkout Session ID: ${data.checkout_session.id}`);
      console.log(`Checkout URL: ${data.checkout_session.url ? 'Present' : 'Not provided'}`);
      console.log(`Customer ID: ${data.customer.id}`);
      console.log(`Customer Email: ${data.customer.email}`);
      
      console.log('\n🎯 Stripe Dashboard Check:');
      console.log(`- Customer ID: ${data.customer.id}`);
      console.log(`- Setup Intent ID: ${data.setup_intent.id}`);
      console.log(`- Checkout Session ID: ${data.checkout_session.id}`);
      console.log(`- Visit checkout URL to test payment flow`);
    } else {
      console.log('❌ Setup payment flow failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Setup payment flow failed:', error.message);
  }
}

// Run the simple test
testStripeSubscriptionSimple().catch(console.error);

