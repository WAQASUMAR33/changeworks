import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'organization') {
      return NextResponse.json({ error: "Invalid token type" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    try {
      // Get organization with password
      const organization = await prisma.organization.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          password: true,
        },
      });

      if (!organization) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }

      // Verify current password
      if (!organization.password) {
        return NextResponse.json({ error: "No password set for this organization" }, { status: 400 });
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, organization.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.organization.update({
        where: { id: decoded.id },
        data: {
          password: hashedNewPassword,
        },
      });
    } catch (dbError) {
      console.log("Database not available, password change not possible:", dbError.message);
      return NextResponse.json({ 
        error: "Database connection unavailable. Password change not possible at this time." 
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    
    console.error("Error changing password:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
