import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/test/create-test-subscription - Create a test subscription with test payment method
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      donor_id,
      organization_id,
      package_id,
      customer_email,
      customer_name,
      test_card = "4242424242424242"
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
          email: customer_email || donor.email,
          name: customer_name || donor.name,
          metadata: {
            donor_id: donor_id.toString(),
            organization_id: organization_id.toString()
          }
        });
      }
    } catch (stripeError) {
      console.error('Stripe customer creation error:', stripeError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create Stripe customer',
          details: {
            type: stripeError.type,
            code: stripeError.code,
            message: stripeError.message,
            param: stripeError.param
          }
        },
        { status: 500 }
      );
    }

    // Create a test payment method using Stripe's test approach
    // We'll create a payment method using Stripe's test card data
    let paymentMethod;
    try {
      // Create a payment method using Stripe's test card
      paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: test_card,
          exp_month: 12,
          exp_year: 2025,
          cvc: '123',
        },
      });

      // Attach the payment method to the customer
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customer.id,
      });

      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });

    } catch (stripeError) {
      console.error('Payment method creation error:', stripeError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create payment method',
          details: {
            type: stripeError.type,
            code: stripeError.code,
            message: stripeError.message,
            param: stripeError.param
          }
        },
        { status: 500 }
      );
    }

    // Create subscription directly
    let stripeSubscription;
    try {
      const subscriptionData = {
        customer: customer.id,
        items: [{
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
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          donor_id: donor_id.toString(),
          organization_id: organization_id.toString(),
          package_id: package_id.toString()
        }
      };

      stripeSubscription = await stripe.subscriptions.create(subscriptionData);

      // Confirm the payment intent if it exists and is required
      if (stripeSubscription.latest_invoice && stripeSubscription.latest_invoice.payment_intent) {
        const paymentIntent = stripeSubscription.latest_invoice.payment_intent;
        if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_confirmation') {
          // In a real scenario, this would involve client-side confirmation
          // For this API, we assume the payment method is valid and can be confirmed
          await stripe.paymentIntents.confirm(paymentIntent.id, {
            payment_method: paymentMethod.id,
          });
        }
      }

    } catch (stripeError) {
      console.error('Stripe subscription creation error:', stripeError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create Stripe subscription',
          details: {
            type: stripeError.type,
            code: stripeError.code,
            message: stripeError.message,
            param: stripeError.param
          }
        },
        { status: 500 }
      );
    }

    // Save subscription to database
    const subscription = await prisma.subscription.create({
      data: {
        stripe_subscription_id: stripeSubscription.id,
        donor_id,
        organization_id,
        package_id,
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
          stripe_customer_id: customer.id,
          payment_method_id: paymentMethod.id,
          created_via: 'test_api'
        })
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

    return NextResponse.json({
      success: true,
      subscription,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name
      },
      payment_method: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        }
      },
      payment: {
        status: stripeSubscription.latest_invoice?.payment_intent?.status || 'unknown',
        amount: stripeSubscription.latest_invoice?.payment_intent?.amount || 0,
        currency: stripeSubscription.latest_invoice?.payment_intent?.currency || 'usd'
      },
      message: 'Test subscription created successfully with test payment method'
    });

  } catch (error) {
    console.error('Error creating test subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create test subscription', details: error },
      { status: 500 }
    );
  }
}
