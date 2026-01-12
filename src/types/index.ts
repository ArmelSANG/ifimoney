// ============================================
// TYPES DE BASE - PLATEFORME TONTINE
// ============================================

// Rôles utilisateur
export type UserRole = 'admin' | 'tontinier' | 'client';

// Statuts de compte
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'expired' | 'rejected';

// Types de tontine
export type TontineType = 'classique' | 'flexible' | 'terme';

// Types de pièce d'identité
export type IdentityDocType = 'cni' | 'passport' | 'permis' | 'carte_consulaire';

// Statuts de transaction
export type TransactionStatus = 'pending' | 'validated' | 'rejected' | 'cancelled';

// Types de transaction
export type TransactionType = 'deposit' | 'withdrawal';

// ============================================
// INTERFACES UTILISATEUR
// ============================================

export interface User {
  id: string;
  email?: string;
  whatsapp: string;
  full_name: string;
  profile_photo_url?: string;
  role: UserRole;
  status: AccountStatus;
  cgu_accepted: boolean;
  cgu_accepted_at?: string;
  cgu_version?: string;
  created_at: string;
  updated_at: string;
}

export interface Admin extends User {
  role: 'admin';
}

export interface Tontinier extends User {
  role: 'tontinier';
  identifier: string; // Format: TXXXX
  identity_doc_type: IdentityDocType;
  identity_doc_url: string;
  expiration_date: string;
  days_remaining?: number;
  suspended_at?: string;
  suspension_reason?: string;
}

export interface Client extends User {
  role: 'client';
  identifier: string; // Format: CXXXX
  tontinier_id: string;
  desired_tontine_type?: TontineType;
  desired_mise?: number;
  desired_objective?: string;
}

// ============================================
// DEMANDES D'INSCRIPTION
// ============================================

export interface RegistrationRequest {
  id: string;
  whatsapp: string;
  full_name: string;
  profile_photo_url: string;
  role: 'tontinier' | 'client';
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  processed_at?: string;
  processed_by?: string;
}

export interface TontinierRegistrationRequest extends RegistrationRequest {
  role: 'tontinier';
  identity_doc_type: IdentityDocType;
  identity_doc_url: string;
  initial_expiration_days?: number;
}

export interface ClientRegistrationRequest extends RegistrationRequest {
  role: 'client';
  tontinier_id?: string;
  desired_tontine_type?: TontineType;
  desired_mise?: number;
  desired_objective?: string;
}

// ============================================
// TONTINE
// ============================================

export interface Tontine {
  id: string;
  identifier: string; // Numérique, modifiable
  name: string;
  description?: string;
  type: TontineType;
  mise: number; // Montant de la mise
  currency: string; // XOF par défaut
  start_date: string;
  end_date?: string; // Obligatoire pour tontine à terme
  cycle_days: number; // Périodicité en jours
  tontinier_id: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  total_collected: number;
  total_withdrawn: number;
  created_at: string;
  updated_at: string;
  // Historique des modifications d'identifiant
  identifier_history?: IdentifierChange[];
}

export interface IdentifierChange {
  old_identifier: string;
  new_identifier: string;
  changed_at: string;
  changed_by: string;
  changed_by_name?: string;
}

// Règles de format pour les identifiants de tontine
export const TONTINE_IDENTIFIER_RULES = {
  minLength: 3,
  maxLength: 20,
  pattern: /^[A-Za-z0-9_-]+$/, // Lettres, chiffres, tirets et underscores
  description: 'Lettres, chiffres, tirets (-) et underscores (_) uniquement, entre 3 et 20 caractères',
} as const;

// Validation d'identifiant de tontine
export function isValidTontineIdentifier(id: string): { valid: boolean; error?: string } {
  if (!id || id.length < TONTINE_IDENTIFIER_RULES.minLength) {
    return { valid: false, error: `Minimum ${TONTINE_IDENTIFIER_RULES.minLength} caractères requis` };
  }
  if (id.length > TONTINE_IDENTIFIER_RULES.maxLength) {
    return { valid: false, error: `Maximum ${TONTINE_IDENTIFIER_RULES.maxLength} caractères autorisés` };
  }
  if (!TONTINE_IDENTIFIER_RULES.pattern.test(id)) {
    return { valid: false, error: TONTINE_IDENTIFIER_RULES.description };
  }
  return { valid: true };
}

