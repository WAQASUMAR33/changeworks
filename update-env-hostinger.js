const fs = require('fs');
const path = require('path');

// Update .env file with Hostinger email configuration
const hostingerConfig = `
# Hostinger Email Configuration
EMAIL_SERVER_HOST=mail.rapidtechpro.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=noreply@rapidtechpro.com
EMAIL_SERVER_PASSWORD=DildilPakistan786@786@waqas
EMAIL_FROM=noreply@rapidtechpro.com

# Alternative Hostinger SMTP Ports (for reference)
# EMAIL_SERVER_PORT=25
# EMAIL_SERVER_PORT=465 (SSL/TLS)
`;

// Read the current .env file
const envPath = path.join(__dirname, '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Remove old email configuration
envContent = envContent.replace(/# Mailgun Email Configuration[\s\S]*?# EMAIL_SERVER_PORT=465 \(SSL\/TLS\)\n/g, '');

// Add new configuration after DATABASE_URL
const databaseUrlIndex = envContent.indexOf('DATABASE_URL=');
const nextLineIndex = envContent.indexOf('\n', databaseUrlIndex);
const beforeDatabase = envContent.substring(0, nextLineIndex + 1);
const afterDatabase = envContent.substring(nextLineIndex + 1);

// Insert Hostinger config after DATABASE_URL
const newEnvContent = beforeDatabase + hostingerConfig + afterDatabase;

// Write the updated .env file
fs.writeFileSync(envPath, newEnvContent);

console.log('✅ .env file updated with Hostinger email configuration!');
console.log('📧 Email Server: mail.rapidtechpro.com:587');
console.log('📧 Email User: noreply@rapidtechpro.com');
console.log('📧 Email From: noreply@rapidtechpro.com');
console.log('🔧 Available Ports: 25, 587, 465 (SSL/TLS)');
