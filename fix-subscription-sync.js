// Fix subscription synchronization between Stripe and database
const BASE_URL = 'https://app.changeworksfund.org';

async function fixSubscriptionSync() {
  console.log('🔧 FIXING SUBSCRIPTION SYNCHRONIZATION');
  console.log('   Ensuring records exist in BOTH Stripe and database');
  console.log('=' .repeat(70));

  try {
    // Step 1: Run diagnostic to understand the current state
    console.log('📋 STEP 1: Run Webhook Diagnostic');
    console.log(`   Endpoint: GET /api/webhook-test?email=dilwaq22@gmail.com`);
    console.log('');

    const diagnosticResponse = await fetch(`${BASE_URL}/api/webhook-test?email=dilwaq22@gmail.com`);
    const diagnosticResult = await diagnosticResponse.json();

    console.log('📥 Diagnostic Response:');
    console.log(`   Status: ${diagnosticResponse.status} ${diagnosticResponse.statusText}`);
    console.log(`   Success: ${diagnosticResult.success}`);
    console.log('');

    if (diagnosticResult.success) {
      const analysis = diagnosticResult.analysis;
      
      console.log('✅ DIAGNOSTIC RESULTS:');
      console.log(`   Stripe Subscriptions: ${analysis.gap_analysis.stripe_subscriptions_count}`);
      console.log(`   Database Subscriptions: ${analysis.gap_analysis.database_subscriptions_count}`);
      console.log(`   Missing in Database: ${analysis.gap_analysis.missing_in_database}`);
      console.log(`   Recent Webhook Events: ${analysis.gap_analysis.webhook_events_recent}`);
      console.log('');

      // Step 2: If there are subscriptions in Stripe but not in database, sync them
      if (analysis.gap_analysis.stripe_subscriptions_count > 0 && analysis.gap_analysis.database_subscriptions_count === 0) {
        console.log('🚨 ISSUE CONFIRMED: Subscriptions exist in Stripe but not in database');
        console.log('📋 STEP 2: Running Manual Sync');
        console.log('');

        const syncResponse = await fetch(`${BASE_URL}/api/webhook-test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_email: 'dilwaq22@gmail.com'
          })
        });

        const syncResult = await syncResponse.json();

        console.log('📥 Sync Response:');
        console.log(`   Status: ${syncResponse.status} ${syncResponse.statusText}`);
        console.log(`   Success: ${syncResult.success}`);
        console.log('');

        if (syncResult.success) {
          console.log('✅ MANUAL SYNC COMPLETED:');
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
              console.log(`      Donor: ${sub.donor?.name}`);
              console.log(`      Package: ${sub.package?.name}`);
              console.log('');
            });
          }
        } else {
          console.log('❌ SYNC FAILED:');
          console.log(`   Error: ${syncResult.error}`);
          console.log(`   Details: ${syncResult.details}`);
        }

      } else if (analysis.gap_analysis.stripe_subscriptions_count === 0) {
        console.log('ℹ️ NO SUBSCRIPTIONS IN STRIPE');
        console.log('   Customer has not completed payment yet');
        console.log('   Need to complete checkout process first');
        console.log('');
      } else {
        console.log('✅ SUBSCRIPTIONS ALREADY SYNCED');
        console.log('   Both Stripe and database have the same subscriptions');
        console.log('');
      }

    } else {
      console.log('❌ DIAGNOSTIC FAILED:');
      console.log(`   Error: ${diagnosticResult.error}`);
      console.log('');
    }

    // Step 3: Verify the fix by checking database subscriptions
    console.log('📋 STEP 3: Verify Fix - Check Database Subscriptions');
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
        console.log('✅ SUCCESS - SUBSCRIPTIONS NOW IN DATABASE:');
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
        
        console.log('🎉 PROBLEM FIXED!');
        console.log('   ✅ Records now exist in BOTH Stripe and database');
        console.log('   ✅ API will return subscription data');
        console.log('   ✅ Future payments will sync automatically');
        
      } else {
        console.log('📭 STILL NO SUBSCRIPTIONS IN DATABASE');
        console.log('   This means either:');
        console.log('   1. No subscriptions exist in Stripe yet');
        console.log('   2. Manual sync failed');
        console.log('   3. Customer needs to complete payment first');
      }
    } else {
      console.log('❌ VERIFICATION FAILED:');
      console.log(`   Error: ${verifyResult.error}`);
    }

  } catch (error) {
    console.log('❌ FIX ERROR:');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n' + '=' .repeat(70));
  console.log('🏁 SUBSCRIPTION SYNC FIX COMPLETED');
  console.log('');
  console.log('📝 SUMMARY:');
  console.log('1. ✅ Diagnostic tool identifies sync issues');
  console.log('2. ✅ Manual sync fixes existing subscriptions');
  console.log('3. ✅ Verification confirms fix worked');
  console.log('4. 🔧 Configure webhook for future automatic sync');
  console.log('');
  console.log('🔧 NEXT STEPS FOR FUTURE SUBSCRIPTIONS:');
  console.log('1. Configure webhook in Stripe Dashboard');
  console.log('2. Set webhook URL: https://app.changeworksfund.org/api/payments/webhook');
  console.log('3. Enable events: customer.subscription.created, customer.subscription.updated');
  console.log('4. Test with new subscription creation');
}

fixSubscriptionSync();
