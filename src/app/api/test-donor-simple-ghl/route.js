import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma.jsx";
import { hash } from "bcryptjs";
import { z } from "zod";

const donorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  organization_id: z.number().int().positive("Organization ID is required"),
});

export async function POST(request) {
  try {
    console.log('🧪 Testing simple donor creation without GHL...');
    
    const body = await request.json();
    const { name, email, password, phone, city, address, postal_code, organization_id } = donorSchema.parse(body);

    console.log('📊 Parsed donor data:', { name, email, organization_id });

    // Check for existing donor
    const existingDonor = await prisma.donor.findUnique({ where: { email } });
    if (existingDonor) {
      return NextResponse.json({ 
        success: false,
        error: "Donor already exists",
        existing_donor: {
          id: existingDonor.id,
          name: existingDonor.name,
          email: existingDonor.email
        }
      }, { status: 400 });
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({ 
      where: { id: organization_id },
      select: { id: true, name: true, email: true }
    });
    if (!organization) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid organization ID",
        provided_organization_id: organization_id
      }, { status: 400 });
    }

    console.log('✅ Organization found:', organization.name);

    // Hash password
    const hashedPassword = await hash(password, 10);
    console.log('✅ Password hashed successfully');

    // Create donor (without GHL integration for testing)
    const donor = await prisma.donor.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        city,
        address,
        postal_code,
        status: true,
        organization: { connect: { id: organization_id } },
      },
      include: { 
        organization: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
    });

    console.log('✅ Donor created successfully:', donor.id);

    return NextResponse.json({
      success: true,
      message: "Donor created successfully (test mode - no GHL integration)",
      donor: {
        id: donor.id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        city: donor.city,
        address: donor.address,
        status: donor.status,
        organization: donor.organization,
        created_at: donor.created_at
      },
      test_info: {
        ghl_integration: "Skipped for testing",
        status: "Active (ready to use)",
        next_step: "Test GHL integration separately"
      }
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Simple donor creation test error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false,
        error: "Validation failed",
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
