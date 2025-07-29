// Sidebar.js
'use client';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    BarChart2,
    Gift,
    Grid,
    Wrench,
    User,
    LifeBuoy,
    ChevronRight,
    Box,
    ActivitySquare,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/publisher' },

    {
        name: 'Account', icon: User, subItems: [
            { name: 'Profile', subItems: [
                { name: 'Overview', path: '/dashboard/publisher/account/profile/overview' },
                { name: 'Promotional Spaces', path: '/dashboard/publisher/account/profile/promotional-spaces' },
            ]},
            { name: 'Settings', subItems: [
                { name: 'Contact Details', path: '/dashboard/publisher/account/settings/contact-details' },
                { name: 'Logo', path: '/dashboard/publisher/account/settings/logo' },
                { name: 'Site Information', path: '/dashboard/publisher/account/settings/site-info' },
                { name: 'Advertiser Alert Options', path: '/dashboard/publisher/account/settings/alerts' },
                { name: 'Subscription Preferences', path: '/dashboard/publisher/account/settings/subscription' },
                { name: 'Payment Details', path: '/dashboard/publisher/account/settings/payment-details' },
                { name: 'Promotion Type', path: '/dashboard/publisher/account/settings/promotion-type' },
                { name: 'Regions', path: '/dashboard/publisher/account/settings/regions' },
            ]},
            { name: 'Users', subItems: [
                { name: 'Manage Users', path: '/dashboard/publisher/account/users/manage' },
                { name: 'User Permissions', path: '/dashboard/publisher/account/users/permissions' },
                { name: 'Contact Details', path: '/dashboard/publisher/account/users/contact-details' },
                { name: 'Invite User', path: '/dashboard/publisher/account/users/invite' },
            ]},
            { name: 'Legal Agreements', subItems: [
                { name: 'Terms & Conditions', path: '/dashboard/publisher/account/legal/terms' },
            ]},
        ]
    },

    {
        name: 'Advertisers', icon: Gift, subItems: [
            { name: 'My Programs', path: '/dashboard/publisher/advertisers/my-programs' },
            { name: 'Closed Programs', path: '/dashboard/publisher/advertisers/closed' },
            { name: 'Join Programs', path: '/dashboard/publisher/advertisers/join' },
            { name: 'Partner Recommendations', path: '/dashboard/publisher/advertisers/recommendations' },
            { name: 'Program Commission Rates', path: '/dashboard/publisher/advertisers/commissions' },
        ]
    },

    {
        name: 'Toolbox', icon: Wrench, subItems: [
            { name: 'Links & Tools', subItems: [
                { name: 'Link Builder', path: '/dashboard/publisher/toolbox/link-builder' },
                { name: 'My Creative', path: '/dashboard/publisher/toolbox/my-creative' },
                { name: 'Create-a-Feed', path: '/dashboard/publisher/toolbox/create-feed' },
                { name: 'Publisher MasterTag', path: '/dashboard/publisher/toolbox/mastertag' },
                { name: 'Service Partner Directory', path: '/dashboard/publisher/toolbox/partner-directory' },
                { name: 'MyAwin Chrome Extension', path: '/dashboard/publisher/toolbox/chrome-extension' },
                { name: 'Transaction Notifications', path: '/dashboard/publisher/toolbox/transaction-notifications' },
            ]},
            { name: 'Promotional', subItems: [
                { name: 'My Offers', path: '/dashboard/publisher/toolbox/offers' },
                { name: 'Opportunity Marketplace', path: '/dashboard/publisher/toolbox/marketplace' },
                { name: 'Advertiser News', path: '/dashboard/publisher/toolbox/news' },
                { name: 'Email Campaign Approvals', path: '/dashboard/publisher/toolbox/email-approvals' },
                { name: 'Exposure Planner', path: '/dashboard/publisher/toolbox/exposure-planner' },
            ]},
        ]
    },

    {
        name: 'Reports', icon: BarChart2, subItems: [
            { name: 'Advertiser Performance', subItems: [
                { name: 'Today', path: '/dashboard/publisher/reports/advertiser/today' },
                { name: 'Week', path: '/dashboard/publisher/reports/advertiser/week' },
                { name: 'Month', path: '/dashboard/publisher/reports/advertiser/month' },
                { name: 'Year', path: '/dashboard/publisher/reports/advertiser/year' },
            ]},
            { name: 'Product Performance', subItems: [
                { name: 'Today', path: '/dashboard/publisher/reports/product/today' },
                { name: 'Week', path: '/dashboard/publisher/reports/product/week' },
                { name: 'Month', path: '/dashboard/publisher/reports/product/month' },
                { name: 'Year', path: '/dashboard/publisher/reports/product/year' },
            ]},
            { name: 'Performance Over Time', subItems: [
                { name: 'Today', path: '/dashboard/publisher/reports/time/today' },
                { name: 'Week', path: '/dashboard/publisher/reports/time/week' },
                { name: 'Month', path: '/dashboard/publisher/reports/time/month' },
                { name: 'Year', path: '/dashboard/publisher/reports/time/year' },
            ]},
            { name: 'Commission Group Performance', subItems: [
                { name: 'Today', path: '/dashboard/publisher/reports/group/today' },
                { name: 'Week', path: '/dashboard/publisher/reports/group/week' },
                { name: 'Month', path: '/dashboard/publisher/reports/group/month' },
                { name: 'Year', path: '/dashboard/publisher/reports/group/year' },
            ]},
            { name: 'Creative Performance', subItems: [
                { name: 'Today', path: '/dashboard/publisher/reports/creative/today' },
                { name: 'Week', path: '/dashboard/publisher/reports/creative/week' },
                { name: 'Month', path: '/dashboard/publisher/reports/creative/month' },
                { name: 'Year', path: '/dashboard/publisher/reports/creative/year' },
            ]},
            { name: 'Device Performance', subItems: [
                { name: 'Today', path: '/dashboard/publisher/reports/device/today' },
                { name: 'Week', path: '/dashboard/publisher/reports/device/week' },
                { name: 'Month', path: '/dashboard/publisher/reports/device/month' },
                { name: 'Year', path: '/dashboard/publisher/reports/device/year' },
            ]},
            { name: 'Click References', path: '/dashboard/publisher/reports/click-references' },
            { name: 'Payment', subItems: [
                { name: 'Overview', path: '/dashboard/publisher/reports/payment/overview' },
                { name: 'History', path: '/dashboard/publisher/reports/payment/history' },
            ]},
            { name: 'Transactions', subItems: [
                { name: 'Today', path: '/dashboard/publisher/reports/transactions/today' },
                { name: 'Week', path: '/dashboard/publisher/reports/transactions/week' },
                { name: 'Month', path: '/dashboard/publisher/reports/transactions/month' },
                { name: 'Year', path: '/dashboard/publisher/reports/transactions/year' },
            ]},
        ]
    },

    {
        name: 'Support', icon: LifeBuoy, subItems: [
            { name: 'Contact Support', path: '/dashboard/publisher/support/contact' },
            { name: 'Videos', path: '/dashboard/publisher/support/videos' },
            { name: 'Help Center', path: '/dashboard/publisher/support/help-center' },
            { name: 'Photo Guides', path: '/dashboard/publisher/support/photos' },
        ]
    },

    { name: 'Activity', icon: ActivitySquare, path: '/dashboard/publisher/activity' },
];
const SidebarItem = ({ item, isHovered, pathname, level = 0 }) => {
    const [open, setOpen] = useState(false);
    const isActive = (path) => pathname === path;
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
        <li className="relative">
            <div
                onClick={() => hasSubItems ? setOpen(!open) : null}
                className={`flex items-center px-4 py-3 cursor-pointer transition group ${
                    isActive(item.path) ? 'bg-violet-600 bg-opacity-20 border-l-4 border-violet-500' : 'hover:bg-gray-700'
                } ${isHovered ? 'justify-between' : 'justify-center'}`}
                style={{ paddingLeft: `${level * 12 + 16}px` }}
            >
                <div className="flex items-center gap-3 w-full">
                    {item.icon && <item.icon className="text-violet-400 w-5 h-5" />}
                    {isHovered && <span className="text-sm text-gray-200">{item.name}</span>}
                </div>
                {hasSubItems && isHovered && (
                    <ChevronRight
                        className={`text-gray-400 w-4 h-4 transition-transform duration-300 ${open ? 'rotate-90' : ''}`}
                    />
                )}
            </div>

            <AnimatePresence>
                {hasSubItems && open && isHovered && (
                    <motion.ul
                        className="space-y-1"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {item.subItems.map((subItem, index) => (
                            <SidebarItem
                                key={index}
                                item={subItem}
                                isHovered={isHovered}
                                pathname={pathname}
                                level={level + 1}
                            />
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </li>
    );
};

export default function Sidebar() {
    const pathname = usePathname();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{ width: isHovered ? 260 : 80 }}
            transition={{ duration: 0.25 }}
            className="h-screen bg-[#1f2937] text-white border-r border-black shadow-lg fixed top-0 left-0 z-50 overflow-y-auto"
        >
            <div className="flex items-center justify-center h-16 border-b border-gray-700 px-4">
                <Image
                    src="/imgs/logo.png"
                    alt="Logo"
                    width={isHovered ? 120 : 30}
                    height={30}
                    className="transition-all duration-200 object-contain"
                />
            </div>
            <ul className="mt-4 space-y-2">
                {menuItems.map((item, index) => (
                    <SidebarItem
                        key={index}
                        item={item}
                        isHovered={isHovered}
                        pathname={pathname}
                    />
                ))}
            </ul>
        </motion.div>
    );
}
