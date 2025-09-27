# Setting Up Stripe Webhook in Production

## Step 1: Add Webhook Endpoint in Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://app.changeworksfund.org/api/payments/webhook`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed` 
   - `payment_intent.canceled`
   - `payment_intent.processing`
5. Click "Add endpoint"

## Step 2: Copy Webhook Secret

1. Click on your newly created webhook
2. Copy the "Signing secret" (starts with `whsec_`)
3. Add this to your production environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

## Step 3: Test the Webhook

### Option A: Send Test Event from Stripe Dashboard
1. In your webhook settings, click "Send test webhook"
2. Select "payment_intent.succeeded" 
3. Click "Send test webhook"
4. Check the response - should be 200 OK

### Option B: Create Real Payment Intent
1. Use Postman to create payment intent:
   ```
   POST https://app.changeworksfund.org/api/payments/create-intent
   ```
2. Use Stripe test cards to complete payment
3. Webhook will be triggered automatically

## Step 4: Monitor Webhook Activity

Check these locations for webhook logs:
- Stripe Dashboard > Webhooks > Your endpoint > Recent deliveries
- Your hosting platform's logs (Vercel, etc.)
- Database to confirm records were created

## Test Cards for Live Mode Testing
Even in live mode, you can use these test cards:
- `4242424242424242` - Succeeds
- `4000000000000002` - Declined
- `4000000000000069` - Expired card
