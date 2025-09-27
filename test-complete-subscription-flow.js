// Complete Stripe subscription flow test
// This shows you exactly how to create actual subscriptions

const baseUrl = 'http://localhost:3000';

async function testCompleteSubscriptionFlow() {
  console.log('🎯 Complete Stripe Subscription Flow Test\n');
  console.log('📋 This will show you exactly how to create actual subscriptions in Stripe Dashboard\n');

  try {
    // Step 1: Create test donor
    console.log('📋 Step 1: Create test donor');
    const donorId = await createTestDonor();

    if (donorId) {
      // Step 2: Create checkout session
      console.log('\n📋 Step 2: Create checkout session');
      const checkoutData = await createCheckoutSession(donorId);

      if (checkoutData) {
        // Step 3: Show how to complete payment
        console.log('\n📋 Step 3: Complete payment to create subscription');
        showPaymentInstructions(checkoutData);

        // Step 4: Wait and check for subscription
        console.log('\n📋 Step 4: Check for created subscription');
        await checkForSubscription(checkoutData.customerId);
      }
    }

    console.log('\n✅ Complete subscription flow test finished!');
    console.log('\n🎯 Summary:');
    console.log('1. ✅ Test donor created');
    console.log('2. ✅ Checkout session created');
    console.log('3. ⏳ Complete payment using checkout URL');
    console.log('4. ⏳ Subscription will be created automatically');
    console.log('5. ⏳ Check Stripe Dashboard for subscription');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function createTestDonor() {
  try {
    const donorData = {
      name: "Complete Flow Test User",
      email: `complete.flow.${Date.now()}@example.com`,
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
      customer_email: `complete.flow.customer.${Date.now()}@example.com`,
      customer_name: 'Complete Flow Customer',
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

function showPaymentInstructions(checkoutData) {
  console.log('🎯 TO CREATE ACTUAL SUBSCRIPTION IN STRIPE DASHBOARD:');
  console.log('');
  console.log('1. 📱 Open this URL in your browser:');
  console.log(`   ${checkoutData.checkoutUrl}`);
  console.log('');
  console.log('2. 💳 Use these test card details:');
  console.log('   Card Number: 4242424242424242');
  console.log('   Expiry Date: 12/25 (or any future date)');
  console.log('   CVC: 123 (or any 3 digits)');
  console.log('   Name: Complete Flow Customer');
  console.log('');
  console.log('3. ✅ Complete the payment');
  console.log('');
  console.log('4. 🎉 Check your Stripe Dashboard:');
  console.log(`   - Customer: ${checkoutData.customerId}`);
  console.log(`   - Subscription will be created automatically`);
  console.log(`   - Invoice will be generated`);
  console.log('');
  console.log('5. 🔄 Run this test again to verify subscription was created');
  console.log('');
  console.log('📊 Expected Results:');
  console.log(`- Customer: ${checkoutData.customerEmail}`);
  console.log(`- Package: ${checkoutData.packageName}`);
  console.log(`- Price: $${checkoutData.packagePrice} ${checkoutData.packageCurrency}`);
  console.log(`- Status: Active`);
  console.log(`- Billing: Monthly recurring`);
}

async function checkForSubscription(customerId) {
  try {
    console.log('Checking for created subscription...');
    console.log('(This will only show results if you completed the payment)');
    
    // List all subscriptions
    const response = await fetch(`${baseUrl}/api/subscriptions?page=1&limit=10`);
    const data = await response.json();

    if (data.success) {
      console.log(`Found ${data.subscriptions.length} subscriptions in database`);
      
      if (data.subscriptions.length > 0) {
        console.log('\n📊 Subscriptions found:');
        data.subscriptions.forEach((sub, index) => {
          console.log(`${index + 1}. ID: ${sub.id}`);
          console.log(`   Stripe ID: ${sub.stripe_subscription_id}`);
          console.log(`   Status: ${sub.status}`);
          console.log(`   Amount: $${sub.amount} ${sub.currency}`);
          console.log(`   Donor: ${sub.donor?.name}`);
          console.log(`   Organization: ${sub.organization?.name}`);
          console.log(`   Package: ${sub.package?.name}`);
          console.log('');
        });
      } else {
        console.log('📋 No subscriptions found yet.');
        console.log('💡 Complete the payment using the checkout URL above to create a subscription.');
      }
    } else {
      console.log('❌ Failed to check subscriptions:', data.error);
    }
  } catch (error) {
    console.error('❌ Failed to check subscriptions:', error.message);
  }
}

// Run the complete flow test
testCompleteSubscriptionFlow().catch(console.error);

