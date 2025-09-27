# Stripe Products & Prices API Guide

## 🚀 New API Endpoints for Stripe Products

### 1. Get All Stripe Products
**Endpoint**: `GET /api/stripe/products`

#### Query Parameters (All Optional):
- `active` (boolean) - Filter by active status (true/false)
- `limit` (integer) - Number of products to return (max 100, default 100)
- `starting_after` (string) - Cursor for pagination
- `ending_before` (string) - Cursor for pagination

#### Example Requests:

**Get all products:**
```
GET /api/stripe/products
```

**Get active products only:**
```
GET /api/stripe/products?active=true
```

**Get products with pagination:**
```
GET /api/stripe/products?limit=10&starting_after=prod_123
```

#### Response Format:
```json
{
  "success": true,
  "products": [
    {
      "id": "prod_1234567890",
      "name": "Premium Subscription",
      "description": "Premium subscription plan with advanced features",
      "active": true,
      "created": 1640995200,
      "updated": 1640995200,
      "metadata": {},
      "images": [],
      "url": null,
      "type": "service",
      "unit_label": null,
      "prices": [
        {
          "id": "price_1234567890",
          "active": true,
          "currency": "usd",
          "unit_amount": 2999,
          "unit_amount_decimal": "2999",
          "recurring": {
            "interval": "month",
            "interval_count": 1
          },
          "type": "recurring",
          "created": 1640995200,
          "metadata": {},
          "nickname": "Monthly Premium",
          "product": "prod_1234567890",
          "billing_scheme": "per_unit",
          "tax_behavior": "unspecified"
        }
      ]
    }
  ],
  "pagination": {
    "has_more": false,
    "total_count": 1,
    "limit": 100
  },
  "stripe_response": {
    "object": "list",
    "url": "/v1/products",
    "has_more": false
  }
}
```

---

### 2. Create Stripe Product
**Endpoint**: `POST /api/stripe/products`

#### Required Headers:
```
Content-Type: application/json
```

#### Required Body Parameters:
- `name` (string) - Product name

#### Optional Body Parameters:
- `description` (string) - Product description
- `active` (boolean) - Whether product is active (default: true)
- `metadata` (object) - Custom metadata
- `images` (array) - Array of image URLs
- `url` (string) - Product URL
- `type` (string) - Product type: 'service' or 'good' (default: 'service')
- `unit_label` (string) - Unit label for the product
- `statement_descriptor` (string) - Statement descriptor

#### Example Request Body:
```json
{
  "name": "Premium Subscription Plan",
  "description": "Premium subscription with advanced features",
  "active": true,
  "metadata": {
    "category": "subscription",
    "tier": "premium"
  },
  "type": "service",
  "unit_label": "month"
}
```

#### Response Format:
```json
{
  "success": true,
  "product": {
    "id": "prod_1234567890",
    "name": "Premium Subscription Plan",
    "description": "Premium subscription with advanced features",
    "active": true,
    "created": 1640995200,
    "updated": 1640995200,
    "metadata": {
      "category": "subscription",
      "tier": "premium"
    },
    "images": [],
    "url": null,
    "type": "service",
    "unit_label": "month",
    "statement_descriptor": null
  },
  "message": "Product created successfully"
}
```

---

### 3. Get All Stripe Prices
**Endpoint**: `GET /api/stripe/prices`

#### Query Parameters (All Optional):
- `active` (boolean) - Filter by active status
- `product` (string) - Filter by product ID
- `currency` (string) - Filter by currency (e.g., 'usd', 'eur')
- `type` (string) - Filter by type: 'one_time' or 'recurring'
- `limit` (integer) - Number of prices to return (max 100, default 100)
- `starting_after` (string) - Cursor for pagination
- `ending_before` (string) - Cursor for pagination

#### Example Requests:

**Get all prices:**
```
GET /api/stripe/prices
```

**Get recurring prices only:**
```
GET /api/stripe/prices?type=recurring
```

**Get prices for specific product:**
```
GET /api/stripe/prices?product=prod_1234567890
```

**Get USD prices:**
```
GET /api/stripe/prices?currency=usd
```

#### Response Format:
```json
{
  "success": true,
  "prices": [
    {
      "id": "price_1234567890",
      "active": true,
      "currency": "usd",
      "unit_amount": 2999,
      "unit_amount_decimal": "2999",
      "recurring": {
        "interval": "month",
        "interval_count": 1
      },
      "type": "recurring",
      "created": 1640995200,
      "metadata": {},
      "nickname": "Monthly Premium",
      "product": "prod_1234567890",
      "billing_scheme": "per_unit",
      "tax_behavior": "unspecified",
      "product_details": {
        "id": "prod_1234567890",
        "name": "Premium Subscription",
        "description": "Premium subscription plan",
        "active": true,
        "images": [],
        "metadata": {}
      }
    }
  ],
  "pagination": {
    "has_more": false,
    "total_count": 1,
    "limit": 100
  }
}
```

---

### 4. Create Stripe Price
**Endpoint**: `POST /api/stripe/prices`

#### Required Headers:
```
Content-Type: application/json
```

#### Required Body Parameters:
- `product` (string) - Product ID
- `unit_amount` (integer) - Price in cents OR `tiers` (array) - Tiered pricing

