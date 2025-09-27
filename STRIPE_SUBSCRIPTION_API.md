# Stripe Subscription API Documentation

This document provides comprehensive documentation for the Stripe subscription APIs in the ChangeWorks application.

## Overview

The subscription system allows donors to set up recurring payments to organizations through various subscription packages. The system integrates with Stripe for payment processing and maintains subscription data in the local database.

## Database Schema

### New Models Added

#### Subscription
- `id`: Primary key
- `stripe_subscription_id`: Unique Stripe subscription ID
- `donor_id`: Reference to donor
- `organization_id`: Reference to organization
- `package_id`: Reference to subscription package
- `status`: Subscription status (ACTIVE, CANCELED, INCOMPLETE, etc.)
- `current_period_start/end`: Current billing period
- `cancel_at_period_end`: Whether to cancel at period end
- `trial_start/end`: Trial period dates
- `amount`: Subscription amount
- `currency`: Currency code
- `interval`: Billing interval (month, year, week, day)
- `interval_count`: Number of intervals

#### SubscriptionTransaction
- `id`: Primary key
- `subscription_id`: Reference to subscription
- `stripe_invoice_id`: Stripe invoice ID
- `amount`: Transaction amount
- `currency`: Currency code
- `status`: Transaction status
- `invoice_url`: PDF invoice URL
- `hosted_invoice_url`: Hosted invoice URL
- `period_start/end`: Billing period

## API Endpoints

### 1. List Subscriptions
**Endpoint:** `GET /api/subscriptions`

**Query Parameters:**
- `donor_id` (optional): Filter by donor ID
- `organization_id` (optional): Filter by organization ID
- `status` (optional): Filter by subscription status

**Response:**
```json
{
  "success": true,
  "subscriptions": [
    {
      "id": 1,
      "stripe_subscription_id": "sub_xxx",
      "donor_id": 1,
      "organization_id": 1,
      "package_id": 1,
      "status": "ACTIVE",
      "current_period_start": "2024-01-01T00:00:00Z",
      "current_period_end": "2024-02-01T00:00:00Z",
      "amount": 29.99,
      "currency": "USD",
      "interval": "month",
      "donor": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "organization": {
        "id": 1,
        "name": "Education Fund",
        "email": "contact@educationfund.org"
      },
      "package": {
        "id": 1,
        "name": "Monthly Supporter",
        "description": "Monthly donation package",
        "price": 29.99,
        "currency": "USD",
        "features": "Monthly newsletter, donor recognition"
      },
      "subscription_transactions": [...]
    }
  ],
  "count": 1
}
```

### 2. Create Subscription
**Endpoint:** `POST /api/subscriptions`

**Request Body:**
```json
{
  "donor_id": 1,
  "organization_id": 1,
  "package_id": 1,
  "payment_method_id": "pm_xxx",
  "trial_period_days": 7
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": 1,
    "stripe_subscription_id": "sub_xxx",
    "status": "INCOMPLETE",
    "donor": {...},
    "organization": {...},
    "package": {...}
  },
  "client_secret": "pi_xxx_secret_xxx",
  "stripe_subscription_id": "sub_xxx",
  "message": "Subscription created successfully"
}
```

### 3. Get Subscription Details
**Endpoint:** `GET /api/subscriptions/{id}`

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": 1,
    "stripe_subscription_id": "sub_xxx",
    "status": "ACTIVE",
    "current_period_start": "2024-01-01T00:00:00Z",
    "current_period_end": "2024-02-01T00:00:00Z",
    "donor": {...},
    "organization": {...},
    "package": {...},
    "subscription_transactions": [...],
    "stripe_data": {
      "id": "sub_xxx",
      "status": "active",
      "current_period_start": 1704067200,
      "current_period_end": 1706745600
    }
  }
}
```

### 4. Update Subscription
**Endpoint:** `PUT /api/subscriptions/{id}`

**Request Body:**
```json
{
  "cancel_at_period_end": true,
  "payment_method_id": "pm_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {...},
  "message": "Subscription updated successfully"
}
```

### 5. Cancel Subscription
**Endpoint:** `DELETE /api/subscriptions/{id}`

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": 1,
    "status": "CANCELED",
    "canceled_at": "2024-01-15T10:30:00Z",
    ...
  },
  "message": "Subscription canceled successfully"
}
```

### 6. Get Subscription Transactions
**Endpoint:** `GET /api/subscriptions/{id}/transactions`

