import { supabase, handleSupabaseError } from './supabase';
import type {
  AdminStats,
  Tontinier,
  Client,
  PaginatedResponse,
  PaginationParams,
  SearchFilters,
} from '@/types';

export const adminService = {
  // Récupérer les statistiques globales
  async getStats(): Promise<{ success: boolean; data?: AdminStats; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_admin_stats');

      if (error) throw error;

      return { success: true, data: data as AdminStats };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer tous les tontiniers
  async getTontiniers(
    params: PaginationParams,
    filters?: SearchFilters
  ): Promise<{ success: boolean; data?: PaginatedResponse<Tontinier>; error?: string }> {
    try {
      const { page, per_page, sort_by = 'created_at', sort_order = 'desc' } = params;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      let query = supabase
        .from('tontiniers')
        .select(`
          *,
          users (*)
        `, { count: 'exact' });

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

      // Transformer les données
      const tontiniers = (data || []).map((t) => {
        const item = t as Record<string, unknown>;
        const users = item.users as Record<string, unknown> | null;
        return {
          ...(users || {}),
          ...item,
          days_remaining: item.expiration_date
            ? Math.max(0, Math.ceil((new Date(item.expiration_date as string).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : 0,
        };
      });

      return {
        success: true,
        data: {
          data: tontiniers as unknown as Tontinier[],
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

  // Récupérer tous les clients
  async getClients(
    params: PaginationParams,
    filters?: SearchFilters
  ): Promise<{ success: boolean; data?: PaginatedResponse<Client>; error?: string }> {
    try {
      const { page, per_page, sort_by = 'created_at', sort_order = 'desc' } = params;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      let query = supabase
        .from('clients')
        .select(`
          *,
          users (*),
          tontiniers (identifier, users (full_name))
        `, { count: 'exact' });

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

      const clients = (data || []).map((c) => {
        const item = c as Record<string, unknown>;
        const users = item.users as Record<string, unknown> | null;
        return {
          ...(users || {}),
          ...item,
        };
      });

      return {
        success: true,
        data: {
          data: clients as unknown as Client[],
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
        .update({ status: 'suspended', updated_at: new Date().toISOString() } as never)
        .eq('id', tontinierId);

      if (userError) throw userError;

      // Enregistrer la suspension
      const { error: tontinierError } = await supabase
        .from('tontiniers')
        .update({
          suspended_at: new Date().toISOString(),
          suspension_reason: reason,
          updated_at: new Date().toISOString(),
        } as never)
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
        .update({ status: 'active', updated_at: new Date().toISOString() } as never)
        .eq('id', tontinierId);

      if (userError) throw userError;

      // Mettre à jour le tontinier
      const { error: tontinierError } = await supabase
        .from('tontiniers')
        .update({
          suspended_at: null,
          suspension_reason: null,
          expiration_date: newExpirationDate.toISOString(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq('user_id', tontinierId);

      if (tontinierError) throw tontinierError;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Prolonger le compte d'un tontinier
  async extendTontinierAccount(
    tontinierId: string,
    additionalDays: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Récupérer la date d'expiration actuelle
      const { data: tontinier, error: fetchError } = await supabase
        .from('tontiniers')
        .select('expiration_date')
        .eq('user_id', tontinierId)
        .single();

      if (fetchError) throw fetchError;

      // Calculer la nouvelle date
      const tontinierData = tontinier as { expiration_date: string };
      const currentExpiration = new Date(tontinierData.expiration_date);
      const now = new Date();
      const baseDate = currentExpiration > now ? currentExpiration : now;
      baseDate.setDate(baseDate.getDate() + additionalDays);

      const { error } = await supabase
        .from('tontiniers')
        .update({
          expiration_date: baseDate.toISOString(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq('user_id', tontinierId);

      if (error) throw error;

      // Si le compte était expiré, le réactiver
      await supabase
        .from('users')
        .update({ status: 'active', updated_at: new Date().toISOString() } as never)
        .eq('id', tontinierId)
        .eq('status', 'expired');

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Suspendre un client
  async suspendClient(clientId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'suspended', updated_at: new Date().toISOString() } as never)
        .eq('id', clientId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Réactiver un client
  async reactivateClient(clientId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'active', updated_at: new Date().toISOString() } as never)
        .eq('id', clientId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer l'historique des audits
  async getAuditLogs(
    params: PaginationParams,
    filters?: SearchFilters
  ): Promise<{ success: boolean; data?: PaginatedResponse<unknown>; error?: string }> {
    try {
      const { page, per_page, sort_by = 'created_at', sort_order = 'desc' } = params;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          users (full_name)
        `, { count: 'exact' });

      if (filters?.query) {
        query = query.or(`action.ilike.%${filters.query}%,entity_type.ilike.%${filters.query}%`);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, count, error } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(from, to);

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data || [],
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

  // Créer ou mettre à jour les CGU
  async updateCGU(
    content: string,
    version: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Désactiver les anciennes CGU
      await supabase
        .from('cgu')
        .update({ is_active: false } as never)
        .eq('is_active', true);

      // Créer la nouvelle version
      const { error } = await supabase.from('cgu').insert({
        version,
        content,
        effective_date: new Date().toISOString(),
        created_by: adminId,
        is_active: true,
      } as never);

      if (error) throw error;

      // Réinitialiser l'acceptation pour tous les utilisateurs
      await supabase
        .from('users')
        .update({ cgu_accepted: false, cgu_version: null } as never)
        .neq('role', 'admin');

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer les CGU actives
  async getActiveCGU(): Promise<{ success: boolean; data?: { id: string; version: string; content: string }; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('cgu')
        .select('id, version, content')
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return { success: true, data: data as { id: string; version: string; content: string } };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },
};

export default adminService;
