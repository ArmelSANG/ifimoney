'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/contexts/NotificationContext';
import { Badge, Button, Loading } from '@/components/common';
import { NOTIFICATION_CONFIG } from '@/types/notifications';
import { formatRelativeTime } from '@/utils';
import { 
  Bell, 
  BellOff,
  Check, 
  CheckCheck, 
  Trash2, 
  X,
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

export function NotificationCenter() {
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

  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      setIsOpen(false);
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton de notification */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-dark-600 dark:text-dark-400" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-danger-500 text-white text-xs font-bold"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-dark-800 rounded-2xl shadow-xl border border-dark-100 dark:border-dark-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-100 dark:border-dark-700">
              <h3 className="font-semibold text-dark-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-5 h-5 text-primary-500" />
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showSettings 
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' 
                      : 'hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-500'
                  }`}
                  title="Paramètres"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Paramètres Push */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-dark-100 dark:border-dark-700 overflow-hidden"
                >
                  <div className="p-4 bg-dark-50 dark:bg-dark-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isPushEnabled ? (
                          <Bell className="w-5 h-5 text-success-500" />
                        ) : (
                          <BellOff className="w-5 h-5 text-dark-400" />
                        )}
                        <div>
                          <p className="font-medium text-dark-900 dark:text-white text-sm">
                            Notifications Push
                          </p>
                          <p className="text-xs text-dark-500">
                            {isPushEnabled 
                              ? 'Activées' 
                              : isPushSupported 
                                ? 'Désactivées' 
                                : 'Non supportées'}
                          </p>
                        </div>
                      </div>
                      {isPushSupported && (
                        <button
                          onClick={handleTogglePush}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            isPushEnabled 
                              ? 'bg-success-500' 
                              : 'bg-dark-300 dark:bg-dark-600'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              isPushEnabled ? 'left-7' : 'left-1'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Liste des notifications */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8">
                  <Loading variant="spinner" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-dark-300 dark:text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-500">Aucune notification</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification, index) => {
                    const config = NOTIFICATION_CONFIG[notification.type];
                    const IconComponent = iconMap[config.icon] || Info;
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`group relative p-4 border-b border-dark-100 dark:border-dark-700 hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors cursor-pointer ${
                          !notification.is_read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex gap-3">
                          {/* Icône */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[config.color]}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-dark-900 dark:text-white text-sm">
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500" />
                              )}
                            </div>
                            <p className="text-sm text-dark-600 dark:text-dark-400 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-dark-400 mt-1">
                              {formatRelativeTime(notification.created_at)}
                            </p>
                          </div>

                          {/* Actions (visible au hover) */}
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-dark-200 dark:hover:bg-dark-600 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4 text-dark-400 hover:text-danger-500" />
                            </button>
                          </div>
                        </div>

                        {/* Lien vers action */}
                        {notification.action_url && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-primary-600 dark:text-primary-400">
                            <span>Voir les détails</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-dark-100 dark:border-dark-700 bg-dark-50 dark:bg-dark-900">
                <Link
                  href="/notifications"
                  className="block text-center text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  Voir toutes les notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationCenter;
