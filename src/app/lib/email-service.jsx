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

  // Send welcome email to donor
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
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
          }
          .content {
            margin-bottom: 30px;
          }
          .content p {
            margin-bottom: 15px;
            font-size: 16px;
          }
          .features {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .features h3 {
            color: #007bff;
            margin-top: 0;
          }
          .features ul {
            margin: 0;
            padding-left: 20px;
          }
          .features li {
            margin-bottom: 8px;
          }
          .cta-button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            border-top: 1px solid #eee;
            padding-top: 20px;
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
          .signature {
            margin-top: 30px;
            font-style: italic;
          }
          .ps {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${organization.name}</h1>
          </div>
          
          <div class="content">
            <p>Hello ${donor.name},</p>
            
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
            <p><strong>ChangeWorks Fund</strong><br>
            Your trusted platform partner for charitable giving</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            
            <p><strong>RapidTechPro</strong><br>
            Punjab Center Mandi Bahauddin<br>
            +923474308859</p>
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

RapidTechPro
Punjab Center Mandi Bahauddin
+923474308859
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
