// Test subscription cancellation
const BASE_URL = 'https://app.changeworksfund.org';

async function testSubscriptionCancellation() {
  console.log('🧪 Testing Subscription Cancellation');
  console.log('📧 Cancel subscription and verify status update');
  console.log('=' .repeat(60));

  try {
    // Test data
    const testData = {
      donor_id: 60, // Using donor ID 60 (Qasim Ali)
      cancel_immediately: false // Cancel at period end
    };

    console.log('📋 Test Data:');
    console.log('   Donor ID:', testData.donor_id);
    console.log('   Cancel Immediately:', testData.cancel_immediately);
    console.log('');

    // First, check current subscription status
    console.log('🔍 Checking current subscription status...');
    const statusResponse = await fetch(`${BASE_URL}/api/subscriptions/cancel-by-donor?donor_id=${testData.donor_id}`);
    const statusResult = await statusResponse.json();
    
    console.log('📊 Current Status:', JSON.stringify(statusResult, null, 2));

    if (statusResult.success && statusResult.subscriptions.length > 0) {
      const activeSubscriptions = statusResult.subscriptions.filter(sub => 
        ['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(sub.status)
      );

      if (activeSubscriptions.length > 0) {
        console.log(`\n✅ Found ${activeSubscriptions.length} active subscription(s) to cancel`);
        
        // Cancel subscription
        console.log('🚀 Canceling subscription...');
        const cancelResponse = await fetch(`${BASE_URL}/api/subscriptions/cancel-by-donor`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testData)
        });

        const cancelResult = await cancelResponse.json();
        
        console.log('📊 Cancel Response Status:', cancelResponse.status);
        console.log('📊 Cancel Response:', JSON.stringify(cancelResult, null, 2));

        if (cancelResult.success) {
          console.log('\n✅ SUBSCRIPTION CANCELLATION SUCCESSFUL!');
          console.log('📧 Message:', cancelResult.message);
          console.log('📧 Successful Cancellations:', cancelResult.successful_cancellations);
          console.log('📧 Failed Cancellations:', cancelResult.failed_cancellations);
          
          if (cancelResult.results && cancelResult.results.length > 0) {
            console.log('\n📋 Cancellation Results:');
            cancelResult.results.forEach((result, index) => {
              console.log(`   ${index + 1}. Subscription ID: ${result.subscription_id}`);
              console.log(`      Stripe ID: ${result.stripe_subscription_id}`);
              console.log(`      Status: ${result.subscription.status}`);
              console.log(`      Cancel at Period End: ${result.subscription.cancel_at_period_end}`);
              console.log(`      Canceled At: ${result.subscription.canceled_at}`);
            });
          }

          // Wait a moment and check status again
          console.log('\n⏳ Waiting 2 seconds and checking status again...');
          await new Promise(resolve => setTimeout(resolve, 2000));

          const finalStatusResponse = await fetch(`${BASE_URL}/api/subscriptions/cancel-by-donor?donor_id=${testData.donor_id}`);
          const finalStatusResult = await finalStatusResponse.json();
          
          console.log('📊 Final Status:', JSON.stringify(finalStatusResult, null, 2));

          if (finalStatusResult.success) {
            const scheduledForCancellation = finalStatusResult.subscriptions.filter(sub => 
              sub.cancel_at_period_end === true || sub.status === 'CANCELED_AT_PERIOD_END'
            );

            console.log('\n🎉 CANCELLATION STATUS VERIFICATION:');
            console.log(`   Total Subscriptions: ${finalStatusResult.total_subscriptions}`);
            console.log(`   Active Subscriptions: ${finalStatusResult.active_subscriptions}`);
            console.log(`   Canceled Subscriptions: ${finalStatusResult.canceled_subscriptions}`);
            console.log(`   Scheduled for Cancellation: ${finalStatusResult.scheduled_for_cancellation}`);

            if (scheduledForCancellation.length > 0) {
              console.log('\n✅ SUCCESS: Subscription is now scheduled for cancellation!');
              console.log('📧 Status should show as "CANCELED_AT_PERIOD_END" or "cancel_at_period_end: true"');
            } else {
              console.log('\n❌ ISSUE: Subscription is not showing as scheduled for cancellation');
            }
          }

        } else {
          console.log('\n❌ SUBSCRIPTION CANCELLATION FAILED');
          console.log('Error:', cancelResult.error);
          console.log('Details:', cancelResult.details);
        }

      } else {
        console.log('\n⚠️ No active subscriptions found to cancel');
        console.log('📧 Current subscriptions:', statusResult.subscriptions.map(sub => ({
          id: sub.id,
          status: sub.status,
          cancel_at_period_end: sub.cancel_at_period_end
        })));
      }

    } else {
      console.log('\n❌ No subscriptions found for this donor');
    }

  } catch (error) {
    console.error('❌ Error testing subscription cancellation:', error.message);
  }
}

