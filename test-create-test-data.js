// Test script to create test data for Stripe subscription testing
// Using built-in fetch API (Node.js 18+)

const baseUrl = 'http://localhost:3000';

async function createTestData() {
  console.log('🧪 Creating test data for Stripe subscription testing...\n');

  try {
    // Test 1: Check existing organizations
    console.log('📋 Test 1: Check existing organizations');
    await checkOrganizations();

    // Test 2: Create test donor if needed
    console.log('\n📋 Test 2: Create test donor');
    const donorId = await createTestDonor();

    // Test 3: Create test organization if needed
    console.log('\n📋 Test 3: Create test organization');
    const organizationId = await createTestOrganization();

    // Test 4: Create test package
    console.log('\n📋 Test 4: Create test package');
    const packageId = await createTestPackage();

    console.log('\n✅ Test data creation completed!');
    console.log('\n📊 Test Data Summary:');
    console.log(`- Donor ID: ${donorId}`);
    console.log(`- Organization ID: ${organizationId}`);
    console.log(`- Package ID: ${packageId}`);
    
    console.log('\n🎯 You can now use these IDs in your Stripe subscription tests!');

  } catch (error) {
    console.error('❌ Test data creation failed:', error.message);
  }
}

async function checkOrganizations() {
  try {
    const response = await fetch(`${baseUrl}/api/organizations/list`);
    const data = await response.json();

    if (data.success && data.organizations) {
      console.log(`Found ${data.organizations.length} organizations:`);
      data.organizations.forEach((org, index) => {
        console.log(`${index + 1}. ID: ${org.id} - ${org.name} - ${org.email}`);
      });
    } else {
      console.log('No organizations found or API error:', data.error);
    }
  } catch (error) {
    console.error('Failed to check organizations:', error.message);
  }
}

async function createTestDonor() {
  try {
    const donorData = {
      name: "Stripe Test Donor",
      email: `stripe.test.donor.${Date.now()}@example.com`,
      password: "password123",
      phone: "+15551234567",
      city: "Test City",
      address: "123 Test Street",
      postal_code: "12345",
      organization_id: 17 // Use existing Corpulate organization
    };

    console.log('Creating test donor with data:');
    console.log(JSON.stringify(donorData, null, 2));

    const response = await fetch(`${baseUrl}/api/donor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donorData)
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);

    if (data.success) {
      console.log('✅ Test donor created successfully!');
      console.log(`Donor ID: ${data.donor.id}`);
      console.log(`Name: ${data.donor.name}`);
      console.log(`Email: ${data.donor.email}`);
      console.log(`Organization: ${data.donor.organization.name}`);
      return data.donor.id;
    } else {
      console.log('❌ Test donor creation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Test donor creation failed:', error.message);
    return null;
  }
}

async function createTestOrganization() {
  try {
    const orgData = {
      name: "Stripe Test Organization",
      email: `stripe.test.org.${Date.now()}@example.com`,
      password: "password123",
      phone: "+15551234567",
      company: "Stripe Test Company",
      address: "456 Test Avenue",
      city: "Test City",
      state: "TS",
      country: "US",
      postalCode: "12345",
      website: "https://stripe-test.com",
      ghlId: "test_ghl_location_id"
    };

    console.log('Creating test organization with data:');
    console.log(JSON.stringify(orgData, null, 2));

    const response = await fetch(`${baseUrl}/api/organization`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orgData)
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);

    if (data.success) {
      console.log('✅ Test organization created successfully!');
      console.log(`Organization ID: ${data.organization.id}`);
      console.log(`Name: ${data.organization.name}`);
      console.log(`Email: ${data.organization.email}`);
      console.log(`GHL ID: ${data.organization.ghlId}`);
      return data.organization.id;
    } else {
      console.log('❌ Test organization creation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Test organization creation failed:', error.message);
    return null;
  }
}

async function createTestPackage() {
  try {
    const packageData = {
      name: "Stripe Test Subscription Plan",
      description: "Test subscription plan for Stripe integration testing",
      price: 29.99,
      currency: "USD",
      features: "Stripe integration testing, webhook handling, payment processing, trial periods",
      duration: "Monthly",
      isActive: true,
      category: "Stripe Test"
    };

    console.log('Creating test package with data:');
    console.log(JSON.stringify(packageData, null, 2));

    const response = await fetch(`${baseUrl}/api/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packageData)
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);

    if (data.success) {
      console.log('✅ Test package created successfully!');
      console.log(`Package ID: ${data.package.id}`);
      console.log(`Name: ${data.package.name}`);
      console.log(`Price: $${data.package.price} ${data.package.currency}`);
      console.log(`Features: ${data.package.features}`);
      return data.package.id;
    } else {
      console.log('❌ Test package creation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Test package creation failed:', error.message);
    return null;
  }
}

// Run the test data creation
createTestData().catch(console.error);

