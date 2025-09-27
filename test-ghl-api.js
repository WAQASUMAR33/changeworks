// Using built-in fetch (Node.js 18+)

async function testGHLContactCreation() {
  try {
    console.log('🧪 Testing GHL Contact Creation API for Corpulate organization...');
    
    const baseUrl = 'http://localhost:3000';
    
    // Test the GHL contact creation test API
    console.log('📤 Sending request to test API...');
    
    const response = await fetch(`${baseUrl}/api/test-ghl-contact-creation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    
    console.log('📊 Response body:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ GHL Contact Creation API test completed successfully!');
    } else {
      console.log('❌ GHL Contact Creation API test failed or had issues');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error testing GHL Contact Creation API:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testGHLContactCreation().then(result => {
  console.log('\n🏁 Test completed. Final result:', result.success ? 'SUCCESS' : 'FAILED');
  process.exit(result.success ? 0 : 1);
});
