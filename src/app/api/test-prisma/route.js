import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma.jsx";

// GET /api/test-prisma - Test prisma connection
export async function GET(request) {
  try {
    console.log('Testing prisma connection...');
    
    // Test basic prisma connection
    const donor = await prisma.donor.findUnique({
      where: { id: 60 },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Prisma connection working',
      donor: donor
    });

  } catch (error) {
    console.error('Prisma test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Prisma connection failed', 
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