**Query Parameters:**
- `limit` (optional): Number of transactions to return (default: 10)
- `offset` (optional): Number of transactions to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "subscription_id": 1,
      "stripe_invoice_id": "in_xxx",
      "amount": 29.99,
      "currency": "USD",
      "status": "paid",
      "invoice_url": "https://pay.stripe.com/invoice/xxx",
      "period_start": "2024-01-01T00:00:00Z",
      "period_end": "2024-02-01T00:00:00Z",
      "stripe_data": {...}
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 10,
    "offset": 0,
    "has_more": false
  }
}
```

### 7. Get Subscription Invoices
**Endpoint:** `GET /api/subscriptions/{id}/invoices`

**Query Parameters:**
- `limit` (optional): Number of invoices to return (default: 10)
- `status` (optional): Filter by invoice status (paid, open, void, uncollectible)

**Response:**
```json
{
  "success": true,
  "invoices": [
    {
      "id": "in_xxx",
      "amount_paid": 29.99,
      "amount_due": 0,
      "currency": "USD",
      "status": "paid",
      "invoice_pdf": "https://pay.stripe.com/invoice/xxx/pdf",
      "hosted_invoice_url": "https://invoice.stripe.com/i/acct_xxx/xxx",
      "period_start": "2024-01-01T00:00:00Z",
      "period_end": "2024-02-01T00:00:00Z",
      "paid_at": "2024-01-01T10:30:00Z",
      "subscription": {
        "id": 1,
        "donor": {...},
        "organization": {...}
      },
      "database_record": {...}
    }
  ],
  "has_more": false,
  "total_count": 1
}
```

### 8. Get Upcoming Invoice
**Endpoint:** `POST /api/subscriptions/{id}/invoices`

**Response:**
```json
{
  "success": true,
  "upcoming_invoice": {
    "id": "in_xxx",
    "amount_due": 29.99,
    "currency": "USD",
    "period_start": "2024-02-01T00:00:00Z",
    "period_end": "2024-03-01T00:00:00Z",
    "subtotal": 29.99,
    "tax": 0,
    "total": 29.99,
    "lines": [
      {
        "id": "il_xxx",
        "description": "Monthly Supporter",
        "amount": 29.99,
        "currency": "USD",
        "period_start": "2024-02-01T00:00:00Z",
        "period_end": "2024-03-01T00:00:00Z"
      }
    ]
  }
}
```

## Webhook Events

The webhook handler at `/api/payments/webhook` now processes the following subscription events:

### Subscription Events
- `customer.subscription.created`: New subscription created
- `customer.subscription.updated`: Subscription updated
- `customer.subscription.deleted`: Subscription canceled

### Invoice Events
- `invoice.created`: New invoice created
- `invoice.payment_succeeded`: Invoice payment successful
- `invoice.payment_failed`: Invoice payment failed

### Webhook Setup

Add these events to your Stripe webhook endpoint:
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.created`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## Frontend Integration

### Creating a Subscription

1. **Create Subscription**: Call `POST /api/subscriptions` to create subscription
2. **Confirm Payment**: Use Stripe SDK to confirm payment with `client_secret`
3. **Handle Webhooks**: Webhook will update subscription status automatically

### Managing Subscriptions

1. **List Subscriptions**: Call `GET /api/subscriptions?donor_id={id}` to get user's subscriptions
2. **Update Subscription**: Call `PUT /api/subscriptions/{id}` to modify subscription
3. **Cancel Subscription**: Call `DELETE /api/subscriptions/{id}` to cancel immediately

### Example Frontend Flow

```javascript
// Create subscription
const response = await fetch('/api/subscriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    donor_id: 1,
    organization_id: 1,
    package_id: 1,
    payment_method_id: 'pm_xxx'
  })
});

const { client_secret, subscription } = await response.json();

// Confirm payment with Stripe
const { error } = await stripe.confirmCardPayment(client_secret);

if (error) {
  console.error('Payment failed:', error);
} else {
  console.log('Subscription created successfully');
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (validation errors)
- `404`: Resource not found
- `500`: Internal server error
- `503`: Service unavailable (Stripe not configured)

## Security Considerations

1. **Authentication**: Implement proper authentication for all endpoints
2. **Authorization**: Ensure users can only access their own subscriptions
3. **Webhook Security**: Always verify webhook signatures
4. **Data Validation**: All inputs are validated using Zod schemas
5. **Error Handling**: Sensitive information is not exposed in error messages

## Testing

### Test Cards for Subscriptions
- `4242424242424242`: Successful payment
- `4000000000000002`: Declined payment
- `4000000000000069`: Expired card

### Test Scenarios
1. Create subscription with trial period
2. Update payment method
3. Cancel subscription at period end
4. Cancel subscription immediately
5. Handle failed payments
6. Process webhook events

## Migration

To add subscription support to existing installations:

1. **Update Database Schema**:
   ```bash
   npx prisma db push
   ```

2. **Update Webhook Configuration**:
   - Add subscription events to existing webhook endpoint
   - No code changes needed, webhook handler already updated

3. **Frontend Integration**:
   - Update payment flows to support subscriptions
   - Add subscription management UI
   - Implement webhook event handling

## Support

For issues or questions:
1. Check webhook logs in Stripe Dashboard
2. Review application logs for error details
3. Verify database schema is up to date
4. Ensure all environment variables are set correctly
