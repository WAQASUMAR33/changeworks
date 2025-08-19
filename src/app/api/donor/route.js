import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";
import nodemailer from "nodemailer";
import crypto from "crypto";

const donorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  imageUrl: z.string().optional(),
  organization_id: z.number().int().positive("Organization ID is required"),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, city, address, imageUrl, organization_id } = donorSchema.parse(body);

    // Check for existing donor
    const existingDonor = await prisma.donor.findUnique({ where: { email } });
    if (existingDonor) {
      return NextResponse.json({ error: "Donor already exists" }, { status: 400 });
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({ where: { id: organization_id } });
    if (!organization) {
      return NextResponse.json({ error: "Invalid organization ID" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create donor
    const donor = await prisma.donor.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        city,
        address,
        imageUrl,
        status: true,
        organization: { connect: { id: organization_id } },
      },
      include: { organization: true },
    });

    // Generate verification token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in DonorVerificationToken
    await prisma.DonorVerificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Send email
    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const verificationUrl = `https://changeworks-seven.vercel.app/api/verify-donor?token=${token}`;

    await transport.sendMail({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: "Verify Your Donor Account",
      text: `Please verify your email by clicking: ${verificationUrl}`,
      html: `<p>Please verify your email by clicking: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
    });

    return NextResponse.json(
      { message: "Donor registered. Please check your email to verify your account.", donor },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: Fetch all donors with pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const [donors, totalCount] = await Promise.all([
      prisma.donor.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          address: true,
          imageUrl: true,
          status: true,
          created_at: true,
          updated_at: true,
          organization_id: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.donor.count(),
    ]);

    return NextResponse.json({ donors, totalCount }, { status: 200 });
  } catch (error) {
    console.error('Error fetching donors:', error);
    return NextResponse.json({ error: 'Failed to fetch donors' }, { status: 500 });
  }
}