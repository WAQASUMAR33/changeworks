# GHL Contact Creation API Documentation

This document provides comprehensive documentation for creating contacts in GoHighLevel (GHL) sub-accounts when donors are created in the ChangeWorks system.

## Overview

The system automatically creates GHL contacts when donors register, using the organization's GHL location ID and the agency API key. This ensures that donor information is properly synced to the organization's GHL sub-account for marketing and communication purposes.

## How It Works

1. **Donor Registration**: When a donor registers, the system identifies their selected organization
2. **GHL Location Lookup**: The system retrieves the organization's GHL location ID from the database
3. **Contact Creation**: Using the agency API key, a contact is created in the organization's GHL sub-account
4. **Data Sync**: All donor information is sent to GHL with custom fields for tracking

## API Endpoints

### 1. Automatic Contact Creation (Donor Registration)
**Endpoint:** `POST /api/donor`

When a donor registers, the system automatically creates a GHL contact in their organization's sub-account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "city": "New York",
  "address": "123 Main St",
  "postal_code": "10001",
  "organization_id": 1
}
```

**Response:**
```json
{
  "message": "Donor registered. Please check your email to verify your account.",
  "donor": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "organization": {
      "id": 1,
      "name": "Education Fund"
    },
    "status": true
  },
  "ghl_contact_status": {
    "created": true,
    "contact_id": "contact_123456",
    "location_id": "location_789012",
    "business_name": "Education Fund GHL",
    "error": null,
    "organization_ghl_available": true,
    "created_in_subaccount": true
  }
}
```

### 2. Manual Contact Creation
**Endpoint:** `POST /api/ghl/contact`

Create a contact in a specific GHL sub-account.

**Request Body:**
```json
{
  "locationId": "location_789012",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "country": "US",
  "postalCode": "10001",
  "source": "ChangeWorks",
  "tags": ["Donor", "ChangeWorks"],
  "customFields": {
    "donor_id": 1,
    "organization_id": 1
  },
  "donor_id": 1,
  "organization_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contact created successfully in GHL sub-account",
  "data": {
    "contactId": "contact_123456",
    "locationId": "location_789012",
    "contact": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    }
  }
}
```

### 3. Bulk Contact Creation
**Endpoint:** `POST /api/ghl/contact/bulk`

Create contacts in multiple GHL sub-accounts for a single donor.

**Request Body:**
```json
{
  "donor_id": 1,
  "locationIds": ["location_789012", "location_345678"],
  "customFields": {
    "special_tag": "VIP"
  },
  "tags": ["Donor", "VIP"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 2 locations for donor John Doe",
  "donor": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "organization": {
      "id": 1,
      "name": "Education Fund"
    }
  },
  "results": {
    "successful": 2,
    "failed": 0,
    "total": 2
  },
  "data": {
    "successful": [
      {
        "locationId": "location_789012",
        "success": true,
        "contactId": "contact_123456",
        "donor": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ],
    "failed": []
  }
}
```

### 4. Auto-Create Contacts
**Endpoint:** `POST /api/ghl/contact/auto-create`

Automatically create contacts using the organization's GHL accounts.

**Request Body:**
```json
{
  "donor_id": 1,
  "organization_id": 1,
  "use_organization_ghl": true,
  "additional_location_ids": ["location_999999"],
  "customFields": {
    "campaign": "Spring 2024"
  },
  "tags": ["Donor", "Spring Campaign"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Auto-created GHL contacts for donor John Doe",
  "donor": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "organization": {
      "id": 1,
      "name": "Education Fund"
    }
  },
  "ghl_accounts_used": [
    {
      "id": 1,
      "location_id": "location_789012",
      "business_name": "Education Fund GHL"
    }
  ],
  "results": {
    "successful": 2,
    "failed": 0,
    "total": 2
  }
}
```

## Contact Data Structure

### Standard Contact Fields
- `firstName`: Donor's first name
- `lastName`: Donor's last name
- `email`: Donor's email address
- `phone`: Donor's phone number
- `address`: Donor's street address
- `city`: Donor's city
- `state`: Donor's state (defaults to empty)
- `country`: Donor's country (defaults to "US")
- `postalCode`: Donor's postal code
- `source`: Source of the contact (e.g., "ChangeWorks Donor Signup")
- `tags`: Array of tags for categorization

### Custom Fields
The system automatically adds these custom fields to track the contact:

- `donor_id`: Internal donor ID
- `organization_id`: Internal organization ID
- `organization_name`: Organization name
- `created_via`: How the contact was created
- `created_at`: Timestamp of creation
- `donor_status`: Status of the donor
- `registration_source`: Source of registration

## Environment Variables

### Required
```env
# GHL Agency API Key (for sub-account access)
GHL_AGENCY_API_KEY=your_agency_api_key_here

# GHL Base URL
GHL_BASE_URL=https://services.leadconnectorhq.com
```

### Optional
```env
# Fallback contact API key (if not using agency key)
GHL_CONTACT_API_KEY=your_contact_api_key_here

# Location-specific tokens (JSON format)
GHL_LOCATION_TOKENS={"location_123": "token_123", "location_456": "token_456"}
```

## Database Schema

### GHLAccount Model
```prisma
model GHLAccount {
  id              Int          @id @default(autoincrement())
  organization_id Int
  ghl_location_id String       @unique
  business_name   String
  email           String
  phone           String?
  address         String?
  city            String?
  state           String?
  country         String?
  postal_code     String?
  website         String?
  timezone        String?
  ghl_data        String?
  status          String       @default("active")
  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt
  api_key         String?
  organization    Organization @relation(fields: [organization_id], references: [id])
}
```

## Error Handling

### Common Errors

1. **No GHL Account Found**
   ```json
   {
     "success": false,
     "message": "No GHL account found for organization",
     "error": "No GHL account found for organization"
   }
   ```

2. **Invalid Location ID**
   ```json
   {
     "success": false,
     "message": "Failed to create contact in GHL sub-account",
     "error": "Invalid location ID",
     "statusCode": 400
   }
   ```

3. **Duplicate Contact**
   ```json
   {
     "success": false,
     "message": "Failed to create contact in GHL sub-account",
     "error": "Contact with this email already exists",
     "statusCode": 409
   }
   ```

## Integration Flow

### 1. Donor Registration Flow
```
Donor Registration → Organization Lookup → GHL Account Lookup → Contact Creation → Response
```

### 2. Manual Contact Creation Flow
```
API Request → Validation → GHL API Call → Response
```

### 3. Bulk Contact Creation Flow
```
API Request → Donor Lookup → Multiple GHL API Calls → Aggregated Response
```

## Best Practices

### 1. Error Handling
- Always check the `ghl_contact_status` in donor registration responses
- Implement retry logic for failed contact creations
- Log all GHL API interactions for debugging

### 2. Rate Limiting
- The system includes 1-second delays between bulk operations
- Monitor GHL API rate limits
- Consider implementing exponential backoff for retries

### 3. Data Validation
- Validate all contact data before sending to GHL
- Ensure email addresses are properly formatted
- Check for required fields before API calls

### 4. Monitoring
- Monitor contact creation success rates
- Set up alerts for failed GHL integrations
- Track contact creation metrics

## Testing

### Test Scenarios

1. **Successful Contact Creation**
   - Create donor with valid organization
   - Verify GHL contact is created
   - Check custom fields are populated

2. **Missing GHL Account**
   - Create donor with organization without GHL account
   - Verify graceful error handling
   - Ensure donor is still created

3. **Invalid Data**
   - Test with invalid email format
   - Test with missing required fields
   - Verify validation errors

4. **Bulk Operations**
   - Test bulk contact creation
   - Verify rate limiting works
   - Check partial success handling

### Test Data
```json
{
  "name": "Test Donor",
  "email": "test@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "city": "Test City",
  "address": "123 Test St",
  "postal_code": "12345",
  "organization_id": 1
}
```

## Troubleshooting

### Common Issues

1. **Contact Not Created**
   - Check if organization has GHL account
   - Verify GHL_AGENCY_API_KEY is set
   - Check GHL API logs

2. **Invalid API Key**
   - Ensure agency API key is valid
   - Check key permissions for sub-account access
   - Verify key format

3. **Rate Limiting**
   - Reduce bulk operation frequency
   - Implement proper delays
   - Monitor API usage

### Debug Information
The system logs detailed information for debugging:
- GHL API requests and responses
- Contact creation attempts
- Error details and stack traces
- Organization and donor information

## Support

For issues or questions:
1. Check application logs for GHL API interactions
2. Verify environment variables are set correctly
3. Test with GHL API directly to isolate issues
4. Review organization's GHL account configuration
