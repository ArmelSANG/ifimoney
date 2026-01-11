'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Clock, FileText, Image as ImageIcon } from 'lucide-react';
import { Avatar } from './Avatar';
import { cn, formatRelativeTime } from '@/utils';
import type { ChatMessageProps } from '@/types/chat';

export function ChatMessage({ message, isOwnMessage, showAvatar = true }: ChatMessageProps) {
  const statusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <Clock className="w-3 h-3 text-dark-400" />;
      case 'delivered':
        return <Check className="w-3 h-3 text-dark-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-primary-500" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (message.message_type) {
      case 'image':
        return (
          <div className="relative">
            <img
              src={message.file_url || ''}
              alt="Image"
              className="max-w-[200px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.file_url || '', '_blank')}
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );
      case 'file':
        return (
          <a
            href={message.file_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 rounded-lg bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600 transition-colors"
          >
            <FileText className="w-5 h-5 text-primary-500" />
            <span className="text-sm truncate max-w-[150px]">
              {message.file_name || 'Fichier'}
            </span>
          </a>
        );
      case 'system':
        return (
          <p className="text-xs text-dark-500 italic text-center">
            {message.content}
          </p>
        );
      default:
        return <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  if (message.message_type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center my-2"
      >
        <div className="px-3 py-1 bg-dark-100 dark:bg-dark-800 rounded-full">
          {renderContent()}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-2 mb-3',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <Avatar
          src={message.sender?.profile_photo_url}
          name={message.sender?.full_name || 'U'}
          size="sm"
        />
      )}
      {!showAvatar && !isOwnMessage && <div className="w-8" />}

      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2',
          isOwnMessage
            ? 'bg-primary-500 text-white rounded-tr-sm'
            : 'bg-dark-100 dark:bg-dark-800 text-dark-900 dark:text-white rounded-tl-sm'
        )}
      >
        {/* Nom de l'expéditeur (si pas son propre message) */}
        {!isOwnMessage && showAvatar && (
          <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
            {message.sender?.full_name}
          </p>
        )}

        {/* Contenu */}
        {renderContent()}

        {/* Heure et statut */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            isOwnMessage ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={cn(
              'text-[10px]',
              isOwnMessage ? 'text-white/70' : 'text-dark-400'
            )}
          >
            {formatRelativeTime(message.created_at)}
          </span>
          {isOwnMessage && statusIcon()}
        </div>
      </div>
    </motion.div>
  );
}

export default ChatMessage;
