-- ============================================
-- SCRIPT COMPLET ifiMoney - TOUT-EN-UN
-- Supprime tout et recrée la base de données
-- ============================================

-- ============================================
-- PARTIE 1: SUPPRESSION COMPLÈTE
-- ============================================

-- Désactiver les triggers temporairement
SET session_replication_role = 'replica';

-- Supprimer les triggers (avec gestion d'erreur si table n'existe pas)
DO $$ BEGIN DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON chat_messages; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trigger_notify_client_added_to_tontine ON tontine_participations; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trigger_notify_tontinier_new_transaction ON transactions; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trigger_notify_transaction_validation ON transactions; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trigger_users_updated_at ON users; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trigger_tontiniers_updated_at ON tontiniers; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trigger_clients_updated_at ON clients; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trigger_tontines_updated_at ON tontines; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP TRIGGER IF EXISTS trigger_transactions_updated_at ON transactions; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Supprimer les tables (ordre important pour les foreign keys)
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

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS get_or_create_conversation CASCADE;
DROP FUNCTION IF EXISTS get_unread_count CASCADE;
DROP FUNCTION IF EXISTS get_total_unread_messages CASCADE;
DROP FUNCTION IF EXISTS update_conversation_timestamp CASCADE;
DROP FUNCTION IF EXISTS create_notification CASCADE;
DROP FUNCTION IF EXISTS notify_tontinier_clients CASCADE;
DROP FUNCTION IF EXISTS notify_tontine_participants CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_notifications CASCADE;
DROP FUNCTION IF EXISTS notify_on_transaction_validation CASCADE;
DROP FUNCTION IF EXISTS notify_tontinier_new_transaction CASCADE;
DROP FUNCTION IF EXISTS notify_client_added_to_tontine CASCADE;
DROP FUNCTION IF EXISTS generate_client_identifier CASCADE;
DROP FUNCTION IF EXISTS generate_tontinier_identifier CASCADE;
DROP FUNCTION IF EXISTS generate_tontine_identifier CASCADE;
DROP FUNCTION IF EXISTS get_admin_stats CASCADE;
DROP FUNCTION IF EXISTS check_tontinier_expiration CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS increment_tontine_collected CASCADE;
DROP FUNCTION IF EXISTS increment_tontine_withdrawn CASCADE;
DROP FUNCTION IF EXISTS increment_participation_deposited CASCADE;
DROP FUNCTION IF EXISTS increment_participation_withdrawn CASCADE;
DROP FUNCTION IF EXISTS get_user_role CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS is_tontinier CASCADE;
DROP FUNCTION IF EXISTS is_client CASCADE;
DROP FUNCTION IF EXISTS get_client_tontinier_id CASCADE;

-- Supprimer les séquences
DROP SEQUENCE IF EXISTS client_id_seq CASCADE;
DROP SEQUENCE IF EXISTS tontinier_id_seq CASCADE;
DROP SEQUENCE IF EXISTS tontine_id_seq CASCADE;

-- Supprimer les types ENUM
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

-- Réactiver les triggers
SET session_replication_role = 'origin';

-- ============================================
-- PARTIE 2: CRÉATION DES TABLES (001)
-- ============================================

-- Enable UUID extension
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
    identifier TEXT UNIQUE NOT NULL CHECK (
        length(identifier) >= 3 AND 
        length(identifier) <= 20 AND 
        identifier ~ '^[A-Za-z0-9_-]+$'
    ),
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_terme_end_date CHECK (
        (type != 'terme') OR (type = 'terme' AND end_date IS NOT NULL)
    )
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

-- SEQUENCES
CREATE SEQUENCE client_id_seq START 10000;
CREATE SEQUENCE tontinier_id_seq START 10000;
CREATE SEQUENCE tontine_id_seq START 100000;

-- FUNCTIONS
CREATE OR REPLACE FUNCTION generate_client_identifier()
RETURNS TEXT AS $$
BEGIN
    RETURN 'C' || nextval('client_id_seq')::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_tontinier_identifier()
