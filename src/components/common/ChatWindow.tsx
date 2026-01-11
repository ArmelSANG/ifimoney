'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Image as ImageIcon,
  X,
  Loader2,
  MoreVertical,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { ChatMessage } from './ChatMessage';
import { cn } from '@/utils';
import type { Conversation, ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatWindowProps {
  conversation: Conversation;
  messages: ChatMessageType[];
  currentUserId: string;
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file', fileUrl?: string, fileName?: string) => Promise<void>;
  onBack: () => void;
  onClose: () => void;
  isSending: boolean;
  isLoading: boolean;
}

export function ChatWindow({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  onClose,
  isSending,
  isLoading,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Déterminer l'autre participant
  const otherParticipant =
    conversation.participant1?.id === currentUserId
      ? conversation.participant2
      : conversation.participant1;

  // Scroll automatique vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus sur l'input au montage
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Envoyer le message
  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const content = inputValue.trim();
    setInputValue('');
    await onSendMessage(content);
  };

  // Envoyer avec Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Grouper les messages par date
  const groupMessagesByDate = (messages: ChatMessageType[]) => {
    const groups: { date: string; messages: ChatMessageType[] }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-dark-100 dark:border-dark-800 bg-white dark:bg-dark-900">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-dark-600 dark:text-dark-400" />
        </button>

        <Avatar
          src={otherParticipant?.profile_photo_url}
          name={otherParticipant?.full_name || 'U'}
          size="sm"
        />

        <div className="flex-1 min-w-0">
          <p className="font-medium text-dark-900 dark:text-white truncate">
            {otherParticipant?.full_name}
          </p>
          <p className="text-xs text-dark-400 capitalize">
            {otherParticipant?.role}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors md:hidden"
        >
          <X className="w-5 h-5 text-dark-600 dark:text-dark-400" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-dark-50 dark:bg-dark-950">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Avatar
              src={otherParticipant?.profile_photo_url}
              name={otherParticipant?.full_name || 'U'}
              size="lg"
            />
            <p className="mt-4 font-medium text-dark-900 dark:text-white">
              {otherParticipant?.full_name}
            </p>
            <p className="text-sm text-dark-400 mt-1">
              Commencez la conversation !
            </p>
          </div>
        ) : (
          <>
            {messageGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Séparateur de date */}
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 text-xs text-dark-500 bg-dark-100 dark:bg-dark-800 rounded-full">
                    {group.date}
                  </span>
                </div>

                {/* Messages du groupe */}
                {group.messages.map((message, messageIndex) => {
                  const isOwnMessage = message.sender_id === currentUserId;
                  const showAvatar =
                    messageIndex === 0 ||
                    group.messages[messageIndex - 1].sender_id !== message.sender_id;

                  return (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isOwnMessage={isOwnMessage}
                      showAvatar={showAvatar}
                    />
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-dark-100 dark:border-dark-800 bg-white dark:bg-dark-900">
        <div className="flex items-center gap-2">
          {/* Bouton pièce jointe (désactivé pour l'instant) */}
          {/* <button
            className="p-2 rounded-full hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
            title="Joindre un fichier"
          >
            <Paperclip className="w-5 h-5 text-dark-400" />
          </button> */}

          {/* Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Écrivez votre message..."
              className="w-full px-4 py-2.5 bg-dark-100 dark:bg-dark-800 rounded-full text-sm text-dark-900 dark:text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isSending}
            />
          </div>

          {/* Bouton envoyer */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className={cn(
              'p-2.5 rounded-full transition-all',
              inputValue.trim() && !isSending
                ? 'bg-primary-500 text-white hover:bg-primary-600'
                : 'bg-dark-100 dark:bg-dark-800 text-dark-400'
            )}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
