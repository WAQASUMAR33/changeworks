'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Settings, 
  Clock, 
  User, 
  LogOut, 
  Search,
  ChevronDown,
  Activity,
  Building2
} from 'lucide-react';

export default function OrgHeader() {
    const [orgName, setOrgName] = useState('');
    const [orgEmail, setOrgEmail] = useState('');
    const [showNotif, setShowNotif] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const org = JSON.parse(sessionStorage.getItem('orgUser'));
        if (org) {
            setOrgName(org.name || 'Organization');
            setOrgEmail(org.email || 'org@changeworks.com');
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotif(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfile(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        // Clear session storage
        sessionStorage.removeItem('orgToken');
        sessionStorage.removeItem('orgUser');
        
        // Also clear any old localStorage data
        localStorage.removeItem('orgToken');
        localStorage.removeItem('orgUser');
        localStorage.removeItem('orgRememberMe');
        
        // Redirect to login
        window.location.href = '/organization/login';
    };

    const notifications = [
        {
            id: 1,
            title: 'New Donation Received',
            message: 'A donor contributed $250 to your cause',
            time: '5 minutes ago',
            type: 'donation',
            read: false
        },
        {
            id: 2,
            title: 'GHL Account Created',
            message: 'Your GoHighLevel sub-account has been successfully created',
            time: '1 hour ago',
            type: 'ghl',
            read: false
        },
        {
            id: 3,
            title: 'Monthly Report Ready',
            message: 'Your organization performance report is now available',
            time: '2 hours ago',
            type: 'report',
            read: true
        }
    ];

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="flex justify-between items-center px-6 py-4">
                {/* Left Section - Welcome & Search */}
                <div className="flex items-center space-x-8">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            Welcome back, <span className="text-blue-600">{orgName || 'Organization'}</span>
                        </h1>
                        <p className="text-sm text-gray-500">Manage your organization and track donations</p>
                    </div>

                    {/* Search Bar */}
                    <div className="hidden md:flex items-center relative">
                        <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search donors, transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex items-center space-x-3">
                    {/* Notifications */}
                    <div className="relative" ref={notifRef}>
                        <button 
                            onClick={() => setShowNotif(!showNotif)} 
                            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        >
                            <Bell className="w-5 h-5 text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {showNotif && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                                Mark all read
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.map((notification, index) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors duration-200 ${
                                                    !notification.read ? 'bg-blue-50' : ''
                                                }`}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className={`w-2 h-2 rounded-full mt-2 ${
                                                        notification.type === 'donation' ? 'bg-green-500' :
                                                        notification.type === 'ghl' ? 'bg-blue-500' : 'bg-gray-500'
                                                    }`} />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 text-sm">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-gray-600 text-sm mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-gray-400 text-xs mt-2 flex items-center">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {notification.time}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="p-4 border-t border-gray-100">
                                        <button className="w-full text-sm text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
                                            View All Notifications
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <button 
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        >
                            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {orgName ? orgName.charAt(0).toUpperCase() : 'O'}
                                </span>
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-gray-900">{orgName || 'Organization'}</p>
                                <p className="text-xs text-gray-500">Organization</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                        </button>

                        <AnimatePresence>
                            {showProfile && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-gray-100">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                                                <span className="text-white font-medium">
                                                    {orgName ? orgName.charAt(0).toUpperCase() : 'O'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{orgName || 'Organization'}</p>
                                                <p className="text-sm text-gray-500">{orgEmail}</p>
                                                <p className="text-xs text-blue-600 font-medium">Organization</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-2">
                                        <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                                            <User className="w-4 h-4" />
                                            <span>Organization Profile</span>
                                        </button>
                                        
                                        <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                                            <Settings className="w-4 h-4" />
                                            <span>Settings</span>
                                        </button>
                                        
                                        <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                                            <Activity className="w-4 h-4" />
                                            <span>Activity Log</span>
                                        </button>
                                        
                                        <div className="border-t border-gray-100 my-2" />
                                        
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
}
