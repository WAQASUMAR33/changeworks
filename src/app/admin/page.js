'use client';
import Sidebar from '../admin/components/sidebar';
import Header from '../admin/components/header';
import OverviewCards from '../admin/components/overviewCards';

export default function PublisherDashboard() {
    return (
        <div className="min-h-screen bg-white text-black">
         
            {/* Main content sits beside collapsed sidebar (80px) */}
            <div className="ml-20 transition-all duration-300">
                <OverviewCards />
            </div>
        </div>
    );
}
