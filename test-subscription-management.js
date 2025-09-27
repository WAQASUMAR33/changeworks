// Test individual subscription management APIs
// Using built-in fetch API (Node.js 18+)

const baseUrl = 'http://localhost:3000';

async function testSubscriptionManagement() {
  console.log('🧪 Testing Subscription Management APIs...\n');

  try {
    // Test 1: List all subscriptions
    console.log('📋 Test 1: List all subscriptions');
    await testListSubscriptions();

    // Test 2: Test subscription filtering
    console.log('\n📋 Test 2: Test subscription filtering');
    await testSubscriptionFiltering();

    // Test 3: Test packages API
    console.log('\n📋 Test 3: Test packages API');
    await testPackagesAPI();

    // Test 4: Test subscription transactions (if any exist)
    console.log('\n📋 Test 4: Test subscription transactions');
    await testSubscriptionTransactions();

    console.log('\n✅ Subscription management tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testListSubscriptions() {
  try {
    const response = await fetch(`${baseUrl}/api/subscriptions?page=1&limit=5`);
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    
    if (data.success) {
      console.log(`Found ${data.subscriptions.length} subscriptions`);
      console.log(`Total: ${data.pagination.total} subscriptions`);
      console.log(`Page: ${data.pagination.page} of ${data.pagination.pages}`);
      
      if (data.subscriptions.length > 0) {
        console.log('\n📊 Subscription Details:');
        data.subscriptions.forEach((sub, index) => {
          console.log(`${index + 1}. ID: ${sub.id}`);
          console.log(`   Stripe ID: ${sub.stripe_subscription_id}`);
          console.log(`   Status: ${sub.status}`);
          console.log(`   Amount: $${sub.amount} ${sub.currency}`);
          console.log(`   Interval: ${sub.interval}`);
          console.log(`   Donor: ${sub.donor?.name}`);
          console.log(`   Organization: ${sub.organization?.name}`);
          console.log(`   Package: ${sub.package?.name}`);
          console.log('');
        });
      } else {
        console.log('📋 No subscriptions found yet');
        console.log('💡 Complete a payment using checkout URL to create subscriptions');
      }
    } else {
      console.log('❌ Failed to list subscriptions:', data.error);
    }
  } catch (error) {
    console.error('❌ List subscriptions test failed:', error.message);
  }
}

async function testSubscriptionFiltering() {
  try {
    console.log('Testing subscription filtering...');
    
    // Test filtering by organization
    const orgResponse = await fetch(`${baseUrl}/api/subscriptions?organization_id=17&page=1&limit=5`);
    const orgData = await orgResponse.json();
    
    console.log(`Organization filter - Status: ${orgResponse.status}, Found: ${orgData.subscriptions?.length || 0} subscriptions`);
    
    // Test filtering by status
    const statusResponse = await fetch(`${baseUrl}/api/subscriptions?status=ACTIVE&page=1&limit=5`);
    const statusData = await statusResponse.json();
    
    console.log(`Status filter - Status: ${statusResponse.status}, Found: ${statusData.subscriptions?.length || 0} subscriptions`);
    
    // Test pagination
    const pageResponse = await fetch(`${baseUrl}/api/subscriptions?page=1&limit=2`);
    const pageData = await pageResponse.json();
    
    console.log(`Pagination - Status: ${pageResponse.status}, Found: ${pageData.subscriptions?.length || 0} subscriptions`);
    
  } catch (error) {
    console.error('❌ Subscription filtering test failed:', error.message);
  }
}

async function testPackagesAPI() {
  try {
    console.log('Testing packages API...');
    
    // List packages
    const response = await fetch(`${baseUrl}/api/packages?page=1&limit=5`);
    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    
    if (data.success) {
      console.log(`Found ${data.packages.length} packages`);
      console.log(`Total: ${data.pagination.total} packages`);
      
      if (data.packages.length > 0) {
        console.log('\n📦 Package Details:');
        data.packages.forEach((pkg, index) => {
          console.log(`${index + 1}. ID: ${pkg.id}`);
          console.log(`   Name: ${pkg.name}`);
          console.log(`   Price: $${pkg.price} ${pkg.currency}`);
          console.log(`   Description: ${pkg.description}`);
          console.log(`   Features: ${pkg.features}`);
          console.log(`   Duration: ${pkg.duration}`);
          console.log(`   Category: ${pkg.category}`);
          console.log(`   Active: ${pkg.isActive}`);
          console.log('');
        });
      }
    } else {
      console.log('❌ Failed to list packages:', data.error);
    }
  } catch (error) {
    console.error('❌ Packages API test failed:', error.message);
  }
}

async function testSubscriptionTransactions() {
  try {
    console.log('Testing subscription transactions...');
    
    // First, let's see if we have any subscriptions
    const subResponse = await fetch(`${baseUrl}/api/subscriptions?page=1&limit=1`);
    const subData = await subResponse.json();
    
    if (subData.success && subData.subscriptions.length > 0) {
      const subscriptionId = subData.subscriptions[0].id;
      console.log(`Testing transactions for subscription ID: ${subscriptionId}`);
      
      const response = await fetch(`${baseUrl}/api/subscriptions/${subscriptionId}/transactions?page=1&limit=5`);
      const data = await response.json();

      console.log(`Status: ${response.status}`);
      console.log(`Success: ${data.success}`);
      
      if (data.success) {
        console.log(`Found ${data.transactions.length} transactions`);
        console.log(`Total: ${data.pagination.total} transactions`);
        
        if (data.transactions.length > 0) {
          console.log('\n📊 Transaction Details:');
          data.transactions.forEach((txn, index) => {
            console.log(`${index + 1}. ID: ${txn.id}`);
            console.log(`   Amount: $${txn.amount} ${txn.currency}`);
            console.log(`   Status: ${txn.status}`);
            console.log(`   Stripe Invoice: ${txn.stripe_invoice_id}`);
            console.log(`   Period: ${txn.period_start} to ${txn.period_end}`);
            console.log('');
          });
        } else {
          console.log('📋 No transactions found for this subscription');
        }
      } else {
        console.log('❌ Failed to get transactions:', data.error);
      }
    } else {
      console.log('📋 No subscriptions found to test transactions');
      console.log('💡 Complete a payment to create a subscription first');
    }
  } catch (error) {
    console.error('❌ Subscription transactions test failed:', error.message);
  }
}

// Run the subscription management test
testSubscriptionManagement().catch(console.error);

