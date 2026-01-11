'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Plus,
  Users,
  Shield,
  Briefcase,
  User,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/services/chat';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';
import { Avatar } from './Avatar';
import { cn } from '@/utils';
import type { ChatParticipant, ConversationType } from '@/types/chat';

export function ChatWidget() {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    isLoading,
    isSending,
    totalUnread,
    isWidgetOpen,
    setWidgetOpen,
    showConversationList,
    setShowConversationList,
    loadConversations,
    openConversation,
    startConversation,
    sendMessage,
    closeConversation,
  } = useChat();

  const [showNewChat, setShowNewChat] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<ChatParticipant[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Ne pas afficher si pas d'utilisateur
  if (!user) return null;

  // Charger les contacts disponibles pour nouvelle conversation
  const loadAvailableContacts = async () => {
    setIsLoadingContacts(true);
    try {
      let contacts: ChatParticipant[] = [];

      if (user.role === 'client') {
        // Client: récupérer son tontinier
        const result = await chatService.getClientTontinier(user.id);
        if (result.success && result.tontinier) {
          contacts = [result.tontinier];
        }
      } else if (user.role === 'tontinier') {
        // Tontinier: récupérer ses clients + les admins
        const [clientsResult, adminsResult] = await Promise.all([
          chatService.getTontinierClients(user.id),
          chatService.getAdmins(),
        ]);
        if (clientsResult.success && clientsResult.clients) {
          contacts = [...contacts, ...clientsResult.clients];
        }
        if (adminsResult.success && adminsResult.admins) {
          contacts = [...contacts, ...adminsResult.admins];
        }
      } else if (user.role === 'admin') {
        // Admin: récupérer tous les tontiniers
        const result = await chatService.getAllTontiniers();
        if (result.success && result.tontiniers) {
          contacts = result.tontiniers;
        }
      }

      // Filtrer les contacts qui ont déjà une conversation
      const existingParticipantIds = conversations.map((c) => c.participant.id);
      contacts = contacts.filter((c) => !existingParticipantIds.includes(c.id));

      setAvailableContacts(contacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Démarrer une nouvelle conversation
  const handleStartConversation = async (contact: ChatParticipant) => {
    let type: ConversationType;
    
    if (user.role === 'client' || contact.role === 'client') {
      type = 'client_tontinier';
    } else {
      type = 'tontinier_admin';
    }

    await startConversation(type, contact.id);
    setShowNewChat(false);
  };

  // Ouvrir le panneau de nouvelle conversation
  const handleNewChat = () => {
    loadAvailableContacts();
    setShowNewChat(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-danger-500" />;
      case 'tontinier':
        return <Briefcase className="w-4 h-4 text-primary-500" />;
      default:
        return <User className="w-4 h-4 text-dark-400" />;
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setWidgetOpen(!isWidgetOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors',
          isWidgetOpen
            ? 'bg-dark-800 text-white'
            : 'bg-primary-500 text-white hover:bg-primary-600'
        )}
      >
        {isWidgetOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </>
        )}
      </motion.button>

      {/* Panneau de chat */}
      <AnimatePresence>
        {isWidgetOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] h-[500px] bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-dark-100 dark:border-dark-800"
          >
            {/* Header */}
            {showConversationList && !showNewChat && (
              <div className="flex items-center justify-between p-4 border-b border-dark-100 dark:border-dark-800">
                <h3 className="font-semibold text-dark-900 dark:text-white">
                  Messages
                </h3>
                <button
                  onClick={handleNewChat}
                  className="p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                  title="Nouvelle conversation"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Contenu */}
            <div className="flex-1 overflow-hidden">
              {/* Liste des conversations */}
              {showConversationList && !showNewChat && (
                <div className="h-full overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                  ) : (
                    <ChatList
                      conversations={conversations}
                      activeConversationId={activeConversation?.id}
                      onSelectConversation={openConversation}
                      currentUserRole={user.role}
                    />
                  )}
                </div>
              )}

              {/* Nouvelle conversation */}
              {showNewChat && (
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-3 p-4 border-b border-dark-100 dark:border-dark-800">
                    <button
                      onClick={() => setShowNewChat(false)}
                      className="p-1.5 rounded-full hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-dark-600 dark:text-dark-400" />
                    </button>
                    <h3 className="font-semibold text-dark-900 dark:text-white">
                      Nouvelle conversation
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {isLoadingContacts ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                      </div>
                    ) : availableContacts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        <Users className="w-12 h-12 text-dark-300 dark:text-dark-600 mb-3" />
                        <p className="text-dark-500 dark:text-dark-400">
                          Aucun contact disponible
                        </p>
                        <p className="text-sm text-dark-400 dark:text-dark-500 mt-1">
                          Vous avez déjà une conversation avec tous vos contacts
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-dark-100 dark:divide-dark-800">
                        {availableContacts.map((contact, index) => (
                          <motion.button
                            key={contact.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleStartConversation(contact)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-dark-50 dark:hover:bg-dark-800/50 transition-colors"
                          >
                            <Avatar
                              src={contact.profile_photo_url}
                              name={contact.full_name}
                              size="md"
                            />
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-dark-900 dark:text-white">
                                  {contact.full_name}
                                </span>
                                {getRoleIcon(contact.role)}
                              </div>
                              <p className="text-sm text-dark-400">
                                {contact.role === 'admin'
                                  ? 'Administrateur'
                                  : contact.role === 'tontinier'
                                  ? `Tontinier ${contact.identifier || ''}`
                                  : `Client ${contact.identifier || ''}`}
                              </p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fenêtre de conversation */}
              {!showConversationList && activeConversation && (
                <ChatWindow
                  conversation={activeConversation}
                  messages={messages}
                  currentUserId={user.id}
                  onSendMessage={sendMessage}
                  onBack={() => {
                    closeConversation();
                    setShowConversationList(true);
                  }}
                  onClose={() => setWidgetOpen(false)}
                  isSending={isSending}
                  isLoading={isLoading}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ChatWidget;
