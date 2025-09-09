# GoHighLevel API Setup Guide

## The Issue
Your GHL account is being created in the database but not appearing in the GoHighLevel dashboard. This is because of incorrect API configuration.

## Required Setup

### 1. **Agency API Key (CRITICAL)**
- You need an **Agency API Key**, not a regular API key
- Agency API keys are typically **250+ characters long**
- Regular API keys (~50 characters) cannot create sub-accounts

### 2. **Correct API Endpoint**
- Use: `https://rest.gohighlevel.com/v1`
- NOT: `https://services.leadconnectorhq.com`

### 3. **Required Plan**
- You need **Agency Pro plan ($497/month)** to create sub-accounts via API
- This feature is not available on lower plans

## How to Get Your Agency API Key

1. **Login to GoHighLevel**: https://app.gohighlevel.com
2. **Navigate to**: Agency Settings → API Keys
3. **Generate Agency API Key**: Look for "Agency API Key" (not regular API key)
4. **Copy the key**: It should be 250+ characters long

## Update Your Environment Variables

Update your `.env.local` file:

```env
# GHL API Configuration
GHL_API_KEY=your_agency_api_key_here_250_characters_minimum
GHL_BASE_URL=https://rest.gohighlevel.com/v1
```

## Test Your Configuration

1. **Check Configuration**: Visit `/api/debug/ghl-config` to verify your setup
2. **Test API Call**: Visit `/api/test/ghl-subaccount` to test the integration
3. **Check Console**: Look for detailed error logs in your browser console

## Common Issues

### ❌ Wrong API Key Type
- **Problem**: Using regular API key instead of Agency API key
- **Solution**: Generate Agency API key from Agency Settings

### ❌ Wrong Plan
- **Problem**: Not on Agency Pro plan
- **Solution**: Upgrade to Agency Pro ($497/month)

### ❌ Wrong Endpoint
- **Problem**: Using old endpoint
- **Solution**: Use `https://rest.gohighlevel.com/v1`

### ❌ API Key Length
- **Problem**: API key too short (< 200 characters)
- **Solution**: Get proper Agency API key (250+ characters)

## Verification Steps

1. **Check API Key Length**:
   ```bash
   curl http://localhost:3000/api/debug/ghl-config
   ```

2. **Test GHL Integration**:
   ```bash
   curl -X POST http://localhost:3000/api/test/ghl-subaccount
   ```

3. **Check Browser Console**: Look for detailed error messages

## Expected Response

When working correctly, you should see:
- API key length: 250+ characters
- Base URL: `https://rest.gohighlevel.com/v1`
- Successful GHL API response with location ID
- Sub-account appears in your GHL dashboard

## Still Having Issues?

1. **Check GHL Dashboard**: Verify you're on Agency Pro plan
2. **Contact GHL Support**: They can verify your API key permissions
3. **Check Console Logs**: Detailed error messages will show the exact issue

## Important Notes

- **Agency API Key is required** for sub-account creation
- **Agency Pro plan is required** ($497/month)
- **Regular API keys cannot create sub-accounts**
- **Test mode may not show sub-accounts** - use live mode
