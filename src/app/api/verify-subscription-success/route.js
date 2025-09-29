import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/subscriptions/verify-success - Verify checkout session and create database record
export async function POST(request) {
  try {
    const body = await request.json();
    const { session_id, donor_id, organization_id } = body;

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    let checkoutSession;
    try {
      checkoutSession = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['subscription', 'customer', 'line_items']
      });
    } catch (stripeError) {
      console.error('Error retrieving checkout session:', stripeError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid session ID or session not found',
          details: stripeError.message 
        },
        { status: 404 }
      );
    }

    // Check if payment was successful
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment not completed',
          payment_status: checkoutSession.payment_status 
        },
        { status: 400 }
      );
    }

    // Check if subscription was created
    if (!checkoutSession.subscription) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No subscription found in checkout session' 
        },
        { status: 400 }
      );
    }

    // Get subscription details from Stripe
    const stripeSubscription = checkoutSession.subscription;
    const customer = checkoutSession.customer;
    const lineItems = checkoutSession.line_items?.data || [];

    // Use provided donor_id and organization_id, or fall back to metadata
    const donorId = donor_id || parseInt(checkoutSession.metadata?.donor_id);
    const organizationId = organization_id || parseInt(checkoutSession.metadata?.organization_id);
    const packageId = parseInt(checkoutSession.metadata?.package_id);

    if (!donorId || !organizationId || !packageId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required donor_id, organization_id, or package_id' 
        },
        { status: 400 }
      );
    }

    // Get package details
    const packageData = await prisma.package.findUnique({
      where: { id: packageId }
    });

    if (!packageData) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    // Get donor and organization details
    const [donor, organization] = await Promise.all([
      prisma.donor.findUnique({
        where: { id: donorId },
        select: { id: true, name: true, email: true }
      }),
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true, email: true }
      })
    ]);

    if (!donor || !organization) {
      return NextResponse.json(
        { success: false, error: 'Donor or organization not found' },
        { status: 404 }
      );
    }

    // Check if subscription already exists in database
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        stripe_subscription_id: stripeSubscription.id
      }
    });

    let subscription;

    if (existingSubscription) {
      // Update existing subscription with proper date validation
      const createValidDate = (timestamp) => {
        if (!timestamp || timestamp === 0) return null;
        const date = new Date(timestamp * 1000);
        return isNaN(date.getTime()) ? null : date;
      };

      subscription = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: stripeSubscription.status.toUpperCase(),
          current_period_start: createValidDate(stripeSubscription.current_period_start) || existingSubscription.current_period_start,
          current_period_end: createValidDate(stripeSubscription.current_period_end) || existingSubscription.current_period_end,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
          canceled_at: createValidDate(stripeSubscription.canceled_at),
          trial_start: createValidDate(stripeSubscription.trial_start),
          trial_end: createValidDate(stripeSubscription.trial_end),
          updated_at: new Date()
        },
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
        }
      });

      console.log(`✅ Updated existing subscription ${stripeSubscription.id} in database`);
    } else {
      // Create new subscription record with proper date validation
      const createValidDate = (timestamp) => {
        if (!timestamp || timestamp === 0) return null;
        const date = new Date(timestamp * 1000);
        return isNaN(date.getTime()) ? null : date;
      };

      const subscriptionData = {
        stripe_subscription_id: stripeSubscription.id,
        donor_id: donorId,
        organization_id: organizationId,
        package_id: packageId,
        status: stripeSubscription.status.toUpperCase(),
        current_period_start: createValidDate(stripeSubscription.current_period_start) || new Date(),
        current_period_end: createValidDate(stripeSubscription.current_period_end) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        cancel_at_period_end: stripeSubscription.cancel_at_period_end || false,
        canceled_at: createValidDate(stripeSubscription.canceled_at),
        trial_start: createValidDate(stripeSubscription.trial_start),
        trial_end: createValidDate(stripeSubscription.trial_end),
        amount: packageData.price,
        currency: packageData.currency,
        interval: 'month', // Default to monthly
        interval_count: 1,
        metadata: JSON.stringify({
          stripe_customer_id: customer.id,
          checkout_session_id: session_id,
          created_via: 'success_page_verification',
          verified_at: new Date()
        })
      };

      subscription = await prisma.subscription.create({
        data: subscriptionData,
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
        }
      });

      console.log(`✅ Created new subscription ${stripeSubscription.id} in database with ID: ${subscription.id}`);
    }

    return NextResponse.json({
      success: true,
      subscription,
      checkout_session: {
        id: checkoutSession.id,
        payment_status: checkoutSession.payment_status,
        customer_email: checkoutSession.customer_details?.email,
        amount_total: checkoutSession.amount_total,
        currency: checkoutSession.currency
      },
      stripe_subscription: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000)
      },
      message: 'Subscription verified and database record created successfully'
    });

  } catch (error) {
    console.error('Error verifying subscription success:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to verify subscription', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
