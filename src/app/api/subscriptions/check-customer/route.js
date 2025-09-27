import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// GET /api/subscriptions/check-customer - Check if customer has active subscription
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const donorId = searchParams.get('donor_id');
    const customerEmail = searchParams.get('customer_email');
    const organizationId = searchParams.get('organization_id');
    const includeInactive = searchParams.get('include_inactive') === 'true';

    // Validate required parameters
    if (!donorId && !customerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Either donor_id or customer_email is required'
      }, { status: 400 });
    }

    // Build where clause
    const where = {};
    
    if (donorId) {
      where.donor_id = parseInt(donorId);
    }
    
    if (organizationId) {
      where.organization_id = parseInt(organizationId);
    }

    // If not including inactive, only get active subscriptions
    if (!includeInactive) {
      where.status = 'ACTIVE';
    }

    // Get subscriptions from database
    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        package: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            currency: true,
            features: true
          }
        },
        subscription_transactions: {
          orderBy: {
            created_at: 'desc'
          },
          take: 1 // Get latest transaction
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // If customer_email is provided, filter by email
    let filteredSubscriptions = subscriptions;
    if (customerEmail) {
      filteredSubscriptions = subscriptions.filter(sub => 
        sub.donor.email.toLowerCase() === customerEmail.toLowerCase()
      );
    }

    // Check Stripe for additional subscription data
    let stripeSubscriptions = [];
    if (filteredSubscriptions.length > 0) {
      try {
        // Get Stripe customer by email
        const customerEmail = filteredSubscriptions[0].donor.email;
        const customers = await stripe.customers.list({
          email: customerEmail,
          limit: 1
        });

        if (customers.data.length > 0) {
          const customer = customers.data[0];
          
          // Get all subscriptions for this customer
          const stripeSubs = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'all',
            limit: 100
          });

          stripeSubscriptions = stripeSubs.data.map(sub => ({
            id: sub.id,
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000),
            current_period_end: new Date(sub.current_period_end * 1000),
            cancel_at_period_end: sub.cancel_at_period_end,
            canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
            trial_start: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
            trial_end: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
            items: sub.items.data.map(item => ({
              id: item.id,
              price: {
                id: item.price.id,
                unit_amount: item.price.unit_amount,
                currency: item.price.currency,
                recurring: item.price.recurring,
                product: item.price.product
              },
              quantity: item.quantity
            })),
            metadata: sub.metadata
          }));
        }
      } catch (stripeError) {
        console.error('Error fetching Stripe subscriptions:', stripeError);
        // Continue without Stripe data
      }
    }

    // Determine subscription status
    const hasActiveSubscription = filteredSubscriptions.some(sub => sub.status === 'ACTIVE');
    const hasAnySubscription = filteredSubscriptions.length > 0;
    const activeSubscriptions = filteredSubscriptions.filter(sub => sub.status === 'ACTIVE');
    const inactiveSubscriptions = filteredSubscriptions.filter(sub => sub.status !== 'ACTIVE');

    // Get subscription summary
    const subscriptionSummary = {
      has_subscription: hasAnySubscription,
      has_active_subscription: hasActiveSubscription,
      total_subscriptions: filteredSubscriptions.length,
      active_subscriptions: activeSubscriptions.length,
      inactive_subscriptions: inactiveSubscriptions.length,
      latest_subscription: filteredSubscriptions[0] || null,
      active_subscription: activeSubscriptions[0] || null
    };

    // Calculate total monthly revenue from active subscriptions
    const monthlyRevenue = activeSubscriptions.reduce((total, sub) => {
      return total + (sub.amount || 0);
    }, 0);

    // Get next billing date
    let nextBillingDate = null;
    if (activeSubscriptions.length > 0) {
      const latestActive = activeSubscriptions[0];
      nextBillingDate = latestActive.current_period_end;
    }

    return NextResponse.json({
      success: true,
      customer: {
        donor_id: donorId ? parseInt(donorId) : null,
        customer_email: customerEmail || (filteredSubscriptions[0]?.donor?.email),
        organization_id: organizationId ? parseInt(organizationId) : null
      },
      subscription_status: subscriptionSummary,
      revenue: {
        monthly_revenue: monthlyRevenue,
        currency: activeSubscriptions[0]?.currency || 'USD'
      },
      next_billing_date: nextBillingDate,
      subscriptions: filteredSubscriptions.map(sub => ({
        id: sub.id,
        stripe_subscription_id: sub.stripe_subscription_id,
        status: sub.status,
        amount: sub.amount,
        currency: sub.currency,
        interval: sub.interval,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: sub.canceled_at,
        trial_start: sub.trial_start,
        trial_end: sub.trial_end,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        donor: sub.donor,
        organization: sub.organization,
        package: sub.package,
        latest_transaction: sub.subscription_transactions[0] || null
      })),
      stripe_subscriptions: stripeSubscriptions,
      message: hasActiveSubscription 
        ? `Customer has ${activeSubscriptions.length} active subscription(s)`
        : hasAnySubscription 
          ? `Customer has ${inactiveSubscriptions.length} inactive subscription(s)`
          : 'Customer has no subscriptions'
    });

  } catch (error) {
    console.error('Error checking customer subscription:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check customer subscription',
      details: error.message
    }, { status: 500 });
  }
}

