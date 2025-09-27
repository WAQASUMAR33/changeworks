// Simple test to check packages API and database connection
// Using built-in fetch API (Node.js 18+)

const baseUrl = 'http://localhost:3000';

async function testSimplePackages() {
  console.log('🧪 Testing simple packages API...\n');

  try {
    // Test 1: Check if packages API is accessible
    console.log('📋 Test 1: Check packages API accessibility');
    const response = await fetch(`${baseUrl}/api/packages`);
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ Packages API is working!');
      console.log(`Success: ${data.success}`);
      console.log(`Found ${data.packages?.length || 0} packages`);
      
      if (data.packages && data.packages.length > 0) {
        console.log('\n📦 Existing packages:');
        data.packages.forEach((pkg, index) => {
          console.log(`${index + 1}. ID: ${pkg.id} - ${pkg.name} - $${pkg.price} ${pkg.currency}`);
        });
      } else {
        console.log('\n📦 No packages found. Let\'s create one...');
        await createTestPackage();
      }
    } else {
      console.log('❌ Packages API returned error status');
      const text = await response.text();
      console.log('Response:', text.substring(0, 200) + '...');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Make sure the development server is running on port 3000');
  }
}

async function createTestPackage() {
  try {
    console.log('\n📦 Creating test package...');
    
    const packageData = {
      name: "Test Subscription Plan",
      description: "Test subscription plan for API testing",
      price: 19.99,
      currency: "USD",
      features: "Basic features for testing",
      duration: "Monthly",
      isActive: true,
      category: "Test"
    };

    const response = await fetch(`${baseUrl}/api/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
    } else {
      console.log('❌ Package creation failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Package creation failed:', error.message);
  }
}

// Run the test
testSimplePackages().catch(console.error);

