# Stripe Payment Integration Setup

This document explains how to set up Stripe payments for the ChangeWorks application.

## Environment Variables Required

### For Local Development
Add these environment variables to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### For Production/Deployment
Make sure to set these environment variables in your deployment platform:

**Vercel:**
- Go to your project settings
- Navigate to "Environment Variables"
- Add each variable with your production Stripe keys

**Netlify:**
- Go to Site settings > Environment variables
- Add each variable

**Other platforms:**
- Set environment variables through your platform's dashboard or CLI

⚠️ **Important:** Use your **live** Stripe keys for production:
- `STRIPE_SECRET_KEY=sk_live_...`
- `STRIPE_PUBLISHABLE_KEY=pk_live_...`

## API Endpoints Created

### 1. Create Payment Intent
**Endpoint:** `POST /api/payments/create-intent`

**Request Body:**
```json
{
  "amount": 100.50,
  "currency": "USD",
  "donor_id": 1,
  "organization_id": 1,
  "description": "Donation to Education Fund"
}
```

**Response:**
```json
{
  "success": true,
  "client_secret": "pi_xxx_secret_xxx",
  "payment_intent_id": "pi_xxx",
  "amount": 100.50,
  "currency": "USD",
  "transaction_id": "pi_xxx_timestamp",
  "message": "Payment intent created successfully"
}
```

### 2. Save Payment Record
**Endpoint:** `POST /api/payments/save`

**Request Body:**
```json
{
  "payment_intent_id": "pi_xxx",
  "amount": 100.50,
  "currency": "USD",
  "donor_id": 1,
  "organization_id": 1,
  "status": "succeeded",
  "payment_method": "stripe"
}
```

### 3. Confirm Payment
**Endpoint:** `POST /api/payments/confirm`

**Request Body:**
```json
{
  "payment_intent_id": "pi_xxx",
  "payment_method_id": "pm_xxx"
}
```

### 4. Get Payment History
**Endpoint:** `GET /api/payments/history/{donor_id}`

**Response:**
```json
{
  "success": true,
  "donor": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "payments": [
    {
      "id": 1,
      "transaction_id": "stripe_pi_xxx_timestamp",
      "amount": 100.50,
      "currency": "USD",
      "status": "completed",
      "payment_method": "stripe",
      "receipt_url": "https://pay.stripe.com/receipts/xxx",
      "transaction_date": "2024-01-15T10:30:00Z",
      "organization": {
        "id": 1,
        "name": "Education Fund"
      }
    }
  ],
  "summary": {
    "total_payments": 5,
    "completed_payments": 4,
    "pending_payments": 1,
    "failed_payments": 0,
    "total_donated": 500.00,
    "currency": "USD"
  }
}
```

### 5. Webhook Handler
**Endpoint:** `POST /api/payments/webhook`

Handles Stripe webhook events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `payment_intent.processing`

## Frontend Integration

Your Flutter app should call these endpoints in this order:

1. **Create Payment Intent**: Call `/api/payments/create-intent` to get the client secret
2. **Confirm Payment**: Use Stripe SDK in Flutter to confirm payment with the client secret
3. **Save Payment Record**: Call `/api/payments/save` to update the database with the final status
4. **Get History**: Call `/api/payments/history/{donor_id}` to show payment history

## Database Schema

The payment records are stored in the `save_tr_record` table with these key fields:

- `trx_id`: Unique transaction identifier
- `trx_amount`: Payment amount
- `trx_method`: Payment method ("stripe")
- `trx_donor_id`: Reference to donor
- `trx_organization_id`: Reference to organization
- `pay_status`: Payment status ("pending", "completed", "failed", "cancelled")
- `trx_details`: JSON string with Stripe-specific details
- `trx_recipt_url`: Stripe receipt URL

## Stripe Webhook Setup

1. In your Stripe Dashboard, go to Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/webhook`
3. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payment_intent.processing`
4. Copy the webhook signing secret to your environment variables

## Security Notes

- All API endpoints validate input using Zod schemas
- Donor and organization IDs are verified against the database
- Stripe webhook signatures are verified for security
- Payment amounts are stored in the smallest currency unit (cents) in Stripe
- Organization balances are automatically updated when payments succeed

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error description",
  "details": "Detailed error information"
}
```

## Testing

Use Stripe's test keys and test card numbers for development:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC
