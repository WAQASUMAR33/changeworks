// Test to create a real subscription in Stripe Dashboard
// This shows you exactly how to get subscriptions to appear

const baseUrl = 'http://localhost:3000';

async function testCreateRealSubscription() {
  console.log('🎯 Creating Real Subscription in Stripe Dashboard\n');
  console.log('📋 This will show you exactly how to get subscriptions to appear\n');

  try {
    // Step 1: Create test donor
    console.log('📋 Step 1: Create test donor');
    const donorId = await createTestDonor();

    if (donorId) {
      // Step 2: Create checkout session
      console.log('\n📋 Step 2: Create checkout session');
      const checkoutData = await createCheckoutSession(donorId);

      if (checkoutData) {
        // Step 3: Show exact steps to create subscription
        console.log('\n📋 Step 3: Create actual subscription');
        showSubscriptionCreationSteps(checkoutData);

        // Step 4: Test what happens after payment
        console.log('\n📋 Step 4: What happens after payment');
        showAfterPaymentSteps();
      }
    }

    console.log('\n✅ Real subscription creation guide completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function createTestDonor() {
  try {
    const donorData = {
      name: "Real Subscription Test User",
      email: `real.subscription.${Date.now()}@example.com`,
      password: "password123",
      phone: "+15551234567",
      city: "Test City",
      address: "123 Test Street",
      postal_code: "12345",
      organization_id: 17
    };

    console.log('Creating test donor...');

    const response = await fetch(`${baseUrl}/api/donor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donorData)
    });

    const data = await response.json();

    if (response.ok && data.donor) {
      console.log('✅ Test donor created successfully!');
      console.log(`Donor ID: ${data.donor.id}`);
      console.log(`Name: ${data.donor.name}`);
      console.log(`Email: ${data.donor.email}`);
      return data.donor.id;
    } else {
      console.log('❌ Test donor creation failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Test donor creation failed:', error.message);
    return null;
  }
}

async function createCheckoutSession(donorId) {
  try {
    const setupData = {
      donor_id: donorId,
      organization_id: 17,
      package_id: 2,
      customer_email: `real.subscription.customer.${Date.now()}@example.com`,
      customer_name: 'Real Subscription Customer',
      return_url: 'https://yourapp.com/subscription/success'
    };

    console.log('Creating checkout session...');

    const response = await fetch(`${baseUrl}/api/subscriptions/setup-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setupData)
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Checkout session created successfully!');
      console.log(`Customer ID: ${data.customer.id}`);
      console.log(`Checkout Session ID: ${data.checkout_session.id}`);
      console.log(`Package: ${data.package.name} - $${data.package.price} ${data.package.currency}`);
      
      return {
        customerId: data.customer.id,
        checkoutSessionId: data.checkout_session.id,
        checkoutUrl: data.checkout_session.url,
        customerEmail: data.customer.email,
        packageName: data.package.name,
        packagePrice: data.package.price,
        packageCurrency: data.package.currency
      };
    } else {
      console.log('❌ Checkout session creation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Checkout session creation failed:', error.message);
    return null;
  }
}

function showSubscriptionCreationSteps(checkoutData) {
  console.log('🎯 TO CREATE ACTUAL SUBSCRIPTION IN STRIPE DASHBOARD:');
  console.log('');
  console.log('📱 STEP 1: Open this URL in your browser:');
  console.log(`   ${checkoutData.checkoutUrl}`);
  console.log('');
  console.log('💳 STEP 2: Use these EXACT test card details:');
  console.log('   Card Number: 4242424242424242');
  console.log('   Expiry Date: 12/25 (or any future date)');
  console.log('   CVC: 123 (or any 3 digits)');
  console.log('   Name: Real Subscription Customer');
  console.log('');
  console.log('✅ STEP 3: Complete the payment');
  console.log('');
  console.log('🎉 STEP 4: Check your Stripe Dashboard');
  console.log(`   - Customer: ${checkoutData.customerId}`);
  console.log(`   - Subscription will appear automatically`);
  console.log(`   - Invoice will be generated`);
  console.log('');
  console.log('🔄 STEP 5: Run this test again to verify');
  console.log('');
  console.log('📊 Expected Results:');
  console.log(`- Customer: ${checkoutData.customerEmail}`);
  console.log(`- Package: ${checkoutData.packageName}`);
  console.log(`- Price: $${checkoutData.packagePrice} ${checkoutData.packageCurrency}`);
  console.log(`- Status: Active`);
  console.log(`- Billing: Monthly recurring`);
  console.log('');
  console.log('⚠️  IMPORTANT: The subscription will ONLY appear after you complete the payment!');
  console.log('   Right now, you only have a checkout session, not a subscription.');
}

function showAfterPaymentSteps() {
  console.log('🎯 AFTER COMPLETING PAYMENT, YOU CAN:');
  console.log('');
  console.log('1. 📊 Check Stripe Dashboard:');
  console.log('   - Go to https://dashboard.stripe.com/test/subscriptions');
  console.log('   - You will see the new subscription');
  console.log('   - Status will be "Active"');
  console.log('');
  console.log('2. 🔍 Test our APIs:');
  console.log('   - GET /api/subscriptions (will show 1 subscription)');
  console.log('   - GET /api/subscriptions/{id} (get specific subscription)');
  console.log('   - GET /api/subscriptions/{id}/transactions (view payments)');
  console.log('');
  console.log('3. 🛠️  Test subscription management:');
  console.log('   - Update payment method');
  console.log('   - Cancel subscription');
  console.log('   - Reactivate subscription');
  console.log('   - View transaction history');
  console.log('');
  console.log('4. 📈 Monitor webhooks:');
  console.log('   - Check Stripe Dashboard → Webhooks');
  console.log('   - See subscription.created event');
  console.log('   - See invoice.payment_succeeded event');
  console.log('');
  console.log('💡 The key is: Subscriptions are only created when payment is completed!');
  console.log('   Setup payment flow = Checkout session (no subscription yet)');
  console.log('   Completed payment = Actual subscription created');
}

// Run the real subscription creation test
testCreateRealSubscription().catch(console.error);

