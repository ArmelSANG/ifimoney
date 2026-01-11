'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/common';
import { Sidebar, adminNavItems, tontinierNavItems, clientNavItems } from './Sidebar';
import type { UserRole } from '@/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (!isLoading && user && user.role !== requiredRole) {
      // Rediriger vers le bon dashboard si le rôle ne correspond pas
      const dashboardPath = getDashboardPath(user.role);
      router.push(dashboardPath);
    } else if (!isLoading && user && !user.cgu_accepted) {
      router.push('/auth/cgu');
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  if (isLoading) {
    return <Loading fullScreen text="Chargement..." />;
  }

  if (!user || user.role !== requiredRole) {
    return <Loading fullScreen text="Redirection..." />;
  }

  const navItems = getNavItems(requiredRole);

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-950 flex">
      <Sidebar navItems={navItems} role={requiredRole} />
      <main className="flex-1 min-h-screen overflow-x-hidden">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'tontinier':
      return '/tontinier/dashboard';
    case 'client':
      return '/client/dashboard';
    default:
      return '/';
  }
}

function getNavItems(role: UserRole) {
  switch (role) {
    case 'admin':
      return adminNavItems;
    case 'tontinier':
      return tontinierNavItems;
    case 'client':
      return clientNavItems;
    default:
      return [];
  }
}

export default DashboardLayout;
