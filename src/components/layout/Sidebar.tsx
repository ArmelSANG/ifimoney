'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Avatar, NotificationCenter } from '@/components/common';
import {
  LayoutDashboard,
  Users,
  Wallet,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Phone,
  MessageCircle,
  Menu,
  X,
  CircleDollarSign,
  UserPlus,
  Clock,
  BarChart3,
} from 'lucide-react';
import { ADMIN_CONTACT } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SidebarProps {
  navItems: NavItem[];
  role: 'admin' | 'tontinier' | 'client';
}

export function Sidebar({ navItems, role }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const roleLabels = {
    admin: 'Administrateur',
    tontinier: 'Tontinier',
    client: 'Client',
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 rounded-xl bg-white dark:bg-dark-800 shadow-lg lg:hidden"
      >
        <Menu className="w-6 h-6 text-dark-600 dark:text-dark-300" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-dark-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        className={cn(
          'fixed left-0 top-0 h-full z-50 bg-white dark:bg-dark-900 border-r border-dark-100 dark:border-dark-800',
          'flex flex-col transition-all duration-300',
          'lg:relative',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-dark-100 dark:border-dark-800">
          <div className="flex items-center justify-between">
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                    <CircleDollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-dark-900 dark:text-white">ifiMoney</h1>
                    <p className="text-xs text-dark-500">{roleLabels[role]}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Close & Collapse Button */}
            <div className="flex items-center gap-2">
              {!isCollapsed && <NotificationCenter />}
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 lg:hidden"
              >
                <X className="w-5 h-5 text-dark-500" />
              </button>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5 text-dark-500" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-dark-500" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800'
                    )}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <AnimatePresence mode="wait">
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="flex-1 font-medium truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {item.badge && item.badge > 0 && (
                      <span className={cn(
                        'flex-shrink-0 px-2 py-0.5 text-xs font-bold rounded-full',
                        isActive ? 'bg-white/20 text-white' : 'bg-danger-500 text-white'
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Contact Section (for tontinier/client) */}
        {role !== 'admin' && !isCollapsed && (
          <div className="p-4 border-t border-dark-100 dark:border-dark-800">
            <p className="text-xs text-dark-500 mb-2">
              {role === 'client' ? 'Contacter votre tontinier' : 'Contacter l\'admin'}
            </p>
            <div className="flex gap-2">
              <a
                href={role === 'tontinier' ? ADMIN_CONTACT.phone_link : '#'}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-success-500 text-white text-sm font-medium hover:bg-success-600 transition-colors"
              >
                <Phone className="w-4 h-4" />
                {!isCollapsed && 'Appeler'}
              </a>
              <a
                href={role === 'tontinier' ? ADMIN_CONTACT.whatsapp_link : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#20BA5C] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {!isCollapsed && 'WhatsApp'}
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-dark-100 dark:border-dark-800">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors mb-2"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!isCollapsed && (
              <span className="font-medium">{isDark ? 'Mode clair' : 'Mode sombre'}</span>
            )}
          </button>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-50 dark:bg-dark-800">
            <Avatar src={user?.profile_photo_url} name={user?.full_name} size="sm" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-900 dark:text-white truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-dark-500 truncate">{roleLabels[role]}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="p-2 rounded-lg text-dark-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

// Navigation items par rôle
export const adminNavItems: NavItem[] = [
  { label: 'Tableau de bord', href: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Demandes', href: '/admin/requests', icon: <UserPlus className="w-5 h-5" /> },
  { label: 'Tontiniers', href: '/admin/tontiniers', icon: <Users className="w-5 h-5" /> },
  { label: 'Clients', href: '/admin/clients', icon: <Users className="w-5 h-5" /> },
  { label: 'Tontines', href: '/admin/tontines', icon: <Wallet className="w-5 h-5" /> },
  { label: 'Transactions', href: '/admin/transactions', icon: <FileText className="w-5 h-5" /> },
  { label: 'Statistiques', href: '/admin/stats', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Paramètres', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
];

export const tontinierNavItems: NavItem[] = [
  { label: 'Tableau de bord', href: '/tontinier/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Mes clients', href: '/tontinier/clients', icon: <Users className="w-5 h-5" /> },
  { label: 'Mes tontines', href: '/tontinier/tontines', icon: <Wallet className="w-5 h-5" /> },
  { label: 'Transactions', href: '/tontinier/transactions', icon: <FileText className="w-5 h-5" /> },
  { label: 'Mes bénéfices', href: '/tontinier/earnings', icon: <CircleDollarSign className="w-5 h-5" /> },
  { label: 'Mon compte', href: '/tontinier/account', icon: <Clock className="w-5 h-5" /> },
  { label: 'Paramètres', href: '/tontinier/settings', icon: <Settings className="w-5 h-5" /> },
];

export const clientNavItems: NavItem[] = [
  { label: 'Tableau de bord', href: '/client/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Mes tontines', href: '/client/tontines', icon: <Wallet className="w-5 h-5" /> },
  { label: 'Mes transactions', href: '/client/transactions', icon: <FileText className="w-5 h-5" /> },
  { label: 'Paramètres', href: '/client/settings', icon: <Settings className="w-5 h-5" /> },
];

export default Sidebar;
