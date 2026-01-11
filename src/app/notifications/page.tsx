'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout';
import { Card, Button, Badge, Loading } from '@/components/common';
import { NOTIFICATION_CONFIG } from '@/types/notifications';
import { formatRelativeTime } from '@/utils';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  UserPlus,
  ArrowUpCircle,
  ArrowDownCircle,
  Flag,
  XOctagon,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

// Mapping des icônes
const iconMap: Record<string, React.ElementType> = {
  'check-circle': CheckCircle2,
  'x-circle': XCircle,
  'alert-triangle': AlertTriangle,
  'info': Info,
  'clock': Clock,
  'user-plus': UserPlus,
  'arrow-up-circle': ArrowUpCircle,
  'arrow-down-circle': ArrowDownCircle,
  'bell': Bell,
  'flag': Flag,
  'x-octagon': XOctagon,
};

// Couleurs par variant
const colorClasses: Record<string, string> = {
  success: 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400',
  danger: 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400',
  warning: 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400',
  primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
  secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400',
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
};

type FilterType = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isPushSupported,
    isPushEnabled,
    requestPushPermission,
    disablePush,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>('all');
  const [showSettings, setShowSettings] = useState(false);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const handleTogglePush = async () => {
    if (isPushEnabled) {
      await disablePush();
    } else {
      await requestPushPermission();
    }
  };

  // Déterminer le rôle pour le layout
  const role = user?.role || 'client';

  return (
    <DashboardLayout requiredRole={role as 'admin' | 'tontinier' | 'client'}>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-description">
            {unreadCount > 0 
              ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Toutes vos notifications sont lues'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} leftIcon={<CheckCheck className="w-4 h-4" />}>
              Tout marquer comme lu
            </Button>
          )}
          <Button 
            variant={showSettings ? 'primary' : 'outline'} 
            size="sm" 
            onClick={() => setShowSettings(!showSettings)}
            leftIcon={<Settings className="w-4 h-4" />}
          >
            Paramètres
          </Button>
        </div>
      </div>

      {/* Paramètres Push */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isPushEnabled ? (
                  <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-success-600" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-dark-100 dark:bg-dark-800 flex items-center justify-center">
                    <BellOff className="w-6 h-6 text-dark-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-dark-900 dark:text-white">
                    Notifications Push
                  </h3>
                  <p className="text-sm text-dark-500">
                    {isPushEnabled 
                      ? 'Vous recevrez des notifications même quand l\'app est fermée'
                      : isPushSupported
                        ? 'Activez pour recevoir des notifications en temps réel'
                        : 'Non supporté par votre navigateur'
                    }
                  </p>
                </div>
              </div>
              {isPushSupported && (
                <button
                  onClick={handleTogglePush}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    isPushEnabled 
                      ? 'bg-success-500' 
                      : 'bg-dark-300 dark:bg-dark-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow ${
                      isPushEnabled ? 'left-8' : 'left-1'
                    }`}
                  />
                </button>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Filtres */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          size="sm"
          variant={filter === 'all' ? 'primary' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Toutes ({notifications.length})
        </Button>
        <Button
          size="sm"
          variant={filter === 'unread' ? 'primary' : 'outline'}
          onClick={() => setFilter('unread')}
        >
          Non lues ({unreadCount})
        </Button>
        <Button
          size="sm"
          variant={filter === 'read' ? 'primary' : 'outline'}
          onClick={() => setFilter('read')}
        >
          Lues ({notifications.length - unreadCount})
        </Button>
      </div>

      {/* Liste des notifications */}
      {isLoading ? (
        <Loading text="Chargement des notifications..." />
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-dark-300 dark:text-dark-600 mx-auto mb-4" />
            <h3 className="font-semibold text-dark-900 dark:text-white mb-2">
              Aucune notification
            </h3>
            <p className="text-dark-500">
              {filter === 'unread' 
                ? 'Toutes vos notifications ont été lues'
                : filter === 'read'
                  ? 'Aucune notification lue'
                  : 'Vous n\'avez pas encore de notifications'
              }
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification, index) => {
            const config = NOTIFICATION_CONFIG[notification.type];
            const IconComponent = iconMap[config.icon] || Info;

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    !notification.is_read ? 'border-l-4 border-l-primary-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-4">
                    {/* Icône */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[config.color]}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-dark-900 dark:text-white">
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <Badge variant="primary" size="sm">Nouveau</Badge>
                            )}
                          </div>
                          <p className="text-dark-600 dark:text-dark-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-sm text-dark-400 mt-2">
                            {formatRelativeTime(notification.created_at)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                              title="Marquer comme lu"
                            >
                              <Check className="w-5 h-5 text-success-500" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5 text-dark-400 hover:text-danger-500" />
                          </button>
                        </div>
                      </div>

                      {/* Lien action */}
                      {notification.action_url && (
                        <div className="flex items-center gap-1 mt-3 text-sm text-primary-600 dark:text-primary-400">
                          <span>Voir les détails</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
