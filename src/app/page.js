'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if organization is already logged in first
    const orgToken = localStorage.getItem('orgToken');
    const orgUser = localStorage.getItem('orgUser');
    
    // Check if admin user is logged in
    const adminToken = localStorage.getItem('token');
    const adminUser = localStorage.getItem('user');

    if (orgToken && orgUser) {
      // Organization is logged in, redirect to organization dashboard
      router.push('/organization/dashboard');
    } else if (adminToken && adminUser) {
      // Admin user is logged in, redirect to admin dashboard
      router.push('/admin');
    } else {
      // No one is logged in, redirect to organization login page
      router.push('/organization/login');
    }
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading ChangeWorks...</p>
      </div>
    </div>
  );
}
