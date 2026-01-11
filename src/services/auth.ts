import { supabase, handleSupabaseError } from './supabase';
import type { User, UserRole } from '@/types';
import type { Database } from '@/types/database';

type DbUser = Database['public']['Tables']['users']['Row'];

export interface LoginCredentials {
  identifier: string; // CXXXX ou TXXXX ou email admin
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  requiresCGU?: boolean;
}

// Service d'authentification
export const authService = {
  // Connexion
  async login({ identifier, password }: LoginCredentials): Promise<AuthResponse> {
    try {
      // Déterminer le type d'utilisateur basé sur l'identifiant
      let email: string;
      let role: UserRole;

      if (identifier.startsWith('C')) {
        // Client
        role = 'client';
        email = `client_${identifier.toLowerCase()}@tontine.local`;
      } else if (identifier.startsWith('T')) {
        // Tontinier
        role = 'tontinier';
        email = `tontinier_${identifier.toLowerCase()}@tontine.local`;
      } else if (identifier.includes('@')) {
        // Admin (email)
        role = 'admin';
        email = identifier;
      } else {
        return { success: false, error: 'Identifiant invalide' };
      }

      // Authentification Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        return { success: false, error: 'Identifiant ou mot de passe incorrect' };
      }

      if (!authData.user) {
        return { success: false, error: 'Utilisateur non trouvé' };
      }

      // Récupérer les données utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userData) {
        return { success: false, error: 'Erreur lors de la récupération des données utilisateur' };
      }

      const user = userData as DbUser;

      // Vérifier le statut du compte
      if (user.status === 'pending') {
        await supabase.auth.signOut();
        return { success: false, error: 'Votre compte est en attente de validation' };
      }

      if (user.status === 'suspended') {
        await supabase.auth.signOut();
        return { success: false, error: 'Votre compte a été suspendu. Contactez l\'administrateur.' };
      }

      if (user.status === 'expired') {
        await supabase.auth.signOut();
        return { success: false, error: 'Votre compte a expiré. Contactez l\'administrateur.' };
      }

      if (user.status === 'rejected') {
        await supabase.auth.signOut();
        return { success: false, error: 'Votre demande de compte a été refusée.' };
      }

      // Vérifier si les CGU ont été acceptées
      if (!user.cgu_accepted) {
        return {
          success: true,
          user: userData as User,
          requiresCGU: true,
        };
      }

      return { success: true, user: userData as User };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Déconnexion
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer la session actuelle
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  // Récupérer l'utilisateur actuel
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) return null;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError || !userData) return null;

      return userData as User;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Accepter les CGU
  async acceptCGU(userId: string, cguId: string, cguVersion: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Enregistrer l'acceptation
      const { error: acceptanceError } = await supabase
        .from('cgu_acceptances')
        .insert({
          user_id: userId,
          cgu_id: cguId,
          cgu_version: cguVersion,
          accepted_at: new Date().toISOString(),
        });

      if (acceptanceError) throw acceptanceError;

      // Mettre à jour l'utilisateur
      const { error: updateError } = await supabase
        .from('users')
        .update({
          cgu_accepted: true,
          cgu_accepted_at: new Date().toISOString(),
          cgu_version: cguVersion,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Changer le mot de passe
  async changePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Écouter les changements d'état d'authentification
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  },
};

export default authService;
