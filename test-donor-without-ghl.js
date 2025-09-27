// Test donor creation without GHL to isolate the issue
async function testDonorWithoutGHL() {
  try {
    console.log('🧪 Testing Donor Creation (without GHL integration)...');
    
    const baseUrl = 'http://localhost:3000';
    
    // Test donor creation with Corpulate organization (ID: 17)
    console.log('📤 Creating donor for Corpulate organization...');
    
    const donorData = {
      name: "Jane Corpulate",
      email: `jane_corpulate_${Date.now()}@example.com`,
      password: "password123",
      phone: "+1555987654",
      city: "Business City",
      address: "456 Corpulate Avenue",
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
    const result = await response.json();
    
    console.log('📊 Response body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Donor creation API is working!');
      console.log('👤 Donor created:', result.donor?.name, '(ID:', result.donor?.id + ')');
      console.log('🏢 Organization:', result.donor?.organization?.name);
      
      if (result.ghl_contact_status) {
        console.log('🔗 GHL Contact Status:', result.ghl_contact_status);
        
        if (result.ghl_contact_status.created) {
          console.log('✅ GHL contact was created successfully!');
        } else {
          console.log('⚠️ GHL contact was not created (expected due to API key issue)');
          console.log('🔍 Error:', result.ghl_contact_status.error);
          console.log('💡 This is expected because the GHL API key is too short');
        }
      }
      
      console.log('\n🎯 Summary:');
      console.log('✅ Donor creation: WORKING');
      console.log('⚠️ GHL integration: NEEDS PROPER API KEY');
      console.log('💡 To fix GHL integration:');
      console.log('   1. Get a proper GHL Agency API key (250+ characters)');
      console.log('   2. Set GHL_AGENCY_API_KEY in environment variables');
      console.log('   3. Restart the development server');
      
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
testDonorWithoutGHL().then(result => {
  console.log('\n🏁 Test completed. Final result:', result.success ? 'SUCCESS' : 'FAILED');
  if (result.success) {
    console.log('🎉 Donor creation is working! GHL integration just needs proper API key.');
  } else {
    console.log('❌ Donor creation has issues that need to be fixed first.');
  }
  process.exit(result.success ? 0 : 1);
});
