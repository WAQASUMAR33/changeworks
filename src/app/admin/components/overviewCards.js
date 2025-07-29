'use client';
import { motion } from 'framer-motion';

const stats = [
    { title: 'Approved & cleared balance', value: '12,304' },
    { title: 'Approved & uncleared balance', value: '932' },
    { title: 'Cleared + uncleared balance', value: '$3,420.50' },
    { title: 'tracked but not approved', value: '45' },
];

export default function OverviewCards() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="p-6"
        >
            <h2 className="text-lg font-semibold text-black mb-4">Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className="bg-gradient-to-br from-white to-blue-50 p-5 rounded-xl shadow hover:shadow-lg transition"
                    >
                        <h3 className="text-sm text-gray-500">{stat.title}</h3>
                        <p className="text-2xl font-bold text-violet-700">{stat.value}</p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