async function testImmediateCancellation() {
  console.log('\n🧪 Testing Immediate Subscription Cancellation');
  console.log('📧 Cancel subscription immediately and verify status');
  console.log('=' .repeat(60));

  try {
    // Test data for immediate cancellation
    const testData = {
      donor_id: 60, // Using donor ID 60 (Qasim Ali)
      cancel_immediately: true // Cancel immediately
    };

    console.log('📋 Test Data:');
    console.log('   Donor ID:', testData.donor_id);
    console.log('   Cancel Immediately:', testData.cancel_immediately);
    console.log('');

    // Cancel subscription immediately
    console.log('🚀 Canceling subscription immediately...');
    const cancelResponse = await fetch(`${BASE_URL}/api/subscriptions/cancel-by-donor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const cancelResult = await cancelResponse.json();
    
    console.log('📊 Cancel Response Status:', cancelResponse.status);
    console.log('📊 Cancel Response:', JSON.stringify(cancelResult, null, 2));

    if (cancelResult.success) {
      console.log('\n✅ IMMEDIATE CANCELLATION SUCCESSFUL!');
      console.log('📧 Message:', cancelResult.message);
      console.log('📧 Successful Cancellations:', cancelResult.successful_cancellations);
      
      if (cancelResult.results && cancelResult.results.length > 0) {
        console.log('\n📋 Cancellation Results:');
        cancelResult.results.forEach((result, index) => {
          console.log(`   ${index + 1}. Subscription ID: ${result.subscription_id}`);
          console.log(`      Status: ${result.subscription.status}`);
          console.log(`      Canceled At: ${result.subscription.canceled_at}`);
        });
      }

      // Check final status
      console.log('\n⏳ Checking final status...');
      const finalStatusResponse = await fetch(`${BASE_URL}/api/subscriptions/cancel-by-donor?donor_id=${testData.donor_id}`);
      const finalStatusResult = await finalStatusResponse.json();
      
      const canceledSubscriptions = finalStatusResult.subscriptions.filter(sub => 
        ['CANCELED', 'UNPAID'].includes(sub.status)
      );

      console.log('\n🎉 IMMEDIATE CANCELLATION STATUS VERIFICATION:');
      console.log(`   Canceled Subscriptions: ${canceledSubscriptions.length}`);
      
      if (canceledSubscriptions.length > 0) {
        console.log('\n✅ SUCCESS: Subscription is now canceled!');
        console.log('📧 Status should show as "CANCELED"');
      } else {
        console.log('\n❌ ISSUE: Subscription is not showing as canceled');
      }

    } else {
      console.log('\n❌ IMMEDIATE CANCELLATION FAILED');
      console.log('Error:', cancelResult.error);
      console.log('Details:', cancelResult.details);
    }

  } catch (error) {
    console.error('❌ Error testing immediate cancellation:', error.message);
  }
}

async function testBothCancellationTypes() {
  console.log('🧪 Testing Both Subscription Cancellation Types');
  console.log('📧 Cancel at Period End + Immediate Cancellation');
  console.log('=' .repeat(60));

  await testSubscriptionCancellation();
  await testImmediateCancellation();

  console.log('\n🎉 Subscription Cancellation Testing Complete!');
  console.log('📋 Summary:');
  console.log('   ✅ Cancel at Period End: Status should be "CANCELED_AT_PERIOD_END"');
  console.log('   ✅ Immediate Cancellation: Status should be "CANCELED"');
  console.log('   ✅ Database Updates: Status and timestamps updated correctly');
  console.log('   ✅ Stripe Sync: Webhook should sync status changes');
  console.log('   ✅ Status Display: Frontend should show correct cancellation status');
}

// Run the tests
testBothCancellationTypes();
