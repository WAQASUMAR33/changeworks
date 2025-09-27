// Comprehensive test script for Stripe Subscription APIs with test data
// Using built-in fetch API (Node.js 18+)

const baseUrl = 'http://localhost:3000';

// Stripe test data
const testData = {
  donor_id: 1,
  organization_id: 17, // Corpulate organization
  package_id: 1, // Test package we just created
  // Stripe test payment method IDs
  payment_method_id: 'pm_card_visa', // Test Visa card
  customer_email: 'test.stripe.subscription@example.com',
  customer_name: 'Stripe Test User'
};

// Alternative test payment methods for different scenarios
const testPaymentMethods = {
  visa: 'pm_card_visa',
  visa_debit: 'pm_card_visa_debit',
  mastercard: 'pm_card_mastercard',
  amex: 'pm_card_amex',
  declined: 'pm_card_chargeDeclined',
  insufficient_funds: 'pm_card_insufficientFunds',
  expired: 'pm_card_expired'
};

async function testStripeSubscriptionFlow() {
  console.log('🧪 Testing Stripe Subscription APIs with Test Data...\n');
  console.log('📋 Test Configuration:');
  console.log(`- Base URL: ${baseUrl}`);
  console.log(`- Donor ID: ${testData.donor_id}`);
  console.log(`- Organization ID: ${testData.organization_id}`);
  console.log(`- Package ID: ${testData.package_id}`);
  console.log(`- Test Payment Method: ${testData.payment_method_id}`);
  console.log('');

  try {
    // Test 1: Verify package exists
    console.log('📋 Test 1: Verify test package exists');
    await verifyTestPackage();

    // Test 2: Create Stripe subscription
    console.log('\n📋 Test 2: Create Stripe subscription');
    const subscriptionId = await createStripeSubscription();

    if (subscriptionId) {
      // Test 3: Get subscription details
      console.log('\n📋 Test 3: Get subscription details');
      await getSubscriptionDetails(subscriptionId);

      // Test 4: Test payment method updates
      console.log('\n📋 Test 4: Test payment method updates');
      await testPaymentMethodUpdate(subscriptionId);

      // Test 5: Test subscription cancellation
      console.log('\n📋 Test 5: Test subscription cancellation');
      await testSubscriptionCancellation(subscriptionId);

      // Test 6: Test subscription reactivation
      console.log('\n📋 Test 6: Test subscription reactivation');
      await testSubscriptionReactivation(subscriptionId);
    }

    // Test 7: Test setup payment flow
    console.log('\n📋 Test 7: Test setup payment flow');
    await testSetupPaymentFlow();

    // Test 8: Test with different payment methods
    console.log('\n📋 Test 8: Test with different payment methods');
    await testDifferentPaymentMethods();

    console.log('\n✅ All Stripe subscription tests completed!');
    console.log('\n🎯 Check your Stripe Dashboard for:');
    console.log('- Created customers');
    console.log('- Created subscriptions');
    console.log('- Payment method attachments');
    console.log('- Webhook events');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

async function verifyTestPackage() {
  try {
    const response = await fetch(`${baseUrl}/api/packages`);
    const data = await response.json();

    if (data.success && data.packages.length > 0) {
      const testPackage = data.packages.find(pkg => pkg.id === testData.package_id);
      if (testPackage) {
        console.log('✅ Test package found:');
        console.log(`- ID: ${testPackage.id}`);
        console.log(`- Name: ${testPackage.name}`);
        console.log(`- Price: $${testPackage.price} ${testPackage.currency}`);
        console.log(`- Features: ${testPackage.features}`);
      } else {
        console.log('❌ Test package not found. Creating one...');
        await createTestPackage();
      }
    } else {
      console.log('❌ No packages found. Creating test package...');
      await createTestPackage();
    }
  } catch (error) {
    console.error('❌ Package verification failed:', error.message);
  }
}

async function createTestPackage() {
  try {
    const packageData = {
      name: "Stripe Test Subscription Plan",
      description: "Test subscription plan for Stripe integration testing",
      price: 29.99,
      currency: "USD",
      features: "Stripe integration testing, webhook handling, payment processing",
      duration: "Monthly",
      isActive: true,
      category: "Stripe Test"
    };

    const response = await fetch(`${baseUrl}/api/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packageData)
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Test package created:');
      console.log(`- ID: ${data.package.id}`);
      console.log(`- Name: ${data.package.name}`);
      testData.package_id = data.package.id;
    } else {
      console.log('❌ Package creation failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Package creation failed:', error.message);
  }
}

async function createStripeSubscription() {
  try {
    const subscriptionData = {
      ...testData,
      customer_email: `stripe.test.${Date.now()}@example.com`,
      trial_period_days: 7 // 7-day trial
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
      console.log(`Trial Period: ${data.subscription.trial_start ? 'Yes' : 'No'}`);
      console.log(`Client Secret: ${data.client_secret ? 'Present' : 'Not provided'}`);
      console.log(`Message: ${data.message}`);
      
      console.log('\n🎯 Stripe Dashboard Check:');
      console.log(`- Customer ID: Check for customer with email ${subscriptionData.customer_email}`);
      console.log(`- Subscription ID: ${data.stripe_subscription_id}`);
      console.log(`- Payment Method: ${testData.payment_method_id}`);
      
      return data.subscription.id;
    } else {
      console.log('❌ Stripe subscription creation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Stripe subscription creation failed:', error.message);
    return null;
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
      console.log(`- Interval: ${data.subscription.interval}`);
      console.log(`- Current Period: ${data.subscription.current_period_start} to ${data.subscription.current_period_end}`);
      console.log(`- Trial Start: ${data.subscription.trial_start || 'None'}`);
      console.log(`- Trial End: ${data.subscription.trial_end || 'None'}`);
      console.log(`- Cancel at Period End: ${data.subscription.cancel_at_period_end}`);
      console.log(`- Donor: ${data.subscription.donor?.name} (${data.subscription.donor?.email})`);
      console.log(`- Organization: ${data.subscription.organization?.name}`);
      console.log(`- Package: ${data.subscription.package?.name}`);
      
      if (data.subscription.stripe_data) {
        console.log('\n🔗 Stripe Data:');
        console.log(`- Stripe Status: ${data.subscription.stripe_data.status}`);
        console.log(`- Stripe Customer: ${data.subscription.stripe_data.customer}`);
        console.log(`- Stripe Items: ${data.subscription.stripe_data.items?.data?.length || 0}`);
      }
    } else {
      console.log('❌ Get subscription failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Get subscription failed:', error.message);
  }
}

async function testPaymentMethodUpdate(subscriptionId) {
  try {
    console.log('Testing payment method update...');
    
    const updateData = {
      action: 'update_payment_method',
      payment_method_id: testPaymentMethods.mastercard // Switch to Mastercard
    };

    const response = await fetch(`${baseUrl}/api/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Payment method updated successfully!');
      console.log(`Message: ${data.message}`);
      console.log(`Stripe Response: ${data.stripe_response?.message}`);
      
      console.log('\n🎯 Stripe Dashboard Check:');
      console.log(`- Check customer's default payment method`);
      console.log(`- Should now be: ${testPaymentMethods.mastercard}`);
    } else {
      console.log('❌ Payment method update failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Payment method update failed:', error.message);
  }
}

async function testSubscriptionCancellation(subscriptionId) {
  try {
    console.log('Testing subscription cancellation (at period end)...');
    
    const response = await fetch(`${baseUrl}/api/subscriptions/${subscriptionId}?immediate=false`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Subscription cancellation scheduled!');
      console.log(`Message: ${data.message}`);
      console.log(`Stripe Response: ${data.stripe_response?.message}`);
      console.log(`Cancel at Period End: ${data.subscription.cancel_at_period_end}`);
      console.log(`Canceled At: ${data.subscription.canceled_at || 'Not yet'}`);
      
      console.log('\n🎯 Stripe Dashboard Check:');
      console.log(`- Subscription should show "cancel_at_period_end: true"`);
      console.log(`- Status should remain active until period end`);
    } else {
      console.log('❌ Subscription cancellation failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Subscription cancellation failed:', error.message);
  }
}

async function testSubscriptionReactivation(subscriptionId) {
  try {
    console.log('Testing subscription reactivation...');
    
    const updateData = {
      action: 'reactivate'
    };

    const response = await fetch(`${baseUrl}/api/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Subscription reactivated successfully!');
      console.log(`Message: ${data.message}`);
      console.log(`Stripe Response: ${data.stripe_response?.message}`);
      console.log(`Cancel at Period End: ${data.subscription.cancel_at_period_end}`);
      
      console.log('\n🎯 Stripe Dashboard Check:');
      console.log(`- Subscription should show "cancel_at_period_end: false"`);
      console.log(`- Status should remain active`);
    } else {
      console.log('❌ Subscription reactivation failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Subscription reactivation failed:', error.message);
  }
}

async function testSetupPaymentFlow() {
  try {
    console.log('Testing setup payment flow...');
    
    const setupData = {
      donor_id: testData.donor_id,
      organization_id: testData.organization_id,
      package_id: testData.package_id,
      customer_email: `stripe.setup.${Date.now()}@example.com`,
      customer_name: 'Stripe Setup Test User',
      return_url: 'https://yourapp.com/subscription/success'
    };

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

async function testDifferentPaymentMethods() {
  try {
    console.log('Testing different payment methods...');
    
    for (const [methodName, paymentMethodId] of Object.entries(testPaymentMethods)) {
      if (methodName === 'visa') continue; // Skip visa as we already tested it
      
      console.log(`\nTesting ${methodName} (${paymentMethodId})...`);
      
      const subscriptionData = {
        ...testData,
        payment_method_id: paymentMethodId,
        customer_email: `stripe.${methodName}.${Date.now()}@example.com`
      };

      const response = await fetch(`${baseUrl}/api/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ ${methodName} subscription created successfully!`);
        console.log(`- Subscription ID: ${data.subscription.id}`);
        console.log(`- Status: ${data.subscription.status}`);
      } else {
        console.log(`❌ ${methodName} subscription failed: ${data.error}`);
      }
    }
  } catch (error) {
    console.error('❌ Different payment methods test failed:', error.message);
  }
}

// Run the comprehensive test
testStripeSubscriptionFlow().catch(console.error);

