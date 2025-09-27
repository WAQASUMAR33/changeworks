# Testing Stripe Webhooks in Production

## Method 1: Stripe CLI for Real Webhook Testing

### Step 1: Install Stripe CLI
Download from: https://stripe.com/docs/stripe-cli

### Step 2: Login to Stripe
```bash
stripe login
```

### Step 3: Forward Webhooks to Your Live Site
```bash
stripe listen --forward-to https://app.changeworksfund.org/api/payments/webhook
```

### Step 4: Trigger Test Events
```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed

# Test canceled payment
stripe trigger payment_intent.canceled
```

## Method 2: Stripe Dashboard Webhook Testing

### Step 1: Set Up Webhook Endpoint in Stripe Dashboard
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Set URL: `https://app.changeworksfund.org/api/payments/webhook`
4. Select events:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - payment_intent.canceled
   - payment_intent.processing

### Step 2: Test from Stripe Dashboard
1. Go to your webhook endpoint in Stripe Dashboard
2. Click "Send test webhook"
3. Select event type
4. Click "Send test webhook"

## Method 3: Real Payment Testing

### Step 1: Create Real Payment Intent
```bash
POST https://app.changeworksfund.org/api/payments/create-intent
Content-Type: application/json

{
  "amount": 1.00,
  "currency": "USD",
  "donor_id": 1,
  "organization_id": 1,
  "description": "Live webhook test"
}
```

### Step 2: Complete Payment in Stripe
Use the client_secret from step 1 to complete payment, which will trigger real webhooks.

## Monitoring Webhooks

### Check Webhook Logs in Stripe Dashboard
1. Go to https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. View "Recent deliveries" tab
4. Check response codes and retry attempts

### Check Your Application Logs
- Vercel: Check function logs in Vercel dashboard
- Other platforms: Check your deployment platform's logs

## Expected Webhook Signatures
Real Stripe webhooks include signatures that need verification. Your production webhook endpoint at `/api/payments/webhook` handles this automatically.

## Testing Checklist
- [ ] Webhook endpoint responds with 200 status
- [ ] Database records are created/updated
- [ ] Organization balances are updated correctly
- [ ] Error handling works for failed payments
- [ ] Webhook signatures are verified
- [ ] Logs show successful processing
