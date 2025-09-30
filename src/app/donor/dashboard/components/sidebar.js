'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  Heart,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Gift,
  TrendingUp,
  Bell,
  Pin,
  PinOff,
} from 'lucide-react';

const DonorSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    router.push('/login');
  };

  const isExpanded = isHovered || isPinned;

  const menuItems = [
    { 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/donor/dashboard',
    },
    {
      name: 'My Donations',
      icon: Heart,
      path: '/donor/dashboard/donations',
    },
    {
      name: 'Subscriptions',
      icon: CreditCard,
      path: '/donor/dashboard/subscriptions',
    },
    {
      name: 'Impact Reports',
      icon: TrendingUp,
      path: '/donor/dashboard/impact',
    },
    {
      name: 'Profile',
      icon: User,
      path: '/donor/dashboard/profile',
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/donor/dashboard/settings',
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo and Toggle */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        {isExpanded && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Donor Portal</h2>
              <p className="text-xs text-gray-500">ChangeWorks Fund</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsPinned(!isPinned)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          {isPinned ? (
            <Pin className="w-4 h-4 text-gray-600" />
          ) : (
            <PinOff className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
              {isExpanded && (
                <span className="font-medium">{item.name}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 text-red-500" />
          {isExpanded && (
            <span className="font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={`bg-white shadow-lg transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SidebarContent />
    </div>
  );
};

export default DonorSidebar;
