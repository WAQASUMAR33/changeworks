# Production API Guide - https://app.changeworksfund.org

## 📋 API Endpoint: `/api/subscriptions`

**Base URL**: `https://app.changeworksfund.org`

### 🔍 GET Request - List Subscriptions

**Endpoint**: `GET https://app.changeworksfund.org/api/subscriptions`

#### Query Parameters (All Optional):
- `donor_id` (integer) - Filter by donor ID
- `organization_id` (integer) - Filter by organization ID  
- `status` (string) - Filter by subscription status
- `page` (integer) - Page number (default: 1)
- `limit` (integer) - Items per page (default: 10)

#### Example Requests:

**1. Get all subscriptions:**
```
GET https://app.changeworksfund.org/api/subscriptions
```

**2. Get subscriptions with pagination:**
```
GET https://app.changeworksfund.org/api/subscriptions?page=1&limit=5
```

**3. Get subscriptions by donor:**
```
GET https://app.changeworksfund.org/api/subscriptions?donor_id=58
```

**4. Get subscriptions by organization:**
```
GET https://app.changeworksfund.org/api/subscriptions?organization_id=17
```

**5. Get subscriptions by status:**
```
GET https://app.changeworksfund.org/api/subscriptions?status=ACTIVE
```

**6. Combined filters:**
```
GET https://app.changeworksfund.org/api/subscriptions?organization_id=17&status=ACTIVE&page=1&limit=10
```

#### Response Format:
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
        "id": 17,
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
      "subscription_transactions": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "pages": 0
  }
}
```

---

### 📝 POST Request - Create Subscription

**Endpoint**: `POST https://app.changeworksfund.org/api/subscriptions`

#### Required Headers:
```
Content-Type: application/json
```

#### Required Body Parameters:
- `donor_id` (integer) - ID of the donor
- `organization_id` (integer) - ID of the organization
- `package_id` (integer) - ID of the subscription package
- `payment_method_id` (string) - Stripe payment method ID

#### Optional Body Parameters:
- `customer_email` (string) - Customer email
- `customer_name` (string) - Customer name
- `trial_period_days` (integer) - Trial period in days (default: 0)

#### Example Request Body:
```json
{
  "donor_id": 58,
  "organization_id": 17,
  "package_id": 2,
  "payment_method_id": "pm_1234567890abcdef",
  "customer_email": "test@example.com",
  "customer_name": "Test User",
  "trial_period_days": 7
}
```

#### Response Format:
```json
{
  "success": true,
  "subscription": {
    "id": 1,
    "stripe_subscription_id": "sub_1234567890",
    "status": "INCOMPLETE",
    "donor": {
      "id": 58,
      "name": "Test User",
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
  "client_secret": "pi_1234567890_secret_abc123",
  "stripe_subscription_id": "sub_1234567890",
  "message": "Subscription created successfully. Complete payment to activate."
}
```

---

## 🚨 Important Notes

### 1. **Payment Method Requirements**
- The `payment_method_id` must be a valid Stripe payment method ID
- Test payment method IDs like `pm_card_visa` will not work
- Use the setup-payment endpoint to create valid payment methods

### 2. **Current Status**
Based on the API response from https://app.changeworksfund.org/api/subscriptions:
- ✅ API is working and accessible
- ✅ Returns proper JSON response
- ⚠️ No subscriptions exist yet (empty array)
- ✅ Pagination is working correctly

### 3. **Recommended Workflow**
Instead of direct subscription creation, use the setup-payment flow:

1. **Setup Payment**: `POST /api/subscriptions/setup-payment`
2. **Complete Payment**: Use Stripe Checkout
3. **Verify Subscription**: `GET /api/subscriptions`

### 4. **Status Values**
Valid subscription statuses:
- `ACTIVE` - Active subscription
- `CANCELED` - Canceled subscription
- `INCOMPLETE` - Payment pending
- `INCOMPLETE_EXPIRED` - Payment expired
- `PAST_DUE` - Payment failed
- `TRIALING` - In trial period
- `UNPAID` - Unpaid subscription

---

## 🧪 Testing with Postman

### Import the Collection
1. Import `ChangeWorks_Subscription_APIs.postman_collection.json`
2. Update the `base_url` variable to: `https://app.changeworksfund.org`
3. Start testing the endpoints

### Test Sequence
1. **GET** `/api/subscriptions` - Verify API is working
2. **GET** `/api/packages` - Get available packages
3. **GET** `/api/donor` - Get available donors
4. **POST** `/api/subscriptions/setup-payment` - Create checkout session
5. **GET** `/api/subscriptions` - Verify subscription creation

---

## 🔗 Related Endpoints

- **Packages**: `GET https://app.changeworksfund.org/api/packages`
- **Donors**: `GET https://app.changeworksfund.org/api/donor`
- **Setup Payment**: `POST https://app.changeworksfund.org/api/subscriptions/setup-payment`
- **Subscription Details**: `GET https://app.changeworksfund.org/api/subscriptions/{id}`

---

**The production API is live and ready for testing! 🚀**
