import { NextResponse } from 'next/server';
import { emailService } from '../../lib/email-service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetEmail = searchParams.get('email');

    if (!targetEmail) {
        return NextResponse.json({ error: 'Please provide an email query parameter (e.g., ?email=you@example.com)' }, { status: 400 });
    }

    const mockDonor = {
        name: 'Test Donor',
        email: targetEmail
    };

    const mockOrganization = {
        name: 'ChangeWorks Fund (Test)',
        email: 'org@example.com',
        firstName: 'Test',
        lastName: 'Admin',
        title: 'Executive Director',
        // Use a placeholder that will likely work or fall back safely
        imageUrl: 'https://placehold.co/200x100?text=Org+Logo', 
        ein: '12-3456789',
        address: '123 Test Avenue',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        phone: '555-123-4567'
    };

    const dashboardLink = 'https://example.com/dashboard';
    const amount = '50.00';
    const donationDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const transactionId = `test_trx_${Date.now()}`;
    const paymentMethod = 'Test Card ****4242';
    const campaignName = 'Test Campaign';

    console.log(`📧 Sending test email to ${targetEmail}...`);

    const result = await emailService.sendOneTimeDonationEmail({
        donor: mockDonor,
        organization: mockOrganization,
        dashboardLink,
        amount,
        donationDate,
        transactionId,
        paymentMethod,
        campaignName
    });

    console.log('📧 Test email result:', result);

    if (result.success) {
        return NextResponse.json({ 
            message: 'Test email sent successfully',
            result,
            details: {
                to: targetEmail,
                subject: `Thanks for Your One-Time Donation to ${mockOrganization.name}`
            }
        });
    } else {
        return NextResponse.json({ 
            error: 'Email service returned failure', 
            result 
        }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Test email route error:', error);
    return NextResponse.json({ 
        error: 'Internal server error during test', 
        details: error.message,
        stack: error.stack
    }, { status: 500 });
  }
}
