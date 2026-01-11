'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout';
import { StatCard, Card, CardHeader, CardTitle, Loading, Badge } from '@/components/common';
import { userService } from '@/services/user';
import { formatCurrency, formatNumber } from '@/utils';
import type { AdminStats } from '@/types';
import { Users, Wallet, TrendingUp, TrendingDown, UserPlus, CircleDollarSign, Activity, FileText } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const result = await userService.getAdminStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
      setIsLoading(false);
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <DashboardLayout requiredRole="admin"><Loading text="Chargement..." /></DashboardLayout>;
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="page-header">
        <h1 className="page-title">Tableau de bord Administrateur</h1>
        <p className="page-description">Vue d'ensemble de la plateforme TontinePro</p>
      </div>

      <div className="stats-grid mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard title="Mise Totale" value={formatCurrency(stats?.total_mise || 0)} icon={<CircleDollarSign className="w-6 h-6" />} variant="primary" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard title="Dépôts Totaux" value={formatCurrency(stats?.total_deposits || 0)} icon={<TrendingUp className="w-6 h-6" />} variant="success" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard title="Retraits Totaux" value={formatCurrency(stats?.total_withdrawals || 0)} icon={<TrendingDown className="w-6 h-6" />} variant="warning" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatCard title="Demandes en attente" value={formatNumber(stats?.pending_requests || 0)} icon={<UserPlus className="w-6 h-6" />} variant="danger" />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard title="Total Clients" value={formatNumber(stats?.total_clients || 0)} description={`${stats?.active_clients || 0} actifs`} icon={<Users className="w-6 h-6" />} variant="secondary" />
        <StatCard title="Total Tontiniers" value={formatNumber(stats?.total_tontiniers || 0)} icon={<Activity className="w-6 h-6" />} variant="default" />
        <StatCard title="Total Tontines" value={formatNumber(stats?.total_tontines || 0)} description={`${stats?.active_tontines || 0} actives`} icon={<Wallet className="w-6 h-6" />} variant="primary" />
        <StatCard title="Balance Nette" value={formatCurrency((stats?.total_deposits || 0) - (stats?.total_withdrawals || 0))} icon={<FileText className="w-6 h-6" />} variant="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
          <div className="grid grid-cols-2 gap-4">
            <a href="/admin/requests" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                <UserPlus className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-dark-700 dark:text-dark-300">Demandes</span>
              {stats?.pending_requests ? <Badge variant="danger" size="sm">{stats.pending_requests}</Badge> : null}
            </a>
            <a href="/admin/tontiniers" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 group-hover:bg-secondary-500 group-hover:text-white transition-colors">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-dark-700 dark:text-dark-300">Tontiniers</span>
            </a>
            <a href="/admin/clients" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-900/30 flex items-center justify-center text-success-600 group-hover:bg-success-500 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-dark-700 dark:text-dark-300">Clients</span>
            </a>
            <a href="/admin/transactions" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-warning-50 dark:bg-warning-900/30 flex items-center justify-center text-warning-600 group-hover:bg-warning-500 group-hover:text-white transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-dark-700 dark:text-dark-300">Transactions</span>
            </a>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Résumé financier</CardTitle></CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-success-50 dark:bg-success-900/20">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-success-600" />
                <span className="font-medium text-dark-700 dark:text-dark-300">Dépôts</span>
              </div>
              <span className="font-bold text-success-600">{formatCurrency(stats?.total_deposits || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-warning-50 dark:bg-warning-900/20">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-warning-600" />
                <span className="font-medium text-dark-700 dark:text-dark-300">Retraits</span>
              </div>
              <span className="font-bold text-warning-600">{formatCurrency(stats?.total_withdrawals || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <div className="flex items-center gap-3">
                <CircleDollarSign className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-dark-700 dark:text-dark-300">Balance</span>
              </div>
              <span className="font-bold text-primary-600">{formatCurrency((stats?.total_deposits || 0) - (stats?.total_withdrawals || 0))}</span>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
