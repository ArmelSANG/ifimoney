import { supabase, handleSupabaseError } from './supabase';
import type {
  Tontine,
  TontineFormData,
  TontineParticipation,
  PaginatedResponse,
  PaginationParams,
  SearchFilters,
} from '@/types';
import { TONTINE_CONFIG } from '@/types/features';

export const tontineService = {
  // Vérifier la disponibilité d'un identifiant
  async checkIdentifierAvailability(identifier: string): Promise<{ available: boolean }> {
    try {
      const { data, error } = await supabase
        .from('tontines')
        .select('id')
        .eq('identifier', identifier)
        .maybeSingle();

      if (error) throw error;

      return { available: !data };
    } catch (error) {
      console.error('Error checking identifier:', error);
      return { available: false };
    }
  },

  // Créer une nouvelle tontine
  async createTontine(
    data: TontineFormData,
    tontinierId: string
  ): Promise<{ success: boolean; tontine?: Tontine; error?: string }> {
    try {
      // Validation du montant minimum
      if (data.mise < TONTINE_CONFIG.MIN_MISE) {
        return { 
          success: false, 
          error: `Le montant minimum d'une mise est de ${TONTINE_CONFIG.MIN_MISE} F` 
        };
      }

      // Générer ou utiliser l'identifiant fourni
      let identifier = data.identifier;
      if (!identifier) {
        const { data: generatedId } = await supabase.rpc('generate_tontine_identifier');
        identifier = generatedId;
      }

      // Vérifier l'unicité de l'identifiant
      const { data: existing } = await supabase
        .from('tontines')
        .select('id')
        .eq('identifier', identifier)
        .single();

      if (existing) {
        return { success: false, error: 'Cet identifiant de tontine existe déjà' };
      }

      // Validation spécifique pour tontine à terme
      if (data.type === 'terme' && !data.end_date) {
        return { success: false, error: 'La date de fin est obligatoire pour une tontine à terme' };
      }

      const { data: tontine, error } = await supabase
        .from('tontines')
        .insert({
          identifier,
          name: data.name,
          description: data.description,
          type: data.type,
          mise: data.mise,
          currency: 'XOF',
          start_date: data.start_date,
          end_date: data.end_date,
          cycle_days: data.cycle_days,
          duration_months: data.duration_months,
          duration_validated: data.type === 'terme' ? true : null, // Validé par le tontinier à la création
          tontinier_id: tontinierId,
          status: 'active',
          total_collected: 0,
          total_withdrawn: 0,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, tontine: tontine as Tontine };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer les tontines d'un tontinier
  async getTontinierTontines(
    tontinierId: string,
    params: PaginationParams,
    filters?: SearchFilters
  ): Promise<{ success: boolean; data?: PaginatedResponse<Tontine>; error?: string }> {
    try {
      const { page, per_page, sort_by = 'created_at', sort_order = 'desc' } = params;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      let query = supabase
        .from('tontines')
        .select('*', { count: 'exact' })
        .eq('tontinier_id', tontinierId);

      // Appliquer les filtres
      if (filters?.query) {
        query = query.or(`name.ilike.%${filters.query}%,identifier.ilike.%${filters.query}%`);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      const { data, count, error } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(from, to);

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data as Tontine[],
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

  // Récupérer une tontine par ID
  async getTontineById(tontineId: string): Promise<{ success: boolean; tontine?: Tontine; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('tontines')
        .select('*')
        .eq('id', tontineId)
        .single();

      if (error) throw error;

      return { success: true, tontine: data as Tontine };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Mettre à jour une tontine
  async updateTontine(
    tontineId: string,
    data: Partial<TontineFormData>,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Si l'identifiant change, vérifier l'unicité et journaliser
      if (data.identifier) {
        const { data: existing } = await supabase
          .from('tontines')
          .select('id, identifier, identifier_history')
          .eq('id', tontineId)
          .single();

        if (existing && existing.identifier !== data.identifier) {
          // Vérifier l'unicité
          const { data: duplicate } = await supabase
            .from('tontines')
            .select('id')
            .eq('identifier', data.identifier)
            .neq('id', tontineId)
            .maybeSingle();

          if (duplicate) {
            return { success: false, error: 'Cet identifiant existe déjà' };
          }

          // Récupérer le nom de l'utilisateur qui fait la modification
          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', userId)
            .single();

          // Ajouter à l'historique
          const history = (existing.identifier_history as Array<{
            old_identifier: string;
            new_identifier: string;
            changed_at: string;
            changed_by: string;
            changed_by_name?: string;
          }>) || [];
          
          history.push({
            old_identifier: existing.identifier,
            new_identifier: data.identifier,
            changed_at: new Date().toISOString(),
            changed_by: userId,
            changed_by_name: userData?.full_name || 'Utilisateur inconnu',
          });

          const { error } = await supabase
            .from('tontines')
            .update({
              identifier: data.identifier,
              name: data.name,
              description: data.description,
              type: data.type,
              mise: data.mise,
              cycle_days: data.cycle_days,
              start_date: data.start_date,
              end_date: data.end_date,
              identifier_history: history,
              updated_at: new Date().toISOString(),
            })
            .eq('id', tontineId);

          if (error) throw error;
          return { success: true };
        }
      }
      
      // Mise à jour sans changement d'identifiant
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.mise !== undefined) updateData.mise = data.mise;
      if (data.cycle_days !== undefined) updateData.cycle_days = data.cycle_days;
      if (data.start_date !== undefined) updateData.start_date = data.start_date;
      if (data.end_date !== undefined) updateData.end_date = data.end_date;

      const { error } = await supabase
        .from('tontines')
        .update(updateData)
        .eq('id', tontineId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Ajouter un client à une tontine
  async addClientToTontine(
    tontineId: string,
    clientId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Vérifier si le client est déjà participant
      const { data: existing } = await supabase
        .from('tontine_participations')
        .select('id')
        .eq('tontine_id', tontineId)
        .eq('client_id', clientId)
        .single();

      if (existing) {
        return { success: false, error: 'Ce client participe déjà à cette tontine' };
      }

      const { error } = await supabase.from('tontine_participations').insert({
        tontine_id: tontineId,
        client_id: clientId,
        status: 'active',
        total_deposited: 0,
        total_withdrawn: 0,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer les participants d'une tontine
  async getTontineParticipants(
    tontineId: string,
    params: PaginationParams
  ): Promise<{ success: boolean; data?: PaginatedResponse<TontineParticipation>; error?: string }> {
    try {
      const { page, per_page, sort_by = 'joined_at', sort_order = 'desc' } = params;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      const { data, count, error } = await supabase
        .from('tontine_participations')
        .select(`
          *,
          clients (
            identifier,
            users (
              full_name,
              whatsapp,
              profile_photo_url
            )
          )
        `, { count: 'exact' })
        .eq('tontine_id', tontineId)
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(from, to);

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data as unknown as TontineParticipation[],
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

  // Récupérer les tontines d'un client
  async getClientTontines(
    clientId: string,
    params: PaginationParams
  ): Promise<{ success: boolean; data?: PaginatedResponse<Tontine>; error?: string }> {
    try {
      const { page, per_page, sort_by = 'joined_at', sort_order = 'desc' } = params;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      const { data, count, error } = await supabase
        .from('tontine_participations')
        .select(`
          tontines (*)
        `, { count: 'exact' })
        .eq('client_id', clientId)
        .eq('status', 'active')
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(from, to);

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tontines = (data || []).map((p: any) => p.tontines);

      return {
        success: true,
        data: {
          data: tontines as Tontine[],
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

  // Changer le statut d'une tontine
  async updateTontineStatus(
    tontineId: string,
    status: Tontine['status']
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('tontines')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tontineId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Toutes les tontines (admin)
  async getAllTontines(
    params: PaginationParams,
    filters?: SearchFilters
  ): Promise<{ success: boolean; data?: PaginatedResponse<Tontine>; error?: string }> {
    try {
      const { page, per_page, sort_by = 'created_at', sort_order = 'desc' } = params;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      let query = supabase.from('tontines').select('*', { count: 'exact' });

      if (filters?.query) {
        query = query.or(`name.ilike.%${filters.query}%,identifier.ilike.%${filters.query}%`);
      }
      if (filters?.tontinier_id) {
        query = query.eq('tontinier_id', filters.tontinier_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, count, error } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(from, to);

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data as Tontine[],
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

export default tontineService;
