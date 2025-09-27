# Customer Subscription Check API

## 🎯 Purpose
Check if a customer has an active subscription or any subscription history.

## 📋 API Endpoint: `/api/subscriptions/check-customer`

### 🔍 GET Request - Check Single Customer

**Endpoint**: `GET /api/subscriptions/check-customer`

#### Query Parameters:
- `donor_id` (integer) - Donor ID (required if customer_email not provided)
- `customer_email` (string) - Customer email (required if donor_id not provided)
- `organization_id` (integer) - Filter by organization ID (optional)
- `include_inactive` (boolean) - Include inactive subscriptions (default: false)

#### Example Requests:

**Check by donor ID:**
```
GET /api/subscriptions/check-customer?donor_id=58
```

**Check by email:**
```
GET /api/subscriptions/check-customer?customer_email=test@example.com
```

**Check with organization filter:**
```
GET /api/subscriptions/check-customer?donor_id=58&organization_id=17
```

**Include inactive subscriptions:**
```
GET /api/subscriptions/check-customer?donor_id=58&include_inactive=true
```

#### Response Format:
```json
{
  "success": true,
  "customer": {
    "donor_id": 58,
    "customer_email": "test@example.com",
    "organization_id": 17
  },
  "subscription_status": {
    "has_subscription": true,
    "has_active_subscription": true,
    "total_subscriptions": 2,
    "active_subscriptions": 1,
    "inactive_subscriptions": 1,
    "latest_subscription": {
      "id": 1,
      "stripe_subscription_id": "sub_1234567890",
      "status": "ACTIVE",
      "amount": 29.99,
      "currency": "USD",
      "interval": "month",
      "current_period_start": "2025-01-01T00:00:00.000Z",
      "current_period_end": "2025-02-01T00:00:00.000Z",
      "cancel_at_period_end": false,
      "donor": {
        "id": 58,
        "name": "John Doe",
        "email": "test@example.com"
      },
      "organization": {
        "id": 17,
        "name": "Corpulate",
        "email": "business@corpulate.com"
      },
      "package": {
        "id": 2,
        "name": "Premium Plan",
        "description": "Premium subscription plan",
        "price": 29.99,
        "currency": "USD",
        "features": "Advanced features included"
      }
    },
    "active_subscription": {
      "id": 1,
      "stripe_subscription_id": "sub_1234567890",
      "status": "ACTIVE",
      "amount": 29.99,
      "currency": "USD",
      "interval": "month",
      "current_period_start": "2025-01-01T00:00:00.000Z",
      "current_period_end": "2025-02-01T00:00:00.000Z",
      "cancel_at_period_end": false,
      "donor": {
        "id": 58,
        "name": "John Doe",
        "email": "test@example.com"
      },
      "organization": {
        "id": 17,
        "name": "Corpulate",
        "email": "business@corpulate.com"
      },
      "package": {
        "id": 2,
        "name": "Premium Plan",
        "description": "Premium subscription plan",
        "price": 29.99,
        "currency": "USD",
        "features": "Advanced features included"
      }
    }
  },
  "revenue": {
    "monthly_revenue": 29.99,
    "currency": "USD"
  },
  "next_billing_date": "2025-02-01T00:00:00.000Z",
  "subscriptions": [
    {
      "id": 1,
      "stripe_subscription_id": "sub_1234567890",
      "status": "ACTIVE",
      "amount": 29.99,
      "currency": "USD",
      "interval": "month",
      "current_period_start": "2025-01-01T00:00:00.000Z",
      "current_period_end": "2025-02-01T00:00:00.000Z",
      "cancel_at_period_end": false,
      "canceled_at": null,
      "trial_start": null,
      "trial_end": null,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z",
      "donor": {
        "id": 58,
        "name": "John Doe",
        "email": "test@example.com"
      },
      "organization": {
        "id": 17,
        "name": "Corpulate",
        "email": "business@corpulate.com"
      },
      "package": {
        "id": 2,
        "name": "Premium Plan",
        "description": "Premium subscription plan",
        "price": 29.99,
        "currency": "USD",
        "features": "Advanced features included"
      },
      "latest_transaction": {
        "id": 1,
        "stripe_invoice_id": "in_1234567890",
        "amount": 29.99,
        "currency": "USD",
        "status": "paid",
        "created_at": "2025-01-01T00:00:00.000Z"
      }
    }
  ],
  "stripe_subscriptions": [
    {
      "id": "sub_1234567890",
      "status": "active",
      "current_period_start": "2025-01-01T00:00:00.000Z",
      "current_period_end": "2025-02-01T00:00:00.000Z",
      "cancel_at_period_end": false,
      "canceled_at": null,
      "trial_start": null,
      "trial_end": null,
      "items": [
        {
          "id": "si_1234567890",
          "price": {
            "id": "price_1234567890",
            "unit_amount": 2999,
            "currency": "usd",
            "recurring": {
              "interval": "month",
              "interval_count": 1
            },
            "product": "prod_1234567890"
          },
          "quantity": 1
        }
      ],
      "metadata": {
        "donor_id": "58",
        "organization_id": "17",
        "package_id": "2"
      }
    }
  ],
  "message": "Customer has 1 active subscription(s)"
}
```

---

### 📝 POST Request - Check Multiple Customers

**Endpoint**: `POST /api/subscriptions/check-customer`

#### Required Headers:
```
Content-Type: application/json
```

#### Required Body Parameters:
- `customers` (array) - Array of customer objects

