import { supabase, handleSupabaseError } from './supabase';
import type {
  TontinierRegistrationFormData,
  ClientRegistrationFormData,
  RegistrationRequest,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export const registrationService = {
  // Soumettre une demande d'inscription tontinier
  async submitTontinierRequest(data: TontinierRegistrationFormData): Promise<{ success: boolean; error?: string }> {
    try {
      // Upload de la photo de profil
      const profilePhotoPath = `registration/${Date.now()}_profile_${data.profile_photo.name}`;
      const { error: profileUploadError } = await supabase.storage
        .from('documents')
        .upload(profilePhotoPath, data.profile_photo);

      if (profileUploadError) throw profileUploadError;

      const { data: profilePhotoData } = supabase.storage
        .from('documents')
        .getPublicUrl(profilePhotoPath);

      // Upload de la pièce d'identité
      const identityDocPath = `registration/${Date.now()}_identity_${data.identity_doc.name}`;
      const { error: identityUploadError } = await supabase.storage
        .from('documents')
        .upload(identityDocPath, data.identity_doc);

      if (identityUploadError) throw identityUploadError;

      const { data: identityDocData } = supabase.storage
        .from('documents')
        .getPublicUrl(identityDocPath);

      // Créer la demande d'inscription
      const { error: insertError } = await supabase
        .from('registration_requests')
        .insert({
          whatsapp: data.whatsapp,
          full_name: data.full_name,
          profile_photo_url: profilePhotoData.publicUrl,
          role: 'tontinier',
          identity_doc_type: data.identity_doc_type,
          identity_doc_url: identityDocData.publicUrl,
          country_code: data.country_code,
          city: data.city,
          address: data.address,
          status: 'pending',
        });

      if (insertError) throw insertError;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Soumettre une demande d'inscription client
  async submitClientRequest(data: ClientRegistrationFormData): Promise<{ success: boolean; error?: string }> {
    try {
      // Upload de la photo de profil
      const profilePhotoPath = `registration/${Date.now()}_profile_${data.profile_photo.name}`;
      const { error: profileUploadError } = await supabase.storage
        .from('documents')
        .upload(profilePhotoPath, data.profile_photo);

      if (profileUploadError) throw profileUploadError;

      const { data: profilePhotoData } = supabase.storage
        .from('documents')
        .getPublicUrl(profilePhotoPath);

      // Créer la demande d'inscription
      const { error: insertError } = await supabase
        .from('registration_requests')
        .insert({
          whatsapp: data.whatsapp,
          full_name: data.full_name,
          profile_photo_url: profilePhotoData.publicUrl,
          role: 'client',
          country_code: data.country_code,
          city: data.city,
          address: data.address,
          desired_tontine_type: data.desired_tontine_type,
          desired_mise: data.desired_mise,
          desired_objective: data.desired_objective,
          status: 'pending',
        });

      if (insertError) throw insertError;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer les demandes en attente (admin)
  async getPendingRequests(
    params: PaginationParams
  ): Promise<{ success: boolean; data?: PaginatedResponse<RegistrationRequest>; error?: string }> {
    try {
      const { page, per_page, sort_by = 'created_at', sort_order = 'desc' } = params;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      // Récupérer le total
      const { count } = await supabase
        .from('registration_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Récupérer les données
      const { data, error } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('status', 'pending')
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range(from, to);

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data as RegistrationRequest[],
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

  // Approuver une demande (admin)
  async approveRequest(
    requestId: string,
    adminId: string,
    expirationDays?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Récupérer la demande
      const { data: request, error: requestError } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError || !request) throw new Error('Demande non trouvée');

      if (request.role === 'tontinier') {
        // Générer l'identifiant tontinier
        const { data: identifier } = await supabase.rpc('generate_tontinier_identifier');

        // Calculer la date d'expiration
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + (expirationDays || 30));

        // Créer l'email interne
        const email = `tontinier_${identifier.toLowerCase()}@tontine.local`;

        // Créer l'utilisateur dans Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: Math.random().toString(36).slice(-8), // Mot de passe temporaire
          email_confirm: true,
        });

        if (authError) throw authError;

        // Créer l'entrée utilisateur
        const { error: userError } = await supabase.from('users').insert({
          id: authData.user.id,
          email,
          whatsapp: request.whatsapp,
          full_name: request.full_name,
          profile_photo_url: request.profile_photo_url,
          role: 'tontinier',
          status: 'active',
          cgu_accepted: false,
        });

        if (userError) throw userError;

        // Créer l'entrée tontinier
        const { error: tontinierError } = await supabase.from('tontiniers').insert({
          user_id: authData.user.id,
          identifier,
          identity_doc_type: request.identity_doc_type,
          identity_doc_url: request.identity_doc_url,
          expiration_date: expirationDate.toISOString(),
        });

        if (tontinierError) throw tontinierError;
      } else {
        // Client
        // Générer l'identifiant client
        const { data: identifier } = await supabase.rpc('generate_client_identifier');

        // Créer l'email interne
        const email = `client_${identifier.toLowerCase()}@tontine.local`;

        // Créer l'utilisateur dans Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: Math.random().toString(36).slice(-8),
          email_confirm: true,
        });

        if (authError) throw authError;

        // Créer l'entrée utilisateur
        const { error: userError } = await supabase.from('users').insert({
          id: authData.user.id,
          email,
          whatsapp: request.whatsapp,
          full_name: request.full_name,
          profile_photo_url: request.profile_photo_url,
          role: 'client',
          status: 'active',
          cgu_accepted: false,
        });

        if (userError) throw userError;

        // Créer l'entrée client
        const { error: clientError } = await supabase.from('clients').insert({
          user_id: authData.user.id,
          identifier,
          tontinier_id: request.tontinier_id,
          desired_tontine_type: request.desired_tontine_type,
          desired_mise: request.desired_mise,
          desired_objective: request.desired_objective,
        });

        if (clientError) throw clientError;
      }

      // Mettre à jour le statut de la demande
      const { error: updateError } = await supabase
        .from('registration_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: adminId,
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Refuser une demande (admin)
  async rejectRequest(
    requestId: string,
    adminId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('registration_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          processed_at: new Date().toISOString(),
          processed_by: adminId,
        })
        .eq('id', requestId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },
};

export default registrationService;
