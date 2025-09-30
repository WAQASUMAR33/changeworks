# GHL Donor Integration Documentation

## 🎯 Overview

The donor signup API now automatically creates contacts in GoHighLevel (GHL) sub-accounts when a new donor is registered. This integration uses the specific GHL API configuration provided.

## 🔧 GHL API Configuration

### API Endpoint
```
https://rest.gohighlevel.com/v1/contacts/
```

### Headers
```
Authorization: Bearer YOUR_GHL_API_KEY_HERE
Version: 2021-07-28
Content-Type: application/json
```

### Location ID
```
KmqGpcvN7d89PFmvNYrG
```

## 📊 Contact Data Structure

When a donor is created, the following data is sent to GHL:

```json
{
  "email": "donor@example.com",
  "phone": "+15551234567",
  "firstName": "John",
  "lastName": "Doe",
  "city": "Mandi Bahauddin",
  "address1": "Lahore",
  "postalCode": "50400",
  "country": "PK",
  "notes": "Donor registration initiated. ID: 123",
  "customField": {
    "cf_transaction_id": "123",
    "cf_transaction_email": "donor@example.com",
    "cf_transaction_amount": "0 AED",
    "cf_donor_id": "123",
    "cf_organization_id": "17",
    "cf_organization_name": "Corpulate",
    "cf_created_via": "ChangeWorks Donor Registration",
    "cf_created_at": "2025-01-24T12:00:00.000Z",
    "cf_donor_status": "Active",
    "cf_registration_source": "Web Signup"
  },
  "locationId": "KmqGpcvN7d89PFmvNYrG"
}
```

## 🚀 How It Works

### 1. Donor Registration Process
1. **Donor submits registration form** with organization selection
2. **System validates donor data** and creates donor record
3. **GHL contact creation is triggered** automatically
4. **Contact is created in the organization's GHL sub-account**
5. **Response includes GHL contact status**

### 2. GHL Contact Creation Flow
```mermaid
graph TD
    A[Donor Registration] --> B[Create Donor Record]
    B --> C[Get Organization GHL Account]
    C --> D{GHL Account Found?}
    D -->|Yes| E[Prepare GHL Contact Data]
    D -->|No| F[Skip GHL Integration]
    E --> G[Call GHL API]
    G --> H{API Success?}
    H -->|Yes| I[Log Success & Return Contact ID]
    H -->|No| J[Log Error & Continue]
    F --> K[Return Response]
    I --> K
    J --> K
```

## 📝 API Response Structure

The donor registration API now returns additional GHL contact information:

```json
{
  "message": "Donor registered successfully...",
  "donor": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "organization": {
      "id": 17,
      "name": "Corpulate"
    },
    "status": true
  },
  "email_status": {
    "sent": true,
    "error": null,
    "verification_token": "token_here"
  },
  "ghl_contact_status": {
    "created": true,
    "contact_id": "ghl_contact_123",
    "location_id": "KmqGpcvN7d89PFmvNYrG",
    "business_name": "Corpulate",
    "error": null,
    "organization_ghl_available": true,
    "created_in_subaccount": true
  }
}
```

## 🧪 Testing

### Test the Integration
```bash
node test-ghl-donor-integration.js
```

### Test GHL API Directly
```bash
node test-ghl-api.js
```

### Test with Postman
```http
POST http://localhost:3001/api/donor
Content-Type: application/json

{
  "name": "John GHL Test",
  "email": "john_ghl_test@example.com",
  "password": "password123",
  "phone": "+15551234567",
  "city": "Mandi Bahauddin",
  "address": "Lahore",
  "postal_code": "50400",
  "organization_id": 17
}
```

## 🔍 Custom Fields Mapping

| Donor Field | GHL Custom Field | Description |
|-------------|------------------|-------------|
| `id` | `cf_donor_id` | Unique donor ID |
| `id` | `cf_transaction_id` | Transaction/Donor ID |
| `email` | `cf_transaction_email` | Donor email |
| `organization_id` | `cf_organization_id` | Organization ID |
| `organization.name` | `cf_organization_name` | Organization name |
| N/A | `cf_transaction_amount` | Default: "0 AED" |
| N/A | `cf_created_via` | "ChangeWorks Donor Registration" |
| N/A | `cf_created_at` | ISO timestamp |
| N/A | `cf_donor_status` | "Active" |
| N/A | `cf_registration_source` | "Web Signup" |

## ⚠️ Error Handling

### Common Issues and Solutions

#### 1. GHL API Authentication Failed
```
Error: 401 Unauthorized
```
**Solution**: Verify the API key is correct and has proper permissions

#### 2. Location ID Not Found
```
Error: Location not found
```
**Solution**: Ensure the location ID `KmqGpcvN7d89PFmvNYrG` is valid

#### 3. Custom Fields Not Found
```
Error: Custom field not found
```
**Solution**: Create the custom fields in GHL dashboard first

#### 4. Organization GHL Account Missing
```
Error: No GHL account found for organization
```
**Solution**: Ensure the organization has a GHL account configured

## 🔧 Configuration

### Environment Variables
The integration uses hardcoded GHL API credentials for now. To make it configurable:

```env
# GHL API Configuration
GHL_API_URL=https://rest.gohighlevel.com/v1/contacts/
GHL_API_KEY=your_ghl_api_key_here
GHL_LOCATION_ID=KmqGpcvN7d89PFmvNYrG
```

### Database Requirements
Ensure your database has:
- `organizations` table with `ghlId` field
- `gHLAccount` table with organization relationships

## 📊 Monitoring and Logging

### Console Logs
The integration provides detailed logging:

```
🔗 Creating GHL contact for donor: John Doe in organization GHL location: KmqGpcvN7d89PFmvNYrG
=== GHL CONTACT API REQUEST ===
URL: https://rest.gohighlevel.com/v1/contacts/
Location ID: KmqGpcvN7d89PFmvNYrG
Request Data: {...}
✅ GHL contact created successfully: {...}
```

### Error Logging
```
❌ Failed to create GHL contact: {
  error: "Custom field not found",
  status: 400,
  locationId: "KmqGpcvN7d89PFmvNYrG",
  responseData: {...}
}
```

## 🚀 Future Enhancements

### Planned Features
1. **Configurable GHL API credentials** via environment variables
2. **Multiple GHL location support** per organization
3. **Contact update functionality** when donor data changes
4. **GHL webhook integration** for real-time updates
5. **Custom field mapping configuration** via admin panel

### API Improvements
1. **Retry mechanism** for failed GHL API calls
2. **Rate limiting** to respect GHL API limits
3. **Batch contact creation** for multiple donors
4. **Contact deduplication** based on email/phone

## 📞 Support

For issues with GHL integration:
1. Check console logs for detailed error messages
2. Verify GHL API credentials and permissions
3. Ensure custom fields exist in GHL dashboard
4. Test GHL API directly using the test scripts
5. Contact development team for assistance

## 📚 Related Documentation

- [GHL Contact Creation API](./GHL_CONTACT_CREATION_API.md)
- [GHL Setup Guide](./GHL_SETUP_GUIDE.md)
- [Donor API Documentation](./README.md)
- [Email Configuration](./MAILGUN_EMAIL_CONFIG.md)