#### Optional Body Parameters:
- `organization_id` (integer) - Filter by organization ID
- `include_inactive` (boolean) - Include inactive subscriptions (default: false)

#### Customer Object:
- `donor_id` (integer) - Donor ID (required if customer_email not provided)
- `customer_email` (string) - Customer email (required if donor_id not provided)

#### Example Request Body:
```json
{
  "customers": [
    {
      "donor_id": 58
    },
    {
      "customer_email": "test@example.com"
    },
    {
      "donor_id": 59,
      "customer_email": "another@example.com"
    }
  ],
  "organization_id": 17,
  "include_inactive": false
}
```

#### Response Format:
```json
{
  "success": true,
  "results": [
    {
      "customer": {
        "donor_id": 58
      },
      "success": true,
      "subscription_status": {
        "has_subscription": true,
        "has_active_subscription": true,
        "total_subscriptions": 1,
        "active_subscriptions": 1
      },
      "subscriptions": [
        {
          "id": 1,
          "status": "ACTIVE",
          "amount": 29.99,
          "currency": "USD",
          "current_period_end": "2025-02-01T00:00:00.000Z",
          "package": {
            "id": 2,
            "name": "Premium Plan",
            "price": 29.99,
            "currency": "USD"
          }
        }
      ]
    },
    {
      "customer": {
        "customer_email": "test@example.com"
      },
      "success": true,
      "subscription_status": {
        "has_subscription": false,
        "has_active_subscription": false,
        "total_subscriptions": 0,
        "active_subscriptions": 0
      },
      "subscriptions": []
    }
  ],
  "summary": {
    "total_customers": 2,
    "customers_with_subscriptions": 1,
    "customers_with_active_subscriptions": 1
  }
}
```

---

## 🎯 Use Cases

### 1. **Check if Customer Can Access Premium Features**
```bash
GET /api/subscriptions/check-customer?donor_id=58
```
- Check `has_active_subscription` field
- If `true`, grant access to premium features

### 2. **Get Customer's Subscription Details**
```bash
GET /api/subscriptions/check-customer?customer_email=test@example.com&include_inactive=true
```
- Get all subscription history
- Show subscription timeline
- Display billing information

### 3. **Check Multiple Customers for Reporting**
```bash
POST /api/subscriptions/check-customer
{
  "customers": [
    {"donor_id": 58},
    {"donor_id": 59},
    {"donor_id": 60}
  ]
}
```
- Bulk check for analytics
- Generate subscription reports
- Identify active vs inactive customers

### 4. **Organization-Level Subscription Check**
```bash
GET /api/subscriptions/check-customer?organization_id=17&include_inactive=true
```
- Check all customers in an organization
- Get organization subscription overview
- Calculate total revenue

---

## 📊 Response Fields Explained

### Subscription Status
- `has_subscription`: Customer has any subscription (active or inactive)
- `has_active_subscription`: Customer has an active subscription
- `total_subscriptions`: Total number of subscriptions
- `active_subscriptions`: Number of active subscriptions
- `inactive_subscriptions`: Number of inactive subscriptions
- `latest_subscription`: Most recent subscription
- `active_subscription`: Current active subscription

### Revenue Information
- `monthly_revenue`: Total monthly revenue from active subscriptions
- `currency`: Currency of the revenue
- `next_billing_date`: Next billing date for active subscriptions

### Subscription Details
- `id`: Database subscription ID
- `stripe_subscription_id`: Stripe subscription ID
- `status`: Subscription status (ACTIVE, CANCELED, etc.)
- `amount`: Subscription amount
- `currency`: Subscription currency
- `interval`: Billing interval (month, year)
- `current_period_start`: Current billing period start
- `current_period_end`: Current billing period end
- `cancel_at_period_end`: Will cancel at period end
- `latest_transaction`: Most recent transaction

---

## 🚨 Error Handling

### Common Errors:
1. **Missing Parameters**: `Either donor_id or customer_email is required`
2. **Invalid Donor ID**: `Donor not found`
3. **Database Error**: `Failed to check customer subscription`
4. **Stripe Error**: Stripe data may be missing, but database data will still be returned

### Error Response Format:
```json
{
  "success": false,
  "error": "Error message description",
  "details": "Detailed error information"
}
```

---

## 🧪 Testing with Postman

### Add to Postman Collection:
1. **GET** `/api/subscriptions/check-customer` - Check single customer
2. **POST** `/api/subscriptions/check-customer` - Check multiple customers

### Test Scenarios:
1. **Active Customer**: `?donor_id=58`
2. **Inactive Customer**: `?donor_id=59&include_inactive=true`
3. **New Customer**: `?customer_email=new@example.com`
4. **Bulk Check**: POST with multiple customers

---

## 🔗 Integration Examples

### Frontend Integration:
```javascript
// Check if user has active subscription
const checkSubscription = async (donorId) => {
  const response = await fetch(`/api/subscriptions/check-customer?donor_id=${donorId}`);
  const data = await response.json();
  
  if (data.success && data.subscription_status.has_active_subscription) {
    // Grant access to premium features
    return true;
  }
  return false;
};
```

### Backend Integration:
```javascript
// Check subscription before processing payment
const hasActiveSubscription = await checkCustomerSubscription(donorId);
if (!hasActiveSubscription) {
  // Redirect to subscription page
  return redirect('/subscribe');
}
```

---

**Customer Subscription Check API is ready for use! 🎉**
