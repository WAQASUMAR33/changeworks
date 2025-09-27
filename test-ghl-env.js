// Test GHL environment and client setup
async function testGHLEnvironment() {
  try {
    console.log('🧪 Testing GHL Environment Setup...');
    
    const baseUrl = 'http://localhost:3000';
    
    // Test GHL configuration check
    console.log('📤 Testing GHL configuration...');
    
    const response = await fetch(`${baseUrl}/api/debug/ghl-config-check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('📊 Response status:', response.status);
    const result = await response.json();
    console.log('📊 Response body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ GHL configuration check completed!');
      
      if (result.ghl_configured) {
        console.log('✅ GHL is properly configured!');
        console.log('🔑 Agency API Key:', result.agency_key_configured ? 'SET' : 'NOT SET');
        console.log('🌐 Base URL:', result.base_url || 'NOT SET');
      } else {
        console.log('❌ GHL is not properly configured');
        console.log('🔍 Issues:', result.issues || []);
      }
    } else {
      console.log('❌ GHL configuration check failed:', result.error || result.message);
    }
    
    return { success: response.ok, result };
    
  } catch (error) {
    console.error('❌ Error testing GHL environment:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testGHLEnvironment().then(result => {
  console.log('\n🏁 GHL Environment test completed. Result:', result.success ? 'SUCCESS' : 'FAILED');
  if (result.result?.ghl_configured) {
    console.log('🎉 GHL Environment is properly configured!');
  } else {
    console.log('⚠️ GHL Environment needs configuration');
    console.log('💡 Make sure to set GHL_AGENCY_API_KEY and GHL_BASE_URL environment variables');
  }
  process.exit(result.success ? 0 : 1);
});
