import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { compare } from "bcryptjs";
import { z } from "zod";
import jwt from "jsonwebtoken";

// Zod schema for organization login
const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password is required"),
});

export async function POST(request) {
  try {
    console.log('🔍 Test organization login attempt');
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);
    console.log('📧 Login email:', email);

    // Check if organization exists
    const organization = await prisma.organization.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        orgPassword: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    console.log('🔍 Organization found:', !!organization);

    if (!organization) {
      console.log('❌ Organization not found');
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Compare password (check both password fields)
    const isPasswordCorrect = await compare(password, organization.password || '') || 
                              await compare(password, organization.orgPassword || '');
    
    console.log('🔍 Password correct:', isPasswordCorrect);
    
    if (!isPasswordCorrect) {
      console.log('❌ Password incorrect');
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check organization status
    if (organization.status !== true) {
      console.log('❌ Organization inactive');
      return NextResponse.json({ error: "Organization account is inactive" }, { status: 403 });
    }

    // Create JWT payload
    const tokenPayload = {
      id: organization.id,
      email: organization.email,
      type: "organization",
    };

    console.log('🔍 Token payload:', tokenPayload);

    // Sign token
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log('✅ Login successful for organization:', organization.name);

    return NextResponse.json({
      message: "Login successful",
      token,
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.email
      }
    }, { status: 200 });
  } catch (error) {
    console.error('❌ Organization login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
