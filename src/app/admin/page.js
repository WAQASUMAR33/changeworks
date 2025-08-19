'use client';
import Sidebar from '../admin/components/sidebar';
import Header from '../admin/components/header';
import OverviewCards from '../admin/components/overviewCards';
import { motion } from 'framer-motion';


export default function PublisherDashboard() {
    return (
        <div className="min-h-screen bg-white text-black">
         
            {/* Main content sits beside collapsed sidebar (80px) */}
             <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="ml-20 transition-all duration-300"
      >
        <OverviewCards />
      </motion.div>
        </div>
    );
}
