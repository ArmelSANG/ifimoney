// Types pour le système de notifications

export type NotificationType = 
  | 'deposit_validated'      // Dépôt validé
  | 'deposit_rejected'       // Dépôt refusé
  | 'withdrawal_validated'   // Retrait validé
  | 'withdrawal_rejected'    // Retrait refusé
  | 'withdrawal_request'     // Nouvelle demande de retrait (pour tontinier)
  | 'deposit_received'       // Nouveau dépôt reçu (pour tontinier)
  | 'cotisation_reminder'    // Rappel de cotisation
  | 'cotisation_overdue'     // Cotisation en retard
  | 'account_expiring'       // Compte tontinier expire bientôt
  | 'account_expired'        // Compte tontinier expiré
  | 'tontine_joined'         // Ajouté à une tontine
  | 'tontine_ended'          // Tontine terminée
  | 'new_client'             // Nouveau client (pour tontinier)
  | 'registration_approved'  // Demande d'inscription approuvée
  | 'registration_rejected'  // Demande d'inscription refusée
  | 'system'                 // Notification système
  | 'info';                  // Information générale

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  is_read: boolean;
  read_at?: string;
  data?: Record<string, unknown>; // Données supplémentaires (ex: tontine_id, transaction_id)
  action_url?: string; // Lien vers la page concernée
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  push_enabled: boolean;
  in_app_enabled: boolean;
  deposit_notifications: boolean;
  withdrawal_notifications: boolean;
  reminder_notifications: boolean;
  system_notifications: boolean;
  reminder_days_before: number; // Jours avant la cotisation pour rappeler
  created_at: string;
  updated_at: string;
}

// Configuration des notifications par type
export const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon: string;
  color: 'success' | 'danger' | 'warning' | 'primary' | 'secondary' | 'info';
  defaultTitle: string;
  pushEnabled: boolean;
}> = {
  deposit_validated: {
    icon: 'check-circle',
    color: 'success',
    defaultTitle: 'Dépôt validé',
    pushEnabled: true,
  },
  deposit_rejected: {
    icon: 'x-circle',
    color: 'danger',
    defaultTitle: 'Dépôt refusé',
    pushEnabled: true,
  },
  withdrawal_validated: {
    icon: 'check-circle',
    color: 'success',
    defaultTitle: 'Retrait validé',
    pushEnabled: true,
  },
  withdrawal_rejected: {
    icon: 'x-circle',
    color: 'danger',
    defaultTitle: 'Retrait refusé',
    pushEnabled: true,
  },
  withdrawal_request: {
    icon: 'arrow-down-circle',
    color: 'warning',
    defaultTitle: 'Nouvelle demande de retrait',
    pushEnabled: true,
  },
  deposit_received: {
    icon: 'arrow-up-circle',
    color: 'success',
    defaultTitle: 'Nouveau dépôt reçu',
    pushEnabled: true,
  },
  cotisation_reminder: {
    icon: 'bell',
    color: 'primary',
    defaultTitle: 'Rappel de cotisation',
    pushEnabled: true,
  },
  cotisation_overdue: {
    icon: 'alert-triangle',
    color: 'danger',
    defaultTitle: 'Cotisation en retard',
    pushEnabled: true,
  },
  account_expiring: {
    icon: 'clock',
    color: 'warning',
    defaultTitle: 'Compte expire bientôt',
    pushEnabled: true,
  },
  account_expired: {
    icon: 'x-octagon',
    color: 'danger',
    defaultTitle: 'Compte expiré',
    pushEnabled: true,
  },
  tontine_joined: {
    icon: 'user-plus',
    color: 'success',
    defaultTitle: 'Nouvelle tontine',
    pushEnabled: true,
  },
  tontine_ended: {
    icon: 'flag',
    color: 'info',
    defaultTitle: 'Tontine terminée',
    pushEnabled: true,
  },
  new_client: {
    icon: 'user-plus',
    color: 'primary',
    defaultTitle: 'Nouveau client',
    pushEnabled: true,
  },
  registration_approved: {
    icon: 'check-circle',
    color: 'success',
    defaultTitle: 'Inscription approuvée',
    pushEnabled: true,
  },
  registration_rejected: {
    icon: 'x-circle',
    color: 'danger',
    defaultTitle: 'Inscription refusée',
    pushEnabled: true,
  },
  system: {
    icon: 'info',
    color: 'secondary',
    defaultTitle: 'Notification système',
    pushEnabled: false,
  },
  info: {
    icon: 'info',
    color: 'info',
    defaultTitle: 'Information',
    pushEnabled: false,
  },
};

// Templates de messages
export const NOTIFICATION_TEMPLATES = {
  deposit_validated: (amount: string, tontine: string) => 
    `Votre dépôt de ${amount} dans la tontine "${tontine}" a été validé.`,
  
  deposit_rejected: (amount: string, tontine: string, reason?: string) => 
    `Votre dépôt de ${amount} dans la tontine "${tontine}" a été refusé.${reason ? ` Raison : ${reason}` : ''}`,
  
  withdrawal_validated: (amount: string, tontine: string) => 
    `Votre retrait de ${amount} de la tontine "${tontine}" a été validé.`,
  
  withdrawal_rejected: (amount: string, tontine: string, reason?: string) => 
    `Votre retrait de ${amount} de la tontine "${tontine}" a été refusé.${reason ? ` Raison : ${reason}` : ''}`,
  
  withdrawal_request: (clientName: string, amount: string, tontine: string) => 
    `${clientName} demande un retrait de ${amount} de la tontine "${tontine}".`,
  
  deposit_received: (clientName: string, amount: string, tontine: string) => 
    `${clientName} a effectué un dépôt de ${amount} dans la tontine "${tontine}".`,
  
  cotisation_reminder: (tontine: string, amount: string, daysLeft: number) => 
    `Rappel : Votre cotisation de ${amount} pour "${tontine}" est due dans ${daysLeft} jour(s).`,
  
  cotisation_overdue: (tontine: string, amount: string, daysOverdue: number) => 
    `Attention : Votre cotisation de ${amount} pour "${tontine}" est en retard de ${daysOverdue} jour(s).`,
  
  account_expiring: (daysLeft: number) => 
    `Votre compte tontinier expire dans ${daysLeft} jour(s). Contactez l'administrateur pour le prolonger.`,
  
  account_expired: () => 
    `Votre compte tontinier a expiré. Contactez l'administrateur pour le réactiver.`,
  
  tontine_joined: (tontine: string, mise: string) => 
    `Vous avez été ajouté à la tontine "${tontine}" avec une mise de ${mise}.`,
  
  tontine_ended: (tontine: string) => 
    `La tontine "${tontine}" est maintenant terminée.`,
  
  new_client: (clientName: string, clientId: string) => 
    `Nouveau client : ${clientName} (${clientId}) vous a été assigné.`,
  
  registration_approved: (identifier: string) => 
    `Félicitations ! Votre inscription a été approuvée. Votre identifiant est : ${identifier}`,
  
  registration_rejected: (reason?: string) => 
    `Votre demande d'inscription a été refusée.${reason ? ` Raison : ${reason}` : ''}`,
};
