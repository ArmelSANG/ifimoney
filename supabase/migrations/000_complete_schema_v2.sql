-- ============================================
-- SCRIPT COMPLET ifiMoney v2
-- ============================================

-- ÉTAPE 1: Supprimer les tables existantes
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS cgu_acceptances CASCADE;
DROP TABLE IF EXISTS cgu CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS tontine_participations CASCADE;
DROP TABLE IF EXISTS tontines CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS tontiniers CASCADE;
DROP TABLE IF EXISTS registration_requests CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ÉTAPE 2: Supprimer les fonctions
DROP FUNCTION IF EXISTS get_or_create_conversation(VARCHAR, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_unread_count(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_total_unread_messages(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE;
DROP FUNCTION IF EXISTS create_notification(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS notify_tontinier_clients(UUID, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS notify_tontine_participants(UUID, TEXT, TEXT, TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_notifications(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS notify_on_transaction_validation() CASCADE;
DROP FUNCTION IF EXISTS notify_tontinier_new_transaction() CASCADE;
DROP FUNCTION IF EXISTS notify_client_added_to_tontine() CASCADE;
DROP FUNCTION IF EXISTS generate_client_identifier() CASCADE;
DROP FUNCTION IF EXISTS generate_tontinier_identifier() CASCADE;
DROP FUNCTION IF EXISTS generate_tontine_identifier() CASCADE;
DROP FUNCTION IF EXISTS get_admin_stats() CASCADE;
DROP FUNCTION IF EXISTS check_tontinier_expiration() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS increment_tontine_collected(UUID, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS increment_tontine_withdrawn(UUID, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS increment_participation_deposited(UUID, UUID, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS increment_participation_withdrawn(UUID, UUID, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_tontinier() CASCADE;
DROP FUNCTION IF EXISTS is_client() CASCADE;
DROP FUNCTION IF EXISTS get_client_tontinier_id() CASCADE;

-- ÉTAPE 3: Supprimer les séquences
DROP SEQUENCE IF EXISTS client_id_seq CASCADE;
DROP SEQUENCE IF EXISTS tontinier_id_seq CASCADE;
DROP SEQUENCE IF EXISTS tontine_id_seq CASCADE;

-- ÉTAPE 4: Supprimer les types ENUM
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS account_status CASCADE;
DROP TYPE IF EXISTS tontine_type CASCADE;
DROP TYPE IF EXISTS identity_doc_type CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS tontine_status CASCADE;
DROP TYPE IF EXISTS registration_status CASCADE;
DROP TYPE IF EXISTS participation_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;

-- ============================================
-- CRÉATION DE LA BASE DE DONNÉES
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'tontinier', 'client');
CREATE TYPE account_status AS ENUM ('pending', 'active', 'suspended', 'expired', 'rejected');
CREATE TYPE tontine_type AS ENUM ('classique', 'flexible', 'terme');
CREATE TYPE identity_doc_type AS ENUM ('cni', 'passport', 'permis', 'carte_consulaire');
CREATE TYPE transaction_status AS ENUM ('pending', 'validated', 'rejected', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal');
CREATE TYPE tontine_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE registration_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE participation_status AS ENUM ('active', 'suspended', 'withdrawn');
CREATE TYPE payment_method AS ENUM ('cash', 'mobile_money');

-- TABLE: users
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    whatsapp TEXT NOT NULL,
    full_name TEXT NOT NULL,
    profile_photo_url TEXT,
    role user_role NOT NULL,
    status account_status DEFAULT 'pending',
    cgu_accepted BOOLEAN DEFAULT FALSE,
    cgu_accepted_at TIMESTAMPTZ,
    cgu_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_whatsapp ON users(whatsapp);

-- TABLE: tontiniers
CREATE TABLE tontiniers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    identifier TEXT UNIQUE NOT NULL,
    identity_doc_type identity_doc_type NOT NULL,
    identity_doc_url TEXT NOT NULL,
    expiration_date TIMESTAMPTZ NOT NULL,
    suspended_at TIMESTAMPTZ,
    suspension_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_tontiniers_identifier ON tontiniers(identifier);
CREATE INDEX idx_tontiniers_expiration ON tontiniers(expiration_date);

-- TABLE: clients
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    identifier TEXT UNIQUE NOT NULL,
    tontinier_id UUID REFERENCES users(id),
    desired_tontine_type tontine_type,
    desired_mise DECIMAL(15, 2),
    desired_objective TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_clients_identifier ON clients(identifier);
CREATE INDEX idx_clients_tontinier ON clients(tontinier_id);

-- TABLE: registration_requests
CREATE TABLE registration_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    whatsapp TEXT NOT NULL,
    full_name TEXT NOT NULL,
    profile_photo_url TEXT NOT NULL,
    role user_role NOT NULL CHECK (role IN ('tontinier', 'client')),
    status registration_status DEFAULT 'pending',
    identity_doc_type identity_doc_type,
    identity_doc_url TEXT,
    tontinier_id UUID REFERENCES users(id),
    desired_tontine_type tontine_type,
    desired_mise DECIMAL(15, 2),
    desired_objective TEXT,
    initial_expiration_days INTEGER,
    rejection_reason TEXT,
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_registration_status ON registration_requests(status);
CREATE INDEX idx_registration_created ON registration_requests(created_at DESC);

-- TABLE: tontines
CREATE TABLE tontines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type tontine_type NOT NULL,
    mise DECIMAL(15, 2) NOT NULL,
    currency TEXT DEFAULT 'XOF',
    start_date DATE NOT NULL,
    end_date DATE,
    cycle_days INTEGER NOT NULL DEFAULT 30,
    tontinier_id UUID NOT NULL REFERENCES users(id),
    status tontine_status DEFAULT 'draft',
    total_collected DECIMAL(15, 2) DEFAULT 0,
    total_withdrawn DECIMAL(15, 2) DEFAULT 0,
    identifier_history JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tontines_identifier ON tontines(identifier);
CREATE INDEX idx_tontines_tontinier ON tontines(tontinier_id);
CREATE INDEX idx_tontines_status ON tontines(status);
CREATE INDEX idx_tontines_type ON tontines(type);

-- TABLE: tontine_participations
CREATE TABLE tontine_participations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tontine_id UUID NOT NULL REFERENCES tontines(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    status participation_status DEFAULT 'active',
    total_deposited DECIMAL(15, 2) DEFAULT 0,
    total_withdrawn DECIMAL(15, 2) DEFAULT 0,
    last_deposit_at TIMESTAMPTZ,
    UNIQUE(tontine_id, client_id)
);

CREATE INDEX idx_participations_tontine ON tontine_participations(tontine_id);
CREATE INDEX idx_participations_client ON tontine_participations(client_id);

-- TABLE: transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type transaction_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency TEXT DEFAULT 'XOF',
    status transaction_status DEFAULT 'pending',
    tontine_id UUID NOT NULL REFERENCES tontines(id),
    client_id UUID NOT NULL REFERENCES users(id),
    tontinier_id UUID NOT NULL REFERENCES users(id),
    payment_method payment_method NOT NULL,
    proof_url TEXT,
    notes TEXT,
    validated_at TIMESTAMPTZ,
    validated_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_tontine ON transactions(tontine_id);
CREATE INDEX idx_transactions_client ON transactions(client_id);
CREATE INDEX idx_transactions_tontinier ON transactions(tontinier_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

-- TABLE: cgu
CREATE TABLE cgu (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_cgu_active ON cgu(is_active);

-- TABLE: cgu_acceptances
CREATE TABLE cgu_acceptances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cgu_id UUID NOT NULL REFERENCES cgu(id),
    cgu_version TEXT NOT NULL,
    accepted_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX idx_cgu_acceptances_user ON cgu_acceptances(user_id);

-- TABLE: audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- TABLE: notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    data JSONB DEFAULT '{}',
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- TABLE: notification_preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    deposit_notifications BOOLEAN DEFAULT TRUE,
    withdrawal_notifications BOOLEAN DEFAULT TRUE,
    reminder_notifications BOOLEAN DEFAULT TRUE,
    system_notifications BOOLEAN DEFAULT TRUE,
    reminder_days_before INTEGER DEFAULT 2,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: push_subscriptions
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- TABLE: conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('client_tontinier', 'tontinier_admin')),
    participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant1_id, participant2_id)
);

CREATE INDEX idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);

-- TABLE: chat_messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(10) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    file_url TEXT,
    file_name VARCHAR(255),
    status VARCHAR(10) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);

-- ============================================
-- SÉQUENCES
-- ============================================
CREATE SEQUENCE client_id_seq START 10000;
CREATE SEQUENCE tontinier_id_seq START 10000;
CREATE SEQUENCE tontine_id_seq START 100000;

-- ============================================
-- FONCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION generate_client_identifier() RETURNS TEXT AS $$
BEGIN RETURN 'C' || nextval('client_id_seq')::TEXT; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_tontinier_identifier() RETURNS TEXT AS $$
BEGIN RETURN 'T' || nextval('tontinier_id_seq')::TEXT; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_tontine_identifier() RETURNS TEXT AS $$
BEGIN RETURN nextval('tontine_id_seq')::TEXT; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_role() RETURNS user_role AS $$
BEGIN RETURN (SELECT role FROM users WHERE id = auth.uid()); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN RETURN get_user_role() = 'admin'; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_tontinier() RETURNS BOOLEAN AS $$
BEGIN RETURN get_user_role() = 'tontinier'; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_client() RETURNS BOOLEAN AS $$
BEGIN RETURN get_user_role() = 'client'; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_client_tontinier_id() RETURNS UUID AS $$
BEGIN RETURN (SELECT tontinier_id FROM clients WHERE user_id = auth.uid()); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_or_create_conversation(p_type VARCHAR(20), p_user1_id UUID, p_user2_id UUID) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
    SELECT id INTO v_id FROM conversations
    WHERE (participant1_id = p_user1_id AND participant2_id = p_user2_id)
       OR (participant1_id = p_user2_id AND participant2_id = p_user1_id);
    IF v_id IS NULL THEN
        INSERT INTO conversations (type, participant1_id, participant2_id)
        VALUES (p_type, p_user1_id, p_user2_id) RETURNING id INTO v_id;
    END IF;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_unread_count(p_conversation_id UUID, p_user_id UUID) RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*)::INTEGER FROM chat_messages
            WHERE conversation_id = p_conversation_id AND sender_id != p_user_id AND status != 'read');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_total_unread_messages(p_user_id UUID) RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COALESCE(SUM(
        (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id AND m.sender_id != p_user_id AND m.status != 'read')
    ), 0)::INTEGER FROM conversations c WHERE c.participant1_id = p_user_id OR c.participant2_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_conversation_timestamp() RETURNS TRIGGER AS $$
BEGIN UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id; RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID, p_type TEXT, p_title TEXT, p_message TEXT,
    p_priority TEXT DEFAULT 'medium', p_data JSONB DEFAULT '{}', p_action_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, priority, data, action_url)
    VALUES (p_user_id, p_type, p_title, p_message, p_priority, p_data, p_action_url) RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_tontiniers_updated_at BEFORE UPDATE ON tontiniers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_tontines_updated_at BEFORE UPDATE ON tontines FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_update_conversation_timestamp AFTER INSERT ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontiniers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontine_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cgu ENABLE ROW LEVEL SECURITY;
ALTER TABLE cgu_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "admin_view_all_users" ON users FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "tontinier_view_clients" ON users FOR SELECT TO authenticated USING (is_tontinier() AND (id = auth.uid() OR id IN (SELECT user_id FROM clients WHERE tontinier_id = auth.uid())));
CREATE POLICY "client_view_self_and_tontinier" ON users FOR SELECT TO authenticated USING (is_client() AND (id = auth.uid() OR id = get_client_tontinier_id()));
CREATE POLICY "users_update_own" ON users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "admin_update_users" ON users FOR UPDATE TO authenticated USING (is_admin());

-- Tontiniers policies
CREATE POLICY "admin_view_tontiniers" ON tontiniers FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "tontinier_view_self" ON tontiniers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "client_view_tontinier" ON tontiniers FOR SELECT TO authenticated USING (is_client() AND user_id = get_client_tontinier_id());
CREATE POLICY "admin_manage_tontiniers" ON tontiniers FOR ALL TO authenticated USING (is_admin());

-- Clients policies
CREATE POLICY "admin_view_clients" ON clients FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "tontinier_view_own_clients" ON clients FOR SELECT TO authenticated USING (is_tontinier() AND tontinier_id = auth.uid());
CREATE POLICY "client_view_self" ON clients FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin_manage_clients" ON clients FOR ALL TO authenticated USING (is_admin());

-- Registration requests policies
CREATE POLICY "anyone_create_request" ON registration_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin_view_requests" ON registration_requests FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "admin_update_requests" ON registration_requests FOR UPDATE TO authenticated USING (is_admin());

-- Tontines policies
CREATE POLICY "admin_view_tontines" ON tontines FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "tontinier_view_own_tontines" ON tontines FOR SELECT TO authenticated USING (is_tontinier() AND tontinier_id = auth.uid());
CREATE POLICY "client_view_tontines" ON tontines FOR SELECT TO authenticated USING (is_client() AND id IN (SELECT tontine_id FROM tontine_participations WHERE client_id = auth.uid()));
CREATE POLICY "tontinier_manage_tontines" ON tontines FOR ALL TO authenticated USING (is_tontinier() AND tontinier_id = auth.uid()) WITH CHECK (is_tontinier() AND tontinier_id = auth.uid());
CREATE POLICY "admin_manage_tontines" ON tontines FOR ALL TO authenticated USING (is_admin());

-- Participations policies
CREATE POLICY "admin_view_participations" ON tontine_participations FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "tontinier_view_participations" ON tontine_participations FOR SELECT TO authenticated USING (is_tontinier() AND tontine_id IN (SELECT id FROM tontines WHERE tontinier_id = auth.uid()));
CREATE POLICY "client_view_participations" ON tontine_participations FOR SELECT TO authenticated USING (is_client() AND client_id = auth.uid());
CREATE POLICY "tontinier_manage_participations" ON tontine_participations FOR ALL TO authenticated USING (is_tontinier() AND tontine_id IN (SELECT id FROM tontines WHERE tontinier_id = auth.uid()));

-- Transactions policies
CREATE POLICY "admin_view_transactions" ON transactions FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "tontinier_view_transactions" ON transactions FOR SELECT TO authenticated USING (is_tontinier() AND tontinier_id = auth.uid());
CREATE POLICY "client_view_transactions" ON transactions FOR SELECT TO authenticated USING (is_client() AND client_id = auth.uid());
CREATE POLICY "tontinier_manage_transactions" ON transactions FOR ALL TO authenticated USING (is_tontinier() AND tontinier_id = auth.uid()) WITH CHECK (is_tontinier() AND tontinier_id = auth.uid());
CREATE POLICY "client_create_withdrawal" ON transactions FOR INSERT TO authenticated WITH CHECK (is_client() AND client_id = auth.uid() AND type = 'withdrawal');

-- CGU policies
CREATE POLICY "view_active_cgu" ON cgu FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "admin_manage_cgu" ON cgu FOR ALL TO authenticated USING (is_admin());

-- CGU acceptances policies
CREATE POLICY "view_own_acceptances" ON cgu_acceptances FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "create_own_acceptance" ON cgu_acceptances FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_view_acceptances" ON cgu_acceptances FOR SELECT TO authenticated USING (is_admin());

-- Audit logs policies
CREATE POLICY "admin_view_audit_logs" ON audit_logs FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "system_insert_audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Notifications policies
CREATE POLICY "users_view_own_notifications" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users_delete_own_notifications" ON notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "system_create_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (TRUE);

-- Notification preferences policies
CREATE POLICY "users_manage_own_preferences" ON notification_preferences FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Push subscriptions policies
CREATE POLICY "users_manage_own_push" ON push_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Conversations policies
CREATE POLICY "conversations_select_own" ON conversations FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);
CREATE POLICY "conversations_insert_own" ON conversations FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Chat messages policies
CREATE POLICY "messages_select_own" ON chat_messages FOR SELECT USING (conversation_id IN (SELECT id FROM conversations WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()));
CREATE POLICY "messages_insert_own" ON chat_messages FOR INSERT WITH CHECK (sender_id = auth.uid() AND conversation_id IN (SELECT id FROM conversations WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()));
CREATE POLICY "messages_update_status" ON chat_messages FOR UPDATE USING (sender_id != auth.uid() AND conversation_id IN (SELECT id FROM conversations WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()));

-- ============================================
-- STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CGU PAR DÉFAUT
-- ============================================

INSERT INTO cgu (version, content, effective_date, is_active) VALUES (
    '1.0',
    '<h2>Conditions Générales d''Utilisation de ifiMoney</h2><p><strong>Date d''effet : Janvier 2025</strong></p><h3>Article 1 - Objet</h3><p>Les présentes CGU régissent l''utilisation de la plateforme ifiMoney.</p><h3>Article 2 - Services</h3><p>ifiMoney permet la création et gestion de tontines, le suivi des cotisations et retraits.</p><h3>Article 3 - Contact</h3><p>Pour toute question : IFIAAS au +22967455462.</p>',
    CURRENT_DATE,
    TRUE
);

-- ============================================
-- REALTIME
-- ============================================

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE notifications; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE conversations; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- VÉRIFICATION
-- ============================================

SELECT 
    'Tables créées: ' || COUNT(*)::TEXT as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
