'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { chatService } from '@/services/chat';
import { useAuth } from './AuthContext';
import type {
  ChatState,
  ChatAction,
  Conversation,
  ChatMessage,
  ConversationPreview,
  ConversationType,
} from '@/types/chat';

// État initial
const initialState: ChatState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoading: false,
  isSending: false,
  error: null,
  totalUnread: 0,
};

// Reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'SET_ACTIVE_CONVERSATION':
      return { ...state, activeConversation: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? action.payload : m
        ),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SENDING':
      return { ...state, isSending: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TOTAL_UNREAD':
      return { ...state, totalUnread: action.payload };
    case 'MARK_CONVERSATION_READ':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.payload ? { ...c, unreadCount: 0 } : c
        ),
        totalUnread: Math.max(0, state.totalUnread - (
          state.conversations.find((c) => c.id === action.payload)?.unreadCount || 0
        )),
      };
    case 'NEW_MESSAGE_RECEIVED':
      const { conversationId, message } = action.payload;
      // Mettre à jour la liste des conversations
      const updatedConversations = state.conversations.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessage: message.content,
            lastMessageTime: message.created_at,
            unreadCount: state.activeConversation?.id === conversationId 
              ? c.unreadCount 
              : c.unreadCount + 1,
          };
        }
        return c;
      });
      // Réordonner par date
      updatedConversations.sort((a, b) => 
        new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
      );
      return {
        ...state,
        conversations: updatedConversations,
        messages: state.activeConversation?.id === conversationId
          ? [...state.messages, message]
          : state.messages,
        totalUnread: state.activeConversation?.id === conversationId
          ? state.totalUnread
          : state.totalUnread + 1,
      };
    default:
      return state;
  }
}

// Interface du contexte
interface ChatContextType extends ChatState {
  // Actions
  loadConversations: () => Promise<void>;
  openConversation: (conversationId: string) => Promise<void>;
  startConversation: (type: ConversationType, otherUserId: string) => Promise<void>;
  sendMessage: (content: string, type?: 'text' | 'image' | 'file', fileUrl?: string, fileName?: string) => Promise<void>;
  markAsRead: () => Promise<void>;
  closeConversation: () => void;
  // État du widget
  isWidgetOpen: boolean;
  setWidgetOpen: (open: boolean) => void;
  showConversationList: boolean;
  setShowConversationList: (show: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [isWidgetOpen, setWidgetOpen] = React.useState(false);
  const [showConversationList, setShowConversationList] = React.useState(true);
  
  const { user } = useAuth();
  const subscriptionsRef = useRef<ReturnType<typeof chatService.subscribeToMessages>[]>([]);

  // Charger les conversations
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [conversationsResult, unreadResult] = await Promise.all([
        chatService.getUserConversations(user.id),
        chatService.getTotalUnreadCount(user.id),
      ]);

      if (conversationsResult.success && conversationsResult.conversations) {
        dispatch({ type: 'SET_CONVERSATIONS', payload: conversationsResult.conversations });
      }

      if (unreadResult.success) {
        dispatch({ type: 'SET_TOTAL_UNREAD', payload: unreadResult.count || 0 });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du chargement des conversations' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user?.id]);

  // Ouvrir une conversation
  const openConversation = useCallback(async (conversationId: string) => {
    if (!user?.id) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [conversationResult, messagesResult] = await Promise.all([
        chatService.getConversationById(conversationId),
        chatService.getMessages(conversationId),
      ]);

      if (conversationResult.success && conversationResult.conversation) {
        dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: conversationResult.conversation });
      }

      if (messagesResult.success && messagesResult.messages) {
        dispatch({ type: 'SET_MESSAGES', payload: messagesResult.messages });
      }

      // Marquer comme lu
      await chatService.markMessagesAsRead(conversationId, user.id);
      dispatch({ type: 'MARK_CONVERSATION_READ', payload: conversationId });

      // S'abonner aux nouveaux messages
      const subscription = chatService.subscribeToMessages(conversationId, (message) => {
        if (message.sender_id !== user.id) {
          dispatch({ type: 'ADD_MESSAGE', payload: message });
          // Marquer comme lu automatiquement si la conversation est ouverte
          chatService.markMessagesAsRead(conversationId, user.id);
        }
      });
      subscriptionsRef.current.push(subscription);

      setShowConversationList(false);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de l\'ouverture de la conversation' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user?.id]);

