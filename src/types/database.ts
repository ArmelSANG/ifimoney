// ============================================
// TYPES SUPABASE - BASE DE DONNÉES
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          whatsapp: string;
          full_name: string;
          profile_photo_url: string | null;
          role: 'admin' | 'tontinier' | 'client';
          status: 'pending' | 'active' | 'suspended' | 'expired' | 'rejected';
          cgu_accepted: boolean;
          cgu_accepted_at: string | null;
          cgu_version: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          whatsapp: string;
          full_name: string;
          profile_photo_url?: string | null;
          role: 'admin' | 'tontinier' | 'client';
          status?: 'pending' | 'active' | 'suspended' | 'expired' | 'rejected';
          cgu_accepted?: boolean;
          cgu_accepted_at?: string | null;
          cgu_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          whatsapp?: string;
          full_name?: string;
          profile_photo_url?: string | null;
          role?: 'admin' | 'tontinier' | 'client';
          status?: 'pending' | 'active' | 'suspended' | 'expired' | 'rejected';
          cgu_accepted?: boolean;
          cgu_accepted_at?: string | null;
          cgu_version?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tontiniers: {
        Row: {
          id: string;
          user_id: string;
          identifier: string;
          identity_doc_type: 'cni' | 'passport' | 'permis' | 'carte_consulaire';
          identity_doc_url: string;
          expiration_date: string;
          suspended_at: string | null;
          suspension_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          identifier: string;
          identity_doc_type: 'cni' | 'passport' | 'permis' | 'carte_consulaire';
          identity_doc_url: string;
          expiration_date: string;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          identifier?: string;
          identity_doc_type?: 'cni' | 'passport' | 'permis' | 'carte_consulaire';
          identity_doc_url?: string;
          expiration_date?: string;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          identifier: string;
          tontinier_id: string;
          desired_tontine_type: 'classique' | 'flexible' | 'terme' | null;
          desired_mise: number | null;
          desired_objective: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          identifier: string;
          tontinier_id: string;
          desired_tontine_type?: 'classique' | 'flexible' | 'terme' | null;
          desired_mise?: number | null;
          desired_objective?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          identifier?: string;
          tontinier_id?: string;
          desired_tontine_type?: 'classique' | 'flexible' | 'terme' | null;
          desired_mise?: number | null;
          desired_objective?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      registration_requests: {
        Row: {
          id: string;
          whatsapp: string;
          full_name: string;
          profile_photo_url: string;
          role: 'tontinier' | 'client';
          status: 'pending' | 'approved' | 'rejected';
          identity_doc_type: 'cni' | 'passport' | 'permis' | 'carte_consulaire' | null;
          identity_doc_url: string | null;
          tontinier_id: string | null;
          desired_tontine_type: 'classique' | 'flexible' | 'terme' | null;
          desired_mise: number | null;
          desired_objective: string | null;
          initial_expiration_days: number | null;
          rejection_reason: string | null;
          processed_at: string | null;
          processed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          whatsapp: string;
          full_name: string;
          profile_photo_url: string;
          role: 'tontinier' | 'client';
          status?: 'pending' | 'approved' | 'rejected';
          identity_doc_type?: 'cni' | 'passport' | 'permis' | 'carte_consulaire' | null;
          identity_doc_url?: string | null;
          tontinier_id?: string | null;
          desired_tontine_type?: 'classique' | 'flexible' | 'terme' | null;
          desired_mise?: number | null;
          desired_objective?: string | null;
          initial_expiration_days?: number | null;
          rejection_reason?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          whatsapp?: string;
          full_name?: string;
          profile_photo_url?: string;
          role?: 'tontinier' | 'client';
          status?: 'pending' | 'approved' | 'rejected';
          identity_doc_type?: 'cni' | 'passport' | 'permis' | 'carte_consulaire' | null;
          identity_doc_url?: string | null;
          tontinier_id?: string | null;
          desired_tontine_type?: 'classique' | 'flexible' | 'terme' | null;
          desired_mise?: number | null;
          desired_objective?: string | null;
          initial_expiration_days?: number | null;
          rejection_reason?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          created_at?: string;
        };
      };
      tontines: {
        Row: {
          id: string;
          identifier: string;
          name: string;
          description: string | null;
          type: 'classique' | 'flexible' | 'terme';
          mise: number;
          currency: string;
          start_date: string;
          end_date: string | null;
          cycle_days: number;
          tontinier_id: string;
          status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
          total_collected: number;
          total_withdrawn: number;
          identifier_history: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          identifier: string;
          name: string;
          description?: string | null;
          type: 'classique' | 'flexible' | 'terme';
          mise: number;
          currency?: string;
          start_date: string;
          end_date?: string | null;
          cycle_days: number;
          tontinier_id: string;
          status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
          total_collected?: number;
          total_withdrawn?: number;
          identifier_history?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          identifier?: string;
          name?: string;
          description?: string | null;
          type?: 'classique' | 'flexible' | 'terme';
          mise?: number;
          currency?: string;
          start_date?: string;
          end_date?: string | null;
          cycle_days?: number;
          tontinier_id?: string;
          status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
          total_collected?: number;
          total_withdrawn?: number;
          identifier_history?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tontine_participations: {
        Row: {
          id: string;
          tontine_id: string;
          client_id: string;
          joined_at: string;
          status: 'active' | 'suspended' | 'withdrawn';
          total_deposited: number;
          total_withdrawn: number;
          last_deposit_at: string | null;
        };
        Insert: {
          id?: string;
          tontine_id: string;
          client_id: string;
          joined_at?: string;
          status?: 'active' | 'suspended' | 'withdrawn';
          total_deposited?: number;
          total_withdrawn?: number;
          last_deposit_at?: string | null;
        };
        Update: {
          id?: string;
          tontine_id?: string;
          client_id?: string;
          joined_at?: string;
          status?: 'active' | 'suspended' | 'withdrawn';
          total_deposited?: number;
          total_withdrawn?: number;
          last_deposit_at?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          type: 'deposit' | 'withdrawal';
          amount: number;
          currency: string;
          status: 'pending' | 'validated' | 'rejected' | 'cancelled';
          tontine_id: string;
          client_id: string;
          tontinier_id: string;
          payment_method: 'cash' | 'mobile_money';
          proof_url: string | null;
          notes: string | null;
          validated_at: string | null;
          validated_by: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'deposit' | 'withdrawal';
          amount: number;
          currency?: string;
          status?: 'pending' | 'validated' | 'rejected' | 'cancelled';
          tontine_id: string;
          client_id: string;
          tontinier_id: string;
          payment_method: 'cash' | 'mobile_money';
          proof_url?: string | null;
          notes?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'deposit' | 'withdrawal';
          amount?: number;
          currency?: string;
          status?: 'pending' | 'validated' | 'rejected' | 'cancelled';
          tontine_id?: string;
          client_id?: string;
          tontinier_id?: string;
          payment_method?: 'cash' | 'mobile_money';
          proof_url?: string | null;
          notes?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      cgu: {
        Row: {
          id: string;
          version: string;
          content: string;
          effective_date: string;
          created_at: string;
          created_by: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          version: string;
          content: string;
          effective_date: string;
          created_at?: string;
          created_by: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          version?: string;
          content?: string;
          effective_date?: string;
          created_at?: string;
          created_by?: string;
          is_active?: boolean;
        };
      };
      cgu_acceptances: {
        Row: {
          id: string;
          user_id: string;
          cgu_id: string;
          cgu_version: string;
          accepted_at: string;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          cgu_id: string;
          cgu_version: string;
          accepted_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          cgu_id?: string;
          cgu_version?: string;
          accepted_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          old_value: Json | null;
          new_value: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          old_value?: Json | null;
          new_value?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          old_value?: Json | null;
          new_value?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          is_read: boolean;
          read_at: string | null;
          data: Json | null;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          is_read?: boolean;
          read_at?: string | null;
          data?: Json | null;
          action_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          is_read?: boolean;
          read_at?: string | null;
          data?: Json | null;
          action_url?: string | null;
          created_at?: string;
        };
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          push_enabled: boolean;
          in_app_enabled: boolean;
          deposit_notifications: boolean;
          withdrawal_notifications: boolean;
          reminder_notifications: boolean;
          system_notifications: boolean;
          reminder_days_before: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          push_enabled?: boolean;
          in_app_enabled?: boolean;
          deposit_notifications?: boolean;
          withdrawal_notifications?: boolean;
          reminder_notifications?: boolean;
          system_notifications?: boolean;
          reminder_days_before?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          push_enabled?: boolean;
          in_app_enabled?: boolean;
          deposit_notifications?: boolean;
          withdrawal_notifications?: boolean;
          reminder_notifications?: boolean;
          system_notifications?: boolean;
          reminder_days_before?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          keys: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          keys: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          keys?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          type: 'client_tontinier' | 'tontinier_admin';
          participant1_id: string;
          participant2_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: 'client_tontinier' | 'tontinier_admin';
          participant1_id: string;
          participant2_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'client_tontinier' | 'tontinier_admin';
          participant1_id?: string;
          participant2_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type: 'text' | 'image' | 'file' | 'system';
          file_url: string | null;
          file_name: string | null;
          status: 'sent' | 'delivered' | 'read';
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          message_type?: 'text' | 'image' | 'file' | 'system';
          file_url?: string | null;
          file_name?: string | null;
          status?: 'sent' | 'delivered' | 'read';
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: 'text' | 'image' | 'file' | 'system';
          file_url?: string | null;
          file_name?: string | null;
          status?: 'sent' | 'delivered' | 'read';
          read_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_client_identifier: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      generate_tontinier_identifier: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      generate_tontine_identifier: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_admin_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
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
        };
      };
      check_tontinier_expiration: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
      get_or_create_conversation: {
        Args: {
          p_type: string;
          p_user1_id: string;
          p_user2_id: string;
        };
        Returns: string;
      };
      get_unread_count: {
        Args: {
          p_conversation_id: string;
          p_user_id: string;
        };
        Returns: number;
      };
      get_total_unread_messages: {
        Args: {
          p_user_id: string;
        };
        Returns: number;
      };
    };
    Enums: {
      user_role: 'admin' | 'tontinier' | 'client';
      account_status: 'pending' | 'active' | 'suspended' | 'expired' | 'rejected';
      tontine_type: 'classique' | 'flexible' | 'terme';
      identity_doc_type: 'cni' | 'passport' | 'permis' | 'carte_consulaire';
      transaction_status: 'pending' | 'validated' | 'rejected' | 'cancelled';
      transaction_type: 'deposit' | 'withdrawal';
    };
  };
}
