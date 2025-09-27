// Simple test to check database connection
// Using built-in fetch API (Node.js 18+)

const baseUrl = 'http://localhost:3000';

async function testDatabaseConnection() {
  console.log('🧪 Testing database connection...\n');

  try {
    // Test a simple API that should work
    console.log('📋 Test 1: Check if server is responding');
    const response = await fetch(`${baseUrl}/api/test-db`);
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ Database connection test successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Database connection test failed');
      const text = await response.text();
      console.log('Response:', text.substring(0, 200) + '...');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Make sure the development server is running on port 3000');
  }
}

// Run the test
testDatabaseConnection().catch(console.error);

