// Test script to create actual Stripe subscriptions (not just checkout sessions)
// Using built-in fetch API (Node.js 18+)

const baseUrl = 'http://localhost:3000';

async function testStripeSubscriptionCreation() {
  console.log('🧪 Testing Actual Stripe Subscription Creation...\n');
  console.log('📋 This test will create real subscriptions in Stripe Dashboard\n');

  try {
    // Test 1: Create a test donor
    console.log('📋 Test 1: Create test donor');
    const donorId = await createTestDonor();

    if (donorId) {
      // Test 2: Create actual Stripe subscription with test payment method
      console.log('\n📋 Test 2: Create actual Stripe subscription');
      const subscriptionId = await createActualSubscription(donorId);

      if (subscriptionId) {
        // Test 3: Verify subscription in database
        console.log('\n📋 Test 3: Verify subscription in database');
        await verifySubscriptionInDatabase(subscriptionId);

        // Test 4: List all subscriptions
        console.log('\n📋 Test 4: List all subscriptions');
        await listAllSubscriptions();
      }
    }

    console.log('\n✅ Stripe subscription creation tests completed!');
    console.log('\n🎯 Check your Stripe Dashboard for:');
    console.log('- Created customers');
    console.log('- Created subscriptions (not just checkout sessions)');
    console.log('- Payment method attachments');
    console.log('- Subscription status and billing periods');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function createTestDonor() {
  try {
    const donorData = {
      name: "Stripe Subscription Test User",
      email: `stripe.subscription.${Date.now()}@example.com`,
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

async function createActualSubscription(donorId) {
  try {
    // First, let's create a customer and attach a payment method
    console.log('Creating Stripe customer and payment method...');
    
    const subscriptionData = {
      donor_id: donorId,
      organization_id: 17, // Corpulate organization
      package_id: 2, // Test package
      payment_method_id: 'pm_card_visa', // This will fail, but let's see the error
      customer_email: `stripe.customer.${Date.now()}@example.com`,
      customer_name: 'Stripe Customer Test',
      trial_period_days: 0 // No trial for immediate subscription
    };

    console.log('Creating subscription with data:');
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
      console.log(`Client Secret: ${data.client_secret ? 'Present' : 'Not provided'}`);
      console.log(`Message: ${data.message}`);
      
      console.log('\n🎯 Stripe Dashboard Check:');
      console.log(`- Customer ID: Check for customer with email ${subscriptionData.customer_email}`);
      console.log(`- Subscription ID: ${data.stripe_subscription_id}`);
      console.log(`- Payment Method: ${subscriptionData.payment_method_id}`);
      console.log(`- Status: ${data.subscription.status}`);
      
      return data.subscription.id;
    } else {
      console.log('❌ Stripe subscription creation failed:', data.error);
      console.log('\n💡 This is expected because pm_card_visa is not a real payment method ID.');
      console.log('💡 In a real scenario, you would:');
      console.log('1. Use Stripe Elements to collect payment method');
      console.log('2. Get a real payment method ID from Stripe');
      console.log('3. Then create the subscription');
      
      // Let's try a different approach - create a subscription with a setup intent
      console.log('\n📋 Alternative: Create subscription with setup intent approach');
      return await createSubscriptionWithSetupIntent(donorId);
    }
  } catch (error) {
    console.error('❌ Stripe subscription creation failed:', error.message);
    return null;
  }
}

async function createSubscriptionWithSetupIntent(donorId) {
  try {
    console.log('Creating subscription using setup intent approach...');
    
    // Step 1: Create setup payment flow
    const setupData = {
      donor_id: donorId,
      organization_id: 17,
      package_id: 2,
      customer_email: `stripe.setup.subscription.${Date.now()}@example.com`,
      customer_name: 'Stripe Setup Subscription User',
      return_url: 'https://yourapp.com/subscription/success'
    };

    console.log('Step 1: Creating setup payment flow...');
    const setupResponse = await fetch(`${baseUrl}/api/subscriptions/setup-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setupData)
    });

    const setupData_result = await setupResponse.json();

    if (setupData_result.success) {
      console.log('✅ Setup payment flow created successfully!');
      console.log(`Customer ID: ${setupData_result.customer.id}`);
      console.log(`Setup Intent ID: ${setupData_result.setup_intent.id}`);
      console.log(`Checkout Session ID: ${setupData_result.checkout_session.id}`);
      
      console.log('\n🎯 To complete the subscription:');
      console.log('1. Visit the checkout URL to add a payment method');
      console.log('2. Complete the payment flow');
      console.log('3. The subscription will be created automatically');
      
      if (setupData_result.checkout_session.url) {
        console.log(`\n🔗 Checkout URL: ${setupData_result.checkout_session.url}`);
        console.log('📋 Use test card: 4242424242424242 (Visa)');
        console.log('📋 Use any future expiry date and any CVC');
      }
      
      return 'setup_created';
    } else {
      console.log('❌ Setup payment flow failed:', setupData_result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Setup intent approach failed:', error.message);
    return null;
  }
}

async function verifySubscriptionInDatabase(subscriptionId) {
  try {
    if (subscriptionId === 'setup_created') {
      console.log('⏳ Subscription will be created after checkout completion');
      return;
    }

    const response = await fetch(`${baseUrl}/api/subscriptions/${subscriptionId}`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Subscription found in database:');
      console.log(`- ID: ${data.subscription.id}`);
      console.log(`- Stripe ID: ${data.subscription.stripe_subscription_id}`);
      console.log(`- Status: ${data.subscription.status}`);
      console.log(`- Amount: $${data.subscription.amount} ${data.subscription.currency}`);
      console.log(`- Current Period: ${data.subscription.current_period_start} to ${data.subscription.current_period_end}`);
      console.log(`- Donor: ${data.subscription.donor?.name}`);
      console.log(`- Organization: ${data.subscription.organization?.name}`);
      console.log(`- Package: ${data.subscription.package?.name}`);
    } else {
      console.log('❌ Subscription not found in database:', data.error);
    }
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
  }
}

async function listAllSubscriptions() {
  try {
    const response = await fetch(`${baseUrl}/api/subscriptions?page=1&limit=10`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Subscriptions list retrieved:');
      console.log(`Found ${data.subscriptions.length} subscriptions`);
      console.log(`Total: ${data.pagination.total} subscriptions`);
      
      if (data.subscriptions.length > 0) {
        console.log('\n📊 Subscription Details:');
        data.subscriptions.forEach((sub, index) => {
          console.log(`${index + 1}. ID: ${sub.id} - ${sub.status} - $${sub.amount} ${sub.currency}`);
          console.log(`   Stripe ID: ${sub.stripe_subscription_id}`);
          console.log(`   Donor: ${sub.donor?.name}`);
          console.log(`   Organization: ${sub.organization?.name}`);
          console.log(`   Package: ${sub.package?.name}`);
          console.log('');
        });
      } else {
        console.log('📋 No subscriptions found in database yet');
        console.log('💡 Complete the checkout flow to create subscriptions');
      }
    } else {
      console.log('❌ Failed to list subscriptions:', data.error);
    }
  } catch (error) {
    console.error('❌ List subscriptions failed:', error.message);
  }
}

// Run the subscription creation test
testStripeSubscriptionCreation().catch(console.error);

