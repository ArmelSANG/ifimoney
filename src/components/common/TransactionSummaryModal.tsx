'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calculator,
  ArrowRight,
  Loader2,
  Info,
} from 'lucide-react';
import { cn, formatCurrency } from '@/utils';
import { earningsService } from '@/services/earnings';
import type { TransactionSummary } from '@/types/features';

interface TransactionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tontineId: string;
  clientId: string;
  clientName: string;
  tontineName: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
  mise: number;
  tontineType: 'classique' | 'flexible' | 'terme';
  isProcessing?: boolean;
}

export function TransactionSummaryModal({
  isOpen,
  onClose,
  onConfirm,
  tontineId,
  clientId,
  clientName,
  tontineName,
  amount,
  type,
  mise,
  tontineType,
  isProcessing = false,
}: TransactionSummaryModalProps) {
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tontineId && clientId) {
      loadSummary();
    }
  }, [isOpen, tontineId, clientId, amount, type]);

  const loadSummary = async () => {
    setIsLoading(true);
    setError(null);
    
    const result = await earningsService.getTransactionSummary(
      tontineId,
      clientId,
      amount,
      type
    );

    if (result.success && result.summary) {
      setSummary(result.summary);
    } else {
      setError(result.error || 'Erreur lors du chargement du récapitulatif');
    }
    
    setIsLoading(false);
  };

  if (!isOpen) return null;

  const isDeposit = type === 'deposit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-dark-900 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className={cn(
          'px-6 py-4 flex items-center justify-between',
          isDeposit ? 'bg-success-500' : 'bg-warning-500'
        )}>
          <div className="flex items-center gap-3">
            {isDeposit ? (
              <TrendingUp className="w-6 h-6 text-white" />
            ) : (
              <TrendingDown className="w-6 h-6 text-white" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">
                Récapitulatif {isDeposit ? 'Dépôt' : 'Retrait'}
              </h3>
              <p className="text-sm text-white/80">
                Vérifiez avant de valider
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-danger-500 mx-auto mb-3" />
              <p className="text-danger-500">{error}</p>
              <button
                onClick={loadSummary}
                className="mt-4 text-primary-500 hover:underline"
              >
                Réessayer
              </button>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              {/* Infos transaction */}
              <div className="bg-dark-50 dark:bg-dark-800 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-dark-500">Client</span>
                    <p className="font-medium text-dark-900 dark:text-white">{clientName}</p>
                  </div>
                  <div>
                    <span className="text-dark-500">Tontine</span>
                    <p className="font-medium text-dark-900 dark:text-white">{tontineName}</p>
                  </div>
                  <div>
                    <span className="text-dark-500">Type</span>
                    <p className="font-medium text-dark-900 dark:text-white capitalize">{tontineType}</p>
                  </div>
                  <div>
                    <span className="text-dark-500">Mise</span>
                    <p className="font-medium text-dark-900 dark:text-white">{formatCurrency(mise)}</p>
                  </div>
                </div>
              </div>

              {/* Montant de l'opération */}
              <div className={cn(
                'rounded-xl p-4 text-center',
                isDeposit ? 'bg-success-50 dark:bg-success-900/20' : 'bg-warning-50 dark:bg-warning-900/20'
              )}>
                <span className="text-sm text-dark-500">Montant {isDeposit ? 'du dépôt' : 'du retrait'}</span>
                <p className={cn(
                  'text-3xl font-bold',
                  isDeposit ? 'text-success-600' : 'text-warning-600'
                )}>
                  {isDeposit ? '+' : '-'} {formatCurrency(amount)}
                </p>
              </div>

              {/* Récapitulatif détaillé */}
              <div className="space-y-3">
                {/* Dépôts */}
                <div className="flex items-center justify-between py-2 border-b border-dark-100 dark:border-dark-800">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success-500" />
                    <span className="text-sm text-dark-600 dark:text-dark-400">Dépôt total</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-dark-400">{formatCurrency(summary.total_deposited_before)}</span>
                    <ArrowRight className="w-4 h-4 text-dark-400" />
                    <span className="font-semibold text-dark-900 dark:text-white">
                      {formatCurrency(summary.total_deposited_after)}
                    </span>
                  </div>
                </div>

                {/* Nombre de mises */}
                <div className="flex items-center justify-between py-2 border-b border-dark-100 dark:border-dark-800">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-primary-500" />
                    <span className="text-sm text-dark-600 dark:text-dark-400">Nombre de mises</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-dark-400">{summary.mises_count_before}</span>
                    <ArrowRight className="w-4 h-4 text-dark-400" />
                    <span className="font-semibold text-dark-900 dark:text-white">
                      {summary.mises_count_after}
                    </span>
                    {summary.mises_count_after > summary.mises_count_before && (
                      <span className="text-xs text-success-500">
                        (+{summary.mises_count_after - summary.mises_count_before})
                      </span>
                    )}
                  </div>
                </div>

                {/* Retraits */}
                <div className="flex items-center justify-between py-2 border-b border-dark-100 dark:border-dark-800">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-warning-500" />
                    <span className="text-sm text-dark-600 dark:text-dark-400">Retrait total</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-dark-400">{formatCurrency(summary.total_withdrawn_before)}</span>
                    <ArrowRight className="w-4 h-4 text-dark-400" />
                    <span className="font-semibold text-dark-900 dark:text-white">
                      {formatCurrency(summary.total_withdrawn_after)}
                    </span>
                  </div>
                </div>

                {/* Frais tontinier */}
                <div className="flex items-center justify-between py-2 border-b border-dark-100 dark:border-dark-800">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-dark-600 dark:text-dark-400">Frais tontinier (réservés)</span>
                  </div>
                  <span className="font-semibold text-purple-600">
                    {formatCurrency(summary.tontinier_fee)}
                  </span>
                </div>

                {/* Avoirs nets */}
                <div className="flex items-center justify-between py-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-3 -mx-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary-500" />
                    <span className="font-medium text-dark-900 dark:text-white">Avoirs nets disponibles</span>
                  </div>
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(summary.net_available)}
                  </span>
                </div>
              </div>

              {/* Alerte si retrait supérieur aux avoirs */}
              {!isDeposit && amount > summary.net_available && (
                <div className="flex items-start gap-3 p-4 bg-danger-50 dark:bg-danger-900/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-danger-600 dark:text-danger-400">
                      Montant supérieur aux avoirs disponibles
                    </p>
                    <p className="text-sm text-danger-500 mt-1">
                      Le client ne peut retirer que {formatCurrency(summary.net_available)} maximum
                      (après déduction des frais réservés).
                    </p>
                  </div>
                </div>
              )}

              {/* Info frais */}
              <div className="flex items-start gap-2 text-xs text-dark-500">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  {tontineType === 'flexible'
                    ? 'Frais: 5% du montant collecté (minimum 200 F)'
                    : 'Frais: 1 mise pour 31 mises ou moins, puis 1 mise par tranche de 31'}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-dark-50 dark:bg-dark-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing || isLoading || !!error || (!isDeposit && !!summary && amount > summary.net_available)}
            className={cn(
              'px-6 py-2 rounded-lg font-medium text-white transition-all flex items-center gap-2',
              isDeposit
                ? 'bg-success-500 hover:bg-success-600 disabled:bg-success-300'
                : 'bg-warning-500 hover:bg-warning-600 disabled:bg-warning-300',
              (isProcessing || isLoading) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validation...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Valider {isDeposit ? 'le dépôt' : 'le retrait'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default TransactionSummaryModal;