#### Optional Body Parameters:
- `currency` (string) - Currency code (default: 'usd')
- `recurring` (object) - Recurring billing settings
- `metadata` (object) - Custom metadata
- `nickname` (string) - Price nickname
- `tax_behavior` (string) - Tax behavior: 'unspecified', 'inclusive', 'exclusive'
- `tiers` (array) - Tiered pricing structure
- `tiers_mode` (string) - Tier mode: 'graduated' or 'volume'
- `billing_scheme` (string) - Billing scheme: 'per_unit' or 'tiered'
- `lookup_key` (string) - Lookup key for the price
- `active` (boolean) - Whether price is active (default: true)

#### Example Request Body (One-time price):
```json
{
  "product": "prod_1234567890",
  "unit_amount": 999,
  "currency": "usd",
  "nickname": "One-time Premium",
  "metadata": {
    "type": "one_time"
  }
}
```

#### Example Request Body (Recurring price):
```json
{
  "product": "prod_1234567890",
  "unit_amount": 2999,
  "currency": "usd",
  "recurring": {
    "interval": "month",
    "interval_count": 1
  },
  "nickname": "Monthly Premium",
  "metadata": {
    "type": "subscription",
    "billing_cycle": "monthly"
  }
}
```

#### Example Request Body (Tiered pricing):
```json
{
  "product": "prod_1234567890",
  "currency": "usd",
  "billing_scheme": "tiered",
  "tiers_mode": "graduated",
  "tiers": [
    {
      "up_to": 10,
      "unit_amount": 2000
    },
    {
      "up_to": 100,
      "unit_amount": 1500
    },
    {
      "up_to": null,
      "unit_amount": 1000
    }
  ],
  "nickname": "Tiered Premium",
  "metadata": {
    "type": "tiered_subscription"
  }
}
```

#### Response Format:
```json
{
  "success": true,
  "price": {
    "id": "price_1234567890",
    "active": true,
    "currency": "usd",
    "unit_amount": 2999,
    "unit_amount_decimal": "2999",
    "recurring": {
      "interval": "month",
      "interval_count": 1
    },
    "type": "recurring",
    "created": 1640995200,
    "metadata": {
      "type": "subscription",
      "billing_cycle": "monthly"
    },
    "nickname": "Monthly Premium",
    "product": "prod_1234567890",
    "billing_scheme": "per_unit",
    "tax_behavior": "unspecified"
  },
  "message": "Price created successfully"
}
```

---

## 🧪 Testing with Postman

### Update Postman Collection
Add these new endpoints to your Postman collection:

1. **GET** `/api/stripe/products` - Get all products
2. **POST** `/api/stripe/products` - Create product
3. **GET** `/api/stripe/prices` - Get all prices
4. **POST** `/api/stripe/prices` - Create price

### Test Sequence
1. **GET** `/api/stripe/products` - See existing products
2. **POST** `/api/stripe/products` - Create a new product
3. **POST** `/api/stripe/prices` - Create a price for the product
4. **GET** `/api/stripe/prices` - Verify price creation
5. **GET** `/api/subscriptions/setup-payment` - Use the new price for subscription

---

## 🔗 Integration with Subscription APIs

### Use Stripe Products in Subscriptions
1. **Create Product**: `POST /api/stripe/products`
2. **Create Price**: `POST /api/stripe/prices` (with recurring settings)
3. **Use in Subscription**: The subscription API will automatically use the Stripe product/price

### Example Workflow
```bash
# 1. Create a product
POST /api/stripe/products
{
  "name": "Premium Plan",
  "description": "Premium subscription plan",
  "type": "service"
}

# 2. Create a recurring price
POST /api/stripe/prices
{
  "product": "prod_1234567890",
  "unit_amount": 2999,
  "currency": "usd",
  "recurring": {
    "interval": "month"
  }
}

# 3. Use in subscription setup
POST /api/subscriptions/setup-payment
{
  "donor_id": 58,
  "organization_id": 17,
  "package_id": 2,
  "customer_email": "test@example.com",
  "customer_name": "Test User"
}
```

---

## 📊 Response Fields Explained

### Product Fields
- `id`: Unique Stripe product ID
- `name`: Product name
- `description`: Product description
- `active`: Whether product is active
- `type`: Product type ('service' or 'good')
- `unit_label`: Unit label (e.g., 'month', 'year')
- `metadata`: Custom key-value pairs
- `images`: Array of image URLs
- `prices`: Array of associated prices

### Price Fields
- `id`: Unique Stripe price ID
- `unit_amount`: Price in cents
- `currency`: Currency code
- `recurring`: Recurring billing settings
- `type`: Price type ('one_time' or 'recurring')
- `nickname`: Human-readable price name
- `billing_scheme`: 'per_unit' or 'tiered'
- `tiers`: Tiered pricing structure
- `product_details`: Associated product information

---

## 🚨 Important Notes

1. **Currency**: All amounts are in cents (e.g., $29.99 = 2999)
2. **Recurring**: Use `recurring` object for subscription prices
3. **Tiers**: Use `tiers` array for volume/graduated pricing
4. **Metadata**: Use for custom data and filtering
5. **Active**: Set `active: false` to disable products/prices
6. **Pagination**: Use `starting_after` and `ending_before` for large lists

---

**New Stripe Products & Prices APIs are ready for use! 🎉**
