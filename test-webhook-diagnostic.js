// Test webhook diagnostic to identify the synchronization issue
const BASE_URL = 'https://app.changeworksfund.org';

async function testWebhookDiagnostic() {
  console.log('🔍 TESTING WEBHOOK DIAGNOSTIC');
  console.log('   This will identify why subscriptions are not syncing');
  console.log('=' .repeat(70));

  try {
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
      
      console.log('✅ DIAGNOSTIC COMPLETED:');
      console.log('');
      
      console.log('👤 STRIPE CUSTOMER:');
      console.log(`   ID: ${analysis.stripe_customer.id}`);
      console.log(`   Email: ${analysis.stripe_customer.email}`);
      console.log(`   Name: ${analysis.stripe_customer.name}`);
      console.log(`   Created: ${analysis.stripe_customer.created}`);
      console.log('');
      
      console.log('📋 STRIPE SUBSCRIPTIONS:');
      console.log(`   Count: ${analysis.stripe_subscriptions.length}`);
      if (analysis.stripe_subscriptions.length > 0) {
        analysis.stripe_subscriptions.forEach((sub, index) => {
          console.log(`   ${index + 1}. ${sub.id}`);
          console.log(`      Status: ${sub.status}`);
          console.log(`      Created: ${sub.created}`);
          console.log(`      Donor ID: ${sub.metadata.donor_id}`);
          console.log(`      Org ID: ${sub.metadata.organization_id}`);
          console.log(`      Package ID: ${sub.metadata.package_id}`);
          console.log('');
        });
      } else {
        console.log('   No subscriptions found in Stripe');
        console.log('');
      }
      
      console.log('👤 DATABASE DONOR:');
      if (analysis.database_donor) {
        console.log(`   ID: ${analysis.database_donor.id}`);
        console.log(`   Name: ${analysis.database_donor.name}`);
        console.log(`   Email: ${analysis.database_donor.email}`);
      } else {
        console.log('   Donor not found in database');
      }
      console.log('');
      
      console.log('📋 DATABASE SUBSCRIPTIONS:');
      console.log(`   Count: ${analysis.database_subscriptions.length}`);
      if (analysis.database_subscriptions.length > 0) {
        analysis.database_subscriptions.forEach((sub, index) => {
          console.log(`   ${index + 1}. ${sub.stripe_subscription_id}`);
          console.log(`      Status: ${sub.status}`);
          console.log(`      Created: ${sub.created}`);
        });
      } else {
        console.log('   No subscriptions found in database');
      }
      console.log('');
      
      console.log('🔔 RECENT WEBHOOK EVENTS:');
      console.log(`   Count: ${analysis.recent_webhook_events.length}`);
      if (analysis.recent_webhook_events.length > 0) {
        analysis.recent_webhook_events.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.id}`);
          console.log(`      Type: ${event.type}`);
          console.log(`      Created: ${event.created}`);
          console.log(`      Customer: ${event.customer}`);
          console.log(`      Subscription: ${event.subscription_id}`);
        });
      } else {
        console.log('   No recent webhook events found');
      }
      console.log('');
      
      console.log('📊 GAP ANALYSIS:');
      console.log(`   Stripe Subscriptions: ${analysis.gap_analysis.stripe_subscriptions_count}`);
      console.log(`   Database Subscriptions: ${analysis.gap_analysis.database_subscriptions_count}`);
      console.log(`   Missing in Database: ${analysis.gap_analysis.missing_in_database}`);
      console.log(`   Recent Webhook Events: ${analysis.gap_analysis.webhook_events_recent}`);
      console.log('');
      
      // Determine the issue
      if (analysis.gap_analysis.stripe_subscriptions_count > 0 && analysis.gap_analysis.database_subscriptions_count === 0) {
        console.log('🚨 ISSUE IDENTIFIED: WEBHOOK SYNCHRONIZATION FAILURE');
        console.log('   - Subscriptions exist in Stripe');
        console.log('   - No subscriptions in database');
        console.log('   - Webhook is not syncing data');
        console.log('');
        
        if (analysis.gap_analysis.webhook_events_recent === 0) {
          console.log('🔧 ROOT CAUSE: NO WEBHOOK EVENTS');
          console.log('   - Webhook is not configured in Stripe');
          console.log('   - Webhook URL is not accessible');
          console.log('   - Webhook events are not being sent');
        } else {
          console.log('🔧 ROOT CAUSE: WEBHOOK PROCESSING FAILURE');
          console.log('   - Webhook events are being sent');
          console.log('   - But webhook processing is failing');
          console.log('   - Check webhook endpoint logs');
        }
      } else if (analysis.gap_analysis.stripe_subscriptions_count === 0) {
        console.log('ℹ️ NO ISSUE: NO SUBSCRIPTIONS IN STRIPE');
        console.log('   - Customer has not completed payment');
        console.log('   - Checkout session may be incomplete');
      } else {
        console.log('✅ SYNC WORKING: Subscriptions are properly synced');
      }
      
    } else {
      console.log('❌ DIAGNOSTIC FAILED:');
      console.log(`   Error: ${diagnosticResult.error}`);
    }

  } catch (error) {
    console.log('❌ DIAGNOSTIC ERROR:');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n' + '=' .repeat(70));
  console.log('🏁 WEBHOOK DIAGNOSTIC COMPLETED');
  console.log('');
  console.log('📝 NEXT STEPS:');
  console.log('1. If webhook events = 0: Configure webhook in Stripe Dashboard');
  console.log('2. If webhook events > 0 but no sync: Check webhook processing');
  console.log('3. If no subscriptions in Stripe: Customer needs to complete payment');
  console.log('4. Use manual sync endpoint to fix existing subscriptions');
}

testWebhookDiagnostic();
