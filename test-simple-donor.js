// Test simple donor creation without GHL
async function testSimpleDonor() {
  try {
    console.log('🧪 Testing Simple Donor Creation (no GHL)...');
    
    const baseUrl = 'http://localhost:3001';
    
    // Test simple donor creation
    console.log('📤 Creating donor without GHL integration...');
    
    const donorData = {
      name: "Simple Corpulate Donor",
      email: `simple_corpulate_${Date.now()}@example.com`,
      password: "password123",
      phone: "+1555111111",
      city: "Business City",
      address: "789 Simple Street",
      postal_code: "12345",
      organization_id: 17 // Corpulate organization ID
    };
    
    console.log('📊 Sending donor data:', { ...donorData, password: '[HIDDEN]' });
    
    const response = await fetch(`${baseUrl}/api/test-donor-simple-ghl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(donorData)
    });

    console.log('📊 Response status:', response.status);
    const result = await response.json();
    
    console.log('📊 Response body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Simple donor creation is working!');
      console.log('👤 Donor created:', result.donor?.name, '(ID:', result.donor?.id + ')');
      console.log('🏢 Organization:', result.donor?.organization?.name);
      
      console.log('\n🎯 Summary:');
      console.log('✅ Basic donor creation: WORKING');
      console.log('💡 The issue is likely in the GHL integration code');
      console.log('🔧 Next steps:');
      console.log('   1. Fix the GHL API key (needs to be 250+ characters)');
      console.log('   2. Test the GHL integration separately');
      
    } else {
      console.log('❌ Simple donor creation failed:', result.error || result.message);
      if (result.details) {
        console.log('🔍 Error details:', result.details);
      }
    }
    
    return { success: response.ok, result };
    
  } catch (error) {
    console.error('❌ Error testing simple donor creation:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testSimpleDonor().then(result => {
  console.log('\n🏁 Test completed. Final result:', result.success ? 'SUCCESS' : 'FAILED');
  if (result.success) {
    console.log('🎉 Basic donor creation is working! The issue is in GHL integration.');
  } else {
    console.log('❌ Basic donor creation has issues that need to be fixed.');
  }
  process.exit(result.success ? 0 : 1);
});
