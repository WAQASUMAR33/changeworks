'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

import {
  Settings,
  ArrowRightLeft,
  LogOut,
  CircleUserRound,
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
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    {
      name: 'Donors',
      icon: Gift,
      path: '',
      subItems: [
        { name: 'List Donors', path: '/admin/donor-accounts' },
        { name: 'Transactions', path: '/admin/transactions_page' },
      ],
    },
    {
      name: 'Organizations',
      icon: Users,
      path: '',
      subItems: [
        { name: 'List Organizations', path: '/admin/organization' },
        { name: 'Transactions', path: '/admin/transactions_page' },
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
        { name: 'General', path: '/admin/settings' },
        { name: 'Preferences', path: '/admin' },
      ],
    },

    { name: 'User\'s Management', icon: CircleUserRound, path: '/admin/users_management' },
    { name: 'Reports', icon: ClipboardPlus, path: '/admin' },
    { name: 'Logout', icon: LogOut, path: '/admin' },
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
          {isHovered && <span className="ml-2 text-lg font-bold">Logo</span>}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 mt-4">
          <ul className="space-y-1 text-xs"> {/* font 2px smaller */}
            {menuItems.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              const hasSub = item.subItems && item.subItems.length > 0;
              const isSubmenuOpen = openSubmenus[item.name];

              return (
                <li key={item.name}>
                  {/* Main menu item */}
                  <motion.div
                    onClick={() => hasSub && toggleSubmenu(item.name)}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(55,65,81,0.8)' }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center px-4 py-3 cursor-pointer rounded-md transition duration-200 ${
                      isActive ? 'bg-gray-800 font-semibold' : ''
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {isHovered && (
                      <div className="flex items-center justify-between flex-1 ml-3">
                        <span>{item.name}</span>
                        {hasSub &&
                          (isSubmenuOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          ))}
                      </div>
                    )}
                  </motion.div>

                  {/* Submenu with AnimatePresence */}
                  <AnimatePresence>
                    {hasSub && isSubmenuOpen && isHovered && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="pl-12 pr-4 pb-1 space-y-1"
                      >
                        {item.subItems.map((sub) => {
                          const isSubActive = pathname === sub.path;
                          return (
                            <motion.li
                              key={sub.name}
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Link
                                href={sub.path}
                                className={`block py-1 text-xs hover:text-white transition ${
                                  isSubActive ? 'text-white font-medium' : 'text-gray-400'
                                }`}
                              >
                                {sub.name}
                              </Link>
                            </motion.li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
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
