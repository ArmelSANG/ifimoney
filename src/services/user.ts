import { supabase, handleSupabaseError } from './supabase';
import type {
  User,
  Tontinier,
  Client,
  AdminStats,
  TontinierStats,
  ClientStats,
  PaginatedResponse,
  PaginationParams,
  SearchFilters,
} from '@/types';

export const userService = {
  // ============================================
  // STATISTIQUES ADMIN
  // ============================================
  async getAdminStats(): Promise<{ success: boolean; data?: AdminStats; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_admin_stats');
      if (error) throw error;
      return { success: true, data: data as AdminStats };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // STATISTIQUES TONTINIER
  // ============================================
  async getTontinierStats(tontinierId: string): Promise<{ success: boolean; data?: TontinierStats; error?: string }> {
    try {
      // Récupérer les infos du tontinier
      const { data: tontinierData, error: tontinierError } = await supabase
        .from('tontiniers')
        .select('expiration_date, suspended_at')
        .eq('user_id', tontinierId)
        .single();

      if (tontinierError) throw tontinierError;

      // Récupérer les stats
      const [clientsRes, tontinesRes, transactionsRes] = await Promise.all([
        supabase
          .from('clients')
          .select('id, users!inner(status)', { count: 'exact' })
          .eq('tontinier_id', tontinierId),
        supabase
          .from('tontines')
          .select('id, status, total_collected, total_withdrawn', { count: 'exact' })
          .eq('tontinier_id', tontinierId),
        supabase
          .from('transactions')
          .select('id, status, type')
          .eq('tontinier_id', tontinierId)
          .eq('status', 'pending'),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeClients = clientsRes.data?.filter(
        (c: any) => c.users?.status === 'active'
      ).length || 0;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeTontines = tontinesRes.data?.filter(
        (t: any) => t.status === 'active'
      ).length || 0;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalCollected = tontinesRes.data?.reduce(
        (sum: number, t: any) => sum + (t.total_collected || 0), 0
      ) || 0;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalWithdrawn = tontinesRes.data?.reduce(
        (sum: number, t: any) => sum + (t.total_withdrawn || 0), 0
      ) || 0;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pendingDeposits = transactionsRes.data?.filter(
        (t: any) => t.type === 'deposit'
      ).length || 0;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pendingWithdrawals = transactionsRes.data?.filter(
        (t: any) => t.type === 'withdrawal'
      ).length || 0;

      // Calculer les jours restants
      const expirationDate = new Date(tontinierData.expiration_date);
      const today = new Date();
      const daysRemaining = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Déterminer le statut du compte
      let accountStatus: 'active' | 'expired' | 'suspended' = 'active';
      if (tontinierData.suspended_at) {
        accountStatus = 'suspended';
      } else if (daysRemaining <= 0) {
        accountStatus = 'expired';
      }

      return {
        success: true,
        data: {
          total_clients: clientsRes.count || 0,
          active_clients: activeClients,
          total_tontines: tontinesRes.count || 0,
          active_tontines: activeTontines,
          total_collected: totalCollected,
          total_withdrawn: totalWithdrawn,
          pending_deposits: pendingDeposits,
          pending_withdrawals: pendingWithdrawals,
          days_remaining: Math.max(0, daysRemaining),
          account_status: accountStatus,
        },
      };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // STATISTIQUES CLIENT
  // ============================================
  async getClientStats(clientId: string): Promise<{ success: boolean; data?: ClientStats; error?: string }> {
    try {
      // Récupérer les participations
      const { data: participations, error: partError } = await supabase
        .from('tontine_participations')
        .select('total_deposited, total_withdrawn, status, tontines(cycle_days, start_date)')
        .eq('client_id', clientId);

      if (partError) throw partError;

      // Récupérer les transactions en attente
      const { data: pendingTx, error: txError } = await supabase
        .from('transactions')
        .select('type')
        .eq('client_id', clientId)
        .eq('status', 'pending');

      if (txError) throw txError;

      const totalDeposited = participations?.reduce(
        (sum: number, p: { total_deposited: number }) => sum + p.total_deposited, 0
      ) || 0;
      
      const totalWithdrawn = participations?.reduce(
        (sum: number, p: { total_withdrawn: number }) => sum + p.total_withdrawn, 0
      ) || 0;
      
      const activeTontines = participations?.filter(
        (p: { status: string }) => p.status === 'active'
      ).length || 0;
      
      const pendingDeposits = pendingTx?.filter(
        (t: { type: string }) => t.type === 'deposit'
      ).length || 0;
      
      const pendingWithdrawals = pendingTx?.filter(
        (t: { type: string }) => t.type === 'withdrawal'
      ).length || 0;

      return {
        success: true,
        data: {
          total_deposited: totalDeposited,
          total_withdrawn: totalWithdrawn,
          balance: totalDeposited - totalWithdrawn,
          active_tontines: activeTontines,
          pending_deposits: pendingDeposits,
          pending_withdrawals: pendingWithdrawals,
        },
      };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // GESTION DES TONTINIERS
  // ============================================
  async getAllTontiniers(
    params: PaginationParams,
    filters?: SearchFilters
  ): Promise<{ success: boolean; data?: PaginatedResponse<Tontinier>; error?: string }> {
    try {
      const { page, per_page, sort_by = 'created_at', sort_order = 'desc' } = params;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      let query = supabase
        .from('tontiniers')
        .select(`*, users!inner(*)`, { count: 'exact' });

      if (filters?.query) {
        query = query.or(`identifier.ilike.%${filters.query}%,users.full_name.ilike.%${filters.query}%`);
      }
      if (filters?.status) {
        query = query.eq('users.status', filters.status);
      }

      const { data, count, error } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(from, to);

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data as unknown as Tontinier[],
          total: count || 0,
          page,
          per_page,
          total_pages: Math.ceil((count || 0) / per_page),
        },
      };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Suspendre un tontinier
  async suspendTontinier(
    tontinierId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Mettre à jour le statut utilisateur
      const { error: userError } = await supabase
        .from('users')
        .update({ status: 'suspended', updated_at: new Date().toISOString() })
        .eq('id', tontinierId);

      if (userError) throw userError;

      // Mettre à jour les infos tontinier
      const { error: tontinierError } = await supabase
        .from('tontiniers')
        .update({
          suspended_at: new Date().toISOString(),
          suspension_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', tontinierId);

      if (tontinierError) throw tontinierError;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Lever la suspension d'un tontinier
  async unsuspendTontinier(
    tontinierId: string,
    additionalDays: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Calculer la nouvelle date d'expiration
      const newExpirationDate = new Date();
      newExpirationDate.setDate(newExpirationDate.getDate() + additionalDays);

      // Mettre à jour le statut utilisateur
      const { error: userError } = await supabase
        .from('users')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', tontinierId);

      if (userError) throw userError;

      // Mettre à jour les infos tontinier
      const { error: tontinierError } = await supabase
        .from('tontiniers')
        .update({
          suspended_at: null,
          suspension_reason: null,
          expiration_date: newExpirationDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', tontinierId);

      if (tontinierError) throw tontinierError;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Prolonger un compte tontinier
  async extendTontinierAccount(
    tontinierId: string,
    additionalDays: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Récupérer la date d'expiration actuelle
      const { data: tontinierData, error: fetchError } = await supabase
        .from('tontiniers')
        .select('expiration_date')
        .eq('user_id', tontinierId)
        .single();

      if (fetchError) throw fetchError;

      const currentExpiration = new Date(tontinierData.expiration_date);
      const today = new Date();
      const baseDate = currentExpiration > today ? currentExpiration : today;
      baseDate.setDate(baseDate.getDate() + additionalDays);

      const { error } = await supabase
        .from('tontiniers')
        .update({
          expiration_date: baseDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', tontinierId);

      if (error) throw error;

      // Si le compte était expiré, le réactiver
      const { error: userError } = await supabase
        .from('users')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', tontinierId)
        .eq('status', 'expired');

      if (userError) throw userError;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // GESTION DES CLIENTS
  // ============================================
  async getAllClients(
    params: PaginationParams,
    filters?: SearchFilters
  ): Promise<{ success: boolean; data?: PaginatedResponse<Client>; error?: string }> {
    try {
      const { page, per_page, sort_by = 'created_at', sort_order = 'desc' } = params;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      let query = supabase
        .from('clients')
        .select(`*, users!inner(*), tontiniers(identifier, users(full_name))`, { count: 'exact' });

      if (filters?.query) {
        query = query.or(`identifier.ilike.%${filters.query}%,users.full_name.ilike.%${filters.query}%`);
      }
      if (filters?.tontinier_id) {
        query = query.eq('tontinier_id', filters.tontinier_id);
      }
      if (filters?.status) {
        query = query.eq('users.status', filters.status);
      }

      const { data, count, error } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(from, to);

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data as unknown as Client[],
          total: count || 0,
          page,
          per_page,
          total_pages: Math.ceil((count || 0) / per_page),
        },
      };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer les clients d'un tontinier
  async getTontinierClients(
    tontinierId: string,
    params: PaginationParams,
    filters?: SearchFilters
  ): Promise<{ success: boolean; data?: PaginatedResponse<Client>; error?: string }> {
    try {
      const { page, per_page, sort_by = 'created_at', sort_order = 'desc' } = params;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      let query = supabase
        .from('clients')
        .select(`*, users!inner(*)`, { count: 'exact' })
        .eq('tontinier_id', tontinierId);

      if (filters?.query) {
        query = query.or(`identifier.ilike.%${filters.query}%,users.full_name.ilike.%${filters.query}%`);
      }

      const { data, count, error } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(from, to);

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data as unknown as Client[],
          total: count || 0,
          page,
          per_page,
          total_pages: Math.ceil((count || 0) / per_page),
        },
      };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Recherche avancée (tontinier)
  async searchClients(
    tontinierId: string,
    query: string
  ): Promise<{ success: boolean; data?: Client[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`*, users!inner(*)`)
        .eq('tontinier_id', tontinierId)
        .or(`identifier.ilike.%${query}%,users.full_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      return { success: true, data: data as unknown as Client[] };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer un utilisateur par ID
  async getUserById(userId: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return { success: true, user: data as User };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer les infos du tontinier d'un client
  async getClientTontinier(clientId: string): Promise<{ success: boolean; tontinier?: Tontinier; error?: string }> {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('tontinier_id')
        .eq('user_id', clientId)
        .single();

      if (clientError) throw clientError;

      const { data, error } = await supabase
        .from('tontiniers')
        .select(`*, users!inner(*)`)
        .eq('user_id', clientData.tontinier_id)
        .single();

      if (error) throw error;

      return { success: true, tontinier: data as unknown as Tontinier };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },
};

export default userService;
