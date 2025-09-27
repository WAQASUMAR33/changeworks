// Comprehensive test script for Stripe Subscription APIs
// Using built-in fetch API (Node.js 18+)

const baseUrl = 'http://localhost:3000';

// Test data
const testData = {
  donor_id: 1,
  organization_id: 17, // Corpulate organization
  package_id: 1,
  payment_method_id: 'pm_card_visa', // Test payment method
  customer_email: 'test.subscription@example.com',
  customer_name: 'Test Subscription User'
};

async function testSubscriptionAPIs() {
  console.log('🧪 Testing Stripe Subscription APIs...\n');

  try {
    // Test 1: List existing subscriptions
    console.log('📋 Test 1: List existing subscriptions');
    await testListSubscriptions();

    // Test 2: Create a new subscription
    console.log('\n📋 Test 2: Create a new subscription');
    const subscriptionId = await testCreateSubscription();

    if (subscriptionId) {
      // Test 3: Get specific subscription
      console.log('\n📋 Test 3: Get specific subscription');
      await testGetSubscription(subscriptionId);

      // Test 4: Get subscription transactions
      console.log('\n📋 Test 4: Get subscription transactions');
      await testGetSubscriptionTransactions(subscriptionId);

      // Test 5: Update subscription (reactivate)
      console.log('\n📋 Test 5: Update subscription');
      await testUpdateSubscription(subscriptionId);

      // Test 6: Cancel subscription
      console.log('\n📋 Test 6: Cancel subscription');
      await testCancelSubscription(subscriptionId);
    }

    // Test 7: Setup payment for subscription
    console.log('\n📋 Test 7: Setup payment for subscription');
    await testSetupPayment();

    console.log('\n✅ All subscription API tests completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

async function testListSubscriptions() {
  try {
    const response = await fetch(`${baseUrl}/api/subscriptions?page=1&limit=5`);
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    
    if (data.success) {
      console.log(`Found ${data.subscriptions.length} subscriptions`);
      console.log(`Total: ${data.pagination.total} subscriptions`);
      
      if (data.subscriptions.length > 0) {
        console.log('Sample subscription:');
        console.log(`- ID: ${data.subscriptions[0].id}`);
        console.log(`- Status: ${data.subscriptions[0].status}`);
        console.log(`- Amount: ${data.subscriptions[0].amount} ${data.subscriptions[0].currency}`);
        console.log(`- Donor: ${data.subscriptions[0].donor?.name}`);
        console.log(`- Organization: ${data.subscriptions[0].organization?.name}`);
      }
    } else {
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('❌ List subscriptions test failed:', error.message);
  }
}

async function testCreateSubscription() {
  try {
    const subscriptionData = {
      ...testData,
      customer_email: `test.subscription.${Date.now()}@example.com`
    };

    console.log('Creating subscription with data:');
    console.log(JSON.stringify(subscriptionData, null, 2));

    const response = await fetch(`${baseUrl}/api/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);

    if (data.success) {
      console.log('✅ Subscription created successfully!');
      console.log(`Subscription ID: ${data.subscription.id}`);
      console.log(`Stripe Subscription ID: ${data.stripe_subscription_id}`);
      console.log(`Status: ${data.subscription.status}`);
      console.log(`Client Secret: ${data.client_secret ? 'Present' : 'Not provided'}`);
      console.log(`Message: ${data.message}`);
      return data.subscription.id;
    } else {
      console.log('❌ Subscription creation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Create subscription test failed:', error.message);
    return null;
  }
}

async function testGetSubscription(subscriptionId) {
  try {
    const response = await fetch(`${baseUrl}/api/subscriptions/${subscriptionId}`);
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);

    if (data.success) {
      console.log('✅ Subscription retrieved successfully!');
      console.log(`ID: ${data.subscription.id}`);
      console.log(`Stripe ID: ${data.subscription.stripe_subscription_id}`);
      console.log(`Status: ${data.subscription.status}`);
      console.log(`Amount: ${data.subscription.amount} ${data.subscription.currency}`);
      console.log(`Interval: ${data.subscription.interval}`);
      console.log(`Current Period: ${data.subscription.current_period_start} to ${data.subscription.current_period_end}`);
      console.log(`Cancel at Period End: ${data.subscription.cancel_at_period_end}`);
      console.log(`Donor: ${data.subscription.donor?.name} (${data.subscription.donor?.email})`);
      console.log(`Organization: ${data.subscription.organization?.name}`);
      console.log(`Package: ${data.subscription.package?.name}`);
      console.log(`Transactions: ${data.subscription.subscription_transactions?.length || 0} records`);
    } else {
      console.log('❌ Get subscription failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Get subscription test failed:', error.message);
  }
}

async function testGetSubscriptionTransactions(subscriptionId) {
  try {
    const response = await fetch(`${baseUrl}/api/subscriptions/${subscriptionId}/transactions?page=1&limit=5`);
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);

    if (data.success) {
      console.log('✅ Subscription transactions retrieved successfully!');
      console.log(`Found ${data.transactions.length} transactions`);
      console.log(`Total: ${data.pagination.total} transactions`);
      
      if (data.transactions.length > 0) {
        console.log('Sample transaction:');
        const transaction = data.transactions[0];
        console.log(`- ID: ${transaction.id}`);
        console.log(`- Amount: ${transaction.amount} ${transaction.currency}`);
        console.log(`- Status: ${transaction.status}`);
        console.log(`- Period: ${transaction.period_start} to ${transaction.period_end}`);
        console.log(`- Stripe Invoice: ${transaction.stripe_invoice_id}`);
      }
    } else {
      console.log('❌ Get subscription transactions failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Get subscription transactions test failed:', error.message);
  }
}

async function testUpdateSubscription(subscriptionId) {
  try {
    // Test reactivating subscription
    const updateData = {
      action: 'reactivate'
    };

    console.log('Updating subscription with data:');
    console.log(JSON.stringify(updateData, null, 2));

    const response = await fetch(`${baseUrl}/api/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);

    if (data.success) {
      console.log('✅ Subscription updated successfully!');
      console.log(`Message: ${data.message}`);
      if (data.stripe_response) {
        console.log(`Stripe Response: ${data.stripe_response.message}`);
      }
    } else {
      console.log('❌ Update subscription failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Update subscription test failed:', error.message);
  }
}

async function testCancelSubscription(subscriptionId) {
  try {
    // Cancel at period end (not immediately)
    const response = await fetch(`${baseUrl}/api/subscriptions/${subscriptionId}?immediate=false`, {
      method: 'DELETE'
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);

    if (data.success) {
      console.log('✅ Subscription canceled successfully!');
      console.log(`Message: ${data.message}`);
      if (data.stripe_response) {
        console.log(`Stripe Response: ${data.stripe_response.message}`);
      }
      console.log(`Cancel at Period End: ${data.subscription.cancel_at_period_end}`);
      console.log(`Canceled At: ${data.subscription.canceled_at}`);
    } else {
      console.log('❌ Cancel subscription failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Cancel subscription test failed:', error.message);
  }
}

async function testSetupPayment() {
  try {
    const setupData = {
      donor_id: testData.donor_id,
      organization_id: testData.organization_id,
      package_id: testData.package_id,
      customer_email: `test.setup.${Date.now()}@example.com`,
      customer_name: 'Test Setup User',
      return_url: 'https://yourapp.com/subscription/success'
    };

    console.log('Setting up payment with data:');
    console.log(JSON.stringify(setupData, null, 2));

    const response = await fetch(`${baseUrl}/api/subscriptions/setup-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(setupData)
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);

    if (data.success) {
      console.log('✅ Payment setup created successfully!');
      console.log(`Setup Intent ID: ${data.setup_intent.id}`);
      console.log(`Setup Intent Status: ${data.setup_intent.status}`);
      console.log(`Client Secret: ${data.setup_intent.client_secret ? 'Present' : 'Not provided'}`);
      console.log(`Checkout Session ID: ${data.checkout_session.id}`);
      console.log(`Checkout URL: ${data.checkout_session.url ? 'Present' : 'Not provided'}`);
      console.log(`Customer ID: ${data.customer.id}`);
      console.log(`Customer Email: ${data.customer.email}`);
      console.log(`Package: ${data.package.name} - $${data.package.price} ${data.package.currency}`);
      console.log(`Message: ${data.message}`);
    } else {
      console.log('❌ Setup payment failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Setup payment test failed:', error.message);
  }
}

// Run the test suite
testSubscriptionAPIs().catch(console.error);

