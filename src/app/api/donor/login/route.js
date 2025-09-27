import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { compare } from "bcryptjs";
import { z } from "zod";
import jwt from "jsonwebtoken";

// Zod validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password is required"),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Check if donor exists
    const donor = await prisma.donor.findUnique({
      where: { email },
    });

    if (!donor) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Optional: enforce email verification
    // if (!donor.emailVerifiedAt) {
    //   return NextResponse.json({ error: "Please verify your email first." }, { status: 401 });
    // }

    // Compare password
    const isPasswordCorrect = await compare(password, donor.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Create JWT token
    const tokenPayload = {
      id: donor.id,
      email: donor.email,
      role: "DONOR",
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return NextResponse.json({
      message: "Login successful",
      token,
      donor
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
