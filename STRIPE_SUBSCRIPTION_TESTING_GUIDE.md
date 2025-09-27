# Stripe Subscription Testing Guide

## 🎯 Why No Subscriptions Appear in Stripe Dashboard

The reason you're not seeing subscriptions in your Stripe Dashboard is because:

### 1. **Setup Payment Flow** (What we've been testing)
- ✅ Creates Stripe customers
- ✅ Creates checkout sessions  
- ✅ Creates setup intents
- ❌ **Does NOT create subscriptions** until payment is completed

### 2. **Direct Subscription Creation** (What we need to test)
- ✅ Creates actual subscriptions immediately
- ❌ Requires real payment method IDs (not test IDs like `pm_card_visa`)

## 🚀 How to Create Actual Subscriptions

### Method 1: Complete Checkout Flow (Recommended for Testing)

1. **Use the checkout URLs** from our tests:
   ```
   https://checkout.stripe.com/c/pay/cs_test_a1bjLaVKIfIaPxUGBgr3QrMnu0zwL4kFZwFc2Qv6YeCeiX7TAAGzq5ZEGR
   ```

2. **Complete the payment** using test cards:
   - **Visa**: `4242424242424242`
   - **Mastercard**: `5555555555554444`
   - **American Express**: `378282246310005`
   - **Any future expiry date** (e.g., 12/25)
   - **Any CVC** (e.g., 123)

3. **Result**: Subscription will be created automatically in Stripe Dashboard

### Method 2: Use Stripe CLI (Advanced)

1. **Install Stripe CLI**:
   ```bash
   # Windows
   winget install stripe.stripe-cli
   
   # Or download from: https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Create test payment method**:
   ```bash
   stripe payment_methods create --type=card --card[number]=4242424242424242 --card[exp_month]=12 --card[exp_year]=2025 --card[cvc]=123
   ```

4. **Use the payment method ID** in our subscription API

### Method 3: Use Stripe Dashboard (Manual)

1. **Go to Stripe Dashboard** → Customers
2. **Find the customer** we created (e.g., `cus_T7phfrIs2OG0nr`)
3. **Create subscription manually** for testing
4. **Use the subscription ID** to test our APIs

## 🧪 Test Scripts Available

### 1. **Setup Payment Flow** (Creates checkout sessions)
```bash
node test-stripe-setup-only.js
```
- ✅ Creates customers
- ✅ Creates checkout sessions
- ✅ Provides checkout URLs for testing
- ❌ No subscriptions until payment completed

### 2. **Direct Subscription Creation** (Requires real payment methods)
```bash
node test-stripe-subscription-creation.js
```
- ✅ Attempts direct subscription creation
- ❌ Fails with test payment method IDs
- ✅ Falls back to setup payment flow

### 3. **Complete Subscription Management**
```bash
node test-subscription-apis.js
```
- ✅ Lists existing subscriptions
- ✅ Gets subscription details
- ✅ Updates subscriptions
- ✅ Cancels subscriptions

## 🎯 Step-by-Step Testing Process

### Step 1: Create Checkout Session
```bash
node test-stripe-setup-only.js
```

### Step 2: Complete Payment
1. Copy the checkout URL from the output
2. Open in browser
3. Use test card: `4242424242424242`
4. Complete payment

### Step 3: Verify Subscription Created
1. Check Stripe Dashboard → Subscriptions
2. Run: `node test-subscription-apis.js`
3. Verify subscription appears in both places

### Step 4: Test Subscription Management
```bash
node test-subscription-apis.js
```

## 📊 What You'll See in Stripe Dashboard

### After Setup Payment Flow:
- ✅ **Customers**: `cus_T7phfrIs2OG0nr`
- ✅ **Setup Intents**: `seti_1SBa28D3DgWpcYpJ106feSa4`
- ✅ **Checkout Sessions**: `cs_test_a1bjLaVKIfIaPxUGBgr3QrMnu0zwL4kFZwFc2Qv6YeCeiX7TAAGzq5ZEGR`
- ❌ **Subscriptions**: None (until payment completed)

### After Completing Payment:
- ✅ **Customers**: Same customer
- ✅ **Payment Methods**: Attached to customer
- ✅ **Subscriptions**: New subscription created
- ✅ **Invoices**: First invoice generated

## 🔧 Environment Setup

Make sure your `.env` file has:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🎯 Quick Test Commands

### Create Test Data:
```bash
node test-create-test-data.js
```

### Test Setup Flow:
```bash
node test-stripe-setup-only.js
```

### Test Subscription APIs:
```bash
node test-subscription-apis.js
```

### Test Complete Flow:
```bash
node test-stripe-subscription-creation.js
```

## 🚨 Common Issues

### 1. "No subscriptions found"
- **Cause**: Only checkout sessions created, no payments completed
- **Solution**: Complete payment using checkout URL

### 2. "Failed to attach payment method"
- **Cause**: Using test payment method IDs instead of real ones
- **Solution**: Use checkout flow or Stripe CLI to create real payment methods

### 3. "Webhook not working"
- **Cause**: Webhook endpoint not configured
- **Solution**: Set up webhook endpoint in Stripe Dashboard

## 🎉 Success Indicators

You'll know the system is working when you see:

1. **In Stripe Dashboard**:
   - ✅ Customers created
   - ✅ Subscriptions created (after payment)
   - ✅ Payment methods attached
   - ✅ Invoices generated

2. **In Database**:
   - ✅ Subscription records created
   - ✅ Transaction records created
   - ✅ Organization balance updated

3. **In API Responses**:
   - ✅ Subscription listing works
   - ✅ Subscription details retrieved
   - ✅ Status updates working

## 🔗 Useful Links

- **Stripe Test Cards**: https://stripe.com/docs/testing#cards
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Webhook Testing**: https://stripe.com/docs/webhooks/test
- **Checkout Sessions**: https://stripe.com/docs/payments/checkout

## 📞 Next Steps

1. **Complete a payment** using the checkout URL
2. **Verify subscription** appears in Stripe Dashboard
3. **Test subscription management** APIs
4. **Set up webhooks** for production
5. **Test different payment scenarios**

The system is working correctly - you just need to complete the payment flow to see actual subscriptions! 🎉

