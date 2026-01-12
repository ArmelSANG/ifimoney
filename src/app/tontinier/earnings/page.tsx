'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Wallet,
  Users,
  PiggyBank,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Card, Loading, StatCard } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { earningsService } from '@/services/earnings';
import { formatCurrency, formatRelativeTime } from '@/utils';
import type {
  EarningsSummary,
  EarningsByTontine,
  EarningsByClient,
  TontinierEarning,
} from '@/types/features';

export default function TontinierEarningsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [earningsByTontine, setEarningsByTontine] = useState<EarningsByTontine[]>([]);
  const [earningsByClient, setEarningsByClient] = useState<EarningsByClient[]>([]);
  const [recentEarnings, setRecentEarnings] = useState<TontinierEarning[]>([]);
  const [activeTab, setActiveTab] = useState<'tontines' | 'clients' | 'history'>('tontines');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    
    const [summaryRes, byTontineRes, byClientRes, historyRes] = await Promise.all([
      earningsService.getEarningsSummary(user.id),
      earningsService.getEarningsByTontine(user.id),
      earningsService.getEarningsByClient(user.id),
      earningsService.getEarningsHistory(user.id, 20),
    ]);

    if (summaryRes.success) setSummary(summaryRes.summary || null);
    if (byTontineRes.success) setEarningsByTontine(byTontineRes.earnings || []);
    if (byClientRes.success) setEarningsByClient(byClientRes.earnings || []);
    if (historyRes.success) setRecentEarnings(historyRes.earnings || []);

    setIsLoading(false);
  };

  const getEarningTypeLabel = (type: string) => {
    switch (type) {
      case 'mise_classique': return 'Classique';
      case 'mise_terme': return 'À terme';
      case 'percentage_flexible': return 'Flexible';
      case 'subscription': return 'Abonnement';
      default: return type;
    }
  };

  const getEarningTypeColor = (type: string) => {
    switch (type) {
      case 'mise_classique': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'mise_terme': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'percentage_flexible': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'subscription': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="tontinier">
        <Loading fullScreen text="Chargement des bénéfices..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="tontinier">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
              Mes Bénéfices
            </h1>
            <p className="text-dark-500 dark:text-dark-400">
              Suivi de vos revenus en temps réel
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard
              title="Bénéfice Total"
              value={formatCurrency(summary?.total_earnings || 0)}
              icon={<Wallet className="w-6 h-6" />}
              variant="success"
              trend={{ value: 12, isPositive: true }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatCard
              title="Tontines Classiques"
              value={formatCurrency(summary?.earnings_classique || 0)}
              icon={<PiggyBank className="w-6 h-6" />}
              variant="primary"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatCard
              title="Tontines Flexibles"
              value={formatCurrency(summary?.earnings_flexible || 0)}
              icon={<TrendingUp className="w-6 h-6" />}
              variant="success"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StatCard
              title="Clients Actifs"
              value={summary?.clients_count?.toString() || '0'}
              icon={<Users className="w-6 h-6" />}
              variant="primary"
            />
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-dark-200 dark:border-dark-700">
          {[
            { id: 'tontines', label: 'Par Tontine', count: earningsByTontine.length },
            { id: 'clients', label: 'Par Client', count: earningsByClient.length },
            { id: 'history', label: 'Historique', count: recentEarnings.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-dark-500 hover:text-dark-700 dark:hover:text-dark-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 text-xs bg-dark-100 dark:bg-dark-800 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Par Tontine */}
          {activeTab === 'tontines' && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                  Bénéfices par Tontine
                </h3>
                
                {earningsByTontine.length === 0 ? (
                  <div className="text-center py-12">
                    <PiggyBank className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                    <p className="text-dark-500">Aucun bénéfice enregistré</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {earningsByTontine.map((item, index) => (
                      <motion.div
                        key={item.tontine_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-800 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.tontine_type === 'flexible' 
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : item.tontine_type === 'terme'
                              ? 'bg-purple-100 dark:bg-purple-900/30'
                              : 'bg-blue-100 dark:bg-blue-900/30'
                          }`}>
                            <PiggyBank className={`w-5 h-5 ${
                              item.tontine_type === 'flexible' 
                                ? 'text-green-500' 
                                : item.tontine_type === 'terme'
                                ? 'text-purple-500'
                                : 'text-blue-500'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-dark-900 dark:text-white">
                              {item.tontine_name}
                            </p>
                            <p className="text-sm text-dark-500">
                              {item.tontine_identifier} • {item.transactions_count} transactions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-success-600">
                            {formatCurrency(item.total_earnings)}
                          </p>
                          <p className="text-xs text-dark-400 capitalize">
                            {item.tontine_type}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Par Client */}
          {activeTab === 'clients' && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                  Bénéfices par Client
                </h3>
                
                {earningsByClient.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                    <p className="text-dark-500">Aucun bénéfice enregistré</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {earningsByClient.map((item, index) => (
                      <motion.div
                        key={item.client_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-dark-50 dark:bg-dark-800 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <span className="text-primary-600 font-semibold">
                              {item.client_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-dark-900 dark:text-white">
                              {item.client_name}
                            </p>
                            <p className="text-sm text-dark-500">
                              {item.client_identifier} • {item.transactions_count} transactions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-success-600">
                            {formatCurrency(item.total_earnings)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Historique */}
          {activeTab === 'history' && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
                  Historique des Bénéfices
                </h3>
                
                {recentEarnings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                    <p className="text-dark-500">Aucun historique</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentEarnings.map((earning, index) => (
                      <motion.div
                        key={earning.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center justify-between p-4 border-b border-dark-100 dark:border-dark-800 last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 text-success-500" />
                          </div>
                          <div>
                            <p className="font-medium text-dark-900 dark:text-white">
                              {earning.client?.full_name || 'Client'}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getEarningTypeColor(earning.earning_type)}`}>
                                {getEarningTypeLabel(earning.earning_type)}
                              </span>
                              <span className="text-xs text-dark-400">
                                {earning.tontine?.name}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-success-600">
                            +{formatCurrency(earning.amount)}
                          </p>
                          <p className="text-xs text-dark-400">
                            {formatRelativeTime(earning.calculated_at)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
