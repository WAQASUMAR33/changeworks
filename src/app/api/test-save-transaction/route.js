import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export async function POST() {
  try {
    console.log('🧪 Testing transaction save API...');

    // Step 1: Get or create test data
    console.log('📊 Step 1: Getting test data...');
    
    let testDonor = await prisma.donor.findFirst({
      select: { id: true, name: true, email: true, organization_id: true }
    });

    let testOrganization = await prisma.organization.findFirst({
      select: { id: true, name: true, email: true, balance: true }
    });

    // Create test data if it doesn't exist
    if (!testOrganization) {
      console.log('Creating test organization...');
      testOrganization = await prisma.organization.create({
        data: {
          name: "Test Organization",
          email: "test@changeworksfund.org",
          password: "hashedpassword123",
          orgPassword: "hashedorgpass123",
          phone: "+1234567890",
          company: "Test Organization",
          address: "123 Test Street",
          city: "Test City",
          state: "Test State",
          country: "US",
          postalCode: "12345",
          status: true,
          balance: 0
        }
      });
    }

    if (!testDonor) {
      console.log('Creating test donor...');
      testDonor = await prisma.donor.create({
        data: {
          name: "Test Donor",
          email: "donor@changeworksfund.org",
          password: "hashedpassword123",
          phone: "+1987654321",
          city: "Donor City",
          address: "456 Donor Avenue",
          status: true,
          organization_id: testOrganization.id
        }
      });
    }

    console.log(`✅ Test donor: ${testDonor.name} (ID: ${testDonor.id})`);
    console.log(`✅ Test organization: ${testOrganization.name} (ID: ${testOrganization.id})`);

    // Step 2: Test the transaction creation API
    console.log('💳 Step 2: Testing POST /api/transactions...');

    const transactionData = {
      trx_id: `test_txn_${Date.now()}`,
      trx_date: new Date().toISOString(),
      trx_amount: 25.50,
      trx_method: "stripe",
      trx_donor_id: testDonor.id,
      trx_organization_id: testOrganization.id,
      trx_details: JSON.stringify({
        test: true,
        payment_intent_id: `pi_test_${Date.now()}`,
        description: "Test transaction via API"
      }),
      pay_status: "completed"
    };

    console.log('📤 Sending transaction data:', transactionData);

    // Make internal API call to test the transaction creation
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionData)
    });

    const responseData = await response.json();
    
    console.log('📥 API Response:', responseData);

    if (!response.ok || !responseData.success) {
      return NextResponse.json({
        success: false,
        error: "Transaction API call failed",
        api_response: responseData,
        request_data: transactionData,
        http_status: response.status
      }, { status: 400 });
    }

    // Step 3: Verify the transaction was actually saved
    console.log('🔍 Step 3: Verifying transaction was saved...');

    const savedTransaction = await prisma.saveTrRecord.findUnique({
      where: {
        trx_id: transactionData.trx_id
      },
      include: {
        donor: { select: { name: true, email: true } },
        organization: { select: { name: true, email: true, balance: true } }
      }
    });

    if (!savedTransaction) {
      return NextResponse.json({
        success: false,
        error: "Transaction was not saved to database",
        api_response: responseData,
        request_data: transactionData
      }, { status: 500 });
    }

    console.log(`✅ Transaction verified in database: ${savedTransaction.trx_id}`);

    // Step 4: Check if it appears in recent Stripe transactions
    console.log('📋 Step 4: Checking recent Stripe transactions...');

    const recentStripeTransactions = await prisma.saveTrRecord.findMany({
      where: {
        trx_method: 'stripe'
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5,
      include: {
        donor: { select: { name: true } },
        organization: { select: { name: true } }
      }
    });

    console.log(`✅ Found ${recentStripeTransactions.length} recent Stripe transactions`);

    return NextResponse.json({
      success: true,
      message: "✅ Stripe transaction successfully saved to database!",
      test_results: {
        transaction_created: true,
        database_saved: true,
        api_working: true,
        relationships_intact: true
      },
      created_transaction: {
        id: savedTransaction.id,
        transaction_id: savedTransaction.trx_id,
        amount: savedTransaction.trx_amount,
        method: savedTransaction.trx_method,
        status: savedTransaction.pay_status,
        date: savedTransaction.trx_date,
        created_at: savedTransaction.created_at,
        donor: savedTransaction.donor,
        organization: savedTransaction.organization,
        stripe_details: savedTransaction.trx_details ? JSON.parse(savedTransaction.trx_details) : null
      },
      database_summary: {
        total_stripe_transactions: recentStripeTransactions.length,
        total_all_transactions: await prisma.saveTrRecord.count(),
        recent_stripe_transactions: recentStripeTransactions.map(t => ({
          id: t.trx_id,
          amount: t.trx_amount,
          status: t.pay_status,
          donor: t.donor.name,
          organization: t.organization.name,
          created: t.created_at
        }))
      }
    });

  } catch (error) {
    console.error('❌ Transaction save test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: "Transaction save test failed",
      details: error.message,
      step: "database_operation",
      suggestions: [
        "Check if database is connected",
        "Verify saveTrRecord table exists", 
        "Check if donor and organization tables have data",
        "Run 'npx prisma generate' if schema changed"
      ]
    }, { status: 500 });
  }
}
