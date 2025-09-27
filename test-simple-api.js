// Simple test to check API connectivity and environment
async function testSimpleAPI() {
  try {
    console.log('🧪 Testing Simple API Connectivity...');
    
    const baseUrl = 'http://localhost:3000';
    
    // Test a simple API endpoint first
    console.log('📤 Testing database connection...');
    
    const response = await fetch(`${baseUrl}/api/test-db`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('📊 Response status:', response.status);
    const result = await response.json();
    console.log('📊 Response body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Database connection is working!');
    } else {
      console.log('❌ Database connection failed:', result.error);
    }
    
    return { success: response.ok, result };
    
  } catch (error) {
    console.error('❌ Error testing simple API:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testSimpleAPI().then(result => {
  console.log('\n🏁 Simple API test completed. Result:', result.success ? 'SUCCESS' : 'FAILED');
  process.exit(result.success ? 0 : 1);
});
