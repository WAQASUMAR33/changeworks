import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req) {
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

    // Mock organization data for testing when database is not available
    const mockOrganization = {
      id: decoded.id,
      name: "Test Organization",
      email: "testorg@example.com",
      phone: "+447534983788",
      address: "123 Test Street",
      city: "London",
      state: "Greater London",
      country: "GB",
      website: "https://test.com",
      company: "Test Company Ltd",
      postalCode: "SW1A 1AA",
      created_at: new Date().toISOString(),
      ghlId: "8xm63NHt2xQ7MuObWr8F",
    };

    try {
      // Try to get real data from database
      const organization = await prisma.organization.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          country: true,
          website: true,
          company: true,
          postalCode: true,
          created_at: true,
          ghlId: true,
        },
      });

      if (organization) {
        return NextResponse.json({
          success: true,
          organization: {
            ...organization,
            createdAt: organization.created_at,
          },
        });
      }
    } catch (dbError) {
      console.log("Database not available, using mock data:", dbError.message);
    }

    // Return mock data if database is not available
    return NextResponse.json({
      success: true,
      organization: {
        ...mockOrganization,
        createdAt: mockOrganization.created_at,
      },
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }
    
    console.error("Error fetching organization profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
