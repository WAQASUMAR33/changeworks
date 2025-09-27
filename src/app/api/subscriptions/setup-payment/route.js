import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/subscriptions/setup-payment - Setup payment for subscription
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      donor_id,
      organization_id,
      package_id,
      customer_email,
      customer_name,
      return_url
    } = body;

    // Validate required fields
    if (!donor_id || !organization_id || !package_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: donor_id, organization_id, package_id' },
        { status: 400 }
      );
    }

    // Get package details
    const packageData = await prisma.package.findUnique({
      where: { id: package_id }
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
        where: { id: donor_id },
        select: { id: true, name: true, email: true }
      }),
      prisma.organization.findUnique({
        where: { id: organization_id },
        select: { id: true, name: true, email: true }
      })
    ]);

    if (!donor || !organization) {
      return NextResponse.json(
        { success: false, error: 'Donor or organization not found' },
        { status: 404 }
      );
    }

    // Create or retrieve Stripe customer
    let customer;
    try {
      const existingCustomers = await stripe.customers.list({
        email: donor.email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: donor.email,
          name: donor.name,
          metadata: {
            donor_id: donor_id.toString(),
            organization_id: organization_id.toString()
          }
        });
      }
    } catch (stripeError) {
      console.error('Stripe customer creation error:', stripeError);
      return NextResponse.json(
        { success: false, error: 'Failed to create Stripe customer' },
        { status: 500 }
      );
    }

    // Create setup intent for payment method collection
    let setupIntent;
    try {
      setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          donor_id: donor_id.toString(),
          organization_id: organization_id.toString(),
          package_id: package_id.toString()
        }
      });
    } catch (stripeError) {
      console.error('Setup intent creation error:', stripeError);
      return NextResponse.json(
        { success: false, error: 'Failed to create setup intent' },
        { status: 500 }
      );
    }

    // Create checkout session for subscription
    let checkoutSession;
    try {
      const sessionData = {
        customer: customer.id,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price_data: {
            currency: packageData.currency.toLowerCase(),
            product_data: {
              name: packageData.name,
              description: packageData.description,
            },
            unit_amount: Math.round(packageData.price * 100), // Convert to cents
            recurring: {
              interval: 'month', // Default to monthly
            },
          },
          quantity: 1,
        }],
        success_url: return_url || `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: return_url || `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/cancel`,
        metadata: {
          donor_id: donor_id.toString(),
          organization_id: organization_id.toString(),
          package_id: package_id.toString()
        },
        subscription_data: {
          metadata: {
            donor_id: donor_id.toString(),
            organization_id: organization_id.toString(),
            package_id: package_id.toString()
          }
        }
      };

      checkoutSession = await stripe.checkout.sessions.create(sessionData);
    } catch (stripeError) {
      console.error('Checkout session creation error:', stripeError);
      return NextResponse.json(
        { success: false, error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      setup_intent: {
        id: setupIntent.id,
        client_secret: setupIntent.client_secret,
        status: setupIntent.status
      },
      checkout_session: {
        id: checkoutSession.id,
        url: checkoutSession.url
      },
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name
      },
      package: {
        id: packageData.id,
        name: packageData.name,
        price: packageData.price,
        currency: packageData.currency
      },
      message: 'Payment setup created successfully'
    });

  } catch (error) {
    console.error('Error setting up subscription payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to setup subscription payment' },
      { status: 500 }
    );
  }
}
