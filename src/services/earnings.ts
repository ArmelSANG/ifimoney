import { supabase, handleSupabaseError } from './supabase';
import type {
  TontinierEarning,
  EarningsSummary,
  EarningsByPeriod,
  EarningsByTontine,
  EarningsByClient,
  TontinierSubscription,
  TransactionSummary,
  ReservedFee,
} from '@/types/features';

export const earningsService = {
  // ============================================
  // BÉNÉFICES TONTINIER
  // ============================================

  // Récupérer le résumé des bénéfices
  async getEarningsSummary(
    tontinierId: string
  ): Promise<{ success: boolean; summary?: EarningsSummary; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('tontinier_earnings_summary')
        .select('*')
        .eq('tontinier_id', tontinierId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Si pas de données, retourner des valeurs par défaut
      if (!data) {
        return {
          success: true,
          summary: {
            tontinier_id: tontinierId,
            total_earnings: 0,
            earnings_classique: 0,
            earnings_terme: 0,
            earnings_flexible: 0,
            earnings_subscription: 0,
            tontines_count: 0,
            clients_count: 0,
          },
        };
      }

      return { success: true, summary: data as EarningsSummary };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer l'historique des bénéfices
  async getEarningsHistory(
    tontinierId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ success: boolean; earnings?: TontinierEarning[]; total?: number; error?: string }> {
    try {
      // Compter le total
      const { count } = await supabase
        .from('tontinier_earnings')
        .select('*', { count: 'exact', head: true })
        .eq('tontinier_id', tontinierId);

      // Récupérer les données
      const { data, error } = await supabase
        .from('tontinier_earnings')
        .select(`
          *,
          tontine:tontines(id, name, identifier),
          client:users!tontinier_earnings_client_id_fkey(id, full_name)
        `)
        .eq('tontinier_id', tontinierId)
        .order('calculated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        earnings: data as unknown as TontinierEarning[],
        total: count || 0,
      };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer les bénéfices par tontine
  async getEarningsByTontine(
    tontinierId: string
  ): Promise<{ success: boolean; earnings?: EarningsByTontine[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('tontinier_earnings')
        .select(`
          tontine_id,
          amount,
          tontine:tontines(id, name, identifier, type)
        `)
        .eq('tontinier_id', tontinierId)
        .not('tontine_id', 'is', null);

      if (error) throw error;

      // Grouper par tontine
      const grouped = (data || []).reduce((acc: Record<string, EarningsByTontine>, item: any) => {
        const tontineId = item.tontine_id;
        if (!acc[tontineId]) {
          acc[tontineId] = {
            tontine_id: tontineId,
            tontine_name: item.tontine?.name || '',
            tontine_identifier: item.tontine?.identifier || '',
            tontine_type: item.tontine?.type || '',
            total_earnings: 0,
            transactions_count: 0,
          };
        }
        acc[tontineId].total_earnings += parseFloat(item.amount);
        acc[tontineId].transactions_count += 1;
        return acc;
      }, {});

      return {
        success: true,
        earnings: Object.values(grouped).sort((a, b) => b.total_earnings - a.total_earnings),
      };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer les bénéfices par client
  async getEarningsByClient(
    tontinierId: string
  ): Promise<{ success: boolean; earnings?: EarningsByClient[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('tontinier_earnings')
        .select(`
          client_id,
          amount,
          client:users!tontinier_earnings_client_id_fkey(id, full_name)
        `)
        .eq('tontinier_id', tontinierId)
        .not('client_id', 'is', null);

      if (error) throw error;

      // Récupérer les identifiants clients
      const clientIds = [...new Set((data || []).map((d: any) => d.client_id).filter(Boolean))];
      
      let clientIdentifiers: Record<string, string> = {};
      if (clientIds.length > 0) {
        const { data: clientsData } = await supabase
          .from('clients')
          .select('user_id, identifier')
          .in('user_id', clientIds);
        
        clientIdentifiers = (clientsData || []).reduce((acc: Record<string, string>, c: any) => {
          acc[c.user_id] = c.identifier;
          return acc;
        }, {});
      }

      // Grouper par client
      const grouped = (data || []).reduce((acc: Record<string, EarningsByClient>, item: any) => {
        const clientId = item.client_id;
        if (!acc[clientId]) {
          acc[clientId] = {
            client_id: clientId,
            client_name: item.client?.full_name || '',
            client_identifier: clientIdentifiers[clientId] || '',
            total_earnings: 0,
            transactions_count: 0,
          };
        }
        acc[clientId].total_earnings += parseFloat(item.amount);
        acc[clientId].transactions_count += 1;
        return acc;
      }, {});

      return {
        success: true,
        earnings: Object.values(grouped).sort((a, b) => b.total_earnings - a.total_earnings),
      };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer les bénéfices par période
  async getEarningsByPeriod(
    tontinierId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month',
    startDate?: string,
    endDate?: string
  ): Promise<{ success: boolean; earnings?: EarningsByPeriod[]; error?: string }> {
    try {
      let query = supabase
        .from('tontinier_earnings')
        .select('amount, calculated_at')
        .eq('tontinier_id', tontinierId);

      if (startDate) {
        query = query.gte('calculated_at', startDate);
      }
      if (endDate) {
        query = query.lte('calculated_at', endDate);
      }

      const { data, error } = await query.order('calculated_at', { ascending: true });

      if (error) throw error;

      // Grouper par période
      const grouped = (data || []).reduce((acc: Record<string, EarningsByPeriod>, item: any) => {
        const date = new Date(item.calculated_at);
        let key: string;

        switch (period) {
          case 'day':
            key = date.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case 'year':
            key = `${date.getFullYear()}`;
            break;
          default:
            key = date.toISOString().split('T')[0];
        }

        if (!acc[key]) {
          acc[key] = {
            period,
            date: key,
            amount: 0,
            count: 0,
          };
        }
        acc[key].amount += parseFloat(item.amount);
        acc[key].count += 1;
        return acc;
      }, {});

      return {
        success: true,
        earnings: Object.values(grouped),
      };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // ABONNEMENTS
  // ============================================

  // Récupérer l'abonnement actif
  async getActiveSubscription(
    tontinierId: string
  ): Promise<{ success: boolean; subscription?: TontinierSubscription; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('tontinier_subscriptions')
        .select('*')
        .eq('tontinier_id', tontinierId)
        .eq('is_active', true)
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return { success: true, subscription: data as TontinierSubscription };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // RÉCAPITULATIF TRANSACTION
  // ============================================

  // Obtenir le récapitulatif avant validation
  async getTransactionSummary(
    tontineId: string,
    clientId: string,
    amount: number,
    type: 'deposit' | 'withdrawal'
  ): Promise<{ success: boolean; summary?: TransactionSummary; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_transaction_summary', {
        p_tontine_id: tontineId,
        p_client_id: clientId,
        p_amount: amount,
        p_type: type,
      });

      if (error) throw error;

      return { success: true, summary: data?.[0] as TransactionSummary };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // FRAIS RÉSERVÉS
  // ============================================

  // Récupérer les frais réservés d'un client
  async getReservedFees(
    tontineId: string,
    clientId: string
  ): Promise<{ success: boolean; fees?: ReservedFee[]; total?: number; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('reserved_fees')
        .select('*')
        .eq('tontine_id', tontineId)
        .eq('client_id', clientId)
        .eq('is_collected', false);

      if (error) throw error;

      const total = (data || []).reduce((sum, fee) => sum + parseFloat(fee.amount), 0);

      return { success: true, fees: data as ReservedFee[], total };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Calculer les avoirs nets disponibles
  async getNetAvailable(
    tontineId: string,
    clientId: string
  ): Promise<{ success: boolean; netAvailable?: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('calculate_net_available', {
        p_tontine_id: tontineId,
        p_client_id: clientId,
      });

      if (error) throw error;

      return { success: true, netAvailable: data as number };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },
};

export default earningsService;
