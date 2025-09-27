# Stripe Subscription API - Complete Documentation

## Overview

This comprehensive Stripe subscription API system provides complete recurring payment functionality including subscription creation, management, cancellation, and transaction tracking. The system integrates with Stripe for payment processing and maintains local database records for subscription management.

## 🚀 Features

- ✅ **Create Subscriptions** - Set up recurring payments with Stripe
- ✅ **Manage Subscriptions** - Update payment methods, quantities, reactivate
- ✅ **Cancel Subscriptions** - Cancel immediately or at period end
- ✅ **List Subscriptions** - Get all subscriptions with filtering and pagination
- ✅ **Transaction Tracking** - Track all subscription payments and invoices
- ✅ **Webhook Integration** - Automatic status updates from Stripe events
- ✅ **Payment Setup** - Secure payment method collection
- ✅ **Customer Management** - Automatic Stripe customer creation

## 📁 API Endpoints

### 1. List Subscriptions
**GET** `/api/subscriptions`

**Query Parameters:**
- `donor_id` (optional) - Filter by donor ID
- `organization_id` (optional) - Filter by organization ID
- `status` (optional) - Filter by subscription status
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "subscriptions": [
    {
      "id": 1,
      "stripe_subscription_id": "sub_1234567890",
      "status": "ACTIVE",
      "current_period_start": "2025-01-01T00:00:00.000Z",
      "current_period_end": "2025-02-01T00:00:00.000Z",
      "cancel_at_period_end": false,
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
        "name": "Corpulate",
        "email": "business@corpulate.com"
      },
      "package": {
        "id": 1,
        "name": "Premium Plan",
        "description": "Premium subscription plan",
        "price": 29.99,
        "currency": "USD",
        "features": "Advanced features included"
      },
      "subscription_transactions": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 2. Create Subscription
**POST** `/api/subscriptions`

**Request Body:**
```json
{
  "donor_id": 1,
  "organization_id": 1,
  "package_id": 1,
  "payment_method_id": "pm_1234567890",
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "trial_period_days": 7
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": 1,
    "stripe_subscription_id": "sub_1234567890",
    "status": "INCOMPLETE",
    "donor": {...},
    "organization": {...},
    "package": {...}
  },
  "client_secret": "pi_1234567890_secret_abc123",
  "stripe_subscription_id": "sub_1234567890",
  "message": "Subscription created successfully. Complete payment to activate."
}
```

### 3. Get Specific Subscription
**GET** `/api/subscriptions/[id]`

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": 1,
    "stripe_subscription_id": "sub_1234567890",
    "status": "ACTIVE",
    "current_period_start": "2025-01-01T00:00:00.000Z",
    "current_period_end": "2025-02-01T00:00:00.000Z",
    "cancel_at_period_end": false,
    "amount": 29.99,
    "currency": "USD",
    "interval": "month",
    "donor": {...},
    "organization": {...},
    "package": {...},
    "subscription_transactions": [...],
    "stripe_data": {...}
  }
}
```

### 4. Update Subscription
**PUT** `/api/subscriptions/[id]`

**Update Payment Method:**
```json
{
  "action": "update_payment_method",
  "payment_method_id": "pm_new1234567890"
}
```

**Update Quantity:**
```json
{
  "action": "update_quantity",
  "quantity": 2
}
```

**Reactivate Subscription:**
```json
{
  "action": "reactivate"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {...},
  "stripe_response": {
    "message": "Payment method updated successfully"
  },
  "message": "Subscription updated successfully"
}
```

### 5. Cancel Subscription
**DELETE** `/api/subscriptions/[id]`

**Query Parameters:**
- `immediate` (optional) - Set to `true` to cancel immediately, `false` to cancel at period end

**Response:**
```json
{
  "success": true,
  "subscription": {...},
  "stripe_response": {
    "message": "Subscription will be canceled at the end of the current period"
  },
  "message": "Subscription scheduled for cancellation"
}
```

### 6. Get Subscription Transactions
**GET** `/api/subscriptions/[id]/transactions`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "subscription_id": 1,
      "stripe_invoice_id": "in_1234567890",
      "amount": 29.99,
      "currency": "USD",
      "status": "paid",
      "invoice_url": "https://invoice.stripe.com/i/acct_123/in_1234567890",
      "hosted_invoice_url": "https://invoice.stripe.com/i/acct_123/in_1234567890",
      "pdf_url": "https://invoice.stripe.com/i/acct_123/in_1234567890.pdf",
      "period_start": "2025-01-01T00:00:00.000Z",
      "period_end": "2025-02-01T00:00:00.000Z",
      "stripe_invoice": {
        "id": "in_1234567890",
        "number": "1234-0001",
        "status": "paid",
        "paid": true,
        "amount_paid": 2999,
        "amount_due": 0,
        "currency": "usd",
        "created": "2025-01-01T00:00:00.000Z",
        "due_date": null,
        "hosted_invoice_url": "https://invoice.stripe.com/i/acct_123/in_1234567890",
        "invoice_pdf": "https://invoice.stripe.com/i/acct_123/in_1234567890.pdf",
        "payment_intent": "pi_1234567890"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

### 7. Setup Payment for Subscription
**POST** `/api/subscriptions/setup-payment`

**Request Body:**
```json
{
  "donor_id": 1,
  "organization_id": 1,
  "package_id": 1,
  "customer_email": "john@example.com",
  "customer_name": "John Doe",
  "return_url": "https://yourapp.com/subscription/success"
}
```

**Response:**
```json
{
  "success": true,
  "setup_intent": {
    "id": "seti_1234567890",
    "client_secret": "seti_1234567890_secret_abc123",
    "status": "requires_payment_method"
  },
  "checkout_session": {
    "id": "cs_1234567890",
    "url": "https://checkout.stripe.com/pay/cs_1234567890"
  },
  "customer": {
    "id": "cus_1234567890",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "package": {
    "id": 1,
    "name": "Premium Plan",
    "price": 29.99,
    "currency": "USD"
  },
  "message": "Payment setup created successfully"
}
```

## 🔄 Webhook Events

The system automatically handles the following Stripe webhook events:

### Subscription Events
- `customer.subscription.created` - New subscription created
- `customer.subscription.updated` - Subscription status/plan updated
- `customer.subscription.deleted` - Subscription canceled

### Invoice Events
- `invoice.created` - New invoice generated
- `invoice.payment_succeeded` - Subscription payment successful
- `invoice.payment_failed` - Subscription payment failed

### Payment Events
- `payment_intent.succeeded` - One-time payment successful
- `payment_intent.payment_failed` - Payment failed
- `payment_intent.canceled` - Payment canceled
- `payment_intent.processing` - Payment processing

## 📊 Database Schema

### Subscription Model
```prisma
model Subscription {
  id                Int                @id @default(autoincrement())
  stripe_subscription_id String         @unique @db.VarChar(255)
  donor_id          Int
  organization_id   Int
  package_id        Int
  status            SubscriptionStatus @default(ACTIVE)
  current_period_start DateTime
  current_period_end   DateTime
  cancel_at_period_end Boolean          @default(false)
  canceled_at       DateTime?
  trial_start       DateTime?
  trial_end         DateTime?
  amount            Float
  currency          String             @default("USD") @db.VarChar(3)
  interval          String             @db.VarChar(20)
  interval_count    Int                @default(1)
  metadata          String?            @db.Text
  created_at        DateTime           @default(now())
  updated_at        DateTime           @updatedAt
  
  donor             Donor              @relation("DonorSubscriptions", fields: [donor_id], references: [id])
  organization      Organization       @relation("OrganizationSubscriptions", fields: [organization_id], references: [id])
  package           Package            @relation(fields: [package_id], references: [id])
  subscription_transactions SubscriptionTransaction[]
}
```

### SubscriptionTransaction Model
```prisma
model SubscriptionTransaction {
  id                Int                @id @default(autoincrement())
  subscription_id   Int
  stripe_invoice_id String             @unique @db.VarChar(255)
  amount            Float
  currency          String             @default("USD") @db.VarChar(3)
  status            String             @db.VarChar(50)
  invoice_url       String?            @db.VarChar(500)
  hosted_invoice_url String?           @db.VarChar(500)
  pdf_url           String?            @db.VarChar(500)
  period_start      DateTime
  period_end        DateTime
  created_at        DateTime           @default(now())
  updated_at        DateTime           @updatedAt
  
  subscription      Subscription       @relation(fields: [subscription_id], references: [id])
}
```

### SubscriptionStatus Enum
```prisma
enum SubscriptionStatus {
  ACTIVE
  CANCELED
  INCOMPLETE
  INCOMPLETE_EXPIRED
  PAST_DUE
  TRIALING
  UNPAID
}
```

## 🛠️ Environment Variables

Required environment variables:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_URL="mysql://user:password@localhost:3306/database"

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 🧪 Testing

### Test Subscription Creation
```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "donor_id": 1,
    "organization_id": 1,
    "package_id": 1,
    "payment_method_id": "pm_1234567890",
    "customer_email": "test@example.com",
    "customer_name": "Test User"
  }'
