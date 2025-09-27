import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    // Get current date for filtering
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Get total counts and current month data
    const [
      totalDonors,
      totalOrganizations,
      totalFundTransfers,
      todayDonations,
      lastMonthDonations,
      thisMonthDonations,
      lastMonthDonors,
      thisMonthDonors,
      lastMonthOrganizations,
      thisMonthOrganizations,
      lastMonthFundTransfers,
      thisMonthFundTransfers
    ] = await Promise.all([
      // Total counts
      prisma.donor.count({ where: { status: true } }),
      prisma.organization.count({ where: { status: true } }),
      prisma.fundTransfer.count(),
      
      // Today's donations
      prisma.saveTrRecord.aggregate({
        where: {
          trx_date: {
            gte: startOfToday,
            lt: endOfToday
          },
          pay_status: 'completed'
        },
        _sum: { trx_amount: true },
        _count: true
      }),
      
      // Last month donations for comparison
      prisma.saveTrRecord.aggregate({
        where: {
          trx_date: {
            gte: startOfLastMonth,
            lt: endOfLastMonth
          },
          pay_status: 'completed'
        },
        _sum: { trx_amount: true }
      }),
      
      // This month donations for comparison
      prisma.saveTrRecord.aggregate({
        where: {
          trx_date: {
            gte: startOfMonth
          },
          pay_status: 'completed'
        },
        _sum: { trx_amount: true }
      }),
      
      // Donor growth comparison
      prisma.donor.count({
        where: {
          status: true,
          created_at: {
            gte: startOfLastMonth,
            lt: endOfLastMonth
          }
        }
      }),
      
      prisma.donor.count({
        where: {
          status: true,
          created_at: {
            gte: startOfMonth
          }
        }
      }),
      
      // Organization growth comparison
      prisma.organization.count({
        where: {
          status: true,
          created_at: {
            gte: startOfLastMonth,
            lt: endOfLastMonth
          }
        }
      }),
      
      prisma.organization.count({
        where: {
          status: true,
          created_at: {
            gte: startOfMonth
          }
        }
      }),
      
      // Fund transfer growth comparison
      prisma.fundTransfer.count({
        where: {
          created_at: {
            gte: startOfLastMonth,
            lt: endOfLastMonth
          }
        }
      }),
      
      prisma.fundTransfer.count({
        where: {
          created_at: {
            gte: startOfMonth
          }
        }
      })
    ]);

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    // Calculate donation change
    const todayAmount = todayDonations._sum.trx_amount || 0;
    const thisMonthAmount = thisMonthDonations._sum.trx_amount || 0;
    const lastMonthAmount = lastMonthDonations._sum.trx_amount || 0;
    const donationChange = calculateChange(thisMonthAmount, lastMonthAmount);

    const stats = {
      totalDonors: {
        value: totalDonors.toLocaleString(),
        change: calculateChange(thisMonthDonors, lastMonthDonors),
        changeType: thisMonthDonors >= lastMonthDonors ? 'increase' : 'decrease'
      },
      todayDonations: {
        value: `$${todayAmount.toLocaleString()}`,
        change: donationChange,
        changeType: thisMonthAmount >= lastMonthAmount ? 'increase' : 'decrease'
      },
      totalOrganizations: {
        value: totalOrganizations.toLocaleString(),
        change: calculateChange(thisMonthOrganizations, lastMonthOrganizations),
        changeType: thisMonthOrganizations >= lastMonthOrganizations ? 'increase' : 'decrease'
      },
      fundTransfers: {
        value: totalFundTransfers.toLocaleString(),
        change: calculateChange(thisMonthFundTransfers, lastMonthFundTransfers),
        changeType: thisMonthFundTransfers >= lastMonthFundTransfers ? 'increase' : 'decrease'
      }
    };

    // Get recent activity
    const recentActivity = await prisma.saveTrRecord.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        donor: {
          select: { name: true, email: true }
        },
        organization: {
          select: { name: true }
        }
      }
    });

    const formattedActivity = recentActivity.map(activity => ({
      id: activity.id,
      type: 'donation',
      title: 'New donation received',
      description: `${activity.donor.name} donated $${activity.trx_amount} to ${activity.organization.name}`,
      time: formatTimeAgo(activity.created_at),
      color: 'green'
    }));

    return NextResponse.json({
      success: true,
      stats,
      recentActivity: formattedActivity
    });

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    }, { status: 500 });
  }
}

function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) {
    return `${minutes} min ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}
