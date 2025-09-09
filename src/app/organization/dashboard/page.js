'use client';
import { motion } from 'framer-motion';
import { 
  Users, 
  DollarSign, 
  Building2, 
  TrendingUp, 
  Activity,
  Target,
  ArrowRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';

const stats = [
    { 
        title: 'Total Donors', 
        value: '1,247', 
        change: '+12.5%',
        changeType: 'increase',
        icon: Users,
        color: 'blue',
        path: '/organization/dashboard/donors'
    },
    { 
        title: 'Total Donations', 
        value: '$45,847', 
        change: '+8.2%',
        changeType: 'increase',
        icon: DollarSign,
        color: 'green',
        path: '/organization/dashboard/transactions'
    },
    { 
        title: 'GHL Accounts', 
        value: '3', 
        change: '+1',
        changeType: 'increase',
        icon: Building2,
        color: 'purple',
        path: '/organization/dashboard/ghl/manage'
    },
    { 
        title: 'This Month', 
        value: '$12,156', 
        change: '+15.2%',
        changeType: 'increase',
        icon: TrendingUp,
        color: 'orange',
        path: '/organization/dashboard/reports'
    },
];

const quickActions = [
    {
        title: 'Create GHL Account',
        description: 'Set up a new GoHighLevel sub-account',
        icon: Plus,
        color: 'blue',
        path: '/organization/dashboard/ghl/create'
    },
    {
        title: 'Recent Donations',
        description: 'View latest donor contributions',
        icon: Activity,
        color: 'green',
        path: '/organization/dashboard/transactions'
    },
    {
        title: 'Analytics',
        description: 'View detailed performance reports',
        icon: Target,
        color: 'purple',
        path: '/organization/dashboard/reports'
    },
];

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                {/* Quick Actions */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {quickActions.map((action, index) => {
                            const colors = getColorClasses(action.color);
                            return (
                                <Link key={action.title} href={action.path}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                                        className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg group`}
                                    >
                                        <div className="flex items-center space-x-4 mb-4">
                                            <div className={`p-3 rounded-xl bg-white ${colors.icon}`}>
                                                <action.icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 text-lg">{action.title}</h3>
                                                <p className="text-gray-600 text-sm">{action.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
                                            <span>Get started</span>
                                            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                                        </div>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Activity */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                    <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl">
                                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">New donation received</p>
                                    <p className="text-sm text-gray-600">John Smith donated $500 to your cause</p>
                                </div>
                                <span className="text-sm text-gray-500">2 hours ago</span>
                            </div>
                            
                            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl">
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">GHL account created</p>
                                    <p className="text-sm text-gray-600">New GoHighLevel sub-account &quot;Education Fund&quot; created</p>
                                </div>
                                <span className="text-sm text-gray-500">1 day ago</span>
                            </div>
                            
                            <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl">
                                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">New donor registered</p>
                                    <p className="text-sm text-gray-600">Sarah Johnson joined your organization</p>
                                </div>
                                <span className="text-sm text-gray-500">3 days ago</span>
                            </div>
                        </div>
                        
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
