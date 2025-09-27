// Test subscription APIs with working data
// Using built-in fetch API (Node.js 18+)

const baseUrl = 'http://localhost:3000';

async function testSubscriptionAPIsWorking() {
  console.log('🧪 Testing Subscription APIs with Working Data...\n');

  try {
    // Test 1: List existing subscriptions
    console.log('📋 Test 1: List existing subscriptions');
    await testListSubscriptions();

    // Test 2: Create a test donor first
    console.log('\n📋 Test 2: Create test donor');
    const donorId = await createTestDonor();

    if (donorId) {
      // Test 3: Test setup payment flow
      console.log('\n📋 Test 3: Test setup payment flow');
      await testSetupPaymentFlow(donorId);

      // Test 4: List subscriptions again
      console.log('\n📋 Test 4: List subscriptions after setup');
      await testListSubscriptions();
    }

    console.log('\n✅ Subscription API tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testListSubscriptions() {
  try {
    const response = await fetch(`${baseUrl}/api/subscriptions?page=1&limit=10`);
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    
    if (data.success) {
      console.log(`Found ${data.subscriptions.length} subscriptions`);
      console.log(`Total: ${data.pagination.total} subscriptions`);
      
      if (data.subscriptions.length > 0) {
        console.log('Sample subscription:');
        const sub = data.subscriptions[0];
        console.log(`- ID: ${sub.id}`);
        console.log(`- Status: ${sub.status}`);
        console.log(`- Amount: $${sub.amount} ${sub.currency}`);
        console.log(`- Donor: ${sub.donor?.name}`);
        console.log(`- Organization: ${sub.organization?.name}`);
        console.log(`- Package: ${sub.package?.name}`);
      }
    } else {
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('❌ List subscriptions test failed:', error.message);
  }
}

async function createTestDonor() {
  try {
    const donorData = {
      name: "Subscription API Test User",
      email: `subscription.api.${Date.now()}@example.com`,
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
      package_id: 2, // Use existing test package
      customer_email: `subscription.setup.${Date.now()}@example.com`,
      customer_name: 'Subscription Setup Test User',
      return_url: 'https://yourapp.com/subscription/success'
    };

    console.log('Testing setup payment flow...');
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
        console.log('📋 Use test card: 4242424242424242 (Visa)');
      }
      
    } else {
      console.log('❌ Setup payment flow failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Setup payment flow failed:', error.message);
  }
}

// Run the working subscription API test
testSubscriptionAPIsWorking().catch(console.error);

