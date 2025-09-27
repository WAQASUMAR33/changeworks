// Test Stripe setup payment flow (recommended for testing)
// Using built-in fetch API (Node.js 18+)

const baseUrl = 'http://localhost:3000';

async function testStripeSetupFlow() {
  console.log('🧪 Testing Stripe Setup Payment Flow...\n');
  console.log('📋 This test creates Stripe customers and checkout sessions for testing');
  console.log('📋 Use the checkout URLs to test payment flows in Stripe Dashboard\n');

  try {
    // Test 1: Create a test donor
    console.log('📋 Test 1: Create test donor');
    const donorId = await createTestDonor();

    if (donorId) {
      // Test 2: Test setup payment flow
      console.log('\n📋 Test 2: Test setup payment flow');
      await testSetupPaymentFlow(donorId);

      // Test 3: Test with different packages
      console.log('\n📋 Test 3: Test with different packages');
      await testDifferentPackages(donorId);
    }

    console.log('\n✅ Stripe setup flow tests completed!');
    console.log('\n🎯 Next Steps:');
    console.log('1. Check your Stripe Dashboard for created customers');
    console.log('2. Use the checkout URLs to test payment flows');
    console.log('3. Monitor webhook events in Stripe Dashboard');
    console.log('4. Test with different payment methods in checkout');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function createTestDonor() {
  try {
    const donorData = {
      name: "Stripe Setup Test User",
      email: `stripe.setup.${Date.now()}@example.com`,
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

async function testSetupPaymentFlow(donorId) {
  try {
    const setupData = {
      donor_id: donorId,
      organization_id: 17,
      package_id: 2, // Test package
      customer_email: `stripe.customer.${Date.now()}@example.com`,
      customer_name: 'Stripe Customer Test',
      return_url: 'https://yourapp.com/subscription/success'
    };

    console.log('Creating setup payment flow...');
    console.log('Setup Data:', JSON.stringify(setupData, null, 2));

    const response = await fetch(`${baseUrl}/api/subscriptions/setup-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setupData)
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);

    if (data.success) {
      console.log('✅ Setup payment flow created successfully!');
      console.log('\n📊 Setup Intent Details:');
      console.log(`- ID: ${data.setup_intent.id}`);
      console.log(`- Status: ${data.setup_intent.status}`);
      console.log(`- Client Secret: ${data.setup_intent.client_secret ? 'Present' : 'Not provided'}`);
      
      console.log('\n📊 Checkout Session Details:');
      console.log(`- ID: ${data.checkout_session.id}`);
      console.log(`- URL: ${data.checkout_session.url ? 'Present' : 'Not provided'}`);
      
      console.log('\n📊 Customer Details:');
      console.log(`- ID: ${data.customer.id}`);
      console.log(`- Email: ${data.customer.email}`);
      console.log(`- Name: ${data.customer.name}`);
      
      console.log('\n📊 Package Details:');
      console.log(`- ID: ${data.package.id}`);
      console.log(`- Name: ${data.package.name}`);
      console.log(`- Price: $${data.package.price} ${data.package.currency}`);
      
      console.log('\n🎯 Stripe Dashboard Check:');
      console.log(`- Customer ID: ${data.customer.id}`);
      console.log(`- Setup Intent ID: ${data.setup_intent.id}`);
      console.log(`- Checkout Session ID: ${data.checkout_session.id}`);
      console.log(`- Visit checkout URL to test payment flow`);
      
      if (data.checkout_session.url) {
        console.log(`\n🔗 Checkout URL: ${data.checkout_session.url}`);
        console.log('📋 Use this URL to test the complete payment flow');
      }
      
    } else {
      console.log('❌ Setup payment flow failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Setup payment flow failed:', error.message);
  }
}

async function testDifferentPackages(donorId) {
  try {
    // Test with the existing test package
    const setupData = {
      donor_id: donorId,
      organization_id: 17,
      package_id: 1, // Different package
      customer_email: `stripe.package2.${Date.now()}@example.com`,
      customer_name: 'Stripe Package Test User',
      return_url: 'https://yourapp.com/subscription/success'
    };

    console.log('Testing with different package...');

    const response = await fetch(`${baseUrl}/api/subscriptions/setup-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setupData)
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Different package setup created successfully!');
      console.log(`- Customer ID: ${data.customer.id}`);
      console.log(`- Package: ${data.package.name} - $${data.package.price} ${data.package.currency}`);
      console.log(`- Checkout Session ID: ${data.checkout_session.id}`);
      
      if (data.checkout_session.url) {
        console.log(`- Checkout URL: ${data.checkout_session.url}`);
      }
    } else {
      console.log('❌ Different package setup failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Different package test failed:', error.message);
  }
}

// Run the setup flow test
testStripeSetupFlow().catch(console.error);

