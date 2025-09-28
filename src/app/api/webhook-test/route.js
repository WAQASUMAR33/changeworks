import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// GET /api/webhook-test - Test webhook functionality and check recent events
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get('email') || 'dilwaq22@gmail.com';
    
    console.log(`🔍 Testing webhook functionality for: ${customerEmail}`);
    
    // Step 1: Check if customer exists in Stripe
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    });
    
    if (customers.data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Customer not found in Stripe',
        email: customerEmail
      });
    }
    
    const customer = customers.data[0];
    console.log(`✅ Found customer: ${customer.id} (${customer.email})`);
    
    // Step 2: Check subscriptions in Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 10
    });
    
    console.log(`📋 Found ${subscriptions.data.length} subscriptions in Stripe`);
    
    // Step 3: Check subscriptions in database
    const donor = await prisma.donor.findFirst({
      where: { email: customerEmail },
      select: { id: true, name: true, email: true }
    });
    
    let dbSubscriptions = [];
    if (donor) {
      dbSubscriptions = await prisma.subscription.findMany({
        where: { donor_id: donor.id },
        include: {
          donor: { select: { id: true, name: true, email: true } },
          organization: { select: { id: true, name: true } },
          package: { select: { id: true, name: true, price: true } }
        }
      });
    }
    
    console.log(`📋 Found ${dbSubscriptions.length} subscriptions in database`);
    
    // Step 4: Check webhook events (recent)
    const events = await stripe.events.list({
      type: 'customer.subscription.created',
      limit: 10
    });
    
    const recentEvents = events.data.filter(event => {
      const eventTime = new Date(event.created * 1000);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return eventTime > oneDayAgo;
    });
    
    console.log(`📋 Found ${recentEvents.length} recent subscription.created events`);
    
    // Step 5: Analyze the gap
    const analysis = {
      stripe_customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        created: new Date(customer.created * 1000)
      },
      stripe_subscriptions: subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        created: new Date(sub.created * 1000),
        metadata: sub.metadata,
        current_period_start: new Date(sub.current_period_start * 1000),
        current_period_end: new Date(sub.current_period_end * 1000)
      })),
      database_donor: donor,
      database_subscriptions: dbSubscriptions.map(sub => ({
        id: sub.id,
        stripe_subscription_id: sub.stripe_subscription_id,
        status: sub.status,
        created: sub.created_at,
        donor_id: sub.donor_id
      })),
      recent_webhook_events: recentEvents.map(event => ({
        id: event.id,
        type: event.type,
        created: new Date(event.created * 1000),
        customer: event.data.object.customer,
        subscription_id: event.data.object.id
      })),
      gap_analysis: {
        stripe_subscriptions_count: subscriptions.data.length,
        database_subscriptions_count: dbSubscriptions.length,
        missing_in_database: subscriptions.data.length - dbSubscriptions.length,
        webhook_events_recent: recentEvents.length
      }
    };
    
    return NextResponse.json({
      success: true,
      message: 'Webhook diagnostic completed',
      analysis
    });
    
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Webhook test failed',
      details: error.message
    }, { status: 500 });
  }
}

// POST /api/webhook-test - Manually trigger subscription sync
export async function POST(request) {
  try {
    const body = await request.json();
    const { customer_email, customer_id } = body;
    
    if (!customer_email && !customer_id) {
      return NextResponse.json({
        success: false,
        error: 'Either customer_email or customer_id is required'
      }, { status: 400 });
    }
    
    let customer;
    
    if (customer_id) {
      customer = await stripe.customers.retrieve(customer_id);
    } else {
      const customers = await stripe.customers.list({
        email: customer_email,
        limit: 1
      });
      customer = customers.data[0];
    }
    
    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Customer not found in Stripe'
      }, { status: 404 });
    }
    
    // Get subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 100
    });
    
    const syncedSubscriptions = [];
    
    for (const stripeSubscription of subscriptions.data) {
      try {
        // Extract metadata
        const donorId = parseInt(stripeSubscription.metadata.donor_id);
        const organizationId = parseInt(stripeSubscription.metadata.organization_id);
        const packageId = parseInt(stripeSubscription.metadata.package_id);
        
        // Get package details
        const packageData = await prisma.package.findUnique({
          where: { id: packageId }
        });
        
        if (!packageData) {
          console.error(`Package ${packageId} not found for subscription ${stripeSubscription.id}`);
          continue;
        }
        
        // Create subscription record
        const subscriptionData = {
          stripe_subscription_id: stripeSubscription.id,
          donor_id: donorId,
          organization_id: organizationId,
          package_id: packageId,
          status: stripeSubscription.status.toUpperCase(),
          current_period_start: new Date(stripeSubscription.current_period_start * 1000),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000),
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          canceled_at: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
          trial_start: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
          trial_end: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
          amount: packageData.price,
          currency: packageData.currency,
          interval: 'month',
          interval_count: 1,
          metadata: JSON.stringify({
            stripe_customer_id: stripeSubscription.customer,
            created_via: 'manual_sync',
            synced_at: new Date()
          })
        };
        
        // Use upsert to create or update
        const dbSubscription = await prisma.subscription.upsert({
          where: {
            stripe_subscription_id: stripeSubscription.id
          },
          update: {
            status: stripeSubscription.status.toUpperCase(),
            current_period_start: new Date(stripeSubscription.current_period_start * 1000),
            current_period_end: new Date(stripeSubscription.current_period_end * 1000),
            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
            canceled_at: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
            trial_start: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
            trial_end: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
            updated_at: new Date()
          },
          create: subscriptionData
        });
        
        syncedSubscriptions.push(dbSubscription);
        console.log(`✅ Synced subscription ${stripeSubscription.id}`);
        
      } catch (error) {
        console.error(`❌ Error syncing subscription ${stripeSubscription.id}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedSubscriptions.length} subscriptions`,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name
      },
      synced_subscriptions: syncedSubscriptions
    });
    
  } catch (error) {
    console.error('Manual sync error:', error);
    return NextResponse.json({
      success: false,
      error: 'Manual sync failed',
      details: error.message
    }, { status: 500 });
  }
}
