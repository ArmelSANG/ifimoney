// ============================================
// TYPES POUR LE SYSTÈME DE CHAT
// ============================================

export type ConversationType = 'client_tontinier' | 'tontinier_admin';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Conversation {
  id: string;
  type: ConversationType;
  participant1_id: string; // Client ou Tontinier
  participant2_id: string; // Tontinier ou Admin
  created_at: string;
  updated_at: string;
  // Relations (populated)
  participant1?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
    role: string;
  };
  participant2?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
    role: string;
  };
  last_message?: ChatMessage;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  file_url?: string | null;
  file_name?: string | null;
  status: MessageStatus;
  read_at: string | null;
  created_at: string;
  // Relations (populated)
  sender?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
    role: string;
  };
}

export interface ChatParticipant {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  role: 'admin' | 'tontinier' | 'client';
  identifier?: string;
  status?: string;
}

// Pour l'affichage dans la liste des conversations
export interface ConversationPreview {
  id: string;
  type: ConversationType;
  participant: ChatParticipant;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
  isOnline?: boolean;
}

// État du chat
export interface ChatState {
  conversations: ConversationPreview[];
  activeConversation: Conversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  totalUnread: number;
}

// Actions du chat
export type ChatAction =
  | { type: 'SET_CONVERSATIONS'; payload: ConversationPreview[] }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: Conversation | null }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SENDING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TOTAL_UNREAD'; payload: number }
  | { type: 'MARK_CONVERSATION_READ'; payload: string }
  | { type: 'NEW_MESSAGE_RECEIVED'; payload: { conversationId: string; message: ChatMessage } };

// Props des composants
export interface ChatWidgetProps {
  userRole: 'admin' | 'tontinier' | 'client';
  userId: string;
}

export interface ChatWindowProps {
  conversation: Conversation;
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file') => Promise<void>;
  onClose: () => void;
  isSending: boolean;
}

export interface ChatMessageProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar?: boolean;
}

export interface ChatListProps {
  conversations: ConversationPreview[];
  activeConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  currentUserRole: 'admin' | 'tontinier' | 'client';
}

// Configuration du chat
export const CHAT_CONFIG = {
  maxMessageLength: 2000,
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  messagesPerPage: 50,
  typingIndicatorTimeout: 3000,
};

// Messages système
export const SYSTEM_MESSAGES = {
  conversation_started: 'La conversation a été créée',
  file_shared: 'Un fichier a été partagé',
  user_joined: 'a rejoint la conversation',
};