// ============================================
// PARTICIPATION TONTINE
// ============================================

export interface TontineParticipation {
  id: string;
  tontine_id: string;
  client_id: string;
  joined_at: string;
  status: 'active' | 'suspended' | 'withdrawn';
  total_deposited: number;
  total_withdrawn: number;
  last_deposit_at?: string;
}

// ============================================
// TRANSACTIONS
// ============================================

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  tontine_id: string;
  client_id: string;
  tontinier_id: string;
  payment_method: 'cash' | 'mobile_money';
  proof_url?: string; // Capture d'écran pour paiement en ligne
  notes?: string;
  validated_at?: string;
  validated_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface DepositRequest extends Omit<Transaction, 'id' | 'created_at' | 'updated_at'> {
  type: 'deposit';
}

export interface WithdrawalRequest extends Omit<Transaction, 'id' | 'created_at' | 'updated_at'> {
  type: 'withdrawal';
}

// ============================================
// CONDITIONS GÉNÉRALES D'UTILISATION
// ============================================

export interface CGU {
  id: string;
  version: string;
  content: string;
  effective_date: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
}

export interface CGUAcceptance {
  id: string;
  user_id: string;
  cgu_id: string;
  cgu_version: string;
  accepted_at: string;
  ip_address?: string;
  user_agent?: string;
}

// ============================================
// LOGS & AUDIT
// ============================================

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ============================================
// STATISTIQUES DASHBOARD
// ============================================

export interface AdminStats {
  total_mise: number;
  total_deposits: number;
  total_withdrawals: number;
  total_clients: number;
  active_clients: number;
  total_tontiniers: number;
  active_tontiniers: number;
  pending_requests: number;
  total_tontines: number;
  active_tontines: number;
}

export interface TontinierStats {
  total_clients: number;
  active_clients: number;
  total_tontines: number;
  active_tontines: number;
  total_collected: number;
  total_withdrawn: number;
  pending_deposits: number;
  pending_withdrawals: number;
  days_remaining: number;
  account_status: AccountStatus;
}

export interface ClientStats {
  total_deposited: number;
  total_withdrawn: number;
  balance: number;
  active_tontines: number;
  pending_deposits: number;
  pending_withdrawals: number;
  next_deposit_date?: string;
}

// ============================================
// FILTRES DE RECHERCHE
// ============================================

export interface SearchFilters {
  query?: string;
  client_id?: string;
  client_name?: string;
  tontine_id?: string;
  tontinier_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
  type?: string;
}

export interface PaginationParams {
  page: number;
  per_page: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================
// RÉPONSES API
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// FORMULAIRES
// ============================================

export interface TontinierRegistrationFormData {
  whatsapp: string;
  full_name: string;
  profile_photo: File;
  identity_doc_type: IdentityDocType;
  identity_doc: File;
}

export interface ClientRegistrationFormData {
  whatsapp: string;
  full_name: string;
  profile_photo: File;
  desired_tontine_type?: TontineType;
  desired_mise?: number;
  desired_objective?: string;
}

export interface TontineFormData {
  name: string;
  description?: string;
  type: TontineType;
  mise: number;
  cycle_days: number;
  start_date: string;
  end_date?: string;
  identifier?: string;
}

export interface DepositFormData {
  amount: number;
  payment_method: 'cash' | 'mobile_money';
  proof?: File;
  notes?: string;
}

export interface WithdrawalFormData {
  amount: number;
  notes?: string;
}

// ============================================
// THÈME
// ============================================

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// ============================================
// CONTACT ADMIN
// ============================================

export const ADMIN_CONTACT = {
  name: 'IFIAAS',
  phone: '+2290167455462',
  whatsapp: '+22967455462',
  whatsapp_link: 'https://wa.me/22967455462',
  phone_link: 'tel:+2290167455462',
} as const;

// Export des types de chat
export * from './chat';

// Export des types de fonctionnalités
export * from './features';