```

### Test Subscription List
```bash
curl http://localhost:3000/api/subscriptions?donor_id=1&page=1&limit=10
```

### Test Subscription Cancellation
```bash
curl -X DELETE http://localhost:3000/api/subscriptions/1?immediate=false
```

## 🔐 Security Features

- ✅ **Webhook Signature Verification** - All webhooks verified with Stripe signatures
- ✅ **Input Validation** - All inputs validated and sanitized
- ✅ **Error Handling** - Comprehensive error handling and logging
- ✅ **Database Transactions** - Atomic operations for data consistency
- ✅ **Stripe Customer Management** - Secure customer and payment method handling

## 📈 Usage Examples

### Frontend Integration

```javascript
// Create subscription
const createSubscription = async (subscriptionData) => {
  const response = await fetch('/api/subscriptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscriptionData),
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Use client_secret to confirm payment
    const { error } = await stripe.confirmCardPayment(result.client_secret);
    if (error) {
      console.error('Payment failed:', error);
    } else {
      console.log('Subscription created successfully!');
    }
  }
};

// List subscriptions
const getSubscriptions = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/subscriptions?${params}`);
  const result = await response.json();
  return result.subscriptions;
};

// Cancel subscription
const cancelSubscription = async (subscriptionId, immediate = false) => {
  const response = await fetch(`/api/subscriptions/${subscriptionId}?immediate=${immediate}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  return result;
};
```

## 🚨 Error Handling

All APIs return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate records)
- `500` - Internal Server Error

## 📝 Notes

1. **Payment Method Requirements**: All subscriptions require a valid payment method to be attached to the Stripe customer.

2. **Trial Periods**: Trial periods can be set during subscription creation and will be automatically handled by Stripe.

3. **Webhook Reliability**: The system uses Stripe webhooks for real-time updates. Ensure your webhook endpoint is accessible and properly configured.

4. **Database Consistency**: All subscription operations are designed to maintain consistency between Stripe and your local database.

5. **Currency Support**: The system supports multiple currencies as configured in your Stripe account.

6. **Subscription Status**: Status updates are automatically synchronized from Stripe webhooks to ensure real-time accuracy.

## 🔧 Maintenance

- Monitor webhook delivery in Stripe Dashboard
- Regularly check subscription status synchronization
- Review failed payment handling and retry logic
- Monitor database performance for large subscription volumes
- Keep Stripe API version updated for latest features

This comprehensive subscription system provides everything needed for robust recurring payment management with Stripe integration.