// POST /api/subscriptions/check-customer - Check multiple customers at once
export async function POST(request) {
  try {
    const body = await request.json();
    const { customers, organization_id, include_inactive = false } = body;

    // Validate required parameters
    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'customers array is required and must not be empty'
      }, { status: 400 });
    }

    // Check each customer
    const results = await Promise.all(
      customers.map(async (customer) => {
        try {
          const { donor_id, customer_email } = customer;
          
          if (!donor_id && !customer_email) {
            return {
              customer,
              success: false,
              error: 'Either donor_id or customer_email is required'
            };
          }

          // Build where clause
          const where = {};
          
          if (donor_id) {
            where.donor_id = parseInt(donor_id);
          }
          
          if (organization_id) {
            where.organization_id = parseInt(organization_id);
          }

          // If not including inactive, only get active subscriptions
          if (!include_inactive) {
            where.status = 'ACTIVE';
          }

          // Get subscriptions from database
          const subscriptions = await prisma.subscription.findMany({
            where,
            include: {
              donor: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              organization: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              package: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  currency: true,
                  features: true
                }
              }
            },
            orderBy: {
              created_at: 'desc'
            }
          });

          // If customer_email is provided, filter by email
          let filteredSubscriptions = subscriptions;
          if (customer_email) {
            filteredSubscriptions = subscriptions.filter(sub => 
              sub.donor.email.toLowerCase() === customer_email.toLowerCase()
            );
          }

          // Determine subscription status
          const hasActiveSubscription = filteredSubscriptions.some(sub => sub.status === 'ACTIVE');
          const hasAnySubscription = filteredSubscriptions.length > 0;
          const activeSubscriptions = filteredSubscriptions.filter(sub => sub.status === 'ACTIVE');

          return {
            customer,
            success: true,
            subscription_status: {
              has_subscription: hasAnySubscription,
              has_active_subscription: hasActiveSubscription,
              total_subscriptions: filteredSubscriptions.length,
              active_subscriptions: activeSubscriptions.length
            },
            subscriptions: filteredSubscriptions.map(sub => ({
              id: sub.id,
              status: sub.status,
              amount: sub.amount,
              currency: sub.currency,
              current_period_end: sub.current_period_end,
              package: sub.package
            }))
          };
        } catch (error) {
          return {
            customer,
            success: false,
            error: error.message
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total_customers: customers.length,
        customers_with_subscriptions: results.filter(r => r.success && r.subscription_status?.has_subscription).length,
        customers_with_active_subscriptions: results.filter(r => r.success && r.subscription_status?.has_active_subscription).length
      }
    });

  } catch (error) {
    console.error('Error checking multiple customer subscriptions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check customer subscriptions',
      details: error.message
    }, { status: 500 });
  }
}
