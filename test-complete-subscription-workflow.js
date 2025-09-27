// Complete subscription workflow test
// This shows the full process from setup to management

const baseUrl = 'http://localhost:3000';

async function testCompleteSubscriptionWorkflow() {
  console.log('🎯 Complete Subscription Workflow Test\n');
  console.log('📋 This test demonstrates the complete subscription lifecycle\n');

  try {
    // Step 1: Create test donor
    console.log('📋 Step 1: Create test donor');
    const donorId = await createTestDonor();

    if (donorId) {
      // Step 2: Create checkout session
      console.log('\n📋 Step 2: Create checkout session');
      const checkoutData = await createCheckoutSession(donorId);

      if (checkoutData) {
        // Step 3: Show payment instructions
        console.log('\n📋 Step 3: Payment instructions');
        showPaymentInstructions(checkoutData);

        // Step 4: Test all subscription APIs
        console.log('\n📋 Step 4: Test subscription management APIs');
        await testAllSubscriptionAPIs();

        // Step 5: Show next steps
        console.log('\n📋 Step 5: Next steps after payment');
        showNextSteps(checkoutData);
      }
    }

    console.log('\n✅ Complete subscription workflow test finished!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function createTestDonor() {
  try {
    const donorData = {
      name: "Complete Workflow Test User",
      email: `complete.workflow.${Date.now()}@example.com`,
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
      console.log(`Organization: ${data.donor.organization.name}`);
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
      customer_email: `complete.workflow.customer.${Date.now()}@example.com`,
      customer_name: 'Complete Workflow Customer',
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
  console.log('🎯 TO CREATE ACTUAL SUBSCRIPTION:');
  console.log('');
  console.log('1. 📱 Open this URL in your browser:');
  console.log(`   ${checkoutData.checkoutUrl}`);
  console.log('');
  console.log('2. 💳 Use these test card details:');
  console.log('   Card Number: 4242424242424242');
  console.log('   Expiry Date: 12/25 (or any future date)');
  console.log('   CVC: 123 (or any 3 digits)');
  console.log('   Name: Complete Workflow Customer');
  console.log('');
  console.log('3. ✅ Complete the payment');
  console.log('');
  console.log('4. 🎉 After payment, you can test all subscription APIs!');
}

async function testAllSubscriptionAPIs() {
  try {
    console.log('Testing all subscription management APIs...\n');

    // Test 1: List subscriptions
    console.log('📋 Test 1: List subscriptions');
    await testListSubscriptions();

    // Test 2: List packages
    console.log('\n📋 Test 2: List packages');
    await testListPackages();

    // Test 3: Test subscription filtering
    console.log('\n📋 Test 3: Test subscription filtering');
    await testSubscriptionFiltering();

    console.log('\n💡 After completing payment, you can also test:');
    console.log('- Get specific subscription details');
    console.log('- Update subscription (payment method, quantity)');
    console.log('- Cancel subscription');
    console.log('- View subscription transactions');
    console.log('- Reactivate subscription');

  } catch (error) {
    console.error('❌ API testing failed:', error.message);
  }
}

async function testListSubscriptions() {
  try {
    const response = await fetch(`${baseUrl}/api/subscriptions?page=1&limit=5`);
    const data = await response.json();

    if (data.success) {
      console.log(`✅ Found ${data.subscriptions.length} subscriptions`);
      console.log(`Total: ${data.pagination.total} subscriptions`);
      
      if (data.subscriptions.length > 0) {
        console.log('Sample subscription:');
        const sub = data.subscriptions[0];
        console.log(`- ID: ${sub.id}, Status: ${sub.status}, Amount: $${sub.amount} ${sub.currency}`);
      }
    } else {
      console.log('❌ Failed to list subscriptions:', data.error);
    }
  } catch (error) {
    console.error('❌ List subscriptions failed:', error.message);
  }
}

async function testListPackages() {
  try {
    const response = await fetch(`${baseUrl}/api/packages?page=1&limit=5`);
    const data = await response.json();

    if (data.success) {
      console.log(`✅ Found ${data.packages.length} packages`);
      console.log(`Total: ${data.pagination.total} packages`);
      
      if (data.packages.length > 0) {
        console.log('Available packages:');
        data.packages.forEach((pkg, index) => {
          console.log(`${index + 1}. ${pkg.name} - $${pkg.price} ${pkg.currency}`);
        });
      }
    } else {
      console.log('❌ Failed to list packages:', data.error);
    }
  } catch (error) {
    console.error('❌ List packages failed:', error.message);
  }
}

async function testSubscriptionFiltering() {
  try {
    // Test organization filter
    const orgResponse = await fetch(`${baseUrl}/api/subscriptions?organization_id=17&page=1&limit=5`);
    const orgData = await orgResponse.json();
    
    console.log(`✅ Organization filter: ${orgData.subscriptions?.length || 0} subscriptions`);
    
    // Test status filter
    const statusResponse = await fetch(`${baseUrl}/api/subscriptions?status=ACTIVE&page=1&limit=5`);
    const statusData = await statusResponse.json();
    
    console.log(`✅ Status filter: ${statusData.subscriptions?.length || 0} subscriptions`);
    
  } catch (error) {
    console.error('❌ Subscription filtering failed:', error.message);
  }
}

function showNextSteps(checkoutData) {
  console.log('🎯 AFTER COMPLETING PAYMENT, YOU CAN TEST:');
  console.log('');
  console.log('1. 📊 List all subscriptions:');
  console.log('   GET /api/subscriptions');
  console.log('');
  console.log('2. 🔍 Get specific subscription:');
  console.log('   GET /api/subscriptions/{id}');
  console.log('');
  console.log('3. 💳 Update payment method:');
  console.log('   PUT /api/subscriptions/{id}');
  console.log('   Body: {"action": "update_payment_method", "payment_method_id": "pm_..."}');
  console.log('');
  console.log('4. ❌ Cancel subscription:');
  console.log('   DELETE /api/subscriptions/{id}?immediate=false');
  console.log('');
  console.log('5. 📈 View transactions:');
  console.log('   GET /api/subscriptions/{id}/transactions');
  console.log('');
  console.log('6. 🔄 Reactivate subscription:');
  console.log('   PUT /api/subscriptions/{id}');
  console.log('   Body: {"action": "reactivate"}');
  console.log('');
  console.log('📊 Expected Results After Payment:');
  console.log(`- Customer: ${checkoutData.customerEmail}`);
  console.log(`- Package: ${checkoutData.packageName}`);
  console.log(`- Price: $${checkoutData.packagePrice} ${checkoutData.packageCurrency}`);
  console.log(`- Status: Active`);
  console.log(`- Billing: Monthly recurring`);
  console.log(`- Stripe Dashboard: Subscription visible`);
}

// Run the complete workflow test
testCompleteSubscriptionWorkflow().catch(console.error);

