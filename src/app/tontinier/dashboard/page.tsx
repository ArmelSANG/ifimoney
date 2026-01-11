'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout';
import { StatCard, Card, CardHeader, CardTitle, Loading, Badge, Avatar } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/user';
import { formatCurrency, formatNumber, getDaysRemaining, ACCOUNT_STATUSES } from '@/utils';
import type { TontinierStats } from '@/types';
import { Users, Wallet, TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle2, FileText, Phone, MessageCircle } from 'lucide-react';
import { ADMIN_CONTACT } from '@/types';

export default function TontinierDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TontinierStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        const result = await userService.getTontinierStats(user.id);
        if (result.success && result.data) {
          setStats(result.data);
        }
      }
      setIsLoading(false);
    };
    fetchStats();
  }, [user]);

  if (isLoading) {
    return <DashboardLayout requiredRole="tontinier"><Loading text="Chargement..." /></DashboardLayout>;
  }

  const statusConfig = stats?.account_status ? ACCOUNT_STATUSES[stats.account_status] : null;

  return (
    <DashboardLayout requiredRole="tontinier">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Bienvenue, {user?.full_name} 👋</h1>
          <p className="page-description">Gérez vos tontines et vos clients</p>
        </div>
        {stats && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white dark:bg-dark-800 shadow-card">
            <Clock className="w-5 h-5 text-primary-500" />
            <div>
              <p className="text-xs text-dark-500">Jours restants</p>
              <p className={`text-lg font-bold ${stats.days_remaining <= 7 ? 'text-danger-500' : stats.days_remaining <= 30 ? 'text-warning-500' : 'text-success-500'}`}>
                {stats.days_remaining} jours
              </p>
            </div>
            <Badge variant={stats.account_status === 'active' ? 'success' : stats.account_status === 'expired' ? 'danger' : 'warning'}>
              {statusConfig?.label}
            </Badge>
          </div>
        )}
      </div>

      {/* Alert for expiring account */}
      {stats && stats.days_remaining <= 7 && stats.account_status === 'active' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-warning-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-warning-700 dark:text-warning-400">Votre compte expire bientôt !</p>
            <p className="text-sm text-warning-600 dark:text-warning-500 mt-1">
              Il vous reste {stats.days_remaining} jour(s). Contactez l'administrateur pour prolonger votre compte.
            </p>
            <div className="flex gap-2 mt-3">
              <a href={ADMIN_CONTACT.phone_link} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success-500 text-white text-sm font-medium hover:bg-success-600 transition-colors">
                <Phone className="w-4 h-4" /> Appeler
              </a>
              <a href={ADMIN_CONTACT.whatsapp_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:bg-[#20BA5C] transition-colors">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>
        </motion.div>
      )}

      <div className="stats-grid mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard title="Total Collecté" value={formatCurrency(stats?.total_collected || 0)} icon={<TrendingUp className="w-6 h-6" />} variant="success" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard title="Total Retiré" value={formatCurrency(stats?.total_withdrawn || 0)} icon={<TrendingDown className="w-6 h-6" />} variant="warning" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard title="Mes Clients" value={formatNumber(stats?.total_clients || 0)} description={`${stats?.active_clients || 0} actifs`} icon={<Users className="w-6 h-6" />} variant="primary" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatCard title="Mes Tontines" value={formatNumber(stats?.total_tontines || 0)} description={`${stats?.active_tontines || 0} actives`} icon={<Wallet className="w-6 h-6" />} variant="secondary" />
        </motion.div>
      </div>

      {/* Pending transactions alert */}
      {stats && (stats.pending_deposits > 0 || stats.pending_withdrawals > 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-6 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <p className="font-medium text-primary-700 dark:text-primary-400">Transactions en attente</p>
          <div className="flex gap-4 mt-2">
            {stats.pending_deposits > 0 && (
              <span className="text-sm text-primary-600 dark:text-primary-500">
                • {stats.pending_deposits} dépôt(s) à valider
              </span>
            )}
            {stats.pending_withdrawals > 0 && (
              <span className="text-sm text-primary-600 dark:text-primary-500">
                • {stats.pending_withdrawals} retrait(s) à traiter
              </span>
            )}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
          <div className="grid grid-cols-2 gap-4">
            <a href="/tontinier/clients" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-dark-700 dark:text-dark-300">Mes clients</span>
            </a>
            <a href="/tontinier/tontines" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center text-secondary-600 group-hover:bg-secondary-500 group-hover:text-white transition-colors">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-dark-700 dark:text-dark-300">Mes tontines</span>
            </a>
            <a href="/tontinier/transactions" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-900/30 flex items-center justify-center text-success-600 group-hover:bg-success-500 group-hover:text-white transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-dark-700 dark:text-dark-300">Transactions</span>
              {stats && (stats.pending_deposits > 0 || stats.pending_withdrawals > 0) && (
                <Badge variant="danger" size="sm">{(stats.pending_deposits || 0) + (stats.pending_withdrawals || 0)}</Badge>
              )}
            </a>
            <a href="/tontinier/account" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-warning-50 dark:bg-warning-900/30 flex items-center justify-center text-warning-600 group-hover:bg-warning-500 group-hover:text-white transition-colors">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-dark-700 dark:text-dark-300">Mon compte</span>
            </a>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact Administrateur</CardTitle></CardHeader>
          <div className="text-center py-4">
            <Avatar name={ADMIN_CONTACT.name} size="xl" className="mx-auto mb-4" />
            <h3 className="font-semibold text-dark-900 dark:text-white">{ADMIN_CONTACT.name}</h3>
            <p className="text-sm text-dark-500 mt-1">Administrateur ifiMoney</p>
            <div className="flex justify-center gap-3 mt-6">
              <a href={ADMIN_CONTACT.phone_link} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success-500 text-white font-medium hover:bg-success-600 transition-colors">
                <Phone className="w-5 h-5" /> Appeler
              </a>
              <a href={ADMIN_CONTACT.whatsapp_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white font-medium hover:bg-[#20BA5C] transition-colors">
                <MessageCircle className="w-5 h-5" /> WhatsApp
              </a>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
