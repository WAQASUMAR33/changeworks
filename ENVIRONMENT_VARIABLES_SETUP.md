# 🔐 Environment Variables Setup Guide

This guide contains all the environment variables required for the ChangeWorks Fund application.

## 📋 Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

### 🗄️ Database Configuration
```env
DATABASE_URL="mysql://username:password@localhost:3306/changeworks_db"
```

### 🔑 JWT Authentication
```env
JWT_SECRET="your-super-secret-jwt-key-here-minimum-32-characters"
```

### 📧 Email Configuration (Mailgun)
```env
# Mailgun SMTP Configuration
EMAIL_SERVER_HOST="smtp.mailgun.org"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="postmaster@mg.changeworksfund.org"
EMAIL_SERVER_PASSWORD="your-mailgun-smtp-password-here"
EMAIL_FROM="noreply@changeworksfund.org"

# Alternative: Mailgun API Configuration
# MAILGUN_API_KEY="your-mailgun-api-key-here"
# MAILGUN_DOMAIN="mg.changeworksfund.org"
```

### 💳 Stripe Payment Processing
```env
# Stripe API Keys (Test Mode)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Stripe API Keys (Live Mode - Production)
# STRIPE_SECRET_KEY="sk_live_your_live_stripe_secret_key_here"
# STRIPE_PUBLISHABLE_KEY="pk_live_your_live_stripe_publishable_key_here"
# STRIPE_WEBHOOK_SECRET="whsec_your_live_webhook_secret_here"
```

### 🏢 GoHighLevel (GHL) Integration
```env
# GHL Agency API Key (for sub-account creation)
GHL_API_KEY="your-ghl-agency-api-key-here-250-characters-minimum"
GHL_AGENCY_API_KEY="your-ghl-agency-api-key-here-250-characters-minimum"

# GHL Base URL
GHL_BASE_URL="https://services.leadconnectorhq.com"

# GHL Company ID
GHL_COMPANY_ID="your-ghl-company-id-here"
```

### 🌐 Application URLs
```env
# Base URL for the application
NEXT_PUBLIC_BASE_URL="https://app.changeworksfund.org"

# Alternative URLs for different environments
# NEXT_PUBLIC_BASE_URL="http://localhost:3000"  # Local development
# NEXT_PUBLIC_BASE_URL="https://staging.changeworksfund.org"  # Staging

# App URL (for password reset links)
NEXT_PUBLIC_APP_URL="https://app.changeworksfund.org"
```

### 🖼️ Image Upload Configuration
```env
NEXT_PUBLIC_IMAGE_UPLOAD_API="/api/upload-image"
```

### 🔗 Plaid Integration (Optional)
```env
# PLAID_CLIENT_ID="your-plaid-client-id"
# PLAID_SECRET="your-plaid-secret"
# PLAID_ENVIRONMENT="sandbox"  # or "development" or "production"
```

### 🛠️ Development/Debug Settings
```env
# Set to "development" for local development
NODE_ENV="production"

# Enable debug logging (set to "true" for debugging)
DEBUG="false"
```

## 🚀 Setup Instructions

### 1. Create Environment File
```bash
# Copy the template and create your local environment file
cp .env.example .env.local
```

### 2. Fill in Your Values
Replace all placeholder values with your actual API keys and configuration.

### 3. Security Checklist
- ✅ Generate strong, unique values for all keys
- ✅ Use different keys for development, staging, and production
- ✅ Never commit `.env` or `.env.local` files to version control
- ✅ Rotate keys regularly
- ✅ Use environment-specific files

## 🔍 Where to Get API Keys

### Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **API Keys**
3. Copy your **Publishable key** and **Secret key**
4. For webhooks, go to **Developers** → **Webhooks** and create an endpoint

### GoHighLevel (GHL)
1. Go to [GoHighLevel Dashboard](https://app.gohighlevel.com/)
2. Navigate to **Settings** → **API Keys**
3. Generate an **Agency API Key** (250+ characters)
4. Get your **Company ID** from the URL or settings

### Mailgun
1. Go to [Mailgun Dashboard](https://app.mailgun.com/)
2. Navigate to **Sending** → **Domains**
3. Select your domain and go to **SMTP**
4. Copy your **SMTP credentials**

### JWT Secret
Generate a strong secret key:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## 🧪 Testing Your Configuration

### Test Email Configuration
```bash
curl -X POST http://localhost:3000/api/test-mailgun \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test Email","message":"Testing email configuration"}'
```

### Test Stripe Configuration
```bash
curl -X GET http://localhost:3000/api/stripe-minimal-test
```

### Test GHL Configuration
```bash
curl -X GET http://localhost:3000/api/debug/ghl-config-check
```

## 🚨 Security Warnings

1. **Never commit environment files** - They're already in `.gitignore`
2. **Use different keys for each environment** (dev, staging, production)
3. **Rotate keys regularly** for security
4. **Use strong, unique passwords** for all services
5. **Monitor API usage** for unusual activity
6. **Set up proper webhook endpoints** for production

## 📞 Support

If you need help setting up any of these integrations:
- Check the individual setup guides in the documentation
- Test each integration using the provided test endpoints
- Contact the development team for assistance

---

**Remember**: Keep your environment variables secure and never share them in plain text!
