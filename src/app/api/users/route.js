import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma"; // Named import
import { hash } from "bcryptjs";
import { z } from "zod";
import nodemailer from "nodemailer";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").max(100, "Email too long"), // Match schema
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password } = signupSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // Generate and store verification token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    // Send verification email
    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;
    await transport.sendMail({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: "Verify Your Email",
      text: `Please verify your email by clicking: ${verificationUrl}`,
      html: `<p>Please verify your email by clicking: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
    });

    return NextResponse.json({ message: "User created. Please verify your email." }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


