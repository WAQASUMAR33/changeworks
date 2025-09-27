// Test script for GHL contact creation integration in donor signup API
// Using built-in fetch API (Node.js 18+)

async function testGHLDonorIntegration() {
  console.log('🧪 Testing GHL Contact Creation Integration in Donor Signup API...\n');

  const baseUrl = 'http://localhost:3000';
  
  // Test donor data
  const donorData = {
    name: "John GHL Test",
    email: `john_ghl_test_${Date.now()}@example.com`,
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
        console.log(`Created in Sub-account: ${responseData.ghl_contact_status.created_in_subaccount}`);
        
        if (responseData.ghl_contact_status.created) {
          console.log('\n🎉 GHL contact created successfully!');
          console.log('📧 Check your GHL dashboard to see the new contact.');
        } else {
          console.log('\n⚠️ GHL contact creation failed or skipped.');
          if (responseData.ghl_contact_status.error) {
            console.log('❌ Error:', responseData.ghl_contact_status.error);
          }
        }
      }

      if (responseData.email_status) {
        console.log('\n📧 Email Status:');
        console.log(`Sent: ${responseData.email_status.sent}`);
        if (responseData.email_status.error) {
          console.log(`Error: ${responseData.email_status.error}`);
        }
      }
    } else {
      console.log('\n❌ Donor registration failed!');
      console.log('Error:', responseData.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Make sure the development server is running on port 3001');
  }
}

// Test GHL API directly
async function testGHLAPIDirectly() {
  console.log('\n🔧 Testing GHL API Directly...\n');

  const ghlApiUrl = 'https://rest.gohighlevel.com/v1/contacts/';
  const ghlApiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6IkttcUdwY3ZON2Q4OVBGbXZOWXJHIiwidmVyc2lvbiI6MSwiaWF0IjoxNzU4NzQ1MjE1NzE4LCJzdWIiOiJLY0NGR21sSzJha2ltWUxJSU5ITCJ9.bbiir7VGC10JFlpepYIc1z0aoU7G-EKwzNSCxH4ogb4';
  
  const testContactData = {
    email: `test_ghl_${Date.now()}@example.com`,
    phone: "+15551234567",
    firstName: "Test",
    lastName: "GHL Contact",
    city: "Mandi Bahauddin",
    address1: "Lahore",
    postalCode: "50400",
    country: "PK",
    notes: "Direct GHL API test contact",
    customField: {
      cf_transaction_id: "TEST123",
      cf_transaction_email: `test_ghl_${Date.now()}@example.com`,
      cf_transaction_amount: "50 AED"
    },
    locationId: "KmqGpcvN7d89PFmvNYrG"
  };

  console.log('📧 Test Contact Data:');
  console.log(JSON.stringify(testContactData, null, 2));
  console.log('');

  try {
    console.log('📤 Sending direct GHL API request...');
    const response = await fetch(ghlApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testContactData)
    });

    const responseData = await response.json();

    console.log('📊 GHL API Response Status:', response.status);
    console.log('📊 GHL API Response Data:');
    console.log(JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('\n✅ GHL API test successful!');
      console.log('📧 Contact created with ID:', responseData.id || responseData.contactId);
    } else {
      console.log('\n❌ GHL API test failed!');
      console.log('Error:', responseData.message || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ GHL API test failed:', error.message);
  }
}

// Run both tests
async function runAllTests() {
  await testGHLAPIDirectly();
  console.log('\n' + '='.repeat(60) + '\n');
  await testGHLDonorIntegration();
}

runAllTests().catch(console.error);
