// Test script to create a test package for subscription testing
// Using built-in fetch API (Node.js 18+)

const baseUrl = 'http://localhost:3000';

async function createTestPackage() {
  console.log('🧪 Creating test package for subscription testing...\n');

  const packageData = {
    name: "Premium Subscription Plan",
    description: "Premium subscription plan with advanced features for recurring donations",
    price: 29.99,
    currency: "USD",
    features: "Advanced donor management, GHL integration, custom reporting, priority support",
    duration: "Monthly",
    isActive: true,
    category: "Subscription"
  };

  try {
    console.log('📦 Creating package with data:');
    console.log(JSON.stringify(packageData, null, 2));

    const response = await fetch(`${baseUrl}/api/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(packageData)
    });

    const data = await response.json();

    console.log(`\n📊 Response Status: ${response.status}`);
    console.log(`📊 Success: ${data.success}`);

    if (data.success) {
      console.log('\n✅ Package created successfully!');
      console.log(`Package ID: ${data.package.id}`);
      console.log(`Name: ${data.package.name}`);
      console.log(`Price: $${data.package.price} ${data.package.currency}`);
      console.log(`Description: ${data.package.description}`);
      console.log(`Features: ${data.package.features}`);
      console.log(`Duration: ${data.package.duration}`);
      console.log(`Category: ${data.package.category}`);
      console.log(`Active: ${data.package.isActive}`);
      
      console.log('\n🎯 You can now use this package ID in subscription tests!');
      console.log(`Package ID: ${data.package.id}`);
    } else {
      console.log('\n❌ Package creation failed!');
      console.log('Error:', data.error);
      
      if (data.error && data.error.includes('already exists')) {
        console.log('\n💡 Package might already exist. Let\'s try to list existing packages...');
        await listExistingPackages();
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Make sure the development server is running on port 3000');
  }
}

async function listExistingPackages() {
  try {
    console.log('\n📋 Listing existing packages...');
    
    const response = await fetch(`${baseUrl}/api/packages`);
    const data = await response.json();

    if (data.success && data.packages) {
      console.log(`Found ${data.packages.length} packages:`);
      data.packages.forEach((pkg, index) => {
        console.log(`${index + 1}. ID: ${pkg.id} - ${pkg.name} - $${pkg.price} ${pkg.currency}`);
      });
    } else {
      console.log('No packages found or API error:', data.error);
    }
  } catch (error) {
    console.error('Failed to list packages:', error.message);
  }
}

// Run the test
createTestPackage().catch(console.error);

