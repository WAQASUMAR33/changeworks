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
      const fromAddress = from || process.env.EMAIL_FROM || 'info@changeworksfund.org';
      
      console.log('📧 Sending email:', {
        to,
        subject,
        from: fromAddress,
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT
      });

      const mailOptions = {
        from: fromAddress,
        to: to,
        subject: subject,
        html: html,
        text: text
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent info:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully'
      };
    } catch (error) {
      console.error('❌ Email sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper to resolve logo URL
  getOrganizationLogoUrl(organization) {
    if (!organization?.imageUrl) return null;
    if (organization.imageUrl.startsWith('http')) return organization.imageUrl;
    
    // Prioritize configured image base URL, fallback to app URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://app.changeworksfund.org';
    // Ensure no double slash
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = organization.imageUrl.startsWith('/') ? organization.imageUrl : `/${organization.imageUrl}`;
    
    return `${cleanBase}${cleanPath}`;
  }

  // Centralized HTML generator
  generateEmailHtml(content, organization, title = '') {
    const logoUrl = this.getOrganizationLogoUrl(organization);
    const orgName = organization?.name || 'ChangeWorks Fund';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #f3f2ef; /* Light gray background */
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          /* Button style for compatibility */
          .button {
            display: inline-block;
            background-color: #302E56;
            color: #ffffff !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 24px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .button:hover {
            background-color: #201e3b;
          }
          /* List styling */
          ul {
            padding-left: 20px;
            margin-bottom: 1.5em;
          }
          li {
            margin-bottom: 8px;
          }
          /* Highlight box */
          .highlight-box {
            background-color: #f8f9fa;
            border-left: 4px solid #302E56;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          /* Media Query for mobile */
          @media only screen and (max-width: 600px) {
            .main-table {
              width: 100% !important;
            }
            .content-cell {
              padding: 20px !important;
            }
          }
        </style>
      </head>
      <body style="background-color: #f3f2ef; margin: 0; padding: 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f2ef;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <!-- Main Card -->
              <table class="main-table" role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; margin: 0 auto;">
                <tr>
                  <td class="content-cell" style="padding: 40px; text-align: left; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; color: #333; line-height: 1.6;">
                    ${organization ? `
                      <div style="text-align: center; margin-bottom: 30px;">
                        ${logoUrl ? `<img src="${logoUrl}" alt="${orgName}" style="max-height: 80px; max-width: 200px; height: auto; border: 0; display: inline-block; margin-bottom: 15px;">` : ''}
                        <h2 style="color: #302E56; margin: 0; font-size: 24px; font-weight: 700;">${orgName}</h2>
                      </div>
                    ` : ''}
                    
                    ${content}
                  </td>
                </tr>
              </table>
              
              <!-- Footer -->
              <div style="margin-top: 20px; text-align: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #666;">
                 <p style="margin: 5px 0;">ChangeWorks Fund</p>
                 <p style="margin: 5px 0;">Your trusted platform partner for charitable giving</p>
                 <p style="margin: 5px 0;">5830 E 2nd St. STE 7000 #29896, Casper, WY 82609</p>
                 <p style="margin: 5px 0;"><a href="#" style="color: #666; text-decoration: underline;">Unsubscribe</a></p>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  // Send Round-Up Welcome Email
  async sendWelcomeEmail({ donor, organization, dashboardLink }) {
    const orgName = organization?.name || 'ChangeWorks Fund';
    const subject = `Welcome to ${orgName}'s Round-Up Community`;

    const content = `
      <h1 style="color: #302E56; font-size: 24px; margin-bottom: 20px;">Welcome to ${orgName}'s Round-Up Community</h1>
      
      <p>Hello ${donor.name},</p>
      
      <p>Thank you for joining ${orgName}'s round-up program. Your everyday purchases will now round up to the nearest dollar, turning your spare change into real change for the people we serve.</p>
      
      <p>You can view your donation activity anytime through your personalized Donor Portal <a href="${dashboardLink}" style="color: #302E56; text-decoration: underline;">[Dashboard Link]</a> on ChangeWorks, our platform partner. That's where you'll be able to:</p>
      
      <div class="highlight-box">
        <h3 style="color: #302E56; margin-top: 0;">Your Donor Portal Features:</h3>
        <ul>
          <li>Track your monthly round-up totals</li>
          <li>Adjust or pause your contributions at any time</li>
          <li>Download donation records for your own files</li>
        </ul>
      </div>
      
      <div class="center-text">
        <a href="${dashboardLink}" class="button">Access Your Donor Portal</a>
      </div>
      
      <p>We're so glad to have you as part of our round-up community, where even pennies can create lasting change.</p>
      
      <p><strong>With gratitude,<br>${orgName} Team</strong></p>
      
      <div class="highlight-box" style="background: #e8f4fd; border-left-color: #302E56;">
        <p style="margin: 0; color: #302E56;"><strong>P.S.</strong> At the end of each month, we'll send you an update with your 30-day total, so you can see the difference you've made.</p>
      </div>
    `;

    const html = this.generateEmailHtml(content, organization, subject);

    const text = `
Welcome to ${orgName}'s Round-Up Community

Hello ${donor.name},

Thank you for joining ${orgName}'s round-up program. Your everyday purchases will now round up to the nearest dollar, turning your spare change into real change for the people we serve.

You can view your donation activity anytime through your personalized Donor Portal [Dashboard Link] on ChangeWorks, our platform partner. That's where you'll be able to:

- Track your monthly round-up totals
- Adjust or pause your contributions at any time
- Download donation records for your own files

Access Your Donor Portal: ${dashboardLink}

We're so glad to have you as part of our round-up community, where even pennies can create lasting change.

With gratitude,
${orgName} Team

P.S. At the end of each month, we'll send you an update with your 30-day total, so you can see the difference you've made.

---
ChangeWorks Fund
Your trusted platform partner for charitable giving

Contact Information:
Email: support@changeworksfund.org
Address: 5830 E 2nd St. STE 7000 #29896, Casper, WY 82609
Unsubscribe
    `;

    return await this.sendEmail({
      to: donor.email,
      subject: subject,
      html: html,
      text: text
    });
  }

  // Send verification email to donor (formatted as One-Time Donation Receipt)
  async sendVerificationEmail({ donor, verificationToken, verificationLink, organization, amount, campaignName, transactionId, paymentMethod, impactDescription, donationDate }) {
    const orgName = organization?.name || 'ChangeWorks Fund';
    // Subject as requested
    const subject = `Thanks for Your One-Time Donation to ${orgName}`;
    
    // Default values for missing donation details (since this might be called from signup without donation info)
    const safeAmount = amount || 'X';
    const safeCampaign = campaignName || 'General Campaign';
    const safeTransactionId = transactionId || 'N/A';
    const safeDate = donationDate || new Date().toLocaleDateString();
    const safeTime = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' });
    const safePaymentMethod = paymentMethod || 'Card ending in XXXX';
    const directorName = (organization?.firstName && organization?.lastName) 
      ? `${organization.firstName} ${organization.lastName}` 
      : 'Director';

    const content = `
      <p style="font-size: 18px; font-weight: 500; color: #212529; margin-bottom: 25px;">Dear ${donor.name},</p>
      
      <p>Thank you for your generous donation to ${orgName}. Your support helps ensure we can continue showing up for people when help is needed.</p>
      
      <p>Your contribution strengthens our ability to provide timely assistance, respond to changing needs, and operate with care and consistency. Support like yours allows us to focus on what matters most: putting resources to work where they can do the most good.</p>
      
      <div class="highlight-box">
        <h3 style="color: #302E56; margin-top: 0; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">Your donation details</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin-bottom: 8px;"><strong>Organization:</strong> ${orgName}</li>
          <li style="margin-bottom: 8px;"><strong>Campaign:</strong> ${safeCampaign}</li>
          <li style="margin-bottom: 8px;"><strong>Donor:</strong> ${donor.name}</li>
          <li style="margin-bottom: 8px;"><strong>Amount:</strong> $${safeAmount}</li>
          ${impactDescription ? `<li style="margin-bottom: 8px;"><strong>Impact:</strong> ${impactDescription}</li>` : ''}
          <li style="margin-bottom: 8px;"><strong>Period:</strong> ${safeDate}</li>
          <li style="margin-bottom: 8px;"><strong>Receipt #:</strong> ${safeTransactionId}</li>
          <li style="margin-bottom: 8px;"><strong>Date:</strong> ${safeDate} at ${safeTime} EST</li>
          <li style="margin-bottom: 8px;"><strong>Payment method:</strong> ${safePaymentMethod}</li>
        </ul>
      </div>
      
      <p>You can access your donor account at any time to update your contribution amount, change your payment method, or resume donations. Step-by-step instructions are available through our trusted donation partner, ChangeWorks.</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${verificationLink}" class="button">CLICK HERE TO ACCESS YOUR DONOR DASHBOARD</a>
      </div>
      
      <p>At ${orgName}, our mission is straightforward: to use every contribution responsibly and thoughtfully in support of the people and communities we serve. We’re grateful for your trust and would be glad to keep you informed about the impact of your giving.</p>
      
      <p>${orgName} is a registered 501(c)(3) nonprofit organization in the United States (EIN: 99-XXXXXXX). Your donation may be tax-deductible; please consult a tax professional regarding your specific situation.</p>
      
      <div style="margin-top: 30px; font-style: italic; color: #495057;">
        <p>With sincere gratitude,</p>
        <p><strong>${directorName}</strong><br>
        ChangeWorks<br>
        Your trusted platform partner for charitable giving</p>
      </div>
    `;

    // Pass null for organization to generateEmailHtml to suppress Org Logo and Name in the branding header/footer
    // The content itself contains the Org Name as requested
    const html = this.generateEmailHtml(content, null, subject);

    const text = `
Thanks for Your One-Time Donation to ${orgName}

Dear ${donor.name},

Thank you for your generous donation to ${orgName}. Your support helps ensure we can continue showing up for people when help is needed.

Your contribution strengthens our ability to provide timely assistance, respond to changing needs, and operate with care and consistency. Support like yours allows us to focus on what matters most: putting resources to work where they can do the most good.

Your donation details
● Organization: ${orgName}
● Campaign: ${safeCampaign}
● Donor: ${donor.name}
● Amount: $${safeAmount}
${impactDescription ? `● Impact: ${impactDescription}` : ''}
● Period: ${safeDate}
● Receipt #: ${safeTransactionId}
● Date: ${safeDate} at ${safeTime} EST
● Payment method: ${safePaymentMethod}

You can access your donor account at any time to update your contribution amount, change your payment method, or resume donations. Step-by-step instructions are available through our trusted donation partner, ChangeWorks.

CLICK HERE TO ACCESS YOUR DONOR DASHBOARD: ${verificationLink}

At ${orgName}, our mission is straightforward: to use every contribution responsibly and thoughtfully in support of the people and communities we serve. We’re grateful for your trust and would be glad to keep you informed about the impact of your giving.

${orgName} is a registered 501(c)(3) nonprofit organization in the United States (EIN: 99-XXXXXXX). Your donation may be tax-deductible; please consult a tax professional regarding your specific situation.

With sincere gratitude,
${directorName}
ChangeWorks
Your trusted platform partner for charitable giving

________________________________________
Contact Information
Email: support@changeworksfund.org
5830 E 2nd St. STE 7000 #29896
Casper, WY 82609
Unsubscribe
    `;

    return await this.sendEmail({
      to: donor.email,
      subject: subject,
      html: html,
      text: text
    });
  }

  // Send monthly impact email to donor
  async sendMonthlyImpactEmail({ donor, organization, dashboardLink, month, totalAmount }) {
    const subject = `See what change your change made this month`;
    
    const content = `
      <p style="font-size: 18px; font-weight: 500; color: #212529; margin-bottom: 25px;">Hello ${donor.name},</p>
      
      <div style="background: linear-gradient(135deg, #302E56 0%, #4A487A 100%); color: white; padding: 30px; border-radius: 15px; margin: 25px 0; text-align: center; box-shadow: 0 8px 25px rgba(48, 46, 86, 0.3);">
        <h2 style="margin: 0 0 15px 0; font-size: 24px; font-weight: 600;">Your Impact This Month</h2>
        <div style="font-size: 36px; font-weight: 700; margin: 10px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">$${totalAmount}</div>
        <p style="font-size: 18px; opacity: 0.9; margin: 0;">${month}</p>
      </div>
      
      <p>Your everyday purchases made a difference in <strong>${month}</strong>. Altogether, your round-ups added up to <strong>$${totalAmount}</strong> for <strong>${organization.name}</strong>.</p>
      
      <p>If you want to see details of your round-up donations or make changes, log into your Donor Portal <a href="${dashboardLink}" style="color: #302E56; text-decoration: underline;">[Dashboard Link]</a> on ChangeWorks, our platform partner. That's where you can see your giving history, adjust settings, or download your records anytime.</p>
      
      <div style="text-align: center;">
        <a href="${dashboardLink}" class="button">Access Your Donor Portal</a>
      </div>
      
      <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
        <p style="margin: 0; color: #856404; font-weight: 500; font-size: 16px;">Thank you for carrying our mission forward with every swipe, tap, and purchase. Small change, month after month, can create lasting change in our community.</p>
      </div>
      
      <div style="margin-top: 30px; font-style: italic; color: #495057;">
        <p>With gratitude,<br>
        <strong>${organization.name} Team</strong></p>
      </div>
    `;

    const html = this.generateEmailHtml(content, organization, 'Your Monthly Impact');

    const text = `
See what change your change made this month

Hello ${donor.name},

Your everyday purchases made a difference in ${month}. Altogether, your round-ups added up to $${totalAmount} for ${organization.name}.

If you want to see details of your round-up donations or make changes, log into your Donor Portal [Dashboard Link] on ChangeWorks, our platform partner. That's where you can see your giving history, adjust settings, or download your records anytime.

Access Your Donor Portal: ${dashboardLink}

Thank you for carrying our mission forward with every swipe, tap, and purchase. Small change, month after month, can create lasting change in our community.

With gratitude,
${organization.name} Team

---
ChangeWorks Fund
Your trusted platform partner for charitable giving

Contact Information:
Email: support@changeworksfund.org

Address: 5830 E 2nd St. STE 7000 #29896, Casper, WY 82609
    `;

    return await this.sendEmail({
      to: donor.email,
      subject: subject,
      html: html,
      text: text
    });
  }

  // Send recurring donation confirmation email
  async sendRecurringDonationEmail({ donor, organization, amount, startDate, transactionId, dashboardLink }) {
    const subject = `Thanks for Your Recurring Monthly Donation to ${organization.name}`;

    const formattedDate = new Date(startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const content = `
      <p>Hello ${donor.name || ''}!</p>

      <p>Thank you for your generous recurring monthly donation to ${organization.name}. Your support helps us continue our mission and make a difference.</p>

      <p>Here are the details of your recurring donation:</p>
      <ul style="list-style: none; padding: 0;">
        <li style="margin-bottom: 8px;"><strong>Organization:</strong> ${organization.name}</li>
        <li style="margin-bottom: 8px;"><strong>Donation Amount:</strong> $${amount}</li>
        <li style="margin-bottom: 8px;"><strong>Frequency:</strong> Monthly</li>
        <li style="margin-bottom: 8px;"><strong>Start Date:</strong> ${formattedDate}</li>
        <li style="margin-bottom: 8px;"><strong>Transaction ID:</strong> ${transactionId}</li>
      </ul>

      <p>You will receive a receipt for each monthly payment. You can manage or cancel your subscription at any time through your donor dashboard.</p>
      
      <div style="text-align: center;">
        <a href="${dashboardLink}" class="button">Manage Subscription</a>
      </div>

      <p>If you have any questions, please contact us at ${organization.email || 'support'} ${organization.phone ? ' or ' + organization.phone : ''}.</p>

      <p>Sincerely,<br>
      The ${organization.name} Team</p>
    `;

    const html = this.generateEmailHtml(content, organization, subject);

    const text = `
Thanks for Your Recurring Monthly Donation to ${organization.name}

Hello ${donor.name || ''}!

Thank you for your generous recurring monthly donation to ${organization.name}. Your support helps us continue our mission and make a difference.

Here are the details of your recurring donation:
• Organization: ${organization.name}
• Donation Amount: $${amount}
• Frequency: Monthly
• Start Date: ${formattedDate}
• Transaction ID: ${transactionId}

You will receive a receipt for each monthly payment. You can manage or cancel your subscription at any time through your donor dashboard:
${dashboardLink}

If you have any questions, please contact us at ${organization.email || 'support'} ${organization.phone ? ' or ' + organization.phone : ''}.

Sincerely,
The ${organization.name} Team

---
ChangeWorks Fund
Your trusted platform partner for charitable giving

Contact Information:
Email: support@changeworksfund.org
    `;

    return await this.sendEmail({
      to: donor.email,
      subject: subject,
      html: html,
      text: text
    });
  }

  // Send one-time donation confirmation email
  async sendOneTimeDonationEmail({ donor, organization, dashboardLink, amount, donationDate, transactionId, paymentMethod, campaignName }) {
    const subject = `Thanks for Your One-Time Donation to ${organization.name}`;
    
    const content = `
      <p>Dear ${donor.name},</p>
      
      <p>Thank you for your generous donation to ${organization.name}. Your support helps ensure we can continue showing up for people when help is needed.</p>
      
      <p>Your contribution strengthens our ability to provide timely assistance, respond to changing needs, and operate with care and consistency. Support like yours allows us to focus on what matters most: putting resources to work where they can do the most good.</p>
      
      <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Your donation details</h3>
      
      <ul style="list-style: none; padding: 0;">
        <li style="margin-bottom: 8px;"><strong>Organization:</strong> ${organization.name}</li>
        <li style="margin-bottom: 8px;"><strong>Campaign:</strong> ${campaignName || 'General Donation'}</li>
        <li style="margin-bottom: 8px;"><strong>Donor:</strong> ${donor.name}</li>
        <li style="margin-bottom: 8px;"><strong>Amount:</strong> $${amount}</li>
        <li style="margin-bottom: 8px;"><strong>Impact:</strong> Your donation supports our core mission.</li>
        <li style="margin-bottom: 8px;"><strong>Period:</strong> ${donationDate}</li>
        <li style="margin-bottom: 8px;"><strong>Receipt #:</strong> ${transactionId || 'N/A'}</li>
        <li style="margin-bottom: 8px;"><strong>Date:</strong> ${donationDate}</li>
        <li style="margin-bottom: 8px;"><strong>Payment method:</strong> ${paymentMethod || 'Credit Card'}</li>
      </ul>
      
      <p>You can access your donor account at any time to update your contribution amount, change your payment method, or resume donations. Step-by-step instructions are available through our trusted donation partner, ChangeWorks.</p>
      
      <div style="text-align: center;">
        <a href="${dashboardLink}" class="button">CLICK HERE TO ACCESS YOUR DONOR DASHBOARD</a>
      </div>
      
      <p>At ${organization.name}, our mission is straightforward: to use every contribution responsibly and thoughtfully in support of the people and communities we serve. We’re grateful for your trust and would be glad to keep you informed about the impact of your giving.</p>
      
      <p>${organization.name} is a registered 501(c)(3) nonprofit organization in the United States (EIN: ${organization.ein || 'XX-XXXXXXX'}). Your donation may be tax-deductible; please consult a tax professional regarding your specific situation.</p>
      
      <p>With sincere gratitude,</p>
      
      <p>
        <strong>${organization.firstName ? `${organization.firstName} ${organization.lastName}` : 'Organization Director'}</strong><br>
        ${organization.title || 'Director'}<br>
        ${organization.name}
      </p>
    `;

    // Suppress logo for one-time donation email as requested previously
    // Pass null for organization to generateEmailHtml to suppress Org Logo and Name in the branding header/footer
    const html = this.generateEmailHtml(content, null, subject);

    const text = `
Thanks for Your One-Time Donation

Dear ${donor.name},

Thank you for your generous donation to ${organization.name}. Your support helps ensure we can continue showing up for people when help is needed.

Your contribution strengthens our ability to provide timely assistance, respond to changing needs, and operate with care and consistency. Support like yours allows us to focus on what matters most: putting resources to work where they can do the most good.

Your donation details
Organization: ${organization.name}
Campaign: ${campaignName || 'General Donation'}
Donor: ${donor.name}
Amount: $${amount}
Impact: Your donation supports our core mission.
Period: ${donationDate}
Receipt #: ${transactionId || 'N/A'}
Date: ${donationDate}
Payment method: ${paymentMethod || 'Credit Card'}

You can access your donor account at any time to update your contribution amount, change your payment method, or resume donations. Step-by-step instructions are available through our trusted donation partner, ChangeWorks.

CLICK HERE TO ACCESS YOUR DONOR DASHBOARD: ${dashboardLink}

At ${organization.name}, our mission is straightforward: to use every contribution responsibly and thoughtfully in support of the people and communities we serve. We’re grateful for your trust and would be glad to keep you informed about the impact of your giving.

${organization.name} is a registered 501(c)(3) nonprofit organization in the United States (EIN: ${organization.ein || 'XX-XXXXXXX'}). Your donation may be tax-deductible; please consult a tax professional regarding your specific situation.

With sincere gratitude,

${organization.firstName ? `${organization.firstName} ${organization.lastName}` : 'Organization Director'}
${organization.title || 'Director'}
${organization.name}

----------------------------------------
ChangeWorks
Your trusted platform partner for charitable giving

Contact Information
Email: support@changeworksfund.org
5830 E 2nd St. STE 7000 #29896
Casper, WY 82609
Unsubscribe
    `;

    return await this.sendEmail({
      to: donor.email,
      subject: subject,
      html: html,
      text: text
    });
  }

  // Send recurring payment confirmation email
  async sendRecurringPaymentEmail({ donor, organization, dashboardLink, amount, paymentDate, nextPaymentDate }) {
    const subject = `Your recurring donation to ${organization.name} has been processed`;
    
    const content = `
      <p style="font-size: 18px; font-weight: 500; color: #212529; margin-bottom: 25px;">Hello ${donor.name},</p>
      
      <div style="background: linear-gradient(135deg, #302E56 0%, #4A487A 100%); color: white; padding: 30px; border-radius: 15px; margin: 25px 0; text-align: center; box-shadow: 0 8px 25px rgba(48, 46, 86, 0.3);">
        <h2 style="margin: 0 0 15px 0; font-size: 24px; font-weight: 600; color: white;">Payment Processed Successfully!</h2>
        <div style="font-size: 36px; font-weight: 700; margin: 10px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">$${amount}</div>
        <p style="font-size: 18px; opacity: 0.9; margin: 0; color: white;">${paymentDate}</p>
      </div>
      
      <p>Your recurring donation of <strong>$${amount}</strong> to <strong>${organization.name}</strong> has been processed successfully.</p>
      
      <div style="background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%); border: 1px solid #bee5eb; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #17a2b8; text-align: center;">
        <p style="margin: 0; color: #0c5460; font-weight: 500; font-size: 16px;"><strong>Next Payment:</strong> ${nextPaymentDate}</p>
      </div>
      
      <p>If you want to see details of your recurring donations or make changes, log into your Donor Portal <a href="${dashboardLink}" style="color: #302E56; text-decoration: underline;">[Dashboard Link]</a> on ChangeWorks, our platform partner. That's where you can see your giving history, adjust settings, or download your records anytime.</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${dashboardLink}" class="button">Access Your Donor Portal</a>
      </div>
      
      <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
        <p style="margin: 0; color: #856404; font-weight: 500; font-size: 16px;">Thank you for carrying our mission forward with your ongoing support. Your recurring contributions help create lasting change in our community.</p>
      </div>
      
      <div style="margin-top: 30px; font-style: italic; color: #495057;">
        <p>With gratitude,<br>
        <strong>${organization.name} Team</strong></p>
      </div>
    `;

    const html = this.generateEmailHtml(content, organization, subject);

    const text = `
Your recurring donation to ${organization.name} has been processed

Hello ${donor.name},

Your recurring donation of $${amount} to ${organization.name} has been processed successfully.

Next Payment: ${nextPaymentDate}

If you want to see details of your recurring donations or make changes, log into your Donor Portal [Dashboard Link] on ChangeWorks, our platform partner. That's where you can see your giving history, adjust settings, or download your records anytime.

Access Your Donor Portal: ${dashboardLink}

Thank you for carrying our mission forward with your ongoing support. Your recurring contributions help create lasting change in our community.

With gratitude,
${organization.name} Team

---
ChangeWorks Fund
Your trusted platform partner for charitable giving

Contact Information:
Email: support@changeworksfund.org

Address: 5830 E 2nd St. STE 7000 #29896, Casper, WY 82609
    `;

    return await this.sendEmail({
      to: donor.email,
      subject: subject,
      html: html,
      text: text
    });
  }

  // Send recurring change donation confirmation email
  async sendRecurringChangeDonationEmail({ donor, organization, dashboardLink, amount, donationDate }) {
    const subject = `Your recurring change donation to ${organization.name} is active`;
    // Format amount to handle "Round Up" text or numeric values
    const formattedAmount = isNaN(amount) ? amount : `$${amount}`;
    
    const content = `
      <p style="font-size: 18px; font-weight: 500; color: #212529; margin-bottom: 25px;">Hello ${donor.name},</p>
      
      <div style="background: linear-gradient(135deg, #302E56 0%, #4A487A 100%); color: white; padding: 30px; border-radius: 15px; margin: 25px 0; text-align: center; box-shadow: 0 8px 25px rgba(48, 46, 86, 0.3);">
        <h2 style="margin: 0 0 15px 0; font-size: 24px; font-weight: 600;">Your Change Donation is Active!</h2>
        <div style="font-size: 36px; font-weight: 700; margin: 10px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${formattedAmount}</div>
        <p style="font-size: 18px; opacity: 0.9; margin: 0;">Started ${donationDate}</p>
      </div>
      
      <p>Your recurring change donation of <strong>${formattedAmount}</strong> to <strong>${organization.name}</strong> is now active and will automatically round up your everyday purchases.</p>
      
      <div style="background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%); border: 1px solid #bee5eb; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #17a2b8;">
        <p style="margin: 0; color: #0c5460; font-weight: 500; font-size: 16px;"><strong>How it works:</strong> Every time you make a purchase, the amount will be rounded up to the nearest dollar, and the difference will be donated to ${organization.name}.</p>
      </div>
      
      <p>If you want to see details of your change donations or make changes, log into your Donor Portal <a href="${dashboardLink}" style="color: #302E56; text-decoration: underline;">[Dashboard Link]</a> on ChangeWorks, our platform partner. That's where you can see your giving history, adjust settings, or download your records anytime.</p>
      
      <div style="text-align: center;">
        <a href="${dashboardLink}" class="button">Access Your Donor Portal</a>
      </div>
      
      <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
        <p style="margin: 0; color: #856404; font-weight: 500; font-size: 16px;">Thank you for carrying our mission forward with every swipe, tap, and purchase. Small change, month after month, can create lasting change in our community.</p>
      </div>
      
      <div style="margin-top: 30px; font-style: italic; color: #495057;">
        <p>With gratitude,<br>
        <strong>${organization.name} Team</strong></p>
      </div>
    `;

    const html = this.generateEmailHtml(content, organization, subject);

    const text = `
Your recurring change donation to ${organization.name} is active

Hello ${donor.name},

Your recurring change donation of ${formattedAmount} to ${organization.name} is now active and will automatically round up your everyday purchases.

How it works: Every time you make a purchase, the amount will be rounded up to the nearest dollar, and the difference will be donated to ${organization.name}.

If you want to see details of your change donations or make changes, log into your Donor Portal [Dashboard Link] on ChangeWorks, our platform partner. That's where you can see your giving history, adjust settings, or download your records anytime.

Access Your Donor Portal: ${dashboardLink}

Thank you for carrying our mission forward with every swipe, tap, and purchase. Small change, month after month, can create lasting change in our community.

With gratitude,
${organization.name} Team

---
ChangeWorks Fund
Your trusted platform partner for charitable giving

Contact Information:
Email: support@changeworksfund.org

Address: 5830 E 2nd St. STE 7000 #29896, Casper, WY 82609
    `;

    return await this.sendEmail({
      to: donor.email,
      subject: subject,
      html: html,
      text: text
    });
  }

  // Send card failure alert email to donor
  async sendCardFailureAlertEmail({ donor, organization, dashboardLink }) {
    const subject = `ACTION NEEDED: Please update your ${organization.name} round-up card`;
    
    const content = `
      <p style="font-size: 18px; font-weight: 500; color: #212529; margin-bottom: 25px;">Hello ${donor.name},</p>
      
      <div style="background: linear-gradient(135deg, #E6E6F0 0%, #D3D2E0 100%); border: 1px solid #D3D2E0; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #302E56; text-align: center;">
        <h3 style="color: #302E56; margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: 600;">⚠️ Card Not Working Alert</h3>
        <p style="margin: 0; color: #302E56; font-weight: 500;">We noticed your round-up card on file isn't working right now. It's an easy fix — simply update your card details in your Donor Portal on ChangeWorks, our platform partner.</p>
      </div>
      
      <p style="margin-bottom: 18px; font-size: 16px; color: #495057;">When you update your card, your purchases will keep rounding up automatically, and your ongoing support for <strong>${organization.name}</strong> will keep making a difference in the community.</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${dashboardLink}" style="display: inline-block; background: linear-gradient(135deg, #302E56 0%, #4A487A 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 15px rgba(48, 46, 86, 0.3);">Update Your Card Now</a>
      </div>
      
      <p style="margin-bottom: 18px; font-size: 16px; color: #495057;">Thank you for being part of our round-up community. Every swipe, tap, and purchase you make helps carry our mission forward — and we don't want you to miss a single moment of impact.</p>
      
      <div style="margin-top: 30px; font-style: italic; color: #495057;">
        <p>With gratitude,<br>
        <strong>${organization.name} Team</strong></p>
      </div>
      
      <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
        <p style="margin: 0; color: #856404; font-weight: 500;"><strong>P.S.</strong> If you have any questions or need assistance, reply to this email and we'll be glad to help.</p>
      </div>
    `;

    const html = this.generateEmailHtml(content, organization, subject);

    const text = `
ACTION NEEDED: Please update your ${organization.name} round-up card

Hello ${donor.name},

We noticed your round-up card on file isn't working right now. It's an easy fix — simply update your card details in your Donor Portal on ChangeWorks, our platform partner.

When you update your card, your purchases will keep rounding up automatically, and your ongoing support for ${organization.name} will keep making a difference in the community.

Update Your Card: ${dashboardLink}

Thank you for being part of our round-up community. Every swipe, tap, and purchase you make helps carry our mission forward — and we don't want you to miss a single moment of impact.

With gratitude,
${organization.name} Team

P.S. If you have any questions or need assistance, reply to this email and we'll be glad to help.

---
ChangeWorks Fund
Your trusted platform partner for charitable giving

Contact Information:
Email: support@changeworksfund.org
Address: 5830 E 2nd St. STE 7000 #29896, Casper, WY 82609
    `;

    return await this.sendEmail({
      to: donor.email,
      subject: subject,
      html: html,
      text: text
    });
  }

  // Send final reminder email for card failure
  async sendCardFailureFinalReminderEmail({ donor, organization, dashboardLink }) {
    const subject = `LAST REMINDER: Please update your ${organization.name} round-up card`;
    
    const content = `
      <p style="font-size: 18px; font-weight: 500; color: #212529; margin-bottom: 25px;">Hello ${donor.name},</p>
      
      <div style="background: linear-gradient(135deg, #E6E6F0 0%, #D3D2E0 100%); border: 1px solid #D3D2E0; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #302E56; text-align: center;">
        <h3 style="color: #302E56; margin-top: 0; margin-bottom: 15px; font-size: 20px; font-weight: 600;">🚨 LAST REMINDER</h3>
        <p style="margin: 0; color: #302E56; font-weight: 500;">Right now, your round-up card on file still isn't working, which means your spare change isn't reaching us — and not reaching the people that together we serve.</p>
      </div>
      
      <p style="margin-bottom: 18px; font-size: 16px; color: #495057;">Please take a moment today to update your card details in your Donor Portal on ChangeWorks, our platform partner.</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${dashboardLink}" style="display: inline-block; background: linear-gradient(135deg, #302E56 0%, #4A487A 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 15px rgba(48, 46, 86, 0.3);">Update Your Card Today</a>
      </div>
      
      <div style="background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%); border: 1px solid #bee5eb; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #17a2b8;">
        <p style="margin: 0; color: #0c5460; font-weight: 500;">Your continued support helps us plan ahead and deliver on our mission. Your pennies matter — and when they pause, so does the change you help us make happen.</p>
      </div>
      
      <p style="margin-bottom: 18px; font-size: 16px; color: #495057;">Thank you for updating your card and for being such an important part of our community.</p>
      
      <div style="margin-top: 30px; font-style: italic; color: #495057;">
        <p>With appreciation,<br>
        <strong>${organization.name} Team</strong></p>
      </div>
    `;

    const html = this.generateEmailHtml(content, organization, subject);

    const text = `
LAST REMINDER: Please update your ${organization.name} round-up card

Hello ${donor.name},

Right now, your round-up card on file still isn't working, which means your spare change isn't reaching us — and not reaching the people that together we serve.

Please take a moment today to update your card details in your Donor Portal on ChangeWorks, our platform partner.

Update Your Card: ${dashboardLink}

Your continued support helps us plan ahead and deliver on our mission. Your pennies matter — and when they pause, so does the change you help us make happen.

Thank you for updating your card and for being such an important part of our community.

With appreciation,
${organization.name} Team

---
ChangeWorks Fund
Your trusted platform partner for charitable giving

Contact Information:
Email: support@changeworksfund.org
Address: 5830 E 2nd St. STE 7000 #29896, Casper, WY 82609
    `;

    return await this.sendEmail({
      to: donor.email,
      subject: subject,
      html: html,
      text: text
    });
  }

  // Send successful verification email to donor
  async sendVerificationSuccessEmail({ donor, organization, dashboardLink }) {
    const orgName = organization?.name || 'ChangeWorks Fund';
    const subject = `Welcome to ${orgName}'s Round-Up Community`;
    
    const content = `
      <h1 style="color: #302E56; font-size: 24px; margin-bottom: 20px;">Welcome to ${orgName}'s Round-Up Community</h1>
      
      <p>Hello ${donor.name},</p>
      
      <p>Thank you for joining ${orgName}'s round-up program. Your everyday purchases will now round up to the nearest dollar, turning your spare change into real change for the people we serve.</p>
      
      <p>You can view your donation activity anytime through your personalized Donor Portal <a href="${dashboardLink}" style="color: #302E56; text-decoration: underline;">[Dashboard Link]</a> on ChangeWorks, our platform partner. That's where you'll be able to:</p>
      
      <div class="highlight-box">
        <h3 style="color: #302E56; margin-top: 0;">Your Donor Portal Features:</h3>
        <ul>
          <li>Track your monthly round-up totals</li>
          <li>Adjust or pause your contributions at any time</li>
          <li>Download donation records for your own files</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${dashboardLink}" class="button">Access Your Donor Portal</a>
      </div>
      
      <p>We're so glad to have you as part of our round-up community, where even pennies can create lasting change.</p>
      
      <div style="margin-top: 30px; font-style: italic; color: #495057;">
        <p>With gratitude,<br>
        <strong>${orgName} Team</strong></p>
      </div>
      
      <div class="highlight-box" style="background: #e8f4fd; border-left-color: #302E56;">
        <p style="margin: 0; color: #302E56;"><strong>P.S.</strong> At the end of each month, we'll send you an update with your 30-day total, so you can see the difference you've made.</p>
      </div>
    `;

    const html = this.generateEmailHtml(content, organization, subject);

    const text = `
Welcome to ${orgName}'s Round-Up Community

Hello ${donor.name},

Thank you for joining ${orgName}'s round-up program. Your everyday purchases will now round up to the nearest dollar, turning your spare change into real change for the people we serve.

You can view your donation activity anytime through your personalized Donor Portal [Dashboard Link] on ChangeWorks, our platform partner. That's where you'll be able to:

- Track your monthly round-up totals
- Adjust or pause your contributions at any time
- Download donation records for your own files

Access Your Donor Portal: ${dashboardLink}

We're so glad to have you as part of our round-up community, where even pennies can create lasting change.

With gratitude,
${orgName} Team

P.S. At the end of each month, we'll send you an update with your 30-day total, so you can see the difference you've made.

---
ChangeWorks Fund
Your trusted platform partner for charitable giving

Contact Information:
Email: support@changeworksfund.org
Address: 5830 E 2nd St. STE 7000 #29896, Casper, WY 82609
    `;

    return await this.sendEmail({
      to: donor.email,
      subject: subject,
      html: html,
      text: text
    });
  }



  // Send password reset email
  async sendPasswordResetEmail({ donor, resetToken, resetLink, organization }) {
    const orgName = organization?.name || 'ChangeWorks Fund';
    const subject = `Reset your password for your ${orgName} donor account`;
    
    const directorName = (organization?.firstName && organization?.lastName) 
      ? `${organization.firstName} ${organization.lastName}` 
      : 'Director';

    // Prepare branding object
    // If organization is provided, use it for branding (logo, name)
    const brandingOrg = organization ? {
      name: orgName,
      imageUrl: organization.imageUrl,
      ...organization
    } : null;
    
    const content = `
      <p style="font-size: 18px; font-weight: 500; color: #212529; margin-bottom: 25px;">Dear ${donor.name},</p>
      
      <p>We received a request to reset the password for your ${orgName} donor account.</p>
      
      <p>To keep your information secure, you’ll need to create a new password before you can access your ChangeWorks donor dashboard. The process is quick and should take less than a minute.</p>
      
      <div class="highlight-box">
        <h3 style="color: #302E56; margin-top: 0;">What you can do once you’re logged in:</h3>
        <ul>
          <li>View and manage your donation activity</li>
          <li>Update payment details or giving preferences</li>
          <li>Download donation records for your files</li>
        </ul>
      </div>
      
      <p>To reset your password, click the button below and follow the on-screen steps. This link will expire for security reasons.</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetLink}" class="button">CLICK HERE TO RESET YOUR PASSWORD</a>
      </div>
      
      <p>If you didn’t request a password reset, you can safely ignore this email. No changes will be made to your account.</p>
      
      <p>If you need help at any point, support is available through our trusted donation partner, ChangeWorks: <a href="mailto:support@changeworksfund.org" style="color: #302E56;">support@changeworksfund.org</a></p>
      
      <p>Thank you for being part of ${orgName} and for the support you provide to our work.</p>
      
      <div style="margin-top: 30px; font-style: italic; color: #495057;">
        <p>With appreciation,</p>
        <p><strong>${directorName}</strong><br>
        ${orgName}</p>
      </div>

      <p style="font-size: 12px; color: #999; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">This message was sent to help protect your account. Please do not reply directly to this email.</p>
    `;

    const html = this.generateEmailHtml(content, brandingOrg, subject);

    const text = `
Reset your password for your ${orgName} donor account

Dear ${donor.name},

We received a request to reset the password for your ${orgName} donor account.

To keep your information secure, you’ll need to create a new password before you can access your ChangeWorks donor dashboard. The process is quick and should take less than a minute.

What you can do once you’re logged in:
- View and manage your donation activity
- Update payment details or giving preferences
- Download donation records for your files

To reset your password, click the button below and follow the on-screen steps. This link will expire for security reasons.

CLICK HERE TO RESET YOUR PASSWORD: ${resetLink}

If you didn’t request a password reset, you can safely ignore this email. No changes will be made to your account.

If you need help at any point, support is available through our trusted donation partner, ChangeWorks: support@changeworksfund.org

Thank you for being part of ${orgName} and for the support you provide to our work.

With appreciation,
${directorName}
${orgName}

This message was sent to help protect your account. Please do not reply directly to this email.

ChangeWorks
Your trusted platform partner for charitable giving
    `;

    return await this.sendEmail({
      to: donor.email,
      subject: subject,
      html: html,
      text: text
    });
  }

  // Send organization password reset email
  async sendOrganizationPasswordResetEmail({ organization, resetToken, resetLink }) {
    const subject = `Reset Your Organization Password - ${organization.name}`;
    
    // ChangeWorks branding for this email
    const brandingOrg = {
      name: 'ChangeWorks',
      imageUrl: '/imgs/changeworks.png'
    };

    const content = `
      <p style="font-size: 18px; font-weight: 500; color: #212529; margin-bottom: 25px;">Hello ${organization.name} Team,</p>
      
      <p>You requested a password reset for your organization account.</p>
      
      <p>Click the button below to reset your password:</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetLink}" class="button">Reset Organization Password</a>
      </div>
      
      <div class="highlight-box">
        <p style="margin: 0; font-weight: 500;">This link will expire in 1 hour.</p>
      </div>
      
      <p>If you didn't request this password reset, please ignore this email. Your account remains secure.</p>
      
      <div style="margin-top: 30px; font-style: italic; color: #495057;">
        <p>Best regards,<br>
        <strong>ChangeWorks Fund Team</strong></p>
      </div>
    `;

    const html = this.generateEmailHtml(content, brandingOrg, subject);

    const text = `
Organization Password Reset - ${organization.name}

Hello ${organization.name} Team,

You requested a password reset for your organization account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email. Your account remains secure.

Best regards,
ChangeWorks Fund Team
Your trusted platform partner for charitable giving
    `;

    return await this.sendEmail({
      to: organization.email,
      subject: subject,
      html: html,
      text: text
    });
  }

  // Send Organization Welcome Email
  async sendOrganizationWelcomeEmail({ organization, dashboardLink }) {
    console.log('📧 Sending Organization Welcome Email to:', organization.email);
    const subject = `Welcome to your ChangeWorks partnership!`;
    const adminName = (organization.firstName && organization.lastName) 
      ? `${organization.firstName} ${organization.lastName}` 
      : organization.name;
    
    // ChangeWorks branding for this email
    const brandingOrg = {
      name: 'ChangeWorks',
      imageUrl: '/imgs/changeworks.png'
    };

    const content = `
      <p style="font-size: 18px; font-weight: 500; color: #212529; margin-bottom: 25px;">Dear ${adminName},</p>
      
      <p>Welcome to ChangeWorks. We’re excited to have you on board and look forward to supporting your organization’s fundraising efforts.</p>
      
      <p>Your ChangeWorks account is now active, giving you access to a secure admin dashboard where you can manage donations, track activity, and stay connected with your supporters. Everything is designed to be straightforward, flexible, and easy to manage.</p>
      
      <div class="highlight-box">
        <h3 style="color: #302E56; margin-top: 0;">What you can do from your admin dashboard:</h3>
        <ul>
          <li>View donation activity across campaigns in real time</li>
          <li>Access reports, payouts, and donor summaries</li>
          <li>Manage organization settings and user permissions</li>
        </ul>
      </div>
      
      <p>You can log in anytime using the link below to get started.</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${dashboardLink}" class="button">CLICK HERE TO ACCESS YOUR ADMIN DASHBOARD</a>
      </div>
      
      <p>Also attached below is a partnership agreement for you to sign that details our joint venture. Kindly sign and return it so we can continue your onboarding process.</p>
      
      <p>If you have questions as you get set up or need help along the way, your ChangeWorks support team is here for you. Reach out anytime to our support team: <a href="mailto:support@changeworksfund.org" style="color: #302E56;">support@changeworksfund.org</a> or visit our website to schedule a virtual meeting: <a href="https://www.changeworksfund.org" style="color: #302E56;">www.changeworksfund.org</a></p>
      
      <p>Thank you for choosing ChangeWorks and for the work you do to support your community!</p>
      
      <div style="margin-top: 30px; font-style: italic; color: #495057;">
        <p>With appreciation,<br>
        <strong>The ChangeWorks Team</strong></p>
      </div>
    `;

    const html = this.generateEmailHtml(content, brandingOrg, subject);

    const text = `
Welcome to your ChangeWorks partnership!

Dear ${adminName},

Welcome to ChangeWorks. We’re excited to have you on board and look forward to supporting your organization’s fundraising efforts.

Your ChangeWorks account is now active, giving you access to a secure admin dashboard where you can manage donations, track activity, and stay connected with your supporters. Everything is designed to be straightforward, flexible, and easy to manage.

What you can do from your admin dashboard:
- View donation activity across campaigns in real time
- Access reports, payouts, and donor summaries
- Manage organization settings and user permissions

You can log in anytime using the link below to get started.

CLICK HERE TO ACCESS YOUR ADMIN DASHBOARD: ${dashboardLink}

Also attached below is a partnership agreement for you to sign that details our joint venture. Kindly sign and return it so we can continue your onboarding process.

If you have questions as you get set up or need help along the way, your ChangeWorks support team is here for you. Reach out anytime to our support team: support@changeworksfund.org or visit our website to schedule a virtual meeting: www.changeworksfund.org

Thank you for choosing ChangeWorks and for the work you do to support your community!

With appreciation,
The ChangeWorks Team

ChangeWorks
Your trusted platform partner for charitable giving

________________________________________Contact Information
Email: support@changeworksfund.org
5830 E 2nd St. STE 7000 #29896
Casper, WY 82609
Unsubscribe
    `;

    return await this.sendEmail({
      to: organization.email,
      subject: subject,
      html: html,
      text: text
    });
  }

  // Send Stripe onboarding link email to organization
  async sendStripeOnboardingEmail({ organization, onboardingUrl }) {
    const subject = `Complete Your Stripe Account Setup - ${organization.name}`;
    
    // ChangeWorks branding for this email
    const brandingOrg = {
      name: 'ChangeWorks',
      imageUrl: '/imgs/changeworks.png'
    };

    const content = `
      <p style="font-size: 18px; font-weight: 500; color: #212529; margin-bottom: 25px;">Hello ${organization.name} Team,</p>
      
      <p>Your organization account has been successfully created! To start receiving payments, you need to complete your Stripe account onboarding.</p>
      
      <div class="highlight-box">
        <h3 style="color: #302E56; margin-top: 0;">What you'll need:</h3>
        <ul>
          <li>Business information (name, address, tax ID)</li>
          <li>Bank account details for payouts</li>
          <li>Identity verification documents</li>
        </ul>
      </div>
      
      <p>Click the button below to complete your Stripe account setup:</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${onboardingUrl}" class="button">Complete Stripe Onboarding</a>
      </div>
      
      <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
        <p style="margin: 0; color: #856404; font-weight: 500;"><strong>Important:</strong> This link will expire in 1 hour. If you need a new link, please contact support.</p>
      </div>
      
      <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
      
      <div style="margin-top: 30px; font-style: italic; color: #495057;">
        <p>Best regards,<br>
        <strong>ChangeWorks Fund Team</strong></p>
      </div>
    `;

    const html = this.generateEmailHtml(content, brandingOrg, subject);

    const text = `
Complete Your Stripe Account Setup - ${organization.name}

Hello ${organization.name} Team,

Your organization account has been successfully created! To start receiving payments, you need to complete your Stripe account onboarding.

What you'll need:
- Business information (name, address, tax ID)
- Bank account details for payouts
- Identity verification documents

Click the link below to complete your Stripe account setup:
${onboardingUrl}

Important: This link will expire in 1 hour. If you need a new link, please contact support.

If you have any questions or need assistance, please don't hesitate to reach out to our support team.

Best regards,
ChangeWorks Fund Team
Your trusted platform partner for charitable giving
    `;

    return await this.sendEmail({
      to: organization.email,
      subject: subject,
      html: html,
      text: text
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
