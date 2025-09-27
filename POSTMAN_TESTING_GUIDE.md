# Postman Testing Guide for ChangeWorks Subscription APIs

## 🚀 Quick Start

### 1. Import the Collection
1. Open Postman
2. Click **Import** button
3. Select `ChangeWorks_Subscription_APIs.postman_collection.json`
4. The collection will be imported with all endpoints

### 2. Set Environment Variables
The collection uses a `base_url` variable set to `http://localhost:3002` (your current server port).

## 📋 Testing Workflow

### Step 1: Test Basic Connectivity
1. **Test Stripe Connection** - Verify Stripe is working
2. **Check Environment Variables** - Ensure all keys are set
3. **List Packages** - Get available subscription packages
4. **List Donors** - Get existing donors

### Step 2: Create Test Data (if needed)
1. **Create Donor** - Create a test donor
2. **Create Package** - Create a test subscription package

### Step 3: Test Subscription Creation
1. **Setup Payment for Subscription** - Create checkout session
2. **List Subscriptions** - Verify subscription was created

### Step 4: Test Subscription Management
1. **Get Subscription by ID** - Get specific subscription details
2. **Update Subscription** - Test subscription updates
3. **Get Subscription Transactions** - View payment history

## 🧪 Key Test Scenarios

### Scenario 1: Complete Subscription Flow
```
1. Create Donor
2. Setup Payment for Subscription
3. Complete payment via Stripe Checkout (manual)
4. List Subscriptions to verify creation
5. Get Subscription Details
```

### Scenario 2: Payment Method Management
```
1. List Payment Methods
2. Add Payment Method
3. Update Subscription with new payment method
4. Remove Payment Method
```

### Scenario 3: Billing and Invoices
```
1. Get Billing Information
2. Update Billing Information
3. Get Invoices
4. Create Manual Invoice
```

### Scenario 4: Analytics and Reporting
```
1. Get Subscription Analytics
2. Get Payment History
3. Get Refund History
```

## 📊 Sample Test Data

### Create Donor
```json
{
  "name": "Test Donor",
  "email": "testdonor@example.com",
  "phone": "+1234567890",
  "password": "testpassword123",
  "organization_id": 17
}
```

### Setup Payment for Subscription
```json
{
  "donor_id": 58,
  "organization_id": 17,
  "package_id": 2,
  "customer_email": "test@example.com",
  "customer_name": "Test User",
  "return_url": "http://localhost:3002/subscription/success"
}
```

### Create Package
```json
{
  "name": "Premium Plan",
  "description": "Premium subscription plan with advanced features",
  "price": 49.99,
  "currency": "USD",
  "duration": 30,
  "features": "Advanced features, priority support, custom integrations",
  "category": "premium"
}
```

## 🔧 Environment Setup

### Required Environment Variables
Make sure these are set in your `.env` file:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=mysql://...
```

### Server Configuration
- **Base URL**: `http://localhost:3002`
- **Port**: 3002 (automatically assigned by Next.js)
- **Environment**: Development

## 🎯 Testing Checklist

### ✅ Basic API Tests
- [ ] Test Stripe connection
- [ ] Check environment variables
- [ ] List packages
- [ ] List donors
- [ ] List subscriptions

### ✅ Subscription Creation
- [ ] Setup payment for subscription
- [ ] Verify checkout session creation
- [ ] Test subscription listing after payment

### ✅ Subscription Management
- [ ] Get subscription by ID
- [ ] Update subscription
- [ ] Cancel subscription
- [ ] Get subscription transactions

### ✅ Payment Methods
- [ ] List payment methods
- [ ] Add payment method
- [ ] Remove payment method

### ✅ Billing & Invoices
- [ ] Get billing information
- [ ] Update billing information
- [ ] Get invoices
- [ ] Create manual invoice

### ✅ Analytics
- [ ] Get subscription analytics
- [ ] Get payment history
- [ ] Get refund history

## 🚨 Common Issues & Solutions

### Issue 1: "Module not found" errors
**Solution**: Restart the development server
```bash
npm run dev
```

### Issue 2: "Stripe connection failed"
**Solution**: Check environment variables
```bash
GET /api/debug/env-check
```

### Issue 3: "No subscriptions found"
**Solution**: Create a subscription first using setup-payment

### Issue 4: "Payment method attachment failed"
**Solution**: Use setup-payment flow instead of direct subscription creation

## 📝 Notes

1. **Test Cards**: Use `4242424242424242` for successful payments
2. **Port**: Server runs on port 3002 (not 3000)
3. **Database**: All data is persisted in MySQL database
4. **Webhooks**: Stripe webhooks update subscription status automatically
5. **GHL Integration**: Donor creation automatically creates GHL contacts

## 🔗 Useful Links

- **Stripe Dashboard**: https://dashboard.stripe.com/test
- **Stripe Test Cards**: https://stripe.com/docs/testing
- **Postman Documentation**: https://learning.postman.com/

---

**Happy Testing! 🎉**
