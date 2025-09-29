import nodemailer from 'nodemailer';

// Email service that reads configuration from environment variables
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Verify email configuration
  async verifyConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email configuration verified' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Send email with HTML and text content
  async sendEmail({ to, subject, html, text, from = null }) {
    try {
      const mailOptions = {
        from: from || process.env.EMAIL_FROM,
        to: to,
        subject: subject,
        html: html,
        text: text
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully'
      };
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send verification email to donor
  async sendVerificationEmail({ donor, verificationToken, verificationLink }) {
    const subject = `Verify Your Email - ChangeWorks Fund`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - ChangeWorks Fund</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            border: 1px solid #e9ecef;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #007bff;
            padding-bottom: 25px;
            margin-bottom: 35px;
          }
          .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 32px;
            font-weight: 600;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .content {
            margin-bottom: 35px;
          }
          .content p {
            margin-bottom: 18px;
            font-size: 16px;
            color: #495057;
          }
          .greeting {
            font-size: 18px;
            font-weight: 500;
            color: #212529;
            margin-bottom: 25px;
          }
          .verification-box {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            padding: 25px;
            border-radius: 10px;
            margin: 25px 0;
            border-left: 4px solid #2196f3;
            text-align: center;
          }
          .verification-box h3 {
            color: #1976d2;
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 18px;
            font-weight: 600;
          }
          .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #2196f3 0%, #21cbf3 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
            transition: all 0.3s ease;
          }
          .verify-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
          }
          .footer {
            border-top: 2px solid #e9ecef;
            padding-top: 25px;
            margin-top: 35px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
          }
          .security-note {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 1px solid #ffeaa7;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #ffc107;
          }
          .security-note p {
            margin: 0;
            color: #856404;
            font-weight: 500;
          }
          .contact-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 25px;
            text-align: center;
          }
          .contact-info h4 {
            color: #007bff;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .contact-info p {
            margin: 5px 0;
            color: #495057;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Hello ${donor.name},</p>
            
            <p>Thank you for signing up with ChangeWorks Fund! To complete your registration and start making a difference, please verify your email address.</p>
            
            <div class="verification-box">
              <h3>Email Verification Required</h3>
              <p>Click the button below to verify your email address and activate your account:</p>
              
              <a href="${verificationLink}" class="verify-button">Verify My Email Address</a>
              
              <p style="margin-top: 15px; font-size: 14px; color: #666;">
                Or copy and paste this link into your browser:<br>
                <span style="word-break: break-all; color: #007bff;">${verificationLink}</span>
              </p>
            </div>
            
            <p>Once verified, you'll be able to:</p>
            <ul style="color: #495057; padding-left: 20px;">
              <li>Access your donor dashboard</li>
              <li>Track your donations and impact</li>
              <li>Manage your giving preferences</li>
              <li>Receive updates about your contributions</li>
            </ul>
            
            <div class="security-note">
              <p><strong>Security Note:</strong> This verification link will expire in 24 hours for your security. If you didn't create an account with us, please ignore this email.</p>
            </div>
          </div>
          
          <div class="footer">
            <div class="contact-info">
              <h4>ChangeWorks Fund</h4>
              <p>Your trusted platform partner for charitable giving</p>
              
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #dee2e6;">
              
              <h4>Contact Information</h4>
              <p><strong>Email:</strong> info@rapidtechpro.com</p>
              <p><strong>Phone:</strong> +923474308859</p>
              <p><strong>Address:</strong> NY-123 Younkers, New York</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Verify Your Email - ChangeWorks Fund

Hello ${donor.name},

Thank you for signing up with ChangeWorks Fund! To complete your registration and start making a difference, please verify your email address.

Email Verification Required:
Click the link below to verify your email address and activate your account:

${verificationLink}

Once verified, you'll be able to:
- Access your donor dashboard
- Track your donations and impact
- Manage your giving preferences
- Receive updates about your contributions

Security Note: This verification link will expire in 24 hours for your security. If you didn't create an account with us, please ignore this email.

---
ChangeWorks Fund
Your trusted platform partner for charitable giving

Contact Information:
Email: info@rapidtechpro.com
Phone: +923474308859
Address: NY-123 Younkers, New York
    `;

    return await this.sendEmail({
      to: donor.email,
      subject: subject,
      html: html,
      text: text
    });
  }

  // Send welcome/thank you email to donor
  async sendWelcomeEmail({ donor, organization, dashboardLink }) {
    const subject = `Welcome to ${organization.name}'s round-up community`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${organization.name}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            border: 1px solid #e9ecef;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #28a745;
            padding-bottom: 25px;
            margin-bottom: 35px;
          }
          .header h1 {
            color: #28a745;
            margin: 0;
            font-size: 32px;
            font-weight: 600;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .content {
            margin-bottom: 35px;
          }
          .content p {
            margin-bottom: 18px;
            font-size: 16px;
            color: #495057;
          }
          .greeting {
            font-size: 18px;
            font-weight: 500;
            color: #212529;
            margin-bottom: 25px;
          }
          .features {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 25px;
            border-radius: 10px;
            margin: 25px 0;
            border-left: 4px solid #28a745;
          }
          .features h3 {
            color: #28a745;
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 18px;
            font-weight: 600;
          }
          .features ul {
            margin: 0;
            padding-left: 20px;
          }
          .features li {
            margin-bottom: 10px;
            color: #495057;
            font-size: 15px;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 25px 0;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            transition: all 0.3s ease;
          }
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
          }
          .footer {
            border-top: 2px solid #e9ecef;
            padding-top: 25px;
            margin-top: 35px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
          }
          .signature {
            margin-top: 30px;
            font-style: italic;
            color: #495057;
          }
          .ps {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 1px solid #ffeaa7;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #ffc107;
          }
          .ps p {
            margin: 0;
            color: #856404;
            font-weight: 500;
          }
          .contact-info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 25px;
            text-align: center;
          }
          .contact-info h4 {
            color: #28a745;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .contact-info p {
            margin: 5px 0;
            color: #495057;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${organization.name}</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Hello ${donor.name},</p>
            
            <p>Thank you for joining <strong>${organization.name}</strong>'s round-up program. Your everyday purchases will now round up to the nearest dollar, turning your spare change into real change for the people we serve.</p>
            
            <p>You can view your donation activity anytime through your personalized Donor Portal on ChangeWorks, our platform partner. That's where you'll be able to:</p>
            
            <div class="features">
              <h3>Your Donor Portal Features:</h3>
              <ul>
                <li>Track your monthly round-up totals</li>
                <li>Adjust or pause your contributions at any time</li>
                <li>Download donation records for your own files</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${dashboardLink}" class="cta-button">Access Your Donor Portal</a>
            </div>
            
            <p>We're so glad to have you as part of our round-up community, where even pennies can create lasting change.</p>
            
            <div class="signature">
              <p>With gratitude,<br>
              <strong>${organization.name} Team</strong></p>
            </div>
            
            <div class="ps">
              <p><strong>P.S.</strong> At the end of each month, we'll send you an update with your 30-day total, so you can see the difference you've made.</p>
            </div>
          </div>
          
          <div class="footer">
            <div class="contact-info">
              <h4>ChangeWorks Fund</h4>
              <p>Your trusted platform partner for charitable giving</p>
              
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #dee2e6;">
              
              <h4>Contact Information</h4>
              <p><strong>Email:</strong> info@rapidtechpro.com</p>
              <p><strong>Phone:</strong> +923474308859</p>
              <p><strong>Address:</strong> NY-123 Younkers, New York</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Welcome to ${organization.name}'s round-up community

Hello ${donor.name},

Thank you for joining ${organization.name}'s round-up program. Your everyday purchases will now round up to the nearest dollar, turning your spare change into real change for the people we serve.

You can view your donation activity anytime through your personalized Donor Portal on ChangeWorks, our platform partner. That's where you'll be able to:

- Track your monthly round-up totals
- Adjust or pause your contributions at any time
- Download donation records for your own files

Access Your Donor Portal: ${dashboardLink}

We're so glad to have you as part of our round-up community, where even pennies can create lasting change.

With gratitude,
${organization.name} Team

P.S. At the end of each month, we'll send you an update with your 30-day total, so you can see the difference you've made.

---
ChangeWorks Fund
Your trusted platform partner for charitable giving

Contact Information:
Email: info@rapidtechpro.com
Phone: +923474308859
Address: NY-123 Younkers, New York
    `;

    return await this.sendEmail({
      to: donor.email,
      subject: subject,
      html: html,
      text: text
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
