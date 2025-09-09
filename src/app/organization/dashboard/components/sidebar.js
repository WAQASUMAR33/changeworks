'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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
  Home,
  BarChart3,
  Shield,
  Bell,
  Menu,
  X,
  ChevronLeft,
  Pin,
  PinOff,
} from 'lucide-react';

const OrgSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleSubmenu = (name) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('orgToken');
    localStorage.removeItem('orgUser');
    router.push('/organization/login');
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  const isExpanded = isHovered || isPinned;

  const menuItems = [
    { 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/organization/dashboard',
    },
    {
      name: 'Donors',
      icon: Gift,
      path: '/organization/dashboard/donors',
      subItems: [
        { name: 'List Donors', path: '/organization/dashboard/donors' },
        { name: 'Add Donor', path: '/organization/dashboard/donors/add' },
      ],
    },
    {
      name: 'Transactions',
      icon: ArrowRightLeft,
      path: '/organization/dashboard/transactions',
    },
    {
      name: 'Reports',
      icon: BarChart3,
      path: '/organization/dashboard/reports',
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/organization/dashboard/settings',
      subItems: [
        { name: 'Profile', path: '/organization/dashboard/settings/profile' },
        { name: 'Security', path: '/organization/dashboard/settings/security' },
        { name: 'Notifications', path: '/organization/dashboard/settings/notifications' },
      ],
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="flex items-center justify-between h-14 px-3 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="ml-1"
              >
                <h1 className="text-base font-semibold text-white">ChangeWorks</h1>
                <p className="text-xs text-gray-400">Organization Portal</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={togglePin}
              className="p-1 rounded hover:bg-gray-700 transition-colors duration-200"
            >
              {isPinned ? (
                <PinOff className="w-3 h-3 text-gray-400" />
              ) : (
                <Pin className="w-3 h-3 text-gray-400" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        <ul className="space-y-0.5">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            const hasSub = item.subItems && item.subItems.length > 0;
            const isSubmenuOpen = openSubmenus[item.name];

            return (
              <li key={item.name}>
                {/* Main menu item */}
                <div
                  onClick={() => {
                    if (hasSub) {
                      toggleSubmenu(item.name);
                    } else {
                      router.push(item.path);
                    }
                  }}
                  className={`group flex items-center px-2 py-1.5 cursor-pointer rounded-md transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between flex-1 ml-2"
                      >
                        <span className="font-medium text-sm">{item.name}</span>
                        {hasSub && (
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isSubmenuOpen ? 'rotate-180' : ''} ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Submenu */}
                <AnimatePresence>
                  {hasSub && isSubmenuOpen && isExpanded && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-4 mt-0.5 space-y-0.5"
                    >
                      {item.subItems.map((sub, subIndex) => {
                        const isSubActive = pathname === sub.path;
                        return (
                          <motion.li
                            key={sub.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: subIndex * 0.05 }}
                          >
                            <Link
                              href={sub.path}
                              className={`block px-2 py-0.5 text-sm rounded-md transition-all duration-200 ${
                                isSubActive 
                                  ? 'bg-blue-600/20 text-blue-300 font-medium' 
                                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
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

      {/* Bottom Section */}
      <div className="p-1.5 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-2 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-all duration-200 group"
        >
          <LogOut className="w-4 h-4" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="ml-2 font-medium text-sm"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        initial={{ width: 64 }}
        animate={{ width: isExpanded ? 240 : 64 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        onMouseEnter={() => !isPinned && setIsHovered(true)}
        onMouseLeave={() => !isPinned && setIsHovered(false)}
        className="hidden lg:block h-full bg-gray-900 border-r border-gray-700 shadow-lg overflow-hidden"
      >
        <SidebarContent />
      </motion.div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <motion.div
        initial={{ x: -240 }}
        animate={{ x: isMobileOpen ? 0 : -240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="lg:hidden fixed left-0 top-0 h-full w-60 bg-gray-900 border-r border-gray-700 shadow-lg z-50"
      >
        <SidebarContent />
      </motion.div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 rounded-lg text-white shadow-lg border border-gray-700"
      >
        {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>
    </>
  );
};

export default OrgSidebar;
