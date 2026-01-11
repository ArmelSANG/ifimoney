import { supabase, handleSupabaseError } from './supabase';
import type { 
  Notification, 
  NotificationType, 
  NotificationPriority,
  NotificationPreferences 
} from '@/types/notifications';
import { NOTIFICATION_CONFIG, NOTIFICATION_TEMPLATES } from '@/types/notifications';

export const notificationService = {
  // ============================================
  // GESTION DES NOTIFICATIONS IN-APP
  // ============================================

  // Créer une notification
  async create(params: {
    userId: string;
    type: NotificationType;
    title?: string;
    message: string;
    priority?: NotificationPriority;
    data?: Record<string, unknown>;
    actionUrl?: string;
  }): Promise<{ success: boolean; notification?: Notification; error?: string }> {
    try {
      const config = NOTIFICATION_CONFIG[params.type];
      
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          type: params.type,
          title: params.title || config.defaultTitle,
          message: params.message,
          priority: params.priority || 'medium',
          data: params.data || {},
          action_url: params.actionUrl,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Envoyer une notification push si activée
      if (config.pushEnabled) {
        await this.sendPushNotification(params.userId, {
          title: params.title || config.defaultTitle,
          body: params.message,
          data: params.data,
          url: params.actionUrl,
        });
      }

      return { success: true, notification: data };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Créer plusieurs notifications (batch)
  async createBatch(notifications: Array<{
    userId: string;
    type: NotificationType;
    title?: string;
    message: string;
    priority?: NotificationPriority;
    data?: Record<string, unknown>;
    actionUrl?: string;
  }>): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const notificationsToInsert = notifications.map(n => ({
        user_id: n.userId,
        type: n.type,
        title: n.title || NOTIFICATION_CONFIG[n.type].defaultTitle,
        message: n.message,
        priority: n.priority || 'medium',
        data: n.data || {},
        action_url: n.actionUrl,
        is_read: false,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notificationsToInsert);

      if (error) throw error;

      // Envoyer les push notifications
      for (const n of notifications) {
        if (NOTIFICATION_CONFIG[n.type].pushEnabled) {
          await this.sendPushNotification(n.userId, {
            title: n.title || NOTIFICATION_CONFIG[n.type].defaultTitle,
            body: n.message,
            data: n.data,
            url: n.actionUrl,
          });
        }
      }

      return { success: true, count: notifications.length };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, count: 0, error: supabaseError.message };
    }
  },

  // Récupérer les notifications d'un utilisateur
  async getByUser(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number; offset?: number }
  ): Promise<{ success: boolean; notifications: Notification[]; unreadCount: number; error?: string }> {
    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Compter les non lues
      const { count: unreadCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      return { 
        success: true, 
        notifications: data || [],
        unreadCount: unreadCount || 0,
      };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, notifications: [], unreadCount: 0, error: supabaseError.message };
    }
  },

  // Marquer comme lue
  async markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Marquer toutes comme lues
  async markAllAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Supprimer une notification
  async delete(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Supprimer les anciennes notifications (plus de 30 jours)
  async deleteOld(userId: string, daysOld: number = 30): Promise<{ success: boolean; error?: string }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // NOTIFICATIONS PUSH (Web Push API)
  // ============================================

  // Enregistrer un abonnement push
  async savePushSubscription(
    userId: string,
    subscription: PushSubscriptionJSON
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Supprimer un abonnement push
  async removePushSubscription(
    userId: string,
    endpoint: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Envoyer une notification push
  async sendPushNotification(
    userId: string,
    payload: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      data?: Record<string, unknown>;
      url?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Récupérer les abonnements de l'utilisateur
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      if (!subscriptions || subscriptions.length === 0) {
        return { success: true }; // Pas d'abonnement, pas d'erreur
      }

      // En production, on utiliserait une Edge Function Supabase
      // pour envoyer les notifications via web-push
      // Pour l'instant, on stocke la notification pour traitement ultérieur
      
      // Note: L'implémentation complète nécessiterait :
      // 1. Une Edge Function avec la librairie web-push
      // 2. Les clés VAPID générées
      // 3. L'envoi via l'API Push

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // PRÉFÉRENCES DE NOTIFICATION
  // ============================================

  // Récupérer les préférences
  async getPreferences(userId: string): Promise<{ success: boolean; preferences?: NotificationPreferences; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Retourner les préférences par défaut si non trouvées
      const defaultPreferences: NotificationPreferences = {
        user_id: userId,
        push_enabled: true,
        in_app_enabled: true,
        deposit_notifications: true,
        withdrawal_notifications: true,
        reminder_notifications: true,
        system_notifications: true,
        reminder_days_before: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return { success: true, preferences: data || defaultPreferences };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Mettre à jour les préférences
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // HELPERS POUR CRÉER DES NOTIFICATIONS TYPÉES
  // ============================================

  // Notification de dépôt validé
  async notifyDepositValidated(params: {
    clientId: string;
    amount: string;
    tontineName: string;
    tontineId: string;
  }) {
    return this.create({
      userId: params.clientId,
      type: 'deposit_validated',
      message: NOTIFICATION_TEMPLATES.deposit_validated(params.amount, params.tontineName),
      priority: 'medium',
      data: { tontine_id: params.tontineId },
      actionUrl: `/client/tontines/${params.tontineId}`,
    });
  },

  // Notification de dépôt refusé
  async notifyDepositRejected(params: {
    clientId: string;
    amount: string;
    tontineName: string;
    tontineId: string;
    reason?: string;
  }) {
    return this.create({
      userId: params.clientId,
      type: 'deposit_rejected',
      message: NOTIFICATION_TEMPLATES.deposit_rejected(params.amount, params.tontineName, params.reason),
      priority: 'high',
      data: { tontine_id: params.tontineId },
      actionUrl: `/client/transactions`,
    });
  },

  // Notification de retrait validé
  async notifyWithdrawalValidated(params: {
    clientId: string;
    amount: string;
    tontineName: string;
    tontineId: string;
  }) {
    return this.create({
      userId: params.clientId,
      type: 'withdrawal_validated',
      message: NOTIFICATION_TEMPLATES.withdrawal_validated(params.amount, params.tontineName),
      priority: 'medium',
      data: { tontine_id: params.tontineId },
      actionUrl: `/client/transactions`,
    });
  },

  // Notification de demande de retrait (pour tontinier)
  async notifyWithdrawalRequest(params: {
    tontinierId: string;
    clientName: string;
    amount: string;
    tontineName: string;
    transactionId: string;
  }) {
    return this.create({
      userId: params.tontinierId,
      type: 'withdrawal_request',
      message: NOTIFICATION_TEMPLATES.withdrawal_request(params.clientName, params.amount, params.tontineName),
      priority: 'high',
      data: { transaction_id: params.transactionId },
      actionUrl: `/tontinier/transactions`,
    });
  },

  // Notification de nouveau dépôt (pour tontinier)
  async notifyDepositReceived(params: {
    tontinierId: string;
    clientName: string;
    amount: string;
    tontineName: string;
    transactionId: string;
  }) {
    return this.create({
      userId: params.tontinierId,
      type: 'deposit_received',
      message: NOTIFICATION_TEMPLATES.deposit_received(params.clientName, params.amount, params.tontineName),
      priority: 'medium',
      data: { transaction_id: params.transactionId },
      actionUrl: `/tontinier/transactions`,
    });
  },

  // Rappel de cotisation
  async notifyCotisationReminder(params: {
    clientId: string;
    tontineName: string;
    amount: string;
    daysLeft: number;
    tontineId: string;
  }) {
    return this.create({
      userId: params.clientId,
      type: 'cotisation_reminder',
      message: NOTIFICATION_TEMPLATES.cotisation_reminder(params.tontineName, params.amount, params.daysLeft),
      priority: params.daysLeft <= 1 ? 'high' : 'medium',
      data: { tontine_id: params.tontineId },
      actionUrl: `/client/tontines/${params.tontineId}`,
    });
  },

  // Cotisation en retard
  async notifyCotisationOverdue(params: {
    clientId: string;
    tontineName: string;
    amount: string;
    daysOverdue: number;
    tontineId: string;
  }) {
    return this.create({
      userId: params.clientId,
      type: 'cotisation_overdue',
      message: NOTIFICATION_TEMPLATES.cotisation_overdue(params.tontineName, params.amount, params.daysOverdue),
      priority: 'urgent',
      data: { tontine_id: params.tontineId },
      actionUrl: `/client/tontines/${params.tontineId}`,
    });
  },

  // Compte tontinier expire bientôt
  async notifyAccountExpiring(params: {
    tontinierId: string;
    daysLeft: number;
  }) {
    return this.create({
      userId: params.tontinierId,
      type: 'account_expiring',
      message: NOTIFICATION_TEMPLATES.account_expiring(params.daysLeft),
      priority: params.daysLeft <= 3 ? 'urgent' : 'high',
      actionUrl: `/tontinier/account`,
    });
  },

  // Inscription approuvée
  async notifyRegistrationApproved(params: {
    userId: string;
    identifier: string;
  }) {
    return this.create({
      userId: params.userId,
      type: 'registration_approved',
      message: NOTIFICATION_TEMPLATES.registration_approved(params.identifier),
      priority: 'high',
    });
  },
};

export default notificationService;
