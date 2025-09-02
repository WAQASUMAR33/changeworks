'use client';
import OverviewCards from './components/overviewCards';
import { motion } from 'framer-motion';

export default function PublisherDashboard() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="min-h-screen"
        >
            <OverviewCards />
        </motion.div>
    );
}
