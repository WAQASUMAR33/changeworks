# Organization Dashboard System

This document describes the new organization dashboard system that has been added to the ChangeWorks application.

## Overview

The organization dashboard provides a separate interface for organizations to manage their accounts, create GoHighLevel (GHL) sub-accounts, and track their activities. It maintains the same design language as the admin dashboard while providing organization-specific functionality.

## Features

### 1. Organization Authentication
- **Signup Page**: `/organization/signup` - Multi-step registration form with validation
- **Login Page**: `/organization/login` - Secure authentication with forgot password functionality
- **Session Management**: Uses separate localStorage keys (`orgToken`, `orgUser`) to avoid conflicts with admin sessions

### 2. Organization Dashboard
- **Main Dashboard**: `/organization/dashboard` - Overview with stats, quick actions, and recent activity
- **Responsive Layout**: Consistent with admin dashboard design using sidebar and header components
- **Navigation**: Organization-specific menu items including GHL integration, donors, transactions, and reports

### 3. GoHighLevel Integration
- **GHL Client**: `src/app/lib/ghl-client.js` - Axios-based client for GHL API interactions
- **Create Account**: `/organization/dashboard/ghl/create` - Form to create new GHL sub-accounts
- **Manage Accounts**: `/organization/dashboard/ghl/manage` - View and manage existing GHL accounts
- **API Routes**: 
  - `/api/ghl/subaccount` - CRUD operations for GHL sub-accounts
  - `/api/ghl/subaccounts/bulk` - Bulk creation of GHL accounts
  - `/api/organization/ghl-account` - Database operations for GHL account records

### 4. Database Integration
- **GHL Account Model**: New Prisma model to store GHL account details
- **Organization Relations**: Updated Organization model to include GHL accounts relationship
- **Data Persistence**: GHL account details are saved to database after successful API creation

## File Structure

```
src/app/
├── organization/
│   ├── signup/page.js                 # Organization registration
│   ├── login/page.js                  # Organization login
│   └── dashboard/
│       ├── layout.js                  # Dashboard layout with auth check
│       ├── page.js                    # Main dashboard overview
│       ├── components/
│       │   ├── sidebar.js             # Organization sidebar navigation
│       │   └── header.js              # Organization header with notifications
│       └── ghl/
│           ├── create/page.js         # Create GHL account form
│           └── manage/page.js         # Manage GHL accounts
├── api/
│   ├── ghl/
│   │   ├── subaccount/route.js        # GHL sub-account CRUD
│   │   └── subaccounts/bulk/route.js  # Bulk GHL operations
│   ├── organization/
│   │   └── ghl-account/route.js       # Database GHL account operations
│   └── test/
│       └── ghl-subaccount/route.js    # Test endpoint for GHL integration
└── lib/
    └── ghl-client.js                  # GHL API client
```

## Environment Variables

Add these to your `.env.local` file:

```env
# GHL API Configuration
GHL_API_KEY=your_ghl_api_key_here
GHL_BASE_URL=https://services.leadconnectorhq.com

# Database Configuration (if not already present)
DATABASE_URL="mysql://username:password@localhost:3306/change_works"
```

## Database Schema

The following new model has been added to `prisma/schema.prisma`:

```prisma
model GHLAccount {
  id                Int         @id @default(autoincrement())
  organization_id   Int
  ghl_location_id   String      @unique @db.VarChar(100)
  business_name     String      @db.VarChar(255)
  email             String      @db.VarChar(100)
  phone             String?     @db.VarChar(20)
  address           String?     @db.VarChar(255)
  city              String?     @db.VarChar(100)
  state             String?     @db.VarChar(100)
  country           String?     @db.VarChar(100)
  postal_code       String?     @db.VarChar(20)
  website           String?     @db.VarChar(255)
  timezone          String?     @db.VarChar(50)
  ghl_data          String?     @db.Text // JSON string of GHL response data
  status            String      @default("active") @db.VarChar(20)
  created_at        DateTime    @default(now())
  updated_at        DateTime    @updatedAt
  organization      Organization @relation("OrganizationGHLAccounts", fields: [organization_id], references: [id])

  @@map("ghl_accounts")
}
```

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install axios
   ```

2. **Update Database Schema**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

3. **Configure Environment Variables**:
   - Add your GHL API key to `.env.local`
   - Ensure database connection is properly configured

4. **Test the Integration**:
   - Visit `/organization/signup` to create an organization account
   - Login at `/organization/login`
   - Navigate to the dashboard and try creating a GHL account

## API Endpoints

### GHL Integration
- `POST /api/ghl/subaccount` - Create a new GHL sub-account
- `GET /api/ghl/subaccount?locationId={id}` - Get GHL sub-account details
- `PUT /api/ghl/subaccount?locationId={id}` - Update GHL sub-account
- `DELETE /api/ghl/subaccount?locationId={id}` - Delete GHL sub-account
- `POST /api/ghl/subaccounts/bulk` - Create multiple GHL accounts

### Database Operations
- `POST /api/organization/ghl-account` - Save GHL account to database
- `GET /api/organization/ghl-account?organizationId={id}` - Get organization's GHL accounts
- `PUT /api/organization/ghl-account?id={id}` - Update GHL account
- `DELETE /api/organization/ghl-account?id={id}` - Soft delete GHL account

## Security Considerations

1. **Authentication**: Organization sessions are separate from admin sessions
2. **Authorization**: Each organization can only access their own GHL accounts
3. **API Keys**: GHL API keys should be stored securely in environment variables
4. **Data Validation**: All inputs are validated using Zod schemas
5. **Error Handling**: Comprehensive error handling with user-friendly messages

## Styling and Design

The organization dashboard maintains consistency with the admin dashboard:
- Same color scheme and design patterns
- Responsive layout with sidebar navigation
- Framer Motion animations for smooth transitions
- Tailwind CSS for styling
- Lucide React icons for consistent iconography

## Future Enhancements

1. **GHL Webhook Integration**: Real-time updates from GHL
2. **Advanced Analytics**: Detailed reporting on GHL account performance
3. **Bulk Operations**: Enhanced bulk management features
4. **API Rate Limiting**: Implement rate limiting for GHL API calls
5. **Audit Logging**: Track all GHL account operations

## Troubleshooting

### Common Issues

1. **GHL API Errors**: Check API key and base URL configuration
2. **Database Connection**: Ensure DATABASE_URL is correctly set
3. **Authentication Issues**: Clear localStorage and try logging in again
4. **CORS Issues**: Ensure API routes are properly configured

### Testing

Use the test endpoint to verify GHL integration:
```bash
curl -X POST http://localhost:3000/api/test/ghl-subaccount
```

This will create a test GHL account and return the results.
