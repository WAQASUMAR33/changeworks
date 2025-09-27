'use client';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Building2, 
  TrendingUp, 
  Activity,
  ArrowRight,
  Loader2
} from 'lucide-react';
import Link from 'next/link';


const getColorClasses = (color) => {
    const colors = {
        blue: {
            bg: 'bg-blue-50',
            icon: 'text-blue-600',
            border: 'border-blue-200',
            hover: 'hover:bg-blue-100',
            gradient: 'from-blue-500 to-blue-600'
        },
        green: {
            bg: 'bg-green-50',
            icon: 'text-green-600',
            border: 'border-green-200',
            hover: 'hover:bg-green-100',
            gradient: 'from-green-500 to-green-600'
        },
        purple: {
            bg: 'bg-purple-50',
            icon: 'text-purple-600',
            border: 'border-purple-200',
            hover: 'hover:bg-purple-100',
            gradient: 'from-purple-500 to-purple-600'
        },
        orange: {
            bg: 'bg-orange-50',
            icon: 'text-orange-600',
            border: 'border-orange-200',
            hover: 'hover:bg-orange-100',
            gradient: 'from-orange-500 to-orange-600'
        }
    };
    return colors[color] || colors.blue;
};

export default function OrganizationDashboard() {
    const [stats, setStats] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Get organization ID from sessionStorage
            const orgUser = sessionStorage.getItem('orgUser');
            if (!orgUser) {
                setError('Organization not found');
                return;
            }
            
            const userData = JSON.parse(orgUser);
            const organizationId = userData.id;
            
            const response = await fetch(`/api/organization/dashboard-stats?organizationId=${organizationId}`);
            const data = await response.json();
            
            if (data.success) {
                // Transform API data to match component structure
                const transformedStats = [
                    {
                        title: 'Total Donations',
                        value: data.stats.totalDonations.value,
                        change: data.stats.totalDonations.change,
                        changeType: data.stats.totalDonations.changeType,
                        icon: DollarSign,
                        color: 'green',
                        path: '/organization/dashboard/transactions'
                    },
                    {
                        title: 'This Month',
                        value: data.stats.thisMonth.value,
                        change: data.stats.thisMonth.change,
                        changeType: data.stats.thisMonth.changeType,
                        icon: TrendingUp,
                        color: 'orange',
                        path: '/organization/dashboard/reports'
                    }
                ];
                
                setStats(transformedStats);
                setRecentActivity(data.recentActivity || []);
            } else {
                setError(data.error || 'Failed to load dashboard data');
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={fetchDashboardData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="min-h-screen"
        >
            <div className="space-y-8">
                {/* Header Section */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Organization Dashboard
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Welcome to your ChangeWorks organization portal. Manage your donors, track donations, and integrate with GoHighLevel.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {stats.map((stat, index) => {
                        const colors = getColorClasses(stat.color);
                        return (
                            <Link key={stat.title} href={stat.path}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    className={`${colors.bg} ${colors.border} ${colors.hover} border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg group`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-xl bg-white ${colors.icon}`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <div className={`flex items-center space-x-1 text-sm font-medium ${
                                            stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            <TrendingUp className="w-4 h-4" />
                                            <span>{stat.change}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                                    <p className="text-gray-600 font-medium">{stat.title}</p>
                                    <div className="mt-4 flex items-center text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
                                        <span>View details</span>
                                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>


                {/* Recent Activity */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        {recentActivity.length > 0 ? (
                            <div className="space-y-4">
                                {recentActivity.map((activity, index) => {
                                    const getActivityIcon = (type) => {
                                        switch (type) {
                                            case 'donation': return DollarSign;
                                            case 'ghl': return Building2;
                                            default: return Users;
                                        }
                                    };
                                    
                                    const getActivityColor = (color) => {
                                        switch (color) {
                                            case 'green': return { bg: 'bg-green-50', icon: 'bg-green-500' };
                                            case 'blue': return { bg: 'bg-blue-50', icon: 'bg-blue-500' };
                                            default: return { bg: 'bg-purple-50', icon: 'bg-purple-500' };
                                        }
                                    };
                                    
                                    const ActivityIcon = getActivityIcon(activity.type);
                                    const colors = getActivityColor(activity.color);
                                    
                                    return (
                                        <div key={activity.id || index} className={`flex items-center space-x-4 p-4 ${colors.bg} rounded-xl`}>
                                            <div className={`w-10 h-10 ${colors.icon} rounded-full flex items-center justify-center`}>
                                                <ActivityIcon className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{activity.title}</p>
                                                <p className="text-sm text-gray-600">{activity.description}</p>
                                            </div>
                                            <span className="text-sm text-gray-500">{activity.time}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 mb-2">No recent activity</p>
                                <p className="text-sm text-gray-400">Activity will appear here as you use the platform</p>
                            </div>
                        )}
                        
                        <div className="mt-6 text-center">
                            <Link href="/organization/dashboard/transactions">
                                <button className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors duration-200">
                                    View all activity
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
