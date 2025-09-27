# Complete Subscription Payment APIs Documentation

## Overview

This document provides comprehensive documentation for all subscription payment APIs implemented in the ChangeWorks platform. These APIs handle the complete subscription payment lifecycle including payment methods, billing, payments, refunds, invoices, analytics, and webhooks.

## Table of Contents

1. [Payment Methods API](#payment-methods-api)
2. [Billing API](#billing-api)
3. [Payments API](#payments-api)
4. [Refunds API](#refunds-api)
5. [Invoices API](#invoices-api)
6. [Analytics API](#analytics-api)
7. [Webhooks API](#webhooks-api)
8. [Error Handling](#error-handling)
9. [Testing](#testing)

---

## Payment Methods API

### Base URL
```
/api/subscriptions/payment-methods
```

### GET - List Payment Methods
**URL:** `GET /api/subscriptions/payment-methods`

**Query Parameters:**
- `customer_id` (optional): Stripe customer ID
- `donor_id` (optional): Donor ID (alternative to customer_id)

**Response:**
```json
{
  "success": true,
  "customer": {
    "id": "cus_...",
    "email": "donor@example.com",
    "name": "John Doe"
  },
  "payment_methods": [
    {
      "id": "pm_...",
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242",
        "exp_month": 12,
        "exp_year": 2025
      },
      "created": 1640995200
    }
  ],
  "total": 1
}
```

### POST - Add Payment Method
**URL:** `POST /api/subscriptions/payment-methods`

**Request Body:**
```json
{
  "donor_id": 1,
  "organization_id": 17,
  "payment_method_id": "pm_1234567890abcdef",
  "set_as_default": true
}
```

**Response:**
```json
{
  "success": true,
  "payment_method": {
    "id": "pm_...",
    "type": "card",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2025
    },
    "created": 1640995200
  },
  "customer": {
    "id": "cus_...",
    "email": "donor@example.com",
    "name": "John Doe"
  },
  "message": "Payment method added successfully"
}
```

### DELETE - Remove Payment Method
**URL:** `DELETE /api/subscriptions/payment-methods?payment_method_id=pm_...`

**Response:**
```json
{
  "success": true,
  "message": "Payment method removed successfully"
}
```

---

## Billing API

### Base URL
```
/api/subscriptions/billing
```

### GET - Get Billing Information
**URL:** `GET /api/subscriptions/billing`

**Query Parameters:**
- `subscription_id` (optional): Subscription ID
- `donor_id` (optional): Donor ID (alternative to subscription_id)

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": 1,
    "stripe_subscription_id": "sub_...",
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
      "name": "Corpulate"
    },
    "package": {
      "id": 1,
      "name": "Premium Plan",
      "price": 29.99,
      "currency": "USD"
    }
  },
  "billing": {
    "customer_id": "cus_...",
    "current_period_start": "2025-01-01T00:00:00.000Z",
    "current_period_end": "2025-02-01T00:00:00.000Z",
    "next_billing_date": "2025-02-01T00:00:00.000Z",
    "billing_cycle_anchor": "2025-01-01T00:00:00.000Z",
    "cancel_at_period_end": false,
    "canceled_at": null,
    "trial_start": null,
    "trial_end": null
  },
  "payment_method": {
    "id": "pm_...",
    "type": "card",
    "card": {
      "brand": "visa",
      "last4": "4242",
      "exp_month": 12,
      "exp_year": 2025
    }
  },
  "upcoming_invoice": {
    "id": "in_...",
    "amount_due": 29.99,
    "currency": "USD",
    "period_start": "2025-02-01T00:00:00.000Z",
    "period_end": "2025-03-01T00:00:00.000Z",
    "due_date": "2025-02-01T00:00:00.000Z"
  },
  "recent_invoices": [
    {
      "id": "in_...",
      "number": "INV-001",
      "status": "paid",
      "amount_paid": 29.99,
      "amount_due": 0,
      "currency": "USD",
      "created": "2025-01-01T00:00:00.000Z",
      "due_date": "2025-01-01T00:00:00.000Z",
      "paid_at": "2025-01-01T00:00:00.000Z",
      "hosted_invoice_url": "https://invoice.stripe.com/...",
      "invoice_pdf": "https://pay.stripe.com/..."
    }
  ]
}
```

### PUT - Update Billing Information
**URL:** `PUT /api/subscriptions/billing`

**Request Body:**
```json
{
  "subscription_id": 1,
  "payment_method_id": "pm_1234567890abcdef",
  "billing_cycle_anchor": "2025-02-01T00:00:00.000Z",
  "proration_behavior": "create_prorations"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": 1,
    "stripe_subscription_id": "sub_...",
    "status": "ACTIVE",
    "current_period_start": "2025-01-01T00:00:00.000Z",
    "current_period_end": "2025-02-01T00:00:00.000Z",
    "billing_cycle_anchor": "2025-02-01T00:00:00.000Z",
    "default_payment_method": "pm_1234567890abcdef"
  },
  "message": "Billing information updated successfully"
}
```

---

## Payments API

### Base URL
```
/api/subscriptions/payments
```

### GET - Get Payment History
**URL:** `GET /api/subscriptions/payments`

**Query Parameters:**
- `subscription_id` (optional): Subscription ID
- `donor_id` (optional): Donor ID
- `organization_id` (optional): Organization ID
- `status` (optional): Payment status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "stripe_transaction_id": "pi_...",
      "subscription_id": 1,
      "amount": 29.99,
      "currency": "USD",
      "status": "SUCCEEDED",
      "payment_method": "stripe",
      "description": "Payment for invoice INV-001",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z",
      "subscription": {
        "id": 1,
        "stripe_subscription_id": "sub_...",
        "status": "ACTIVE",
        "donor": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "organization": {
          "id": 17,
          "name": "Corpulate"
        },
        "package": {
          "id": 1,
          "name": "Premium Plan",
          "price": 29.99,
          "currency": "USD"
        }
      }
    }
  ],
  "stripe_payments": [
    {
      "id": "pi_...",
      "amount": 29.99,
      "currency": "USD",
      "status": "succeeded",
      "created": "2025-01-01T00:00:00.000Z",
      "description": "Payment for subscription",
      "metadata": {
        "subscription_id": "sub_...",
        "donor_id": "1"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### POST - Create Manual Payment
**URL:** `POST /api/subscriptions/payments`

**Request Body:**
```json
{
  "subscription_id": 1,
  "amount": 29.99,
  "currency": "USD",
  "payment_method_id": "pm_1234567890abcdef",
  "description": "Manual payment for subscription",
  "metadata": {
    "reason": "manual_payment"
  }
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": 1,
    "stripe_transaction_id": "pi_...",
    "subscription_id": 1,
    "amount": 29.99,
    "currency": "USD",
    "status": "SUCCEEDED",
    "payment_method": "stripe",
    "description": "Manual payment for subscription",
    "created_at": "2025-01-01T00:00:00.000Z",
    "subscription": {
      "id": 1,
      "stripe_subscription_id": "sub_...",
      "status": "ACTIVE",
      "donor": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "organization": {
        "id": 17,
        "name": "Corpulate"
      },
      "package": {
        "id": 1,
        "name": "Premium Plan",
        "price": 29.99,
        "currency": "USD"
      }
    }
  },
  "payment_intent": {
    "id": "pi_...",
    "status": "succeeded",
    "amount": 29.99,
    "currency": "USD",
    "client_secret": "pi_..._secret_..."
  },
  "message": "Payment created successfully"
}
```

---

## Refunds API

### Base URL
```
/api/subscriptions/refunds
```

### GET - Get Refund History
**URL:** `GET /api/subscriptions/refunds`

**Query Parameters:**
- `subscription_id` (optional): Subscription ID
- `donor_id` (optional): Donor ID
- `organization_id` (optional): Organization ID
- `status` (optional): Refund status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "refunds": [
    {
      "id": 1,
      "stripe_transaction_id": "re_...",
      "subscription_id": 1,
      "amount": -29.99,
      "currency": "USD",
      "status": "REFUNDED",
      "payment_method": "stripe",
      "description": "Refund for transaction pi_...",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z",
      "subscription": {
        "id": 1,
        "stripe_subscription_id": "sub_...",
        "status": "ACTIVE",
        "donor": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "organization": {
          "id": 17,
          "name": "Corpulate"
        },
        "package": {
          "id": 1,
          "name": "Premium Plan",
          "price": 29.99,
          "currency": "USD"
        }
      }
    }
  ],
  "stripe_refunds": [
    {
      "id": "re_...",
      "amount": 29.99,
      "currency": "USD",
      "status": "succeeded",
      "reason": "requested_by_customer",
      "created": "2025-01-01T00:00:00.000Z",
      "description": "Refund for subscription payment",
      "metadata": {
        "subscription_id": "sub_...",
        "donor_id": "1"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### POST - Create Refund
**URL:** `POST /api/subscriptions/refunds`

**Request Body:**
```json
{
  "subscription_id": 1,
  "transaction_id": 1,
  "amount": 29.99,
  "reason": "requested_by_customer",
  "metadata": {
    "refund_reason": "customer_request"
  }
}
```

**Response:**
```json
{
  "success": true,
  "refund": {
    "id": 1,
    "stripe_refund_id": "re_...",
    "subscription_id": 1,
    "amount": -29.99,
    "currency": "USD",
    "status": "REFUNDED",
    "description": "Refund for transaction pi_...",
    "created_at": "2025-01-01T00:00:00.000Z",
    "subscription": {
      "id": 1,
      "stripe_subscription_id": "sub_...",
      "status": "ACTIVE",
      "donor": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "organization": {
        "id": 17,
        "name": "Corpulate"
      },
      "package": {
        "id": 1,
        "name": "Premium Plan",
        "price": 29.99,
        "currency": "USD"
      }
    }
  },
  "stripe_refund": {
    "id": "re_...",
    "amount": 29.99,
    "currency": "USD",
    "status": "succeeded",
    "reason": "requested_by_customer",
    "created": "2025-01-01T00:00:00.000Z"
  },
  "message": "Refund created successfully"
}
```

---

## Invoices API

### Base URL
```
/api/subscriptions/invoices
```

### GET - Get Invoices
**URL:** `GET /api/subscriptions/invoices`

**Query Parameters:**
- `subscription_id` (optional): Subscription ID
- `donor_id` (optional): Donor ID
- `organization_id` (optional): Organization ID
- `status` (optional): Invoice status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "invoices": [
    {
      "id": "in_...",
      "number": "INV-001",
      "status": "paid",
      "amount_paid": 29.99,
      "amount_due": 0,
      "total": 29.99,
      "subtotal": 29.99,
      "tax": 0,
      "currency": "USD",
      "created": "2025-01-01T00:00:00.000Z",
      "due_date": "2025-01-01T00:00:00.000Z",
      "paid_at": "2025-01-01T00:00:00.000Z",
      "period_start": "2025-01-01T00:00:00.000Z",
      "period_end": "2025-02-01T00:00:00.000Z",
      "hosted_invoice_url": "https://invoice.stripe.com/...",
      "invoice_pdf": "https://pay.stripe.com/...",
      "subscription": {
        "id": 1,
        "stripe_subscription_id": "sub_...",
        "status": "ACTIVE",
        "donor": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "organization": {
          "id": 17,
          "name": "Corpulate"
        },
        "package": {
          "id": 1,
          "name": "Premium Plan",
          "price": 29.99,
          "currency": "USD"
        }
      },
      "line_items": [
        {
          "id": "il_...",
          "description": "Premium Plan",
          "amount": 29.99,
          "currency": "USD",
          "quantity": 1,
          "period_start": "2025-01-01T00:00:00.000Z",
          "period_end": "2025-02-01T00:00:00.000Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### POST - Create Manual Invoice
**URL:** `POST /api/subscriptions/invoices`

**Request Body:**
```json
{
  "subscription_id": 1,
  "amount": 29.99,
  "currency": "USD",
  "description": "Manual invoice for subscription",
  "due_date": "2025-02-01T00:00:00.000Z",
  "metadata": {
    "reason": "manual_invoice"
  }
}
```

**Response:**
```json
{
  "success": true,
  "invoice": {
    "id": "in_...",
    "number": "INV-002",
    "status": "open",
    "amount_due": 29.99,
    "total": 29.99,
    "currency": "USD",
    "created": "2025-01-01T00:00:00.000Z",
    "due_date": "2025-02-01T00:00:00.000Z",
    "hosted_invoice_url": "https://invoice.stripe.com/...",
    "invoice_pdf": "https://pay.stripe.com/...",
    "subscription": {
      "id": 1,
      "stripe_subscription_id": "sub_...",
      "status": "ACTIVE",
      "donor": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "organization": {
        "id": 17,
        "name": "Corpulate"
      },
      "package": {
        "id": 1,
        "name": "Premium Plan",
        "price": 29.99,
        "currency": "USD"
      }
    }
  },
  "message": "Invoice created successfully"
}
```

---

## Analytics API

### Base URL
```
/api/subscriptions/analytics
```

### GET - Get Subscription Analytics
**URL:** `GET /api/subscriptions/analytics`

**Query Parameters:**
- `organization_id` (optional): Organization ID
- `donor_id` (optional): Donor ID
- `period` (optional): Period in days (default: 30)
- `start_date` (optional): Start date (ISO format)
- `end_date` (optional): End date (ISO format)

**Response:**
```json
{
  "success": true,
  "analytics": {
    "period": {
      "start": "2025-01-01T00:00:00.000Z",
      "end": "2025-01-31T00:00:00.000Z",
      "days": 30
    },
    "overview": {
      "total_subscriptions": 100,
      "active_subscriptions": 85,
      "canceled_subscriptions": 15,
      "active_rate": 85.0
    },
    "subscriptions_by_status": [
      {
        "status": "ACTIVE",
        "count": 85
      },
      {
        "status": "CANCELED",
        "count": 15
      }
    ],
    "subscriptions_by_package": [
      {
        "package_id": 1,
        "package_name": "Premium Plan",
        "package_price": 29.99,
        "package_currency": "USD",
        "count": 50,
        "total_revenue": 1499.50
      },
      {
        "package_id": 2,
        "package_name": "Basic Plan",
        "package_price": 19.99,
        "package_currency": "USD",
        "count": 35,
        "total_revenue": 699.65
      }
    ],
    "revenue": {
      "total_revenue": 2199.15,
      "successful_payments": 95,
      "failed_payments": 5,
      "pending_payments": 0,
      "success_rate": 95.0
    },
    "growth": {
      "new_subscriptions": 25,
      "previous_period_subscriptions": 20,
      "growth_rate": 25.0
    },
    "churn": {
      "canceled_subscriptions": 5,
      "active_at_start": 80,
      "churn_rate": 6.25
    },
    "top_donors": [
      {
        "donor_id": 1,
        "donor_name": "John Doe",
        "donor_email": "john@example.com",
        "total_amount": 299.90,
        "subscription_count": 10
      }
    ],
    "recent_transactions": [
      {
        "id": 1,
        "amount": 29.99,
        "currency": "USD",
        "status": "SUCCEEDED",
        "created_at": "2025-01-01T00:00:00.000Z",
        "subscription": {
          "id": 1,
          "donor": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com"
          },
          "organization": {
            "id": 17,
            "name": "Corpulate"
          },
          "package": {
            "id": 1,
            "name": "Premium Plan",
            "price": 29.99,
            "currency": "USD"
          }
        }
      }
    ]
  }
}
```

---

## Webhooks API

### Base URL
```
/api/subscriptions/webhooks
```

### POST - Handle Stripe Webhooks
**URL:** `POST /api/subscriptions/webhooks`

**Headers:**
- `stripe-signature`: Stripe webhook signature

**Supported Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.created`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `invoice.finalized`
- `invoice.payment_action_required`
- `payment_method.attached`
- `payment_method.detached`
- `charge.succeeded`
- `charge.failed`
- `charge.dispute.created`

**Response:**
```json
{
  "received": true
}
```

---

## Error Handling

All APIs return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Testing

### Test Script
Run the comprehensive test script:
```bash
node test-all-subscription-payment-apis.js
```

### Manual Testing
1. **Create a subscription** using the setup-payment API
2. **Complete payment** via Stripe Checkout
3. **Test all APIs** with the created subscription data

### Test Data
- **Test Card:** `4242424242424242`
- **Expiry:** `12/25`
- **CVC:** `123`

---

## Implementation Status

✅ **All APIs Implemented:**
- Payment Methods API
- Billing API
- Payments API
- Refunds API
- Invoices API
- Analytics API
- Webhooks API

✅ **Features:**
- Complete CRUD operations
- Stripe integration
- Database persistence
- Error handling
- Pagination
- Filtering
- Analytics and reporting
- Webhook processing

✅ **Ready for Production:**
- All APIs tested and working
- Comprehensive error handling
- Stripe webhook integration
- Database schema support
- Documentation complete

---

## Next Steps

1. **Configure Stripe Webhooks** in Stripe Dashboard
2. **Set up environment variables** for production
3. **Test with real payment methods** in production
4. **Monitor webhook events** for subscription lifecycle
5. **Set up monitoring** for API performance and errors

---

**All subscription payment APIs are now complete and ready for use!** 🎉
