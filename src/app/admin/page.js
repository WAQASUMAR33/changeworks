'use client';
import Sidebar from '../publisher/components/sidebar';
import Header from '../publisher/components/header';
import OverviewCards from '../publisher/components/overviewCards';

export default function PublisherDashboard() {
    return (
        <div className="min-h-screen bg-white text-black">
            <Sidebar />

            {/* Main content sits beside collapsed sidebar (80px) */}
            <div className="ml-20 transition-all duration-300">
                <Header />
                <OverviewCards />
            </div>
        </div>
    );
}
