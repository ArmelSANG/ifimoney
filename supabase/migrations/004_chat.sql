-- ============================================
-- MIGRATION 004: SYSTÈME DE CHAT
-- ============================================

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('client_tontinier', 'tontinier_admin')),
  participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte pour éviter les doublons de conversation
  UNIQUE(participant1_id, participant2_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(10) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  file_url TEXT,
  file_name VARCHAR(255),
  status VARCHAR(10) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_status ON chat_messages(status);

-- ============================================
-- FONCTIONS
-- ============================================

-- Fonction pour obtenir ou créer une conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_type VARCHAR(20),
  p_user1_id UUID,
  p_user2_id UUID
) RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Chercher une conversation existante (dans les deux sens)
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE (participant1_id = p_user1_id AND participant2_id = p_user2_id)
     OR (participant1_id = p_user2_id AND participant2_id = p_user1_id);
  
  -- Si pas trouvée, créer une nouvelle
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (type, participant1_id, participant2_id)
    VALUES (p_type, p_user1_id, p_user2_id)
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour compter les messages non lus
CREATE OR REPLACE FUNCTION get_unread_count(
  p_conversation_id UUID,
  p_user_id UUID
) RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM chat_messages
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND status != 'read'
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le total des messages non lus pour un utilisateur
CREATE OR REPLACE FUNCTION get_total_unread_messages(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(
      (SELECT COUNT(*) FROM chat_messages m 
       WHERE m.conversation_id = c.id 
         AND m.sender_id != p_user_id 
         AND m.status != 'read')
    ), 0)::INTEGER
    FROM conversations c
    WHERE c.participant1_id = p_user_id OR c.participant2_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at de la conversation
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================
-- POLITIQUES RLS (Row Level Security)
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres conversations
CREATE POLICY conversations_select_own ON conversations
  FOR SELECT
  USING (
    auth.uid() = participant1_id OR 
    auth.uid() = participant2_id
  );

-- Politique: Les utilisateurs peuvent créer des conversations où ils sont participants
CREATE POLICY conversations_insert_own ON conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = participant1_id OR 
    auth.uid() = participant2_id
  );

-- Politique: Les utilisateurs peuvent voir les messages de leurs conversations
CREATE POLICY messages_select_own ON chat_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
    )
  );

-- Politique: Les utilisateurs peuvent envoyer des messages dans leurs conversations
CREATE POLICY messages_insert_own ON chat_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations
      WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
    )
  );

-- Politique: Les utilisateurs peuvent mettre à jour le statut des messages qu'ils ont reçus
CREATE POLICY messages_update_status ON chat_messages
  FOR UPDATE
  USING (
    sender_id != auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations
      WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Ne peut mettre à jour que le statut et read_at
    sender_id != auth.uid()
  );

-- ============================================
-- REALTIME
-- ============================================

-- Activer Realtime pour les tables de chat
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ============================================
-- DONNÉES DE TEST (optionnel, à commenter en production)
-- ============================================

-- INSERT INTO conversations (type, participant1_id, participant2_id)
-- SELECT 'client_tontinier', c.user_id, c.tontinier_id
-- FROM clients c
-- LIMIT 5;
