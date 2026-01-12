import { supabase, handleSupabaseError } from './supabase';
import type {
  Transaction,
  DepositFormData,
  WithdrawalFormData,
  PaginatedResponse,
  PaginationParams,
  SearchFilters,
} from '@/types';
import { TONTINE_CONFIG } from '@/types/features';

export const transactionService = {
  // Créer un dépôt (client ou tontinier)
  async createDeposit(
    data: DepositFormData,
    clientId: string,
    tontineId: string,
    tontinierId: string
  ): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    try {
      // Validation du montant minimum
      if (data.amount < TONTINE_CONFIG.MIN_MISE) {
        return { 
          success: false, 
          error: `Le montant minimum est de ${TONTINE_CONFIG.MIN_MISE} F` 
        };
      }

      let proofUrl: string | undefined;

      // Upload de la preuve si paiement en ligne
      if (data.payment_method === 'mobile_money' && data.proof) {
        const proofPath = `proofs/${Date.now()}_${data.proof.name}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(proofPath, data.proof);

        if (uploadError) throw uploadError;

        const { data: proofData } = supabase.storage
          .from('documents')
          .getPublicUrl(proofPath);

        proofUrl = proofData.publicUrl;
      }

      // Déterminer le statut initial
      const status = data.payment_method === 'cash' ? 'validated' : 'pending';

      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          type: 'deposit',
          amount: data.amount,
          currency: 'XOF',
          status,
          tontine_id: tontineId,
          client_id: clientId,
          tontinier_id: tontinierId,
          payment_method: data.payment_method,
          proof_url: proofUrl,
          notes: data.notes,
          validated_at: status === 'validated' ? new Date().toISOString() : null,
          validated_by: status === 'validated' ? tontinierId : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Si validé immédiatement, mettre à jour les totaux
      if (status === 'validated') {
        await this.updateTotalsAfterDeposit(tontineId, clientId, data.amount);
      }

      return { success: true, transaction: transaction as Transaction };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Créer une demande de retrait (client)
  async createWithdrawalRequest(
    data: WithdrawalFormData,
    clientId: string,
    tontineId: string,
    tontinierId: string
  ): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    try {
      // Vérifier si c'est une tontine à terme
      const { data: tontine, error: tontineError } = await supabase
        .from('tontines')
        .select('type, end_date')
        .eq('id', tontineId)
        .single();

      if (tontineError) throw tontineError;

      if (tontine.type === 'terme') {
        const endDate = new Date(tontine.end_date!);
        const today = new Date();

        if (today < endDate) {
          return {
            success: false,
            error: `Retrait impossible avant la fin du contrat (${endDate.toLocaleDateString('fr-FR')})`,
          };
        }
      }

      // Vérifier les avoirs nets disponibles (après déduction des frais réservés)
      const { data: netAvailable, error: netError } = await supabase.rpc('calculate_net_available', {
        p_tontine_id: tontineId,
        p_client_id: clientId,
      });

      if (netError) {
        // Fallback: calcul simple si la fonction RPC n'existe pas
        const { data: participation } = await supabase
          .from('tontine_participations')
          .select('total_deposited, total_withdrawn')
          .eq('tontine_id', tontineId)
          .eq('client_id', clientId)
          .single();

        if (!participation) {
          return { success: false, error: 'Participation non trouvée' };
        }

        const balance = participation.total_deposited - participation.total_withdrawn;
        if (data.amount > balance) {
          return { success: false, error: `Solde insuffisant. Disponible: ${balance} XOF` };
        }
      } else {
        // Utiliser les avoirs nets (avec frais réservés déduits)
        const availableAmount = netAvailable || 0;
        if (data.amount > availableAmount) {
          return { 
            success: false, 
            error: `Montant supérieur aux avoirs disponibles. Maximum: ${availableAmount} XOF (frais réservés déduits)` 
          };
        }
      }

      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          type: 'withdrawal',
          amount: data.amount,
          currency: 'XOF',
          status: 'pending',
          tontine_id: tontineId,
          client_id: clientId,
          tontinier_id: tontinierId,
          payment_method: 'cash',
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, transaction: transaction as Transaction };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Valider une transaction (tontinier)
  async validateTransaction(
    transactionId: string,
    tontinierId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'validated',
          validated_at: new Date().toISOString(),
          validated_by: tontinierId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (updateError) throw updateError;

      // Mettre à jour les totaux
      if (transaction.type === 'deposit') {
        await this.updateTotalsAfterDeposit(
          transaction.tontine_id,
          transaction.client_id,
          transaction.amount
        );
      } else {
        await this.updateTotalsAfterWithdrawal(
          transaction.tontine_id,
          transaction.client_id,
          transaction.amount
        );
      }

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Refuser une transaction (tontinier)
  async rejectTransaction(
    transactionId: string,
    tontinierId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          validated_by: tontinierId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Mettre à jour les totaux après un dépôt
  async updateTotalsAfterDeposit(
    tontineId: string,
    clientId: string,
    amount: number
  ): Promise<void> {
    await supabase.rpc('increment_tontine_collected', {
      tontine_id: tontineId,
      amount: amount,
    });

    await supabase.rpc('increment_participation_deposited', {
      tontine_id: tontineId,
      client_id: clientId,
      amount: amount,
    });
  },

  // Mettre à jour les totaux après un retrait
  async updateTotalsAfterWithdrawal(
    tontineId: string,
    clientId: string,
    amount: number
  ): Promise<void> {
    await supabase.rpc('increment_tontine_withdrawn', {
      tontine_id: tontineId,
      amount: amount,
    });

    await supabase.rpc('increment_participation_withdrawn', {
      tontine_id: tontineId,
      client_id: clientId,
      amount: amount,
    });
  },

  // Récupérer les transactions d'un client
  async getClientTransactions(
    clientId: string,
    params: PaginationParams,
    filters?: SearchFilters
  ): Promise<{ success: boolean; data?: PaginatedResponse<Transaction>; error?: string }> {
    try {
      const { page, per_page, sort_by = 'created_at', sort_order = 'desc' } = params;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('client_id', clientId);

      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.tontine_id) query = query.eq('tontine_id', filters.tontine_id);
      if (filters?.date_from) query = query.gte('created_at', filters.date_from);
      if (filters?.date_to) query = query.lte('created_at', filters.date_to);

      const { data, count, error } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(from, to);

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data as Transaction[],
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

  // Récupérer les transactions d'un tontinier
  async getTontinierTransactions(
    tontinierId: string,
    params: PaginationParams,
    filters?: SearchFilters
  ): Promise<{ success: boolean; data?: PaginatedResponse<Transaction>; error?: string }> {
    try {
      const { page, per_page, sort_by = 'created_at', sort_order = 'desc' } = params;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      let query = supabase
        .from('transactions')
        .select(`*, clients(identifier, users(full_name)), tontines(name, identifier)`, { count: 'exact' })
        .eq('tontinier_id', tontinierId);

      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.tontine_id) query = query.eq('tontine_id', filters.tontine_id);
      if (filters?.client_id) query = query.eq('client_id', filters.client_id);
      if (filters?.date_from) query = query.gte('created_at', filters.date_from);
      if (filters?.date_to) query = query.lte('created_at', filters.date_to);

      const { data, count, error } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(from, to);

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data as Transaction[],
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

  // Récupérer les transactions en attente (tontinier)
  async getPendingTransactions(
    tontinierId: string
  ): Promise<{ success: boolean; data?: Transaction[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, clients(identifier, users(full_name, whatsapp)), tontines(name, identifier)`)
        .eq('tontinier_id', tontinierId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;

      return { success: true, data: data as Transaction[] };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Toutes les transactions (admin)
  async getAllTransactions(
    params: PaginationParams,
    filters?: SearchFilters
  ): Promise<{ success: boolean; data?: PaginatedResponse<Transaction>; error?: string }> {
    try {
      const { page, per_page, sort_by = 'created_at', sort_order = 'desc' } = params;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      let query = supabase
        .from('transactions')
        .select(`*, clients(identifier, users(full_name)), tontiniers(identifier, users(full_name)), tontines(name, identifier)`, { count: 'exact' });

      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.tontine_id) query = query.eq('tontine_id', filters.tontine_id);
      if (filters?.client_id) query = query.eq('client_id', filters.client_id);
      if (filters?.tontinier_id) query = query.eq('tontinier_id', filters.tontinier_id);
      if (filters?.date_from) query = query.gte('created_at', filters.date_from);
      if (filters?.date_to) query = query.lte('created_at', filters.date_to);

      const { data, count, error } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(from, to);

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data as Transaction[],
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
};

export default transactionService;
