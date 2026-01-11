'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, User, Briefcase, Shield } from 'lucide-react';
import { Avatar } from './Avatar';
import { cn, formatRelativeTime } from '@/utils';
import type { ChatListProps, ConversationPreview } from '@/types/chat';

export function ChatList({
  conversations,
  activeConversationId,
  onSelectConversation,
  currentUserRole,
}: ChatListProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3 h-3 text-danger-500" />;
      case 'tontinier':
        return <Briefcase className="w-3 h-3 text-primary-500" />;
      default:
        return <User className="w-3 h-3 text-dark-400" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'tontinier':
        return 'Tontinier';
      default:
        return 'Client';
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
        <MessageCircle className="w-12 h-12 text-dark-300 dark:text-dark-600 mb-3" />
        <p className="text-dark-500 dark:text-dark-400 font-medium">
          Aucune conversation
        </p>
        <p className="text-sm text-dark-400 dark:text-dark-500 mt-1">
          {currentUserRole === 'client'
            ? 'Commencez une conversation avec votre tontinier'
            : currentUserRole === 'tontinier'
            ? 'Vos conversations avec les clients et l\'admin apparaîtront ici'
            : 'Vos conversations avec les tontiniers apparaîtront ici'}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-dark-100 dark:divide-dark-800">
      {conversations.map((conversation, index) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={conversation.id === activeConversationId}
          onClick={() => onSelectConversation(conversation.id)}
          getRoleIcon={getRoleIcon}
          getRoleLabel={getRoleLabel}
          index={index}
        />
      ))}
    </div>
  );
}

interface ConversationItemProps {
  conversation: ConversationPreview;
  isActive: boolean;
  onClick: () => void;
  getRoleIcon: (role: string) => React.ReactNode;
  getRoleLabel: (role: string) => string;
  index: number;
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
  getRoleIcon,
  getRoleLabel,
  index,
}: ConversationItemProps) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 text-left transition-colors',
        isActive
          ? 'bg-primary-50 dark:bg-primary-900/20'
          : 'hover:bg-dark-50 dark:hover:bg-dark-800/50'
      )}
    >
      {/* Avatar */}
      <div className="relative">
        <Avatar
          src={conversation.participant.profile_photo_url}
          name={conversation.participant.full_name}
          size="md"
        />
        {conversation.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 border-2 border-white dark:border-dark-900 rounded-full" />
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-medium text-dark-900 dark:text-white truncate">
              {conversation.participant.full_name}
            </span>
            {getRoleIcon(conversation.participant.role)}
          </div>
          {conversation.lastMessageTime && (
            <span className="text-[10px] text-dark-400 flex-shrink-0">
              {formatRelativeTime(conversation.lastMessageTime)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-dark-400 dark:text-dark-500">
              {getRoleLabel(conversation.participant.role)}
              {conversation.participant.identifier && ` • ${conversation.participant.identifier}`}
            </span>
          </div>
        </div>

        {conversation.lastMessage && (
          <p className="text-sm text-dark-500 dark:text-dark-400 truncate mt-1">
            {conversation.lastMessage}
          </p>
        )}
      </div>

      {/* Badge non lu */}
      {conversation.unreadCount > 0 && (
        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-primary-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
        </span>
      )}
    </motion.button>
  );
}

export default ChatList;
