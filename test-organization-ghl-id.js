// Test script to verify GHL ID retrieval from organization table
// Using built-in fetch API (Node.js 18+)

async function testOrganizationGHLId() {
  console.log('🧪 Testing GHL ID retrieval from organization table...\n');

  const baseUrl = 'http://localhost:3000';
  
  try {
    // First, let's get the organization details
    console.log('📋 Fetching organization details...');
    const orgResponse = await fetch(`${baseUrl}/api/organizations/list`);
    const orgData = await orgResponse.json();
    
    console.log('📊 Organizations found:', orgData.organizations?.length || 0);
    
    if (orgData.organizations && orgData.organizations.length > 0) {
      // Find Corpulate organization
      const corpulateOrg = orgData.organizations.find(org => org.name === 'Corpulate');
      
      if (corpulateOrg) {
        console.log('\n🏢 Corpulate Organization Details:');
        console.log(`ID: ${corpulateOrg.id}`);
        console.log(`Name: ${corpulateOrg.name}`);
        console.log(`GHL ID: ${corpulateOrg.ghlId}`);
        console.log(`Email: ${corpulateOrg.email}`);
        console.log(`Status: ${corpulateOrg.status}`);
        
        // Test donor creation with this organization
        console.log('\n🧪 Testing donor creation with Corpulate organization...');
        
        const donorData = {
          name: "Test GHL ID Retrieval",
          email: `test_ghl_id_${Date.now()}@example.com`,
          password: "password123",
          phone: "+15551234567",
          city: "Mandi Bahauddin",
          address: "Lahore",
          postal_code: "50400",
          organization_id: corpulateOrg.id
        };

        console.log('📧 Test Donor Data:');
        console.log(JSON.stringify(donorData, null, 2));

        const donorResponse = await fetch(`${baseUrl}/api/donor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(donorData)
        });

        const donorResult = await donorResponse.json();

        console.log('\n📊 Donor Registration Response:');
        console.log(`Status: ${donorResponse.status}`);
        console.log(`Success: ${donorResponse.ok}`);

        if (donorResult.ghl_contact_status) {
          console.log('\n🔗 GHL Contact Status:');
          console.log(`Created: ${donorResult.ghl_contact_status.created}`);
          console.log(`Contact ID: ${donorResult.ghl_contact_status.contact_id}`);
          console.log(`Location ID: ${donorResult.ghl_contact_status.location_id}`);
          console.log(`Business Name: ${donorResult.ghl_contact_status.business_name}`);
          console.log(`Error: ${donorResult.ghl_contact_status.error}`);
          
          if (donorResult.ghl_contact_status.created) {
            console.log('\n✅ GHL contact created successfully using organization GHL ID!');
            console.log(`📧 Contact ID: ${donorResult.ghl_contact_status.contact_id}`);
            console.log(`🏢 Location ID: ${donorResult.ghl_contact_status.location_id}`);
          } else {
            console.log('\n❌ GHL contact creation failed');
            if (donorResult.ghl_contact_status.error) {
              console.log(`Error: ${donorResult.ghl_contact_status.error}`);
            }
          }
        }

        if (donorResult.donor) {
          console.log('\n👤 Donor Created:');
          console.log(`ID: ${donorResult.donor.id}`);
          console.log(`Name: ${donorResult.donor.name}`);
          console.log(`Email: ${donorResult.donor.email}`);
          console.log(`Organization: ${donorResult.donor.organization.name}`);
        }

      } else {
        console.log('❌ Corpulate organization not found');
        console.log('Available organizations:');
        orgData.organizations.forEach(org => {
          console.log(`- ${org.name} (ID: ${org.id}, GHL ID: ${org.ghlId})`);
        });
      }
    } else {
      console.log('❌ No organizations found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Make sure the development server is running on port 3000');
  }
}

// Run the test
testOrganizationGHLId().catch(console.error);
