// Test donor creation for Corpulate organization
async function testCorpulateDonor() {
  try {
    console.log('🧪 Testing Donor Creation for Corpulate Organization...');
    
    const baseUrl = 'http://localhost:3000';
    
    // Test donor creation with Corpulate organization (ID: 17)
    console.log('📤 Creating donor for Corpulate organization...');
    
    const donorData = {
      name: "John Corpulate",
      email: `john_corpulate_${Date.now()}@example.com`,
      password: "password123",
      phone: "+1555123456",
      city: "Business City",
      address: "123 Corpulate Street",
      postal_code: "12345",
      organization_id: 17 // Corpulate organization ID
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
          console.log('🏢 Business Name:', result.ghl_contact_status.business_name);
        } else {
          console.log('⚠️ GHL contact was not created:', result.ghl_contact_status.error);
          console.log('🔍 Organization GHL available:', result.ghl_contact_status.organization_ghl_available);
        }
      } else {
        console.log('⚠️ No GHL contact status in response');
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
testCorpulateDonor().then(result => {
  console.log('\n🏁 Test completed. Final result:', result.success ? 'SUCCESS' : 'FAILED');
  if (result.result?.ghl_contact_status?.created) {
    console.log('🎉 GHL Contact Creation is working for Corpulate!');
  } else {
    console.log('⚠️ GHL Contact Creation needs attention for Corpulate');
    if (result.result?.ghl_contact_status?.error) {
      console.log('🔍 Error details:', result.result.ghl_contact_status.error);
    }
  }
  process.exit(result.success ? 0 : 1);
});
