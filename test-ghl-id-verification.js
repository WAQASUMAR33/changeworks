// Test script to verify GHL ID is properly retrieved from organization table
// Using built-in fetch API (Node.js 18+)

async function testGHLIdVerification() {
  console.log('🧪 Testing GHL ID retrieval from organization table...\n');

  const baseUrl = 'http://localhost:3000';
  
  // Test donor data using organization ID 17 (Corpulate) which we know exists
  const donorData = {
    name: "GHL ID Verification Test",
    email: `ghl_id_test_${Date.now()}@example.com`,
    password: "password123",
    phone: "+15551234567",
    city: "Mandi Bahauddin",
    address: "Lahore",
    postal_code: "50400",
    organization_id: 17 // Corpulate organization
  };

  console.log('📧 Test Donor Data:');
  console.log(JSON.stringify(donorData, null, 2));
  console.log('');

  try {
    console.log('📤 Sending donor registration request...');
    const response = await fetch(`${baseUrl}/api/donor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(donorData)
    });

    const responseData = await response.json();

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:');
    console.log(JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('\n✅ Donor registration successful!');
      
      if (responseData.ghl_contact_status) {
        console.log('\n🔗 GHL Contact Status:');
        console.log(`Created: ${responseData.ghl_contact_status.created}`);
        console.log(`Contact ID: ${responseData.ghl_contact_status.contact_id}`);
        console.log(`Location ID: ${responseData.ghl_contact_status.location_id}`);
        console.log(`Business Name: ${responseData.ghl_contact_status.business_name}`);
        console.log(`Error: ${responseData.ghl_contact_status.error}`);
        console.log(`Organization GHL Available: ${responseData.ghl_contact_status.organization_ghl_available}`);
        console.log(`Created in Sub-account: ${responseData.ghl_contact_status.created_in_subaccount}`);
        
        if (responseData.ghl_contact_status.created) {
          console.log('\n🎉 GHL contact created successfully!');
          console.log('📧 The GHL ID was successfully retrieved from the organization table.');
          console.log(`🏢 Location ID used: ${responseData.ghl_contact_status.location_id}`);
          console.log(`📞 Contact ID: ${responseData.ghl_contact_status.contact_id}`);
        } else {
          console.log('\n⚠️ GHL contact creation failed or skipped.');
          if (responseData.ghl_contact_status.error) {
            console.log('❌ Error:', responseData.ghl_contact_status.error);
          }
        }
      }

      if (responseData.donor && responseData.donor.organization) {
        console.log('\n🏢 Organization Details:');
        console.log(`ID: ${responseData.donor.organization.id}`);
        console.log(`Name: ${responseData.donor.organization.name}`);
        console.log(`Email: ${responseData.donor.organization.email}`);
        console.log(`GHL ID: ${responseData.donor.organization.ghlId}`);
      }

    } else {
      console.log('\n❌ Donor registration failed!');
      console.log('Error:', responseData.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Make sure the development server is running on port 3000');
  }
}

// Run the test
testGHLIdVerification().catch(console.error);



