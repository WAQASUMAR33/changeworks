'use client';
import { motion } from 'framer-motion';
import { 
  Users, 
  DollarSign, 
  Building2, 
  Gift, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Target,
  ArrowRight
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
        path: '/admin/donor-accounts'
    },
    { 
        title: 'Today Donations', 
        value: '$12,847', 
        change: '+8.2%',
        changeType: 'increase',
        icon: DollarSign,
        color: 'green',
        path: '/admin/transactions_page'
    },
    { 
        title: 'Organizations', 
        value: '89', 
        change: '+3.1%',
        changeType: 'increase',
        icon: Building2,
        color: 'purple',
        path: '/admin/organization'
    },
    { 
        title: 'Fund Transfers', 
        value: '156', 
        change: '+5.2%',
        changeType: 'increase',
        icon: Gift,
        color: 'orange',
        path: '/admin/fund-transfer'
    },
];

const quickActions = [
    {
        title: 'Recent Activity',
        description: 'View latest transactions',
        icon: Activity,
        color: 'blue',
        path: '/admin/transactions_page'
    },
    {
        title: 'Analytics',
        description: 'View detailed reports',
        icon: Target,
        color: 'green',
        path: '/admin'
    },
    {
        title: 'User Management',
        description: 'Manage users & roles',
        icon: Users,
        color: 'purple',
        path: '/admin/users_management'
    },
];

const getColorClasses = (color) => {
    const colors = {
        blue: {
            bg: 'bg-blue-50',
            icon: 'text-blue-600',
            border: 'border-blue-200',
            hover: 'hover:bg-blue-100'
        },
        green: {
            bg: 'bg-green-50',
            icon: 'text-green-600',
            border: 'border-green-200',
            hover: 'hover:bg-green-100'
        },
        purple: {
            bg: 'bg-purple-50',
            icon: 'text-purple-600',
            border: 'border-purple-200',
            hover: 'hover:bg-purple-100'
        },
        orange: {
            bg: 'bg-orange-50',
            icon: 'text-orange-600',
            border: 'border-orange-200',
            hover: 'hover:bg-orange-100'
        }
    };
    return colors[color] || colors.blue;
};

export default function OverviewCards() {
    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Dashboard Overview
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Welcome to your ChangeWorks admin dashboard. Here&apos;s a comprehensive overview of your platform&apos;s performance and key metrics.
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
                                whileHover={{ y: -2 }}
                                className={`${colors.bg} ${colors.border} p-6 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                                        <stat.icon className={`w-5 h-5 ${colors.icon}`} />
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        {stat.changeType === 'increase' ? (
                                            <TrendingUp className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-red-500" />
                                        )}
                                        <span className={`text-sm font-medium ${
                                            stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {stat.change}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                        {stat.value}
                                    </h3>
                                    <p className="text-sm text-gray-600 font-medium">
                                        {stat.title}
                                    </p>
                                </div>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickActions.map((action, index) => {
                    const colors = getColorClasses(action.color);
                    return (
                        <Link key={action.title} href={action.path}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                                whileHover={{ y: -2 }}
                                className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-3 rounded-lg ${colors.bg}`}>
                                            <action.icon className={`w-6 h-6 ${colors.icon}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{action.title}</h3>
                                            <p className="text-sm text-gray-600">{action.description}</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                                </div>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">New donation received</p>
                                <p className="text-sm text-gray-600">Josephine Thompson donated $500 to Education Fund</p>
                            </div>
                            <span className="text-xs text-gray-500">2 min ago</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">Organization update</p>
                                <p className="text-sm text-gray-600">Donoghue Susan updated their profile information</p>
                            </div>
                            <span className="text-xs text-gray-500">1 hour ago</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">System maintenance</p>
                                <p className="text-sm text-gray-600">Scheduled maintenance completed successfully</p>
                            </div>
                            <span className="text-xs text-gray-500">3 hours ago</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
