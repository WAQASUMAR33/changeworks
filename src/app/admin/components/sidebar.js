'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

import {
  UserIcon,
  Settings,
  ArrowRightLeft,
  GiftIcon,
  LogOut,
  KeyIcon,
  BarChartIcon,
  CircleUserRound,
  MessageSquareWarning,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
Gift,
Users,
ClipboardPlus,
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});

  const toggleSubmenu = (name) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const menuItems = [

     {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin',
     
    },

    {
      name: 'Donors',
      icon: Gift,
      path: '',
      subItems: [
        { name: 'List Donors', path: '/admin/donor-accounts' },
        { name: 'Transactions', path: '/admin/donor-accounts' },
      ],
    },
    {
      name: 'Organizations',
      icon: Users,
      path: '',
       subItems: [
        { name: 'List Organizations', path: '/admin/organization' },
        { name: 'Transactions', path: '/admin' },
      ],
    },

    {
      name: 'Organizations Trnx',
      icon: ArrowRightLeft,
      path: '',
       subItems: [
        { name: 'List Organizations', path: '/admin' },
        { name: 'Transactions', path: '/admin' },
      ],
    },


    {
      name: 'Settings',
      icon: Settings,
      path: '',
       subItems: [
        { name: 'List Organizations', path: '/admin' },
        { name: 'Transactions', path: '/admin' },
      ],
    },
   
    {
      name: 'Profile',
      icon: CircleUserRound,
      path: '/profile',
       subItems: []
    },
    {
      name: 'Reports',
      icon: ClipboardPlus,
      path: '/reports',
       subItems: [],
    },
    {
      name: 'Logout',
      icon: LogOut,
      path: '/login',
    },
  ];

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: isHovered ? 260 : 80 }}
      transition={{ duration: 0.25 }}
      className="h-full bg-[#1f2937] text-white border-r border-black shadow-lg overflow-y-auto flex-shrink-0"
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-20 border-b border-gray-800">
          <Image src="/images/logo.png" alt="Logo" width={40} height={40} />
          {isHovered && <span className="ml-2 text-xl font-bold">Logo</span>}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 mt-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              const hasSub = item.subItems && item.subItems.length > 0;
              const isSubmenuOpen = openSubmenus[item.name];

              return (
                <li key={item.name}>
                  <div
                    onClick={() => hasSub && toggleSubmenu(item.name)}
                    className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-700 transition duration-200 ${
                      isActive ? 'bg-gray-800 font-semibold' : ''
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {isHovered && (
                      <>
                        <span className="ml-3 flex-1">{item.name}</span>
                        {hasSub &&
                          (isSubmenuOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          ))}
                      </>
                    )}
                  </div>

                  {/* Submenu */}
                  {hasSub && isSubmenuOpen && isHovered && (
                    <ul className="pl-12 pr-4 pb-1 space-y-1">
                      {item.subItems.map((sub) => {
                        const isSubActive = pathname === sub.path;
                        return (
                          <li key={sub.name}>
                            <Link
                              href={sub.path}
                              className={`block py-1 text-sm hover:text-white transition ${
                                isSubActive ? 'text-white font-medium' : 'text-gray-300'
                              }`}
                            >
                              {sub.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </motion.div>
  );
};

export default Sidebar;
