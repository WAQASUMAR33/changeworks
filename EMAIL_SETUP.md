# Email Setup for Password Reset

## 🔧 Environment Variables Required

To enable password reset functionality, you need to add these environment variables to your `.env` file:

```env
# Email Server Configuration
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# App URL (for reset links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📧 Gmail Setup (Recommended)

### 1. Enable 2-Factor Authentication
- Go to your Google Account settings
- Enable 2-Factor Authentication

### 2. Generate App Password
- Go to Google Account → Security → App passwords
- Generate a new app password for "Mail"
- Use this password as `EMAIL_SERVER_PASSWORD`

### 3. Update .env File
```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-gmail@gmail.com
EMAIL_SERVER_PASSWORD=your-16-digit-app-password
EMAIL_FROM=your-gmail@gmail.com
```

## 🔄 Other Email Providers

### Outlook/Hotmail
```env
EMAIL_SERVER_HOST=smtp-mail.outlook.com
EMAIL_SERVER_PORT=587
```

### Yahoo
```env
EMAIL_SERVER_HOST=smtp.mail.yahoo.com
EMAIL_SERVER_PORT=587
```

### Custom SMTP Server
```env
EMAIL_SERVER_HOST=your-smtp-server.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-username
EMAIL_SERVER_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

## 🧪 Testing

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Go to login page** and click "Forgot Password"

3. **Enter your email** and submit

4. **Check your email** for the password reset link

5. **Click the link** to reset your password

## 🛡️ Security Features

- **Token Expiration**: Reset tokens expire after 1 hour
- **Secure Hashing**: Tokens are hashed using bcrypt
- **One-time Use**: Tokens are deleted after use
- **Email Validation**: Only sends to registered email addresses

## 🚨 Troubleshooting

### Email Not Sending
- Check your environment variables
- Verify your email credentials
- Check your email provider's security settings
- Look for error messages in the console

### Development Mode
In development, if email sending fails, the API will return the reset URL in the response for testing purposes.

### Production
In production, make sure to:
- Use a reliable email service (Gmail, SendGrid, etc.)
- Set up proper DNS records
- Monitor email delivery rates
- Handle email sending errors gracefully

## 📱 Email Template

The password reset email includes:
- Professional ChangeWorks branding
- Clear call-to-action button
- Fallback text link
- Security information
- Expiration notice
