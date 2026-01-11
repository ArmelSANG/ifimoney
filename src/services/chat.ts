import { supabase, handleSupabaseError } from './supabase';
import type {
  Conversation,
  ChatMessage,
  ConversationPreview,
  ConversationType,
  ChatParticipant,
} from '@/types/chat';

export const chatService = {
  // ============================================
  // CONVERSATIONS
  // ============================================

  // Obtenir ou créer une conversation
  async getOrCreateConversation(
    type: ConversationType,
    userId1: string,
    userId2: string
  ): Promise<{ success: boolean; conversation?: Conversation; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_type: type,
        p_user1_id: userId1,
        p_user2_id: userId2,
      });

      if (error) throw error;

      // Récupérer la conversation complète
      const conversation = await this.getConversationById(data);
      return conversation;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer une conversation par ID
  async getConversationById(
    conversationId: string
  ): Promise<{ success: boolean; conversation?: Conversation; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant1:users!conversations_participant1_id_fkey(id, full_name, profile_photo_url, role),
          participant2:users!conversations_participant2_id_fkey(id, full_name, profile_photo_url, role)
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      return { success: true, conversation: data as unknown as Conversation };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer toutes les conversations d'un utilisateur
  async getUserConversations(
    userId: string
  ): Promise<{ success: boolean; conversations?: ConversationPreview[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant1:users!conversations_participant1_id_fkey(id, full_name, profile_photo_url, role),
          participant2:users!conversations_participant2_id_fkey(id, full_name, profile_photo_url, role)
        `)
        .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transformer en ConversationPreview
      const previews: ConversationPreview[] = await Promise.all(
        (data || []).map(async (conv: any) => {
          // Déterminer l'autre participant
          const isParticipant1 = conv.participant1_id === userId;
          const otherParticipant = isParticipant1 ? conv.participant2 : conv.participant1;

          // Récupérer le dernier message
          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Compter les messages non lus
          const { data: unreadData } = await supabase.rpc('get_unread_count', {
            p_conversation_id: conv.id,
            p_user_id: userId,
          });

          return {
            id: conv.id,
            type: conv.type as ConversationType,
            participant: {
              id: otherParticipant?.id || '',
              full_name: otherParticipant?.full_name || 'Utilisateur',
              profile_photo_url: otherParticipant?.profile_photo_url || null,
              role: otherParticipant?.role || 'client',
            } as ChatParticipant,
            lastMessage: lastMsg?.content || null,
            lastMessageTime: lastMsg?.created_at || conv.updated_at,
            unreadCount: unreadData || 0,
          };
        })
      );

      return { success: true, conversations: previews };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Récupérer le nombre total de messages non lus
  async getTotalUnreadCount(
    userId: string
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_total_unread_messages', {
        p_user_id: userId,
      });

      if (error) throw error;

      return { success: true, count: data || 0 };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // MESSAGES
  // ============================================

  // Récupérer les messages d'une conversation
  async getMessages(
    conversationId: string,
    limit: number = 50,
    before?: string
  ): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
    try {
      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users!chat_messages_sender_id_fkey(id, full_name, profile_photo_url, role)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Inverser pour avoir l'ordre chronologique
      const messages = (data || []).reverse() as unknown as ChatMessage[];

      return { success: true, messages };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Envoyer un message
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'system' = 'text',
    fileUrl?: string,
    fileName?: string
  ): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType,
          file_url: fileUrl || null,
          file_name: fileName || null,
          status: 'sent',
        })
        .select(`
          *,
          sender:users!chat_messages_sender_id_fkey(id, full_name, profile_photo_url, role)
        `)
        .single();

      if (error) throw error;

      return { success: true, message: data as unknown as ChatMessage };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Marquer les messages comme lus
  async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .neq('status', 'read');

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // FICHIERS
  // ============================================

  // Upload un fichier pour le chat
  async uploadFile(
    file: File,
    conversationId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${conversationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('chat-files').getPublicUrl(fileName);

      return { success: true, url: data.publicUrl };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // PARTICIPANTS DISPONIBLES
  // ============================================

  // Pour un client: récupérer son tontinier
  async getClientTontinier(
    clientUserId: string
  ): Promise<{ success: boolean; tontinier?: ChatParticipant; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          tontinier_id,
          tontiniers!clients_tontinier_id_fkey(
            user_id,
            identifier,
            users!tontiniers_user_id_fkey(id, full_name, profile_photo_url, role, status)
          )
        `)
        .eq('user_id', clientUserId)
        .single();

      if (error) throw error;

      const tontinierData = data?.tontiniers as any;
      const userData = tontinierData?.users;

      if (!userData) {
        return { success: false, error: 'Tontinier non trouvé' };
      }

      return {
        success: true,
        tontinier: {
          id: userData.id,
          full_name: userData.full_name,
          profile_photo_url: userData.profile_photo_url,
          role: 'tontinier',
          identifier: tontinierData.identifier,
          status: userData.status,
        },
      };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Pour un tontinier: récupérer ses clients
  async getTontinierClients(
    tontinierUserId: string
  ): Promise<{ success: boolean; clients?: ChatParticipant[]; error?: string }> {
    try {
      // D'abord récupérer l'ID du tontinier
      const { data: tontinierData, error: tontinierError } = await supabase
        .from('tontiniers')
        .select('id')
        .eq('user_id', tontinierUserId)
        .single();

      if (tontinierError) throw tontinierError;

      // Ensuite récupérer les clients
      const { data, error } = await supabase
        .from('clients')
        .select(`
          identifier,
          users!clients_user_id_fkey(id, full_name, profile_photo_url, role, status)
        `)
        .eq('tontinier_id', tontinierData.id);

      if (error) throw error;

      const clients: ChatParticipant[] = (data || []).map((client: any) => ({
        id: client.users.id,
        full_name: client.users.full_name,
        profile_photo_url: client.users.profile_photo_url,
        role: 'client' as const,
        identifier: client.identifier,
        status: client.users.status,
      }));

      return { success: true, clients };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Pour un tontinier: récupérer les admins
  async getAdmins(): Promise<{ success: boolean; admins?: ChatParticipant[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, profile_photo_url, role, status')
        .eq('role', 'admin')
        .eq('status', 'active');

      if (error) throw error;

      const admins: ChatParticipant[] = (data || []).map((admin: any) => ({
        id: admin.id,
        full_name: admin.full_name,
        profile_photo_url: admin.profile_photo_url,
        role: 'admin' as const,
        status: admin.status,
      }));

      return { success: true, admins };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // Pour un admin: récupérer tous les tontiniers
  async getAllTontiniers(): Promise<{ success: boolean; tontiniers?: ChatParticipant[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('tontiniers')
        .select(`
          identifier,
          users!tontiniers_user_id_fkey(id, full_name, profile_photo_url, role, status)
        `);

      if (error) throw error;

      const tontiniers: ChatParticipant[] = (data || []).map((t: any) => ({
        id: t.users.id,
        full_name: t.users.full_name,
        profile_photo_url: t.users.profile_photo_url,
        role: 'tontinier' as const,
        identifier: t.identifier,
        status: t.users.status,
      }));

      return { success: true, tontiniers };
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      return { success: false, error: supabaseError.message };
    }
  },

  // ============================================
  // SUBSCRIPTIONS REALTIME
  // ============================================

  // S'abonner aux nouveaux messages d'une conversation
  subscribeToMessages(
    conversationId: string,
    onMessage: (message: ChatMessage) => void
  ) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Récupérer le message complet avec les infos du sender
          const { data } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:users!chat_messages_sender_id_fkey(id, full_name, profile_photo_url, role)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            onMessage(data as unknown as ChatMessage);
          }
        }
      )
      .subscribe();
  },

  // S'abonner aux mises à jour de statut des messages
  subscribeToMessageStatus(
    conversationId: string,
    onStatusUpdate: (messageId: string, status: string) => void
  ) {
    return supabase
      .channel(`status:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onStatusUpdate(payload.new.id, payload.new.status);
        }
      )
      .subscribe();
  },

  // S'abonner aux nouvelles conversations
  subscribeToConversations(
    userId: string,
    onNewConversation: (conversation: Conversation) => void
  ) {
    return supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        async (payload) => {
          // Vérifier si l'utilisateur est participant
          if (payload.new.participant1_id === userId || payload.new.participant2_id === userId) {
            const result = await this.getConversationById(payload.new.id);
            if (result.success && result.conversation) {
              onNewConversation(result.conversation);
            }
          }
        }
      )
      .subscribe();
  },

  // Se désabonner d'un channel
  unsubscribe(channel: ReturnType<typeof supabase.channel>) {
    supabase.removeChannel(channel);
  },
};

export default chatService;
