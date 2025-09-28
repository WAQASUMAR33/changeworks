// Test manual sync endpoint to fix subscription synchronization
const BASE_URL = 'https://app.changeworksfund.org';

async function testManualSync() {
  console.log('🔄 TESTING MANUAL SYNC ENDPOINT');
  console.log('   This will sync Stripe subscriptions to database');
  console.log('=' .repeat(70));

  try {
    // Test with donor_id
    console.log('📋 SYNCING SUBSCRIPTIONS FOR DONOR ID: 6');
    console.log('-' .repeat(50));

    const syncPayload = {
      donor_id: 6
    };

    console.log('📤 Request Payload:');
    console.log(JSON.stringify(syncPayload, null, 2));
    console.log('');

    const syncResponse = await fetch(`${BASE_URL}/api/subscriptions/sync-stripe`, {
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
      console.log('✅ SUCCESS - Manual Sync Completed:');
      console.log(`   Message: ${syncResult.message}`);
      console.log(`   Customer ID: ${syncResult.customer?.id}`);
      console.log(`   Customer Email: ${syncResult.customer?.email}`);
      console.log(`   Customer Name: ${syncResult.customer?.name}`);
      console.log(`   Synced Subscriptions: ${syncResult.synced_subscriptions?.length || 0}`);
      console.log('');

      if (syncResult.synced_subscriptions && syncResult.synced_subscriptions.length > 0) {
        console.log('📋 SYNCED SUBSCRIPTIONS:');
        syncResult.synced_subscriptions.forEach((sub, index) => {
          console.log(`   Subscription ${index + 1}:`);
          console.log(`     ID: ${sub.id}`);
          console.log(`     Stripe ID: ${sub.stripe_subscription_id}`);
          console.log(`     Status: ${sub.status}`);
          console.log(`     Amount: $${sub.amount}/${sub.currency}`);
          console.log(`     Donor: ${sub.donor?.name} (${sub.donor?.email})`);
          console.log(`     Package: ${sub.package?.name}`);
          console.log(`     Created: ${sub.created_at}`);
          console.log('');
        });
      } else {
        console.log('📭 NO SUBSCRIPTIONS FOUND IN STRIPE');
        console.log('   This means the customer has no subscriptions in Stripe yet.');
        console.log('   The checkout session may not have been completed.');
      }

      if (syncResult.errors && syncResult.errors.length > 0) {
        console.log('⚠️ ERRORS DURING SYNC:');
        syncResult.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }

    } else {
      console.log('❌ SYNC FAILED:');
      console.log(`   Error: ${syncResult.error}`);
      if (syncResult.details) {
        console.log(`   Details: ${syncResult.details}`);
      }
    }

    console.log('\n' + '=' .repeat(70));

    // Now check if subscriptions appear in the database
    console.log('🔍 VERIFYING SYNC - CHECKING DATABASE');
    console.log('-' .repeat(50));

    const verifyResponse = await fetch(`${BASE_URL}/api/subscriptions?donor_id=6`);
    const verifyResult = await verifyResponse.json();

    console.log('📥 Verification Response:');
    console.log(`   Status: ${verifyResponse.status}`);
    console.log(`   Success: ${verifyResult.success}`);
    console.log(`   Subscriptions Count: ${verifyResult.subscriptions?.length || 0}`);
    console.log('');

    if (verifyResult.subscriptions && verifyResult.subscriptions.length > 0) {
      console.log('✅ SUCCESS - Subscriptions now appear in database:');
      verifyResult.subscriptions.forEach((sub, index) => {
        console.log(`   ${index + 1}. ${sub.stripe_subscription_id} - ${sub.status}`);
      });
    } else {
      console.log('📭 Still no subscriptions in database');
      console.log('   This means either:');
      console.log('   1. No subscriptions exist in Stripe for this customer');
      console.log('   2. The checkout session was not completed');
      console.log('   3. The customer needs to complete payment');
    }

  } catch (error) {
    console.log('❌ SYNC ERROR:');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n' + '=' .repeat(70));
  console.log('🏁 MANUAL SYNC TEST COMPLETED');
  console.log('');
  console.log('📝 SUMMARY:');
  console.log('1. Manual sync endpoint created: POST /api/subscriptions/sync-stripe');
  console.log('2. This can sync Stripe subscriptions to database');
  console.log('3. Use this when webhooks are not working');
  console.log('4. Check Stripe Dashboard to verify subscriptions exist');
}

testManualSync();
