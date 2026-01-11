'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '@/services/notifications';
import type { Notification, NotificationPreferences } from '@/types/notifications';
import { supabase } from '@/services/supabase';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  preferences: NotificationPreferences | null;
  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  // Push
  isPushSupported: boolean;
  isPushEnabled: boolean;
  requestPushPermission: () => Promise<boolean>;
  disablePush: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  // Vérifier le support Push
  useEffect(() => {
    const checkPushSupport = () => {
      const supported = 'Notification' in window && 
                       'serviceWorker' in navigator && 
                       'PushManager' in window;
      setIsPushSupported(supported);
      
      if (supported && Notification.permission === 'granted') {
        setIsPushEnabled(true);
      }
    };
    checkPushSupport();
  }, []);

  // Charger les notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await notificationService.getByUser(user.id, { limit: 50 });
      if (result.success) {
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Charger les préférences
  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    
    const result = await notificationService.getPreferences(user.id);
    if (result.success && result.preferences) {
      setPreferences(result.preferences);
    }
  }, [user]);

  // Charger les données à la connexion
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      fetchPreferences();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
    }
  }, [isAuthenticated, user, fetchNotifications, fetchPreferences]);

  // Écouter les nouvelles notifications en temps réel
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Afficher une notification toast si l'app est au premier plan
          if (document.visibilityState === 'visible') {
            // On pourrait utiliser toast.info ici
            console.log('Nouvelle notification:', newNotification.title);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Marquer comme lue
  const markAsRead = async (notificationId: string) => {
    const result = await notificationService.markAsRead(notificationId);
    if (result.success) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    if (!user) return;
    
    const result = await notificationService.markAllAsRead(user.id);
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId: string) => {
    const result = await notificationService.delete(notificationId);
    if (result.success) {
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  // Mettre à jour les préférences
  const updatePreferences = async (prefs: Partial<NotificationPreferences>) => {
    if (!user) return;
    
    const result = await notificationService.updatePreferences(user.id, prefs);
    if (result.success) {
      setPreferences(prev => prev ? { ...prev, ...prefs } : null);
    }
  };

  // Demander la permission Push
  const requestPushPermission = async (): Promise<boolean> => {
    if (!isPushSupported || !user) return false;

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Enregistrer le service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // S'abonner aux notifications push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        // Sauvegarder l'abonnement
        await notificationService.savePushSubscription(user.id, subscription.toJSON());
        
        setIsPushEnabled(true);
        await updatePreferences({ push_enabled: true });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de l\'activation des notifications push:', error);
      return false;
    }
  };

  // Désactiver les notifications Push
  const disablePush = async () => {
    if (!user) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await notificationService.removePushSubscription(user.id, subscription.endpoint);
        }
      }
      
      setIsPushEnabled(false);
      await updatePreferences({ push_enabled: false });
    } catch (error) {
      console.error('Erreur lors de la désactivation des notifications push:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        preferences,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        updatePreferences,
        isPushSupported,
        isPushEnabled,
        requestPushPermission,
        disablePush,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