RETURNS TEXT AS $$
BEGIN
    RETURN 'T' || nextval('tontinier_id_seq')::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_tontine_identifier()
RETURNS TEXT AS $$
BEGIN
    RETURN nextval('tontine_id_seq')::TEXT;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
    total_mise DECIMAL,
    total_deposits DECIMAL,
    total_withdrawals DECIMAL,
    total_clients BIGINT,
    active_clients BIGINT,
    total_tontiniers BIGINT,
    active_tontiniers BIGINT,
    pending_requests BIGINT,
    total_tontines BIGINT,
    active_tontines BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(t.mise), 0)::DECIMAL as total_mise,
        COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'deposit' AND status = 'validated'), 0)::DECIMAL as total_deposits,
        COALESCE((SELECT SUM(amount) FROM transactions WHERE type = 'withdrawal' AND status = 'validated'), 0)::DECIMAL as total_withdrawals,
        (SELECT COUNT(*) FROM users WHERE role = 'client')::BIGINT as total_clients,
        (SELECT COUNT(*) FROM users WHERE role = 'client' AND status = 'active')::BIGINT as active_clients,
        (SELECT COUNT(*) FROM users WHERE role = 'tontinier')::BIGINT as total_tontiniers,
        (SELECT COUNT(*) FROM users WHERE role = 'tontinier' AND status = 'active')::BIGINT as active_tontiniers,
        (SELECT COUNT(*) FROM registration_requests WHERE status = 'pending')::BIGINT as pending_requests,
        (SELECT COUNT(*) FROM tontines)::BIGINT as total_tontines,
        (SELECT COUNT(*) FROM tontines WHERE status = 'active')::BIGINT as active_tontines
    FROM tontines t;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_tontine_collected(p_tontine_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE tontines 
    SET total_collected = total_collected + p_amount,
        updated_at = NOW()
    WHERE id = p_tontine_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_tontine_withdrawn(p_tontine_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE tontines 
    SET total_withdrawn = total_withdrawn + p_amount,
        updated_at = NOW()
    WHERE id = p_tontine_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_participation_deposited(p_tontine_id UUID, p_client_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE tontine_participations 
    SET total_deposited = total_deposited + p_amount,
        last_deposit_at = NOW()
    WHERE tontine_id = p_tontine_id AND client_id = p_client_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_participation_withdrawn(p_tontine_id UUID, p_client_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE tontine_participations 
    SET total_withdrawn = total_withdrawn + p_amount
    WHERE tontine_id = p_tontine_id AND client_id = p_client_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_tontinier_expiration()
RETURNS VOID AS $$
BEGIN
    UPDATE users u
    SET status = 'expired', updated_at = NOW()
    FROM tontiniers t
    WHERE u.id = t.user_id
    AND u.status = 'active'
    AND t.expiration_date < NOW()
    AND t.suspended_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_tontiniers_updated_at
    BEFORE UPDATE ON tontiniers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_tontines_updated_at
    BEFORE UPDATE ON tontines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- INSERT DEFAULT CGU
INSERT INTO cgu (version, content, effective_date, is_active) VALUES (
    '1.0',
    '<h2>Conditions Générales d''Utilisation de ifiMoney</h2>
    <p><strong>Date d''effet : Janvier 2025</strong></p>
    
    <h3>Article 1 - Objet</h3>
    <p>Les présentes Conditions Générales d''Utilisation (CGU) régissent l''utilisation de la plateforme ifiMoney, service de gestion de tontine digitale.</p>
    
    <h3>Article 2 - Acceptation</h3>
    <p>L''utilisation de la plateforme implique l''acceptation pleine et entière des présentes CGU. Tout utilisateur doit accepter ces conditions avant de pouvoir accéder aux services.</p>
    
    <h3>Article 3 - Services</h3>
    <p>ifiMoney permet :</p>
    <ul>
        <li>La création et la gestion de tontines</li>
        <li>Le suivi des cotisations et des retraits</li>
        <li>La traçabilité complète des opérations</li>
    </ul>
    
    <h3>Article 4 - Responsabilités</h3>
    <p>Chaque utilisateur est responsable de :</p>
    <ul>
        <li>La confidentialité de ses identifiants</li>
        <li>L''exactitude des informations fournies</li>
        <li>Le respect des engagements de cotisation</li>
    </ul>
    
    <h3>Article 5 - Protection des données</h3>
    <p>ifiMoney s''engage à protéger les données personnelles de ses utilisateurs conformément aux réglementations en vigueur.</p>
    
    <h3>Article 6 - Modification</h3>
    <p>ifiMoney se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés de toute modification et devront accepter les nouvelles conditions pour continuer à utiliser le service.</p>
    
    <h3>Article 7 - Contact</h3>
    <p>Pour toute question concernant ces CGU, contactez IFIAAS au +22967455462.</p>',
    CURRENT_DATE,
    TRUE
);

-- ============================================
-- PARTIE 3: RLS POLICIES (002)
-- ============================================

-- Enable RLS on all tables
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

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_tontinier()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'tontinier';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_client()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'client';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_client_tontinier_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT tontinier_id FROM clients WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS POLICIES
CREATE POLICY "admin_view_all_users" ON users
    FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "tontinier_view_clients" ON users
    FOR SELECT TO authenticated
    USING (is_tontinier() AND (id = auth.uid() OR id IN (SELECT user_id FROM clients WHERE tontinier_id = auth.uid())));

CREATE POLICY "client_view_self_and_tontinier" ON users
    FOR SELECT TO authenticated
    USING (is_client() AND (id = auth.uid() OR id = get_client_tontinier_id()));

CREATE POLICY "users_update_own" ON users
    FOR UPDATE TO authenticated
    USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "admin_update_users" ON users
    FOR UPDATE TO authenticated USING (is_admin());

-- TONTINIERS POLICIES
CREATE POLICY "admin_view_tontiniers" ON tontiniers
    FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "tontinier_view_self" ON tontiniers
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "client_view_tontinier" ON tontiniers
    FOR SELECT TO authenticated USING (is_client() AND user_id = get_client_tontinier_id());

CREATE POLICY "admin_manage_tontiniers" ON tontiniers
    FOR ALL TO authenticated USING (is_admin());

-- CLIENTS POLICIES
CREATE POLICY "admin_view_clients" ON clients
    FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "tontinier_view_clients" ON clients
    FOR SELECT TO authenticated USING (is_tontinier() AND tontinier_id = auth.uid());

CREATE POLICY "client_view_self" ON clients
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "admin_manage_clients" ON clients
    FOR ALL TO authenticated USING (is_admin());

-- REGISTRATION REQUESTS POLICIES
CREATE POLICY "anyone_create_request" ON registration_requests
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "admin_view_requests" ON registration_requests
    FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "admin_update_requests" ON registration_requests
    FOR UPDATE TO authenticated USING (is_admin());

-- TONTINES POLICIES
CREATE POLICY "admin_view_tontines" ON tontines
    FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "tontinier_view_tontines" ON tontines
    FOR SELECT TO authenticated USING (is_tontinier() AND tontinier_id = auth.uid());

CREATE POLICY "client_view_tontines" ON tontines
    FOR SELECT TO authenticated
    USING (is_client() AND id IN (SELECT tontine_id FROM tontine_participations WHERE client_id = auth.uid()));

CREATE POLICY "tontinier_manage_tontines" ON tontines
    FOR ALL TO authenticated
    USING (is_tontinier() AND tontinier_id = auth.uid())
    WITH CHECK (is_tontinier() AND tontinier_id = auth.uid());

CREATE POLICY "admin_manage_tontines" ON tontines
    FOR ALL TO authenticated USING (is_admin());

-- TONTINE PARTICIPATIONS POLICIES
CREATE POLICY "admin_view_participations" ON tontine_participations
    FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "tontinier_view_participations" ON tontine_participations
    FOR SELECT TO authenticated
    USING (is_tontinier() AND tontine_id IN (SELECT id FROM tontines WHERE tontinier_id = auth.uid()));

CREATE POLICY "client_view_participations" ON tontine_participations
    FOR SELECT TO authenticated USING (is_client() AND client_id = auth.uid());

CREATE POLICY "tontinier_manage_participations" ON tontine_participations
    FOR ALL TO authenticated
    USING (is_tontinier() AND tontine_id IN (SELECT id FROM tontines WHERE tontinier_id = auth.uid()));

-- TRANSACTIONS POLICIES
CREATE POLICY "admin_view_transactions" ON transactions
    FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "tontinier_view_transactions" ON transactions
    FOR SELECT TO authenticated USING (is_tontinier() AND tontinier_id = auth.uid());

CREATE POLICY "client_view_transactions" ON transactions
    FOR SELECT TO authenticated USING (is_client() AND client_id = auth.uid());

CREATE POLICY "tontinier_manage_transactions" ON transactions
    FOR ALL TO authenticated
    USING (is_tontinier() AND tontinier_id = auth.uid())
    WITH CHECK (is_tontinier() AND tontinier_id = auth.uid());

CREATE POLICY "client_create_withdrawal" ON transactions
    FOR INSERT TO authenticated
    WITH CHECK (is_client() AND client_id = auth.uid() AND type = 'withdrawal');

-- CGU POLICIES
CREATE POLICY "view_active_cgu" ON cgu
    FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "admin_manage_cgu" ON cgu
    FOR ALL TO authenticated USING (is_admin());

-- CGU ACCEPTANCES POLICIES
CREATE POLICY "view_own_acceptances" ON cgu_acceptances
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "create_own_acceptance" ON cgu_acceptances
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_view_acceptances" ON cgu_acceptances
    FOR SELECT TO authenticated USING (is_admin());

-- AUDIT LOGS POLICIES
CREATE POLICY "admin_view_audit_logs" ON audit_logs
    FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "system_insert_audit_logs" ON audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- STORAGE
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'authenticated_upload') THEN
        CREATE POLICY "authenticated_upload" ON storage.objects
            FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read') THEN
        CREATE POLICY "public_read" ON storage.objects
            FOR SELECT TO public USING (bucket_id = 'documents');
    END IF;
END $$;

-- ============================================
-- PARTIE 4: NOTIFICATIONS (003)
-- ============================================

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
CREATE INDEX idx_notifications_type ON notifications(type);

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

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    keys JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_notifications" ON notifications
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_update_own_notifications" ON notifications
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_delete_own_notifications" ON notifications
    FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "system_create_notifications" ON notifications
    FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "users_manage_own_preferences" ON notification_preferences
    FOR ALL TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_manage_own_push" ON push_subscriptions
    FOR ALL TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notification functions
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_priority TEXT DEFAULT 'medium',
    p_data JSONB DEFAULT '{}',
    p_action_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, priority, data, action_url)
    VALUES (p_user_id, p_type, p_title, p_message, p_priority, p_data, p_action_url)
    RETURNING id INTO v_notification_id;
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_tontinier_clients(
    p_tontinier_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_priority TEXT DEFAULT 'medium'
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_client RECORD;
BEGIN
    FOR v_client IN SELECT user_id FROM clients WHERE tontinier_id = p_tontinier_id
    LOOP
        INSERT INTO notifications (user_id, type, title, message, priority)
        VALUES (v_client.user_id, p_type, p_title, p_message, p_priority);
        v_count := v_count + 1;
    END LOOP;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION notify_tontine_participants(
    p_tontine_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_priority TEXT DEFAULT 'medium',
    p_exclude_user_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_participant RECORD;
BEGIN
    FOR v_participant IN 
        SELECT client_id FROM tontine_participations 
        WHERE tontine_id = p_tontine_id
        AND (p_exclude_user_id IS NULL OR client_id != p_exclude_user_id)
    LOOP
        INSERT INTO notifications (user_id, type, title, message, priority, data)
        VALUES (v_participant.client_id, p_type, p_title, p_message, p_priority, 
                jsonb_build_object('tontine_id', p_tontine_id));
        v_count := v_count + 1;
    END LOOP;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_old_notifications(p_days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL AND is_read = TRUE;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification triggers
CREATE OR REPLACE FUNCTION notify_on_transaction_validation()
RETURNS TRIGGER AS $$
DECLARE
    v_client_name TEXT;
    v_tontine_name TEXT;
    v_amount_formatted TEXT;
BEGIN
    SELECT u.full_name INTO v_client_name FROM users u WHERE u.id = NEW.client_id;
    SELECT t.name INTO v_tontine_name FROM tontines t WHERE t.id = NEW.tontine_id;
    v_amount_formatted := TO_CHAR(NEW.amount, 'FM999,999,999') || ' XOF';
    
    IF NEW.status = 'validated' AND OLD.status = 'pending' THEN
        IF NEW.type = 'deposit' THEN
            PERFORM create_notification(NEW.client_id, 'deposit_validated', 'Dépôt validé',
                'Votre dépôt de ' || v_amount_formatted || ' dans "' || v_tontine_name || '" a été validé.',
                'medium', jsonb_build_object('transaction_id', NEW.id, 'tontine_id', NEW.tontine_id), '/client/transactions');
        ELSIF NEW.type = 'withdrawal' THEN
            PERFORM create_notification(NEW.client_id, 'withdrawal_validated', 'Retrait validé',
                'Votre retrait de ' || v_amount_formatted || ' de "' || v_tontine_name || '" a été validé.',
                'medium', jsonb_build_object('transaction_id', NEW.id, 'tontine_id', NEW.tontine_id), '/client/transactions');
        END IF;
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        IF NEW.type = 'deposit' THEN
            PERFORM create_notification(NEW.client_id, 'deposit_rejected', 'Dépôt refusé',
                'Votre dépôt de ' || v_amount_formatted || ' dans "' || v_tontine_name || '" a été refusé.' ||
                CASE WHEN NEW.rejection_reason IS NOT NULL THEN ' Raison : ' || NEW.rejection_reason ELSE '' END,
                'high', jsonb_build_object('transaction_id', NEW.id, 'tontine_id', NEW.tontine_id), '/client/transactions');
        ELSIF NEW.type = 'withdrawal' THEN
            PERFORM create_notification(NEW.client_id, 'withdrawal_rejected', 'Retrait refusé',
                'Votre retrait de ' || v_amount_formatted || ' de "' || v_tontine_name || '" a été refusé.' ||
                CASE WHEN NEW.rejection_reason IS NOT NULL THEN ' Raison : ' || NEW.rejection_reason ELSE '' END,
                'high', jsonb_build_object('transaction_id', NEW.id, 'tontine_id', NEW.tontine_id), '/client/transactions');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_transaction_validation
    AFTER UPDATE ON transactions
    FOR EACH ROW
    WHEN (OLD.status = 'pending' AND NEW.status IN ('validated', 'rejected'))
    EXECUTE FUNCTION notify_on_transaction_validation();

CREATE OR REPLACE FUNCTION notify_tontinier_new_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_client_name TEXT;
    v_tontine_name TEXT;
    v_amount_formatted TEXT;
BEGIN
    SELECT u.full_name INTO v_client_name FROM users u WHERE u.id = NEW.client_id;
    SELECT t.name INTO v_tontine_name FROM tontines t WHERE t.id = NEW.tontine_id;
    v_amount_formatted := TO_CHAR(NEW.amount, 'FM999,999,999') || ' XOF';
    
    IF NEW.type = 'deposit' THEN
        PERFORM create_notification(NEW.tontinier_id, 'deposit_received', 'Nouveau dépôt reçu',
            v_client_name || ' a effectué un dépôt de ' || v_amount_formatted || ' dans "' || v_tontine_name || '".',
            'medium', jsonb_build_object('transaction_id', NEW.id, 'tontine_id', NEW.tontine_id, 'client_id', NEW.client_id), '/tontinier/transactions');
    ELSIF NEW.type = 'withdrawal' THEN
        PERFORM create_notification(NEW.tontinier_id, 'withdrawal_request', 'Nouvelle demande de retrait',
            v_client_name || ' demande un retrait de ' || v_amount_formatted || ' de "' || v_tontine_name || '".',
            'high', jsonb_build_object('transaction_id', NEW.id, 'tontine_id', NEW.tontine_id, 'client_id', NEW.client_id), '/tontinier/transactions');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_tontinier_new_transaction
    AFTER INSERT ON transactions
    FOR EACH ROW EXECUTE FUNCTION notify_tontinier_new_transaction();

CREATE OR REPLACE FUNCTION notify_client_added_to_tontine()
RETURNS TRIGGER AS $$
DECLARE
    v_tontine_name TEXT;
    v_mise_formatted TEXT;
BEGIN
    SELECT t.name, TO_CHAR(t.mise, 'FM999,999,999') || ' XOF'
    INTO v_tontine_name, v_mise_formatted
    FROM tontines t WHERE t.id = NEW.tontine_id;
    
    PERFORM create_notification(NEW.client_id, 'tontine_joined', 'Nouvelle tontine',
        'Vous avez été ajouté à la tontine "' || v_tontine_name || '" avec une mise de ' || v_mise_formatted || '.',
        'medium', jsonb_build_object('tontine_id', NEW.tontine_id), '/client/tontines');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_client_added_to_tontine
    AFTER INSERT ON tontine_participations
    FOR EACH ROW EXECUTE FUNCTION notify_client_added_to_tontine();

-- ============================================
-- PARTIE 5: CHAT (004)
-- ============================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('client_tontinier', 'tontinier_admin')),
    participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant1_id, participant2_id)
);

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

CREATE INDEX idx_conversations_participant1 ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON conversations(participant2_id);
CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_status ON chat_messages(status);

-- Chat functions
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_type VARCHAR(20),
    p_user1_id UUID,
    p_user2_id UUID
) RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    SELECT id INTO v_conversation_id FROM conversations
    WHERE (participant1_id = p_user1_id AND participant2_id = p_user2_id)
       OR (participant1_id = p_user2_id AND participant2_id = p_user1_id);
    
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (type, participant1_id, participant2_id)
        VALUES (p_type, p_user1_id, p_user2_id)
        RETURNING id INTO v_conversation_id;
    END IF;
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_unread_count(p_conversation_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*)::INTEGER FROM chat_messages
            WHERE conversation_id = p_conversation_id AND sender_id != p_user_id AND status != 'read');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_total_unread_messages(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COALESCE(SUM(
        (SELECT COUNT(*) FROM chat_messages m 
         WHERE m.conversation_id = c.id AND m.sender_id != p_user_id AND m.status != 'read')
    ), 0)::INTEGER FROM conversations c
    WHERE c.participant1_id = p_user_id OR c.participant2_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- Chat RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select_own" ON conversations
    FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "conversations_insert_own" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "messages_select_own" ON chat_messages
    FOR SELECT USING (conversation_id IN (
        SELECT id FROM conversations WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()));

CREATE POLICY "messages_insert_own" ON chat_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid() AND conversation_id IN (
        SELECT id FROM conversations WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()));

CREATE POLICY "messages_update_status" ON chat_messages
    FOR UPDATE USING (sender_id != auth.uid() AND conversation_id IN (
        SELECT id FROM conversations WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()));

-- ============================================
-- PARTIE 6: REALTIME
-- ============================================

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE notifications; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE conversations; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- FIN DU SCRIPT - SUCCÈS!
-- ============================================

SELECT '✅ Base de données ifiMoney créée avec succès!' as message;
