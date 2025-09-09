import GHLClient from '../../../lib/ghl-client';
import { prisma } from '../../../lib/prisma';
import { hash } from 'bcryptjs';

export async function POST() {
  try {
    // Test data for integrated signup
    const testData = {
      name: 'Test Organization ' + Date.now(),
      email: `testorg+${Date.now()}@example.com`,
      password: 'testpassword123',
      phone: '+447534983788',
      company: 'Test Company Ltd',
      address: '123 Test Street',
      city: 'London',
      state: 'Greater London',
      country: 'GB',
      postalCode: 'SW1A 1AA',
      website: 'https://testcompany.com',
      // GHL Business Details
      createGHLAccount: true,
      businessName: 'Test Business ' + Date.now(),
      businessPhone: '+447534983788',
      businessAddress: '123 Business Street',
      businessCity: 'London',
      businessState: 'Greater London',
      businessCountry: 'GB',
      businessPostalCode: 'SW1A 1AA',
      businessWebsite: 'https://testbusiness.com',
      businessTimezone: 'Europe/London'
    };

    console.log('=== INTEGRATED SIGNUP TEST ===');
    console.log('Test Data:', JSON.stringify(testData, null, 2));

    // Step 1: Create organization
    const hashedPassword = await hash(testData.password, 10);
    
    const organization = await prisma.organization.create({
      data: {
        name: testData.name,
        email: testData.email,
        password: hashedPassword,
        phone: testData.phone,
        company: testData.company,
        address: testData.address,
        website: testData.website,
        city: testData.city,
        state: testData.state,
        country: testData.country,
        postalCode: testData.postalCode,
      },
    });

    console.log('Organization created:', organization.id);

    let ghlAccount = null;
    let ghlLocationId = null;

    // Step 2: Create GHL account if requested
    if (testData.createGHLAccount && testData.businessName) {
      try {
        const ghlClient = new GHLClient();
        
        const ghlData = {
          businessName: testData.businessName,
          firstName: testData.name.split(' ')[0] || testData.name,
          lastName: testData.name.split(' ').slice(1).join(' ') || '',
          email: testData.email,
          phone: testData.businessPhone || testData.phone || '',
          address: testData.businessAddress || testData.address || '',
          city: testData.businessCity || testData.city || '',
          state: testData.businessState || testData.state || '',
          country: testData.businessCountry || testData.country || 'GB',
          postalCode: testData.businessPostalCode || testData.postalCode || '',
          website: testData.businessWebsite || testData.website || '',
          timezone: testData.businessTimezone || 'Europe/London',
          companyId: process.env.GHL_COMPANY_ID
        };

        console.log('Creating GHL account...');
        const ghlResult = await ghlClient.createSubAccount(ghlData);

        if (ghlResult.success) {
          ghlLocationId = ghlResult.locationId;
          
          // Save GHL account details to database
          ghlAccount = await prisma.gHLAccount.create({
            data: {
              organization_id: organization.id,
              ghl_location_id: ghlLocationId,
              business_name: testData.businessName,
              email: testData.email,
              phone: testData.businessPhone || testData.phone,
              address: testData.businessAddress || testData.address,
              city: testData.businessCity || testData.city,
              state: testData.businessState || testData.state,
              country: testData.businessCountry || testData.country,
              postal_code: testData.businessPostalCode || testData.postalCode,
              website: testData.businessWebsite || testData.website,
              timezone: testData.businessTimezone || 'Europe/London',
              ghl_data: JSON.stringify(ghlResult.data),
              status: 'active'
            }
          });

          // Update organization with GHL location ID
          await prisma.organization.update({
            where: { id: organization.id },
            data: { ghlId: ghlLocationId }
          });

          console.log('GHL account created successfully:', ghlLocationId);
        } else {
          console.error('GHL account creation failed:', ghlResult.error);
        }
      } catch (ghlError) {
        console.error('GHL integration error:', ghlError);
      }
    }

    return Response.json({
      message: 'Integrated Signup Test Completed',
      success: true,
      organization: {
        ...organization,
        ghlId: ghlLocationId
      },
      ghlAccount: ghlAccount,
      ghlLocationId: ghlLocationId,
      testData: testData
    });

  } catch (error) {
    console.error('Integrated signup test error:', error);
    return Response.json({
      message: 'Integrated Signup Test Failed',
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
