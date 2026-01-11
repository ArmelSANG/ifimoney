'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout';
import { StatCard, Card, CardHeader, CardTitle, Loading, Avatar, Button } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/user';
import { formatCurrency, formatNumber } from '@/utils';
import type { ClientStats, Tontinier } from '@/types';
import { Wallet, TrendingUp, TrendingDown, CircleDollarSign, Phone, MessageCircle, FileText, Clock } from 'lucide-react';

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [tontinier, setTontinier] = useState<Tontinier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const [statsResult, tontinierResult] = await Promise.all([
          userService.getClientStats(user.id),
          userService.getClientTontinier(user.id),
        ]);
        if (statsResult.success && statsResult.data) setStats(statsResult.data);
        if (tontinierResult.success && tontinierResult.tontinier) setTontinier(tontinierResult.tontinier);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  if (isLoading) {
    return <DashboardLayout requiredRole="client"><Loading text="Chargement..." /></DashboardLayout>;
  }

  const tontinierUser = tontinier as unknown as { users: { full_name: string; whatsapp: string; profile_photo_url?: string } };

  return (
    <DashboardLayout requiredRole="client">
      <div className="page-header">
        <h1 className="page-title">Bienvenue, {user?.full_name} 👋</h1>
        <p className="page-description">Suivez vos tontines et vos transactions</p>
      </div>

      <div className="stats-grid mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard title="Solde Total" value={formatCurrency(stats?.balance || 0)} icon={<CircleDollarSign className="w-6 h-6" />} variant="primary" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard title="Total Déposé" value={formatCurrency(stats?.total_deposited || 0)} icon={<TrendingUp className="w-6 h-6" />} variant="success" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard title="Total Retiré" value={formatCurrency(stats?.total_withdrawn || 0)} icon={<TrendingDown className="w-6 h-6" />} variant="warning" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <StatCard title="Tontines Actives" value={formatNumber(stats?.active_tontines || 0)} icon={<Wallet className="w-6 h-6" />} variant="secondary" />
        </motion.div>
      </div>

      {/* Pending transactions info */}
      {stats && (stats.pending_deposits > 0 || stats.pending_withdrawals > 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-6 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <p className="font-medium text-primary-700 dark:text-primary-400">Opérations en attente</p>
          <div className="flex gap-4 mt-2">
            {stats.pending_deposits > 0 && (
              <span className="text-sm text-primary-600 dark:text-primary-500">• {stats.pending_deposits} dépôt(s) en attente de validation</span>
            )}
            {stats.pending_withdrawals > 0 && (
              <span className="text-sm text-primary-600 dark:text-primary-500">• {stats.pending_withdrawals} retrait(s) en cours de traitement</span>
            )}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
          <div className="grid grid-cols-2 gap-4">
            <a href="/client/tontines" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-dark-700 dark:text-dark-300">Mes tontines</span>
            </a>
            <a href="/client/transactions" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-success-50 dark:bg-success-900/30 flex items-center justify-center text-success-600 group-hover:bg-success-500 group-hover:text-white transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-dark-700 dark:text-dark-300">Transactions</span>
            </a>
          </div>
        </Card>

        {/* Contact Tontinier */}
        {tontinierUser && (
          <Card>
            <CardHeader><CardTitle>Mon Tontinier</CardTitle></CardHeader>
            <div className="text-center py-4">
              <Avatar src={tontinierUser.users?.profile_photo_url} name={tontinierUser.users?.full_name} size="xl" className="mx-auto mb-4" />
              <h3 className="font-semibold text-dark-900 dark:text-white">{tontinierUser.users?.full_name}</h3>
              <p className="text-sm text-dark-500 mt-1">{tontinier?.identifier}</p>
              <div className="flex justify-center gap-3 mt-6">
                <a href={`tel:${tontinierUser.users?.whatsapp}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success-500 text-white font-medium hover:bg-success-600 transition-colors">
                  <Phone className="w-5 h-5" /> Appeler
                </a>
                <a href={`https://wa.me/${tontinierUser.users?.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white font-medium hover:bg-[#20BA5C] transition-colors">
                  <MessageCircle className="w-5 h-5" /> WhatsApp
                </a>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Summary Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6">
        <Card variant="gradient">
          <div className="text-center py-4">
            <CircleDollarSign className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">Votre épargne totale</h3>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">
              {formatCurrency(stats?.balance || 0)}
            </p>
            <p className="text-sm text-dark-500 mt-2">
              Continuez vos efforts d'épargne pour atteindre vos objectifs !
            </p>
          </div>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
