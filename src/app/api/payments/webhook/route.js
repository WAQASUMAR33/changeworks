import { NextResponse } from "next/server";
import Stripe from 'stripe';
import { prisma } from "../../../lib/prisma";
import emailService from "../../../lib/email-service";

// Initialize Stripe with proper error handling
let stripe;
let endpointSecret;

try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY environment variable is not set');
  } else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (endpointSecret) {
    endpointSecret = endpointSecret.trim();
  }
  
  if (!endpointSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET environment variable is not set');
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
}

export async function POST(request) {
  try {
    // Check if Stripe is properly initialized
    if (!stripe) {
      console.error('Stripe not initialized - webhook cannot be processed');
      return NextResponse.json({
        error: 'Payment service not available'
      }, { status: 503 });
    }

    if (!endpointSecret) {
      console.error('Webhook secret not configured');
      return NextResponse.json({
        error: 'Webhook configuration missing'
      }, { status: 503 });
    }

    // Use arrayBuffer and Buffer to preserve raw body for signature verification
    const buf = await request.arrayBuffer();
    const body = Buffer.from(buf);
    const sig = request.headers.get('stripe-signature');

    let event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      console.error('Debug Info:');
      console.error('- Endpoint Secret (partial):', endpointSecret ? `...${endpointSecret.slice(-5)}` : 'Missing');
      console.error('- Body Length:', body ? body.length : 'Missing');
      console.error('- Signature Header:', sig);
      return NextResponse.json({
        error: 'Webhook signature verification failed',
        details: err.message
      }, { status: 400 });
    }

    // Handle the event
    console.log(`🔍 Webhook received: ${event.type}`);
    console.log(`🔍 Event ID: ${event.id}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;
      case 'payment_intent.processing':
        await handlePaymentIntentProcessing(event.data.object);
        break;
      // Subscription events
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'invoice.created':
        await handleInvoiceCreated(event.data.object);
        break;
      default:
        // quietly ignore unhandled events
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({
      error: 'Webhook handler failed'
    }, { status: 500 });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const donorId = parseInt(paymentIntent.metadata.donor_id);
    const organizationId = parseInt(paymentIntent.metadata.organization_id);
    const fullAmount = paymentIntent.amount_received / 100; // Convert from cents
    const organizationAmount = fullAmount * 0.9; // 90% goes to organization (10% platform commission)

    const updateTrRecord = prisma.saveTrRecord.updateMany({
      where: {
        trx_details: {
          contains: paymentIntent.id
        }
      },
      data: {
        pay_status: 'completed',
        trx_amount: organizationAmount, // Store 90% of the amount
        trx_recipt_url: paymentIntent.receipt_url,
        trx_details: JSON.stringify({
          payment_intent_id: paymentIntent.id,
          stripe_payment_method: paymentIntent.payment_method,
          stripe_status: paymentIntent.status,
          stripe_amount_received: paymentIntent.amount_received,
          full_amount: fullAmount,
          organization_amount: organizationAmount,
          stripe_created: new Date(paymentIntent.created * 1000),
          webhook_processed_at: new Date()
        }),
        updated_at: new Date()
      }
    });

    const updateOrgBalance = prisma.organization.update({
      where: { id: organizationId },
      data: {
        balance: {
          increment: organizationAmount
        }
      }
    });

    await Promise.all([updateTrRecord, updateOrgBalance]);

    // Handle one-time donation specific logic (create transaction record if missing and send email)
    if (paymentIntent.metadata?.transaction_type === 'one_time') {
      try {
        // Check if transaction already exists
        const existingTrx = await prisma.donorTransaction.findUnique({
          where: { trnx_id: paymentIntent.id }
        });

        let transactionCreated = false;

        if (!existingTrx) {
          console.log(`Creating missing DonorTransaction for one-time payment ${paymentIntent.id}`);
          
          const paymentMethod = typeof paymentIntent.payment_method === 'string' 
            ? paymentIntent.payment_method 
            : (paymentIntent.payment_method?.id || 'card');

          await prisma.donorTransaction.create({
            data: {
              donor_id: donorId,
              organization_id: organizationId,
              amount: organizationAmount,
              currency: 'usd',
              transaction_type: 'one_time',
              status: 'completed',
              trnx_id: paymentIntent.id,
              payment_method: paymentMethod,
              receipt_url: paymentIntent.receipt_url,
            }
          });
          transactionCreated = true;
        }
          
        // Send Thank You Email ONLY if we created the transaction (to avoid duplicates with confirm API)
        // OR if we want to ensure it sends even if confirm API failed to send but created transaction? 
        // For now, we assume if transaction exists, email was handled.
        if (transactionCreated) {
            // Fetch donor and organization details
            const [donor, organization] = await Promise.all([
          prisma.donor.findUnique({ 
            where: { id: donorId }, 
            select: { 
              name: true, 
              email: true 
            } 
          }),
          prisma.organization.findUnique({ 
            where: { id: organizationId }, 
            select: { 
              name: true, 
              email: true,
              firstName: true,
              lastName: true,
              title: true,
              imageUrl: true,
              ein: true,
              address: true,
              city: true,
              state: true,
              postalCode: true,
              phone: true
            } 
          })
        ]);

        if (donor && organization) {
          const dashboardLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.changeworksfund.org'}/donor/dashboard?donor_id=${donorId}`;
          
          let paymentMethodText = 'Credit Card';
          // Try to extract card details from payment intent if available
          if (paymentIntent.payment_method_details?.card?.last4) {
            paymentMethodText = `Card ending in ${paymentIntent.payment_method_details.card.last4}`;
          } else if (typeof paymentIntent.payment_method === 'string') {
              // If we only have ID, we can't easily get last4 without another API call, so default to generic
              paymentMethodText = 'Credit Card';
          }

          console.log(`📧 [Webhook] Sending one-time donation email to ${donor.email}`);
          try {
            const emailResult = await emailService.sendOneTimeDonationEmail({
              donor,
              organization,
              dashboardLink,
              amount: fullAmount.toFixed(2),
              donationDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
              transactionId: paymentIntent.id,
              paymentMethod: paymentMethodText,
              campaignName: paymentIntent.metadata.campaign_name || 'General Donation'
            });
            console.log(`📧 [Webhook] Email result: ${JSON.stringify(emailResult)}`);
          } catch (emailErr) {
            console.error(`❌ [Webhook] Failed to send email: ${emailErr.message}`);
          }
        } else {
            console.warn(`⚠️ [Webhook] Missing donor/org data for email. Donor: ${!!donor}, Org: ${!!organization}`);
        }
      }
      } catch (err) {
        console.error('Error handling one-time donation in webhook:', err);
      }
    }

    // Send monthly impact email to donor
    // We await this to ensure it sends before function exit, but failures are caught
    // Only send if NOT one_time transaction (one-time handled in confirm-and-record or above block)
    if (paymentIntent.metadata?.transaction_type !== 'one_time') {
      try {
        await sendMonthlyImpactEmail(donorId, organizationId, fullAmount);
      } catch (emailError) {
        console.error('Failed to send monthly impact email:', emailError);
      }
    }

  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  try {
    // Update transaction record
    await prisma.saveTrRecord.updateMany({
      where: {
        trx_details: {
          contains: paymentIntent.id
        }
      },
      data: {
        pay_status: 'failed',
        trx_details: JSON.stringify({
          payment_intent_id: paymentIntent.id,
          stripe_status: paymentIntent.status,
          stripe_last_payment_error: paymentIntent.last_payment_error,
          webhook_processed_at: new Date()
        }),
        updated_at: new Date()
      }
    });

    // Send card failure alert email if donor and organization info available
    try {
      const donorId = parseInt(paymentIntent.metadata.donor_id);
      const organizationId = parseInt(paymentIntent.metadata.organization_id);

      if (donorId && organizationId) {
        await sendCardFailureAlertEmail(donorId, organizationId);
      }
    } catch (emailError) {
      console.error('Failed to send card failure alert email:', emailError);
    }

  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent) {
  try {
    // Update transaction record
    await prisma.saveTrRecord.updateMany({
      where: {
        trx_details: {
          contains: paymentIntent.id
        }
      },
      data: {
        pay_status: 'cancelled',
        trx_details: JSON.stringify({
          payment_intent_id: paymentIntent.id,
          stripe_status: paymentIntent.status,
          webhook_processed_at: new Date()
        }),
        updated_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error handling payment_intent.canceled:', error);
  }
}

async function handlePaymentIntentProcessing(paymentIntent) {
  try {
    // Update transaction record
    await prisma.saveTrRecord.updateMany({
      where: {
        trx_details: {
          contains: paymentIntent.id
        }
      },
      data: {
        pay_status: 'pending',
        trx_details: JSON.stringify({
          payment_intent_id: paymentIntent.id,
          stripe_status: paymentIntent.status,
          webhook_processed_at: new Date()
        }),
        updated_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error handling payment_intent.processing:', error);
  }
}

// Subscription event handlers
async function handleSubscriptionCreated(subscription) {
  try {
    const donorId = parseInt(subscription.metadata.donor_id);
    const organizationId = parseInt(subscription.metadata.organization_id);
    const packageId = parseInt(subscription.metadata.package_id);
    const productId = subscription.metadata.product_id;
    const priceId = subscription.metadata.price_id;

    // Get package details for amount and currency
    let packageData;
    if (packageId) {
      packageData = await prisma.package.findUnique({
        where: { id: packageId },
        select: { price: true, currency: true }
      });
    }

    // If no package found, get amount from Stripe price
    let amount = 0;
    let currency = 'usd';
    let interval = 'month';
    let intervalCount = 1;

    if (packageData) {
      amount = packageData.price;
      currency = packageData.currency;
    } else if (priceId) {
      try {
        const stripePrice = await stripe.prices.retrieve(priceId);
        amount = stripePrice.unit_amount / 100; // Convert from cents
        currency = stripePrice.currency;
        interval = stripePrice.recurring?.interval || 'month';
        intervalCount = stripePrice.recurring?.interval_count || 1;
      } catch (stripeError) {
        console.error('Failed to retrieve Stripe price:', stripeError);
        // Use default values
        amount = 0;
        currency = 'usd';
      }
    }

    if (!packageData && !priceId) {
      console.error(`No package or price found for subscription ${subscription.id}`);
      return;
    }

    // Create or update subscription record
    const subscriptionData = {
      stripe_subscription_id: subscription.id,
      donor_id: donorId,
      organization_id: organizationId,
      package_id: packageId || 1, // Default package ID if not provided
      status: subscription.status.toUpperCase(),
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      amount: amount,
      currency: currency,
      interval: interval,
      interval_count: intervalCount,
      metadata: JSON.stringify({
        stripe_customer_id: subscription.customer,
        stripe_product_id: productId,
        stripe_price_id: priceId,
        created_via: 'webhook',
        webhook_processed_at: new Date()
      })
    };

    // Use upsert to create or update
    await prisma.subscription.upsert({
      where: {
        stripe_subscription_id: subscription.id
      },
      update: {
        status: subscription.status.toUpperCase(),
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        updated_at: new Date()
      },
      create: subscriptionData
    });

  } catch (error) {
    console.error('Error handling customer.subscription.created:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    // Determine the correct status based on Stripe data
    let status = subscription.status.toUpperCase();

    // If subscription is canceled at period end, set appropriate status
    if (subscription.cancel_at_period_end && subscription.status === 'active') {
      status = 'CANCELED_AT_PERIOD_END';
    }

    // If subscription is canceled, ensure status is CANCELED
    if (subscription.status === 'canceled') {
      status = 'CANCELED';
    }

    // Update subscription record
    await prisma.subscription.updateMany({
      where: {
        stripe_subscription_id: subscription.id
      },
      data: {
        status: status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        updated_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error handling customer.subscription.updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    // Update subscription record
    await prisma.subscription.updateMany({
      where: {
        stripe_subscription_id: subscription.id
      },
      data: {
        status: 'CANCELED',
        canceled_at: new Date(),
        updated_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error handling customer.subscription.deleted:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  try {
    if (!invoice.subscription) {
      return;
    }

    // Find subscription in database
    const subscription = await prisma.subscription.findFirst({
      where: {
        stripe_subscription_id: invoice.subscription
      },
      include: {
        donor: true,
        organization: true
      }
    });

    if (!subscription) {
      console.log(`Subscription not found for invoice ${invoice.id}`);
      return;
    }

    const fullAmount = invoice.amount_paid / 100; // Convert from cents
    const organizationAmount = fullAmount * 0.9; // 90% goes to organization (10% platform fee)

    // Create or update subscription transaction record with 90% amount
    const upsertSubTrx = prisma.subscriptionTransaction.upsert({
      where: {
        stripe_invoice_id: invoice.id
      },
      update: {
        status: 'paid',
        amount: organizationAmount, // Store 90% of the amount
        invoice_url: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        pdf_url: invoice.invoice_pdf,
        updated_at: new Date()
      },
      create: {
        subscription_id: subscription.id,
        stripe_invoice_id: invoice.id,
        amount: organizationAmount, // Store 90% of the amount
        currency: invoice.currency,
        status: 'paid',
        invoice_url: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        pdf_url: invoice.invoice_pdf,
        period_start: new Date(invoice.period_start * 1000),
        period_end: new Date(invoice.period_end * 1000)
      }
    });

    // Update organization balance with 90% of the amount
    const updateOrgBalance = prisma.organization.update({
      where: { id: subscription.organization_id },
      data: {
        balance: {
          increment: organizationAmount
        }
      }
    });

    // Create transaction record and donor transaction record
    const createTrRecords = (async () => {
      // Create transaction record in SaveTrRecord table for recurring payment with 90% amount
      const transactionRecord = await prisma.saveTrRecord.create({
        data: {
          trx_id: `sub_${invoice.subscription}_${invoice.id}_${Date.now()}`,
          trx_date: new Date(),
          trx_amount: organizationAmount, // Store 90% of the amount
          trx_method: 'stripe_subscription_recurring',
          trx_donor_id: subscription.donor_id,
          trx_organization_id: subscription.organization_id,
          pay_status: 'completed',
          trx_recipt_url: invoice.hosted_invoice_url || null,
          trx_details: JSON.stringify({
            subscription_id: invoice.subscription,
            invoice_id: invoice.id,
            payment_intent_id: invoice.payment_intent,
            stripe_customer_id: invoice.customer,
            subscription_status: 'active',
            full_amount: fullAmount,
            organization_amount: organizationAmount,
            platform_fee: fullAmount * 0.1,
            period_start: new Date(invoice.period_start * 1000),
            period_end: new Date(invoice.period_end * 1000),
            created_via: 'webhook_recurring_payment',
            created_at: new Date()
          })
        }
      });

      // Create donor transaction record for recurring payment with 90% amount
      await prisma.donorTransaction.create({
        data: {
          donor_id: subscription.donor_id,
          organization_id: subscription.organization_id,
          amount: organizationAmount, // Store 90% of the amount
          currency: invoice.currency,
          transaction_type: 'subscription_recurring',
          status: 'completed',
          stripe_subscription_id: invoice.subscription,
          stripe_invoice_id: invoice.id,
          stripe_payment_intent_id: invoice.payment_intent,
          description: `Monthly subscription payment: ${invoice.subscription}`,
          metadata: JSON.stringify({
            subscription_id: subscription.id,
            save_tr_record_id: transactionRecord.id,
            invoice_id: invoice.id,
            full_amount: fullAmount,
            organization_amount: organizationAmount,
            platform_fee: fullAmount * 0.1,
            period_start: new Date(invoice.period_start * 1000),
            period_end: new Date(invoice.period_end * 1000),
            created_via: 'webhook_recurring_payment'
          })
        }
      });
    })();

    await Promise.all([upsertSubTrx, updateOrgBalance, createTrRecords]);

    // Send monthly impact email to donor with full amount
    try {
      await sendMonthlyImpactEmail(subscription.donor_id, subscription.organization_id, fullAmount);

      // Send recurring payment confirmation email
      const dashboardLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://changeworkscollective.org'}/donor/dashboard`;
      
      // Calculate next payment date (approximated from current period end)
      let nextPaymentDate = 'Next month';
      if (invoice.lines?.data?.[0]?.period?.end) {
        nextPaymentDate = new Date(invoice.lines.data[0].period.end * 1000).toLocaleDateString();
      }

      await emailService.sendRecurringPaymentEmail({
        donor: subscription.donor,
        organization: subscription.organization,
        dashboardLink: dashboardLink,
        amount: fullAmount.toFixed(2),
        paymentDate: new Date().toLocaleDateString(),
        nextPaymentDate: nextPaymentDate
      });
    } catch (emailError) {
      console.error('Failed to send recurring payment emails:', emailError);
    }

  } catch (error) {
    console.error('Error handling invoice.payment_succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    if (!invoice.subscription) {
      return;
    }

    // Find subscription in database
    const subscription = await prisma.subscription.findFirst({
      where: {
        stripe_subscription_id: invoice.subscription
      }
    });

    if (!subscription) {
      console.log(`Subscription not found for invoice ${invoice.id}`);
      return;
    }

    // Create or update subscription transaction record
    await prisma.subscriptionTransaction.upsert({
      where: {
        stripe_invoice_id: invoice.id
      },
      update: {
        status: 'failed',
        updated_at: new Date()
      },
      create: {
        subscription_id: subscription.id,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_due / 100, // Convert from cents
        currency: invoice.currency,
        status: 'failed',
        period_start: new Date(invoice.period_start * 1000),
        period_end: new Date(invoice.period_end * 1000)
      }
    });

    // Send card failure alert email for subscription payment failure
    try {
      await sendCardFailureAlertEmail(subscription.donor_id, subscription.organization_id);
    } catch (emailError) {
      console.error('Failed to send card failure alert email:', emailError);
    }

  } catch (error) {
    console.error('Error handling invoice.payment_failed:', error);
  }
}

async function handleInvoiceCreated(invoice) {
  try {
    if (!invoice.subscription) {
      return;
    }

    // Find subscription in database
    const subscription = await prisma.subscription.findFirst({
      where: {
        stripe_subscription_id: invoice.subscription
      }
    });

    if (!subscription) {
      console.log(`Subscription not found for invoice ${invoice.id}`);
      return;
    }

    // Create subscription transaction record
    await prisma.subscriptionTransaction.upsert({
      where: {
        stripe_invoice_id: invoice.id
      },
      update: {
        status: invoice.status,
        invoice_url: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        pdf_url: invoice.invoice_pdf,
        updated_at: new Date()
      },
      create: {
        subscription_id: subscription.id,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_due / 100, // Convert from cents
        currency: invoice.currency,
        status: invoice.status,
        invoice_url: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
        pdf_url: invoice.invoice_pdf,
        period_start: new Date(invoice.period_start * 1000),
        period_end: new Date(invoice.period_end * 1000)
      }
    });

  } catch (error) {
    console.error('Error handling invoice.created:', error);
  }
}

// Helper function to send monthly impact email
async function sendMonthlyImpactEmail(donorId, organizationId, amount) {
  try {
    // Get current month name
    const currentDate = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[currentDate.getMonth()];

    // Fetch donor and organization information
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
      return;
    }

    // Generate dashboard link
    const dashboardLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.changeworksfund.org'}/donor/dashboard?donor_id=${donor.id}`;

    // Send monthly impact email
    const emailResult = await emailService.sendMonthlyImpactEmail({
      donor: {
        name: donor.name,
        email: donor.email
      },
      organization: organization,
      dashboardLink: dashboardLink,
      month: currentMonth,
      totalAmount: amount.toFixed(2)
    });

    if (!emailResult.success) {
      console.error(`❌ Failed to send monthly impact email to ${donor.email}:`, emailResult.error);
    }

  } catch (error) {
    console.error('Error sending monthly impact email:', error);
  }
}

// Helper function to send card failure alert email
async function sendCardFailureAlertEmail(donorId, organizationId) {
  try {
    // Fetch donor and organization information
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
      return;
    }

    // Generate dashboard link
    const dashboardLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.changeworksfund.org'}/donor/dashboard?donor_id=${donor.id}`;

    // Send card failure alert email
    const emailResult = await emailService.sendCardFailureAlertEmail({
      donor: {
        name: donor.name,
        email: donor.email
      },
      organization: organization,
      dashboardLink: dashboardLink
    });

    if (!emailResult.success) {
      console.error(`❌ Failed to send card failure alert email to ${donor.email}:`, emailResult.error);
    }

  } catch (error) {
    console.error('Error sending card failure alert email:', error);
  }
}
