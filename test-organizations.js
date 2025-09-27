// Test to get available organizations
async function testOrganizations() {
  try {
    console.log('🧪 Testing Organization API...');
    
    const baseUrl = 'http://localhost:3000';
    
    // Get organizations
    console.log('📤 Getting organizations...');
    
    const response = await fetch(`${baseUrl}/api/organizations/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('📊 Response status:', response.status);
    const result = await response.json();
    console.log('📊 Response body:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.organizations) {
      console.log('✅ Organizations retrieved successfully!');
      console.log('📋 Available organizations:');
      result.organizations.forEach((org, index) => {
        console.log(`  ${index + 1}. ${org.name} (ID: ${org.id}) - ${org.email}`);
      });
      
      // Return the first organization for testing
      if (result.organizations.length > 0) {
        return { success: true, organization: result.organizations[0] };
      }
    } else {
      console.log('❌ Failed to get organizations:', result.error || result.message);
    }
    
    return { success: response.ok, result };
    
  } catch (error) {
    console.error('❌ Error testing organizations API:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testOrganizations().then(result => {
  console.log('\n🏁 Organizations test completed. Result:', result.success ? 'SUCCESS' : 'FAILED');
  if (result.organization) {
    console.log('🎯 First organization for testing:', result.organization.name, '(ID:', result.organization.id + ')');
  }
  process.exit(result.success ? 0 : 1);
});
