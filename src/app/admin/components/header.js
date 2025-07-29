'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Settings, Clock, User, LogOut, MessageSquare, HelpCircle, CreditCard } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
    const [userName, setUserName] = useState('');
    const [showNotif, setShowNotif] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) setUserName(`${user.firstName} ${user.lastName || ''}`);
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
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-center border-b border-gray-200 px-6 py-4 bg-white sticky top-0 z-30"
        >
            <h1 className="text-xl font-semibold text-gray-800">
                Welcome, <span className="text-violet-600">{userName || 'Publisher'}</span>
            </h1>

            <div className="flex items-center gap-6 relative">
                <div className="relative" ref={notifRef}>
                    <button onClick={() => setShowNotif(!showNotif)} className="relative hover:text-violet-600 transition">
                        <Bell className="w-5 h-5 text-gray-500" />
                        <span className="absolute -top-1 -right-2 text-xs bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center font-semibold">3</span>
                    </button>

                    <AnimatePresence>
                        {showNotif && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 mt-4 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-40"
                            >
                                <div className="p-4 border-b border-gray-200 font-semibold text-gray-800 flex justify-between">
                                    Notifications <button className="text-sm text-violet-600">Clear All</button>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    <div className="p-4 text-sm text-gray-600">
                                        <p className="font-semibold text-black">Josephine Thompson</p>
                                        commented on admin panel: <span className="italic text-gray-500">“Wow 😍 this looks awesome!”</span>
                                    </div>
                                    <div className="p-4 text-sm text-gray-600">
                                        <p className="font-semibold text-black">Donoghue Susan</p>
                                        Hi, how are you? What about our next meeting?
                                    </div>
                                </div>
                                <div className="p-4 border-t border-gray-200">
                                    <button className="text-sm text-white bg-violet-600 px-4 py-2 rounded hover:bg-violet-700 transition w-full">
                                        View All Notifications
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="relative" ref={profileRef}>
                    <button onClick={() => setShowProfile(!showProfile)}>
                        <Image
                            src="/avatar.jpg"
                            alt="Avatar"
                            width={35}
                            height={35}
                            className="rounded-full border-2 border-violet-600"
                        />
                    </button>

                    <AnimatePresence>
                        {showProfile && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 mt-4 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-40"
                            >
                                <div className="p-4 text-sm font-semibold text-gray-700 border-b border-gray-200">
                                    Welcome {userName || 'User'}!
                                </div>
                                <ul className="text-sm text-gray-600 divide-y divide-gray-100">
                                    <li className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-2"><User size={16} /> Profile</li>
                                    <li className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-2"><MessageSquare size={16} /> Messages</li>
                                    <li className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-2"><CreditCard size={16} /> Pricing</li>
                                    <li className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-2"><HelpCircle size={16} /> Help</li>
                                    <li
                                        onClick={handleLogout}
                                        className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                    >
                                        <LogOut size={16} className="text-red-500" />
                                        <span className="text-red-500">Logout</span>
                                    </li>
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

