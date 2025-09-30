import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const donorId = decoded.id;

    // Get donor information
    const donor = await prisma.donor.findUnique({
      where: { id: donorId }
    });

    if (!donor) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }

    // Get total donated amount
    const totalDonated = await prisma.transaction.aggregate({
      where: {
        donorId: donorId,
        status: 'completed'
      },
      _sum: {
        amount: true
      }
    });

    // Get organizations supported
    const organizationsSupported = await prisma.transaction.findMany({
      where: {
        donorId: donorId,
        status: 'completed'
      },
      select: {
        organizationId: true
      },
      distinct: ['organizationId']
    });

    // Get donation streak (months with at least one donation)
    const donationsByMonth = await prisma.transaction.findMany({
      where: {
        donorId: donorId,
        status: 'completed'
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate streak
    let streak = 0;
    const now = new Date();
    let currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    for (const donation of donationsByMonth) {
      const donationMonth = new Date(donation.createdAt.getFullYear(), donation.createdAt.getMonth(), 1);
      if (donationMonth.getTime() === currentMonth.getTime()) {
        streak++;
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      } else {
        break;
      }
    }

    // Mock impact data (in real app, this would come from actual impact calculations)
    const impact = {
      totalDonated: {
        value: totalDonated._sum.amount || 0,
        change: '+12.5%',
        changeType: 'increase'
      },
      livesImpacted: {
        value: Math.floor((totalDonated._sum.amount || 0) / 50), // Assume $50 per life impacted
        change: '+8.3%',
        changeType: 'increase'
      },
      organizationsSupported: {
        value: organizationsSupported.length,
        change: '+1',
        changeType: 'increase'
      },
      donationStreak: streak,
      recentStories: [
        {
          title: "Clean Water Initiative",
          description: "Your donation helped provide clean water to 15 families in rural areas.",
          organization: "Water for All",
          date: "2024-01-15"
        },
        {
          title: "Education Support",
          description: "Funded school supplies for 25 children in underserved communities.",
          organization: "Education First",
          date: "2024-01-10"
        }
      ],
      donationBreakdown: [
        { category: "Education", amount: (totalDonated._sum.amount || 0) * 0.4, percentage: 40, color: "#3B82F6" },
        { category: "Healthcare", amount: (totalDonated._sum.amount || 0) * 0.3, percentage: 30, color: "#10B981" },
        { category: "Environment", amount: (totalDonated._sum.amount || 0) * 0.2, percentage: 20, color: "#059669" },
        { category: "Other", amount: (totalDonated._sum.amount || 0) * 0.1, percentage: 10, color: "#8B5CF6" }
      ],
      achievements: [
        {
          title: "First Donation",
          description: "Made your first donation to make a difference"
        },
        {
          title: "Monthly Supporter",
          description: "Set up your first recurring donation"
        },
        {
          title: "Impact Champion",
          description: "Donated over $500 total"
        }
      ]
    };

    return NextResponse.json({
      success: true,
      impact
    });

  } catch (error) {
    console.error("Impact data fetch error:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
