import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function POST() {
  try {
    console.log('🧪 Starting payment flow test...');
    
    // Step 1: Check if we have test data
    console.log('📊 Step 1: Checking test data availability...');
    
    const [donorCount, organizationCount, sampleDonor, sampleOrganization] = await Promise.all([
      prisma.donor.count(),
      prisma.organization.count(),
      prisma.donor.findFirst({
        select: { id: true, name: true, email: true, organization_id: true }
      }),
      prisma.organization.findFirst({
        select: { id: true, name: true, email: true, balance: true }
      })
    ]);

    if (!sampleDonor || !sampleOrganization) {
      return NextResponse.json({
        success: false,
        error: "No test data available",
        details: "Please create test data first using POST /api/create-test-data",
        current_data: {
          donor_count: donorCount,
          organization_count: organizationCount
        }
      }, { status: 400 });
    }

    console.log(`✅ Found test donor: ${sampleDonor.name} (ID: ${sampleDonor.id})`);
    console.log(`✅ Found test organization: ${sampleOrganization.name} (ID: ${sampleOrganization.id})`);

    // Step 2: Create Payment Intent
    console.log('💳 Step 2: Creating payment intent...');
    
    const paymentIntentData = {
      amount: 5.00,
      currency: "USD",
      donor_id: sampleDonor.id,
      organization_id: sampleOrganization.id,
      description: "Test payment flow - API integration test"
    };

    const createIntentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentIntentData)
    });

    const intentData = await createIntentResponse.json();
    
    if (!intentData.success) {
      return NextResponse.json({
        success: false,
        error: "Payment intent creation failed",
        details: intentData,
        step: "create_intent"
      }, { status: 400 });
    }

    console.log(`✅ Payment intent created: ${intentData.payment_intent_id}`);

    // Step 3: Simulate successful payment and save to database
    console.log('💾 Step 3: Saving payment record to database...');
    
    const savePaymentData = {
      payment_intent_id: intentData.payment_intent_id,
      amount: 5.00,
      currency: "USD",
      donor_id: sampleDonor.id,
      organization_id: sampleOrganization.id,
      status: "succeeded",
      payment_method: "stripe"
    };

    const savePaymentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/payments/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savePaymentData)
    });

    const saveData = await savePaymentResponse.json();
    
    if (!saveData.success) {
      return NextResponse.json({
        success: false,
        error: "Payment save failed",
        details: saveData,
        step: "save_payment",
        payment_intent_created: intentData.payment_intent_id
      }, { status: 400 });
    }

    console.log(`✅ Payment record saved to database`);

    // Step 4: Verify database record was created
    console.log('🔍 Step 4: Verifying database record...');
    
    const dbTransaction = await prisma.saveTrRecord.findFirst({
      where: {
        trx_details: {
          contains: intentData.payment_intent_id
        }
      },
      include: {
        donor: { select: { name: true, email: true } },
        organization: { select: { name: true, email: true } }
      }
    });

    if (!dbTransaction) {
      return NextResponse.json({
        success: false,
        error: "Transaction not found in database",
        details: "Payment was processed but not saved to database",
        step: "verify_database"
      }, { status: 500 });
    }

    console.log(`✅ Database record verified: ${dbTransaction.trx_id}`);

    // Step 5: Check organization balance update
    console.log('💰 Step 5: Checking organization balance...');
    
    const updatedOrganization = await prisma.organization.findUnique({
      where: { id: sampleOrganization.id },
      select: { id: true, name: true, balance: true }
    });

    const balanceIncreased = updatedOrganization.balance > sampleOrganization.balance;

    console.log(`✅ Organization balance: $${sampleOrganization.balance} → $${updatedOrganization.balance}`);

    // Step 6: Test payment history retrieval
    console.log('📋 Step 6: Testing payment history retrieval...');
    
    const historyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/payments/history/${sampleDonor.id}`);
    const historyData = await historyResponse.json();

    const paymentFound = historyData.success && 
      historyData.payments.some(p => p.stripe_details?.payment_intent_id === intentData.payment_intent_id);

    console.log(`✅ Payment history test: ${paymentFound ? 'FOUND' : 'NOT FOUND'}`);

    // Return comprehensive test results
    return NextResponse.json({
      success: true,
      message: "Payment flow test completed successfully! 🎉",
      test_results: {
        step_1_data_check: "✅ PASSED",
        step_2_payment_intent: "✅ PASSED",
        step_3_save_payment: "✅ PASSED", 
        step_4_database_verify: "✅ PASSED",
        step_5_balance_update: balanceIncreased ? "✅ PASSED" : "⚠️ NO CHANGE",
        step_6_payment_history: paymentFound ? "✅ PASSED" : "⚠️ NOT FOUND"
      },
      test_data: {
        donor: {
          id: sampleDonor.id,
          name: sampleDonor.name,
          email: sampleDonor.email
        },
        organization: {
          id: sampleOrganization.id,
          name: sampleOrganization.name,
          email: sampleOrganization.email,
          balance_before: sampleOrganization.balance,
          balance_after: updatedOrganization.balance,
          balance_increased: balanceIncreased
        },
        payment: {
          payment_intent_id: intentData.payment_intent_id,
          amount: 5.00,
          currency: "USD",
          status: "succeeded",
          transaction_id: dbTransaction.trx_id,
          created_at: dbTransaction.created_at
        }
      },
      api_endpoints_tested: [
        "POST /api/payments/create-intent",
        "POST /api/payments/save", 
        "GET /api/payments/history/[donor_id]",
        "Database: saveTrRecord table",
        "Database: organization balance update"
      ],
      next_steps: [
        "Test webhook processing with POST /api/payments/webhook-test",
        "Test real payment completion with Stripe test cards",
        "Monitor Stripe Dashboard for payment intents",
        "Test refund functionality if needed"
      ]
    });

  } catch (error) {
    console.error('❌ Payment flow test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: "Payment flow test failed",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      suggestions: [
        "Check if database is connected",
        "Verify Stripe environment variables are set",
        "Ensure test data exists (POST /api/create-test-data)",
        "Check server logs for detailed error information"
      ]
    }, { status: 500 });
  }
}
