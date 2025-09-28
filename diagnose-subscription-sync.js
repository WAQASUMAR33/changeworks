// Diagnose subscription synchronization issue
const BASE_URL = 'https://app.changeworksfund.org';

async function diagnoseSubscriptionSync() {
  console.log('🔍 DIAGNOSING SUBSCRIPTION SYNCHRONIZATION ISSUE');
  console.log('   API shows empty but Stripe has subscription');
  console.log('=' .repeat(70));

  try {
    const donorId = 6;
    
    console.log(`📋 CHECKING DONOR ID: ${donorId} (dilwaq22@gmail.com)`);
    console.log('-' .repeat(50));

    // Step 1: Check database subscriptions
    console.log('🔍 STEP 1: Check Database Subscriptions');
    console.log(`   Endpoint: GET /api/subscriptions?donor_id=${donorId}`);
    console.log('');

    const dbResponse = await fetch(`${BASE_URL}/api/subscriptions?donor_id=${donorId}`);
    const dbResult = await dbResponse.json();

    console.log('📥 Database Response:');
    console.log(`   Status: ${dbResponse.status}`);
    console.log(`   Success: ${dbResult.success}`);
    console.log(`   Subscriptions Count: ${dbResult.subscriptions?.length || 0}`);
    console.log(`   Total: ${dbResult.pagination?.total || 0}`);
    console.log('');

    if (dbResult.subscriptions && dbResult.subscriptions.length > 0) {
      console.log('✅ Database has subscriptions:');
      dbResult.subscriptions.forEach((sub, index) => {
        console.log(`   ${index + 1}. ${sub.stripe_subscription_id} - ${sub.status}`);
      });
    } else {
      console.log('❌ Database has NO subscriptions');
      console.log('   This indicates a webhook synchronization issue');
    }

    console.log('\n' + '=' .repeat(70));

    // Step 2: Check webhook status
    console.log('🔍 STEP 2: Check Webhook Status');
    console.log(`   Endpoint: GET /api/webhook-status`);
    console.log('');

    try {
      const webhookResponse = await fetch(`${BASE_URL}/api/webhook-status`);
      const webhookResult = await webhookResponse.json();

      console.log('📥 Webhook Status:');
      console.log(`   Status: ${webhookResponse.status}`);
      console.log(`   Success: ${webhookResult.success}`);
      console.log(`   Webhook URL: ${webhookResult.webhook_url || 'Not configured'}`);
      console.log(`   Events: ${webhookResult.events?.join(', ') || 'None'}`);
      console.log('');
    } catch (webhookError) {
      console.log('❌ Webhook status check failed:');
      console.log(`   Error: ${webhookError.message}`);
      console.log('');
    }

    console.log('\n' + '=' .repeat(70));

    // Step 3: Check customer in Stripe via API
    console.log('🔍 STEP 3: Check Stripe Customer Data');
    console.log('   This will help identify the Stripe customer ID');
    console.log('');

    const customerResponse = await fetch(`${BASE_URL}/api/subscriptions/check-customer?customer_email=dilwaq22@gmail.com`);
    const customerResult = await customerResponse.json();

    console.log('📥 Customer Check Response:');
    console.log(`   Status: ${customerResponse.status}`);
    console.log(`   Success: ${customerResult.success}`);
    console.log(`   Has Subscriptions: ${customerResult.hasSubscriptions}`);
    console.log(`   Donor: ${customerResult.donor?.name} (${customerResult.donor?.email})`);
    console.log('');

    console.log('\n' + '=' .repeat(70));

    // Step 4: Provide solutions
    console.log('🔧 POSSIBLE SOLUTIONS:');
    console.log('-' .repeat(50));
    console.log('');
    console.log('1. 🔄 WEBHOOK ISSUE:');
    console.log('   - Stripe webhook may not be configured properly');
    console.log('   - Webhook events may not be reaching your server');
    console.log('   - Check Stripe Dashboard > Webhooks');
    console.log('');
    console.log('2. 📝 MANUAL SYNC:');
    console.log('   - Create a manual sync endpoint');
    console.log('   - Fetch subscriptions from Stripe API');
    console.log('   - Save them to database');
    console.log('');
    console.log('3. 🔍 STRIPE DASHBOARD CHECK:');
    console.log('   - Go to Stripe Dashboard');
    console.log('   - Check Customers section');
    console.log('   - Look for customer: dilwaq22@gmail.com');
    console.log('   - Check if subscription exists there');
    console.log('');
    console.log('4. 🧪 TEST WEBHOOK:');
    console.log('   - Use Stripe CLI to test webhooks');
    console.log('   - Send test events to your webhook endpoint');
    console.log('   - Verify webhook is receiving events');
    console.log('');

  } catch (error) {
    console.log('❌ DIAGNOSIS ERROR:');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n' + '=' .repeat(70));
  console.log('🏁 DIAGNOSIS COMPLETED');
  console.log('');
  console.log('📝 NEXT STEPS:');
  console.log('1. Check Stripe Dashboard for the subscription');
  console.log('2. Verify webhook configuration in Stripe');
  console.log('3. Test webhook endpoint manually');
  console.log('4. Consider manual sync if webhook is not working');
}

diagnoseSubscriptionSync();
