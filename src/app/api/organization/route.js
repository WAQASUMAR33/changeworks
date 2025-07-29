import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

// Validation schema
const organizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  ghlId: z.string().optional(),
  imageUrl: z.string().optional(),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const input = organizationSchema.parse(body);

    const existing = await prisma.organization.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const hashedPassword = await hash(input.password, 10);

    const organization = await prisma.organization.create({
      data: {
        ...input,
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      message: "Organization registered successfully",
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.email,
      },
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



export async function GET() {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
        phone: true,
        company: true,
        address: true,
        website: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        ghlId: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ organizations }, { status: 200 });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
