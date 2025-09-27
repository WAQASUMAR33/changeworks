// Simple test for donor creation with GHL integration
async function testDonorCreation() {
  try {
    console.log('🧪 Testing Donor Creation with GHL Integration...');
    
    const baseUrl = 'http://localhost:3000';
    
    // First, let's test if we can access the donor API
    console.log('📤 Testing donor creation API...');
    
    const donorData = {
      name: "Test Corpulate Donor",
      email: `test_corpulate_${Date.now()}@example.com`,
      password: "password123",
      phone: "+1555123456",
      city: "Business City",
      address: "123 Test Street",
      postal_code: "12345",
      organization_id: 1 // We'll need to check what organization IDs exist
    };
    
    console.log('📊 Sending donor data:', { ...donorData, password: '[HIDDEN]' });
    
    const response = await fetch(`${baseUrl}/api/donor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(donorData)
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    
    console.log('📊 Response body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Donor creation API is working!');
      
      if (result.ghl_contact_status) {
        console.log('🔗 GHL Contact Status:', result.ghl_contact_status);
        
        if (result.ghl_contact_status.created) {
          console.log('✅ GHL contact was created successfully!');
          console.log('📋 Contact ID:', result.ghl_contact_status.contact_id);
          console.log('📍 Location ID:', result.ghl_contact_status.location_id);
        } else {
          console.log('⚠️ GHL contact was not created:', result.ghl_contact_status.error);
        }
      }
    } else {
      console.log('❌ Donor creation failed:', result.error || result.message);
    }
    
    return { success: response.ok, result };
    
  } catch (error) {
    console.error('❌ Error testing donor creation:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testDonorCreation().then(result => {
  console.log('\n🏁 Test completed. Final result:', result.success ? 'SUCCESS' : 'FAILED');
  if (result.result?.ghl_contact_status?.created) {
    console.log('🎉 GHL Contact Creation is working!');
  } else {
    console.log('⚠️ GHL Contact Creation needs attention');
  }
  process.exit(result.success ? 0 : 1);
});