  // Démarrer une nouvelle conversation
  const startConversation = useCallback(async (type: ConversationType, otherUserId: string) => {
    if (!user?.id) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await chatService.getOrCreateConversation(type, user.id, otherUserId);

      if (result.success && result.conversation) {
        await openConversation(result.conversation.id);
        // Recharger la liste des conversations
        await loadConversations();
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Erreur lors de la création de la conversation' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de la création de la conversation' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user?.id, openConversation, loadConversations]);

  // Envoyer un message
  const sendMessage = useCallback(async (
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
    fileUrl?: string,
    fileName?: string
  ) => {
    if (!user?.id || !state.activeConversation) return;

    dispatch({ type: 'SET_SENDING', payload: true });
    try {
      const result = await chatService.sendMessage(
        state.activeConversation.id,
        user.id,
        content,
        type,
        fileUrl,
        fileName
      );

      if (result.success && result.message) {
        dispatch({ type: 'ADD_MESSAGE', payload: result.message });
        // Mettre à jour la preview de la conversation
        const updatedConversations = state.conversations.map((c) =>
          c.id === state.activeConversation?.id
            ? { ...c, lastMessage: content, lastMessageTime: result.message!.created_at }
            : c
        );
        dispatch({ type: 'SET_CONVERSATIONS', payload: updatedConversations });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Erreur lors de l\'envoi du message' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de l\'envoi du message' });
    } finally {
      dispatch({ type: 'SET_SENDING', payload: false });
    }
  }, [user?.id, state.activeConversation, state.conversations]);

  // Marquer comme lu
  const markAsRead = useCallback(async () => {
    if (!user?.id || !state.activeConversation) return;

    await chatService.markMessagesAsRead(state.activeConversation.id, user.id);
    dispatch({ type: 'MARK_CONVERSATION_READ', payload: state.activeConversation.id });
  }, [user?.id, state.activeConversation]);

  // Fermer la conversation
  const closeConversation = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: null });
    dispatch({ type: 'SET_MESSAGES', payload: [] });
    setShowConversationList(true);
    
    // Se désabonner des subscriptions
    subscriptionsRef.current.forEach((sub) => chatService.unsubscribe(sub));
    subscriptionsRef.current = [];
  }, []);

  // Charger les conversations au montage
  useEffect(() => {
    if (user?.id) {
      loadConversations();

      // S'abonner aux nouvelles conversations
      const subscription = chatService.subscribeToConversations(user.id, () => {
        loadConversations();
      });

      return () => {
        chatService.unsubscribe(subscription);
        subscriptionsRef.current.forEach((sub) => chatService.unsubscribe(sub));
      };
    }
  }, [user?.id, loadConversations]);

  // Écouter les nouveaux messages globalement pour le badge
  useEffect(() => {
    if (!user?.id) return;

    // Rafraîchir le compteur de non-lus périodiquement
    const interval = setInterval(async () => {
      const result = await chatService.getTotalUnreadCount(user.id);
      if (result.success) {
        dispatch({ type: 'SET_TOTAL_UNREAD', payload: result.count || 0 });
      }
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [user?.id]);

  const value: ChatContextType = {
    ...state,
    loadConversations,
    openConversation,
    startConversation,
    sendMessage,
    markAsRead,
    closeConversation,
    isWidgetOpen,
    setWidgetOpen,
    showConversationList,
    setShowConversationList,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;
