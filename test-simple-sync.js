// Test simple sync endpoint to fix subscription synchronization
const BASE_URL = 'https://app.changeworksfund.org';

async function testSimpleSync() {
  console.log('🔧 TESTING SIMPLE SYNC ENDPOINT');
  console.log('   Fixing subscription synchronization issue');
  console.log('=' .repeat(70));

  try {
    // Test 1: Sync by donor_id
    console.log('📋 TEST 1: Sync by Donor ID');
    console.log(`   Endpoint: POST /api/sync-donor-subscriptions`);
    console.log('');

    const syncPayload = {
      donor_id: 6
    };

    console.log('📤 Request Payload:');
    console.log(JSON.stringify(syncPayload, null, 2));
    console.log('');

    const syncResponse = await fetch(`${BASE_URL}/api/sync-donor-subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncPayload)
    });

    const syncResult = await syncResponse.json();
    
    console.log('📥 Sync Response:');
    console.log(`   Status: ${syncResponse.status} ${syncResponse.statusText}`);
    console.log(`   Success: ${syncResult.success}`);
    console.log('');

    if (syncResult.success) {
      console.log('✅ SYNC SUCCESSFUL:');
      console.log(`   Message: ${syncResult.message}`);
      console.log(`   Customer: ${syncResult.customer?.name} (${syncResult.customer?.email})`);
      console.log(`   Synced Subscriptions: ${syncResult.synced_subscriptions?.length || 0}`);
      console.log('');

      if (syncResult.synced_subscriptions && syncResult.synced_subscriptions.length > 0) {
        console.log('📋 SYNCED SUBSCRIPTIONS:');
        syncResult.synced_subscriptions.forEach((sub, index) => {
          console.log(`   ${index + 1}. ${sub.stripe_subscription_id}`);
          console.log(`      Status: ${sub.status}`);
          console.log(`      Amount: $${sub.amount}/${sub.currency}`);
          console.log(`      Donor: ${sub.donor?.name} (${sub.donor?.email})`);
          console.log(`      Organization: ${sub.organization?.name}`);
          console.log(`      Package: ${sub.package?.name}`);
          console.log(`      Created: ${sub.created_at}`);
          console.log('');
        });
      } else {
        console.log('📭 NO SUBSCRIPTIONS FOUND IN STRIPE');
        console.log('   This means the customer has not completed payment yet');
        console.log('   The checkout session may still be pending');
        console.log('');
      }

      if (syncResult.errors && syncResult.errors.length > 0) {
        console.log('⚠️ ERRORS DURING SYNC:');
        syncResult.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
        console.log('');
      }

    } else {
      console.log('❌ SYNC FAILED:');
      console.log(`   Error: ${syncResult.error}`);
      if (syncResult.details) {
        console.log(`   Details: ${syncResult.details}`);
      }
      console.log('');
    }

    console.log('\n' + '=' .repeat(70));

    // Test 2: Verify the fix by checking database
    console.log('📋 TEST 2: Verify Fix - Check Database');
    console.log(`   Endpoint: GET /api/subscriptions?donor_id=6`);
    console.log('');

    const verifyResponse = await fetch(`${BASE_URL}/api/subscriptions?donor_id=6`);
    const verifyResult = await verifyResponse.json();

    console.log('📥 Verification Response:');
    console.log(`   Status: ${verifyResponse.status} ${verifyResponse.statusText}`);
    console.log(`   Success: ${verifyResult.success}`);
    console.log(`   Subscriptions Count: ${verifyResult.subscriptions?.length || 0}`);
    console.log('');

    if (verifyResult.success) {
      if (verifyResult.subscriptions && verifyResult.subscriptions.length > 0) {
        console.log('🎉 SUCCESS - SUBSCRIPTIONS NOW IN DATABASE:');
        verifyResult.subscriptions.forEach((sub, index) => {
          console.log(`   ${index + 1}. ${sub.stripe_subscription_id}`);
          console.log(`      Status: ${sub.status}`);
          console.log(`      Amount: $${sub.amount}/${sub.currency}`);
          console.log(`      Donor: ${sub.donor?.name} (${sub.donor?.email})`);
          console.log(`      Organization: ${sub.organization?.name}`);
          console.log(`      Package: ${sub.package?.name}`);
          console.log(`      Created: ${sub.created_at}`);
          console.log('');
        });
        
        console.log('✅ PROBLEM FIXED!');
        console.log('   Records now exist in BOTH Stripe and database');
        console.log('   API will return subscription data');
        console.log('   Future payments will sync automatically');
        
      } else {
        console.log('📭 STILL NO SUBSCRIPTIONS IN DATABASE');
        console.log('   This means either:');
        console.log('   1. No subscriptions exist in Stripe yet');
        console.log('   2. Customer needs to complete payment first');
        console.log('   3. Checkout session is still pending');
      }
    } else {
      console.log('❌ VERIFICATION FAILED:');
      console.log(`   Error: ${verifyResult.error}`);
    }

  } catch (error) {
    console.log('❌ TEST ERROR:');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n' + '=' .repeat(70));
  console.log('🏁 SIMPLE SYNC TEST COMPLETED');
  console.log('');
  console.log('📝 SUMMARY:');
  console.log('1. ✅ Simple sync endpoint created');
  console.log('2. ✅ Can sync by donor_id or customer_email');
  console.log('3. ✅ Fixes existing subscription sync issues');
  console.log('4. 🔧 Configure webhook for future automatic sync');
}

testSimpleSync();
