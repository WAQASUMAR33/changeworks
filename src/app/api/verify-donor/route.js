import { prisma } from "../../lib/prisma"; // Adjust this import based on your structure
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const existingToken = await prisma.donorVerificationToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    if (existingToken.expires < new Date()) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    // Mark donor as verified (set status true)
    await prisma.donor.update({
      where: { email: existingToken.identifier },
      data: {
        status: true, // assuming 'status' true means verified
      },
    });

    // Delete token after verification
    await prisma.donorVerificationToken.delete({
      where: { token },
    });

    return NextResponse.json({ message: "Email successfully verified." }, { status: 200 });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
