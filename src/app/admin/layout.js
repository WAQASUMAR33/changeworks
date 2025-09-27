'use client';

import { useEffect, useState } from 'react';

export default function AdminLayout({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user has admin token or is an admin user
    const adminToken = localStorage.getItem('adminToken');
    const regularToken = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Check if user is admin through admin token
    if (adminToken) {
      setIsAdmin(true);
      return;
    }
    
    // Check if user is admin through regular token
    if (regularToken && user) {
      try {
        const userData = JSON.parse(user);
        if (userData.role === 'ADMIN' || userData.role === 'SUPERADMIN' || userData.role === 'MANAGER') {
          // Convert regular token to admin token
          localStorage.setItem('adminToken', regularToken);
          localStorage.setItem('adminUser', user);
          setIsAdmin(true);
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    // If no valid admin access, redirect to general login
    window.location.replace('/login');
  }, []);

  // If not admin, don't render anything (redirect will happen)
  if (!isAdmin) {
    return null;
  }

  // Show admin layout with sidebar and header
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
        </div>
        <nav className="mt-6">
          <a href="/admin" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">Dashboard</a>
          <a href="/admin/users_management" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">Users</a>
          <a href="/admin/organization" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">Organizations</a>
          <a href="/admin/donor-accounts" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">Donors</a>
          <a href="/admin/packages" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">Packages</a>
          <a href="/admin/fund-transfer" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">Fund Transfers</a>
          <a href="/admin/transactions_page" className="block px-6 py-3 text-gray-700 hover:bg-gray-100">Transactions</a>
        </nav>
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
            <button 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/admin/login';
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
