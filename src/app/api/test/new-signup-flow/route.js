import GHLClient from '../../../lib/ghl-client';
import { prisma } from '../../../lib/prisma';
import { hash } from 'bcryptjs';

export async function POST() {
  try {
    // Test data for new signup flow
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
      // Organization Login Details
      orgPassword: 'orgpassword123',
      confirmOrgPassword: 'orgpassword123'
    };

    console.log('=== NEW SIGNUP FLOW TEST ===');
    console.log('Test Data:', JSON.stringify(testData, null, 2));

    // Validate organization password confirmation
    if (testData.orgPassword !== testData.confirmOrgPassword) {
      return Response.json({ 
        error: "Organization passwords do not match" 
      }, { status: 400 });
    }

    const hashedPassword = await hash(testData.password, 10);
    const hashedOrgPassword = await hash(testData.orgPassword, 10);

    // Step 1: Create organization
    const organization = await prisma.organization.create({
      data: {
        name: testData.name,
        email: testData.email,
        password: hashedPassword,
        orgPassword: hashedOrgPassword, // Store organization password
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

    // Step 2: Automatically create GHL account using organization information
    try {
      const ghlClient = new GHLClient();
      
      const ghlData = {
        businessName: testData.company || testData.name, // Use company name or organization name
        firstName: testData.name.split(' ')[0] || testData.name,
        lastName: testData.name.split(' ').slice(1).join(' ') || '',
        email: testData.email,
        phone: testData.phone || '',
        address: testData.address || '',
        city: testData.city || '',
        state: testData.state || '',
        country: testData.country || 'GB',
        postalCode: testData.postalCode || '',
        website: testData.website || '',
        timezone: 'Europe/London', // Default timezone
        companyId: process.env.GHL_COMPANY_ID
      };

      console.log('Creating GHL account automatically...');
      const ghlResult = await ghlClient.createSubAccount(ghlData);

      if (ghlResult.success) {
        ghlLocationId = ghlResult.locationId;
        
        // Save GHL account details to database
        ghlAccount = await prisma.gHLAccount.create({
          data: {
            organization_id: organization.id,
            ghl_location_id: ghlLocationId,
            business_name: testData.company || testData.name,
            email: testData.email,
            phone: testData.phone,
            address: testData.address,
            city: testData.city,
            state: testData.state,
            country: testData.country,
            postal_code: testData.postalCode,
            website: testData.website,
            timezone: 'Europe/London',
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

    return Response.json({
      message: 'New Signup Flow Test Completed',
      success: true,
      organization: {
        ...organization,
        ghlId: ghlLocationId
      },
      ghlAccount: ghlAccount,
      ghlLocationId: ghlLocationId,
      testData: testData,
      summary: {
        organizationCreated: true,
        ghlAccountCreated: !!ghlAccount,
        ghlLocationId: ghlLocationId,
        orgPasswordStored: !!organization.orgPassword
      }
    });

  } catch (error) {
    console.error('New signup flow test error:', error);
    return Response.json({
      message: 'New Signup Flow Test Failed',
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
