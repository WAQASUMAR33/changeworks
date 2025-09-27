# 🚨 GHL API Fix Guide

## Critical Issues Found & Fixed

Based on the official GHL API documentation, I've identified and fixed several critical issues:

### 1. **Wrong Base URL** ❌ → ✅
- **Before**: `https://rest.gohighlevel.com/v1/locations`
- **After**: `https://services.leadconnectorhq.com/locations/`

### 2. **Missing Required Field** ❌ → ✅
- **Issue**: `companyId` is **REQUIRED** but was missing
- **Fix**: Added `companyId` to all API calls

### 3. **Wrong Data Structure** ❌ → ✅
- **Before**: Contact details sent as separate fields
- **After**: Contact details sent in `prospectInfo` object

## 🔧 Required Environment Variables

Update your `.env.local` file:

```env
# CORRECT Base URL (from official GHL documentation)
GHL_BASE_URL=https://services.leadconnectorhq.com

# Your GHL API Key (should be Agency API Key for sub-account creation)
GHL_API_KEY=your_agency_api_key_here
```

## 🆔 Required: Company ID

You need to provide your **Company/Agency ID** in the API calls. This is a **REQUIRED** field according to the documentation.

### How to Find Your Company ID:

1. **Log into your GHL dashboard**
2. **Go to Settings → Company Settings**
3. **Look for "Company ID" or "Agency ID"**
4. **Copy the ID (it looks like: `UAXssdawIWAWD`)**

### Update the Test Data:

In `src/app/api/debug/ghl-raw/route.js`, replace:
```javascript
companyId: 'UAXssdawIWAWD' // Replace with YOUR actual company ID
```

## 📋 Complete API Request Structure

According to the documentation, the correct request structure is:

```javascript
{
  "name": "Business Name",
  "phone": "+1234567890",
  "companyId": "YOUR_COMPANY_ID", // REQUIRED
  "address": "123 Main St",
  "city": "City",
  "state": "State",
  "country": "US",
  "postalCode": "12345",
  "website": "https://website.com",
  "timezone": "America/New_York",
  "prospectInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }
}
```

## 🧪 Testing Steps

1. **Update your `.env.local`**:
   ```env
   GHL_BASE_URL=https://services.leadconnectorhq.com
   ```

2. **Find your Company ID** from GHL dashboard

3. **Update the test data** with your Company ID

4. **Restart your development server**:
   ```bash
   npm run dev
   ```

5. **Test the API**:
   - Go to `/organization/dashboard/ghl/debug`
   - Click "Test GHL API"
   - Check the response

## 🎯 Expected Success Response

If everything is correct, you should see:

```json
{
  "id": "ve9EPM428h8vShlRW1KT",
  "companyId": "YOUR_COMPANY_ID",
  "name": "Test Business",
  "phone": "+1234567890",
  "email": "test@example.com",
  "address": "123 Test Street",
  "city": "Test City",
  "state": "CA",
  "domain": "test.msgsndr.com",
  "country": "US",
  "postalCode": "12345",
  "website": "https://testbusiness.com",
  "timezone": "America/Los_Angeles"
}
```

## ⚠️ Important Notes

1. **Agency Pro Plan Required**: Sub-account creation requires Agency Pro ($497/month) plan
2. **Agency API Key Required**: Regular API keys won't work for sub-account creation
3. **Company ID Required**: This field is mandatory and must be your actual company ID

## 🔍 Debugging

If you still get errors:

1. **Check the debug page**: `/organization/dashboard/ghl/debug`
2. **Look at server console logs** for detailed error messages
3. **Verify your Company ID** is correct
4. **Ensure you have Agency Pro plan** and Agency API Key

## 📞 Next Steps

1. Update your environment variables
2. Find and use your correct Company ID
3. Test the API
4. Create GHL accounts through your dashboard

The sub-accounts should now appear in your GoHighLevel dashboard! 🎉
