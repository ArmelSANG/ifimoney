// ============================================
// TYPES POUR LES NOUVELLES FONCTIONNALITÉS
// Adresses, Frais, Bénéfices
// ============================================

// Pays africain
export interface AfricanCountry {
  id: number;
  code: string;
  name: string;
  phone_code: string;
  phone_length: number[];
  phone_regex?: string;
  currency: string;
}

// Ville africaine
export interface AfricanCity {
  id: number;
  country_code: string;
  name: string;
  region?: string;
}

// Adresse complète
export interface Address {
  country_code: string;
  city: string;
  address: string;
  phone_country_code?: string;
}

// Abonnement tontinier
export type SubscriptionType = 'monthly_1000' | 'monthly_2000' | 'monthly_3000' | 'monthly_4000' | 'monthly_5000' | 'custom';

export interface TontinierSubscription {
  id: string;
  tontinier_id: string;
  subscription_type: SubscriptionType;
  monthly_amount: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Types de bénéfices
export type EarningType = 'mise_classique' | 'mise_terme' | 'percentage_flexible' | 'subscription';

// Bénéfice tontinier
export interface TontinierEarning {
  id: string;
  tontinier_id: string;
  tontine_id?: string;
  client_id?: string;
  transaction_id?: string;
  earning_type: EarningType;
  amount: number;
  description?: string;
  calculated_at: string;
  period_start?: string;
  period_end?: string;
  // Relations
  tontine?: {
    id: string;
    name: string;
    identifier: string;
  };
  client?: {
    id: string;
    full_name: string;
    identifier?: string;
  };
}

// Résumé des bénéfices
export interface EarningsSummary {
  tontinier_id: string;
  total_earnings: number;
  earnings_classique: number;
  earnings_terme: number;
  earnings_flexible: number;
  earnings_subscription: number;
  tontines_count: number;
  clients_count: number;
}

// Bénéfices par période
export interface EarningsByPeriod {
  period: string; // 'day', 'week', 'month', 'year'
  date: string;
  amount: number;
  count: number;
}

// Bénéfices par tontine
export interface EarningsByTontine {
  tontine_id: string;
  tontine_name: string;
  tontine_identifier: string;
  tontine_type: string;
  total_earnings: number;
  transactions_count: number;
}

// Bénéfices par client
export interface EarningsByClient {
  client_id: string;
  client_name: string;
  client_identifier: string;
  total_earnings: number;
  transactions_count: number;
}

// Frais réservés
export interface ReservedFee {
  id: string;
  tontine_id: string;
  client_id: string;
  tontinier_id: string;
  fee_type: 'mise_fee' | 'percentage_fee';
  amount: number;
  is_collected: boolean;
  collected_at?: string;
  created_at: string;
}

// Récapitulatif de transaction (avant validation)
export interface TransactionSummary {
  total_deposited_before: number;
  total_deposited_after: number;
  mises_count_before: number;
  mises_count_after: number;
  total_withdrawn_before: number;
  total_withdrawn_after: number;
  tontinier_fee: number;
  net_available: number;
}

// Validation de numéro de téléphone
export interface PhoneValidation {
  isValid: boolean;
  formatted: string; // Format E.164
  countryCode: string;
  nationalNumber: string;
  error?: string;
}

// Configuration des montants
export const TONTINE_CONFIG = {
  MIN_MISE: 50,
  MIN_FEE_FLEXIBLE: 200,
  FEE_PERCENTAGE_FLEXIBLE: 0.05, // 5%
  MISES_PER_FEE: 31, // 1 mise pour chaque tranche de 31
  MIN_SUBSCRIPTION: 1000,
  MAX_SUBSCRIPTION: 5000,
} as const;

// Utilitaires de calcul des frais
export function calculateFlexibleFee(amount: number): number {
  const percentageFee = amount * TONTINE_CONFIG.FEE_PERCENTAGE_FLEXIBLE;
  return Math.max(percentageFee, TONTINE_CONFIG.MIN_FEE_FLEXIBLE);
}

export function calculateClassicFee(totalMises: number, miseAmount: number): number {
  if (totalMises <= TONTINE_CONFIG.MISES_PER_FEE) {
    return miseAmount; // 1 mise
  }
  return miseAmount * Math.ceil(totalMises / TONTINE_CONFIG.MISES_PER_FEE);
}

export function calculateNetAvailable(
  totalDeposited: number,
  totalWithdrawn: number,
  reservedFees: number
): number {
  return Math.max(0, totalDeposited - totalWithdrawn - reservedFees);
}

// Validation du montant de mise
export function validateMiseAmount(amount: number): { isValid: boolean; error?: string } {
  if (amount < TONTINE_CONFIG.MIN_MISE) {
    return {
      isValid: false,
      error: `Le montant minimum est de ${TONTINE_CONFIG.MIN_MISE} F`,
    };
  }
  return { isValid: true };
}

// Liste des montants d'abonnement
export const SUBSCRIPTION_AMOUNTS = [1000, 2000, 3000, 4000, 5000] as const;
