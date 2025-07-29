import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { compare } from "bcryptjs";
import { z } from "zod";
import jwt from "jsonwebtoken";

// Zod schema
const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password is required"),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Compare password
    const isPasswordCorrect = await compare(password, user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Create JWT payload
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role, // optional
    };

    // Sign token
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "7d", // Adjust expiration as needed
    });

    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
