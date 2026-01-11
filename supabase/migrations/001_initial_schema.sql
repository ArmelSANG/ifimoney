-- ============================================
-- MIGRATION: CRÉATION DES TABLES PRINCIPALES
-- Plateforme TontinePro
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

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

-- ============================================
-- TABLE: users
-- ============================================

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

-- ============================================
-- TABLE: tontiniers
-- ============================================

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

-- ============================================
-- TABLE: clients
-- ============================================

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

-- ============================================
-- TABLE: registration_requests
-- ============================================

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

-- ============================================
-- TABLE: tontines
-- ============================================

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

-- ============================================
-- TABLE: tontine_participations
-- ============================================

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

-- ============================================
-- TABLE: transactions
-- ============================================

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

-- ============================================
-- TABLE: cgu
-- ============================================

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

-- ============================================
-- TABLE: cgu_acceptances
-- ============================================

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

-- ============================================
-- TABLE: audit_logs
-- ============================================

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

-- ============================================
-- SEQUENCES FOR IDENTIFIERS
-- ============================================

CREATE SEQUENCE client_id_seq START 10000;
CREATE SEQUENCE tontinier_id_seq START 10000;
CREATE SEQUENCE tontine_id_seq START 100000;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate Client Identifier
CREATE OR REPLACE FUNCTION generate_client_identifier()
RETURNS TEXT AS $$
BEGIN
    RETURN 'C' || nextval('client_id_seq')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Generate Tontinier Identifier
CREATE OR REPLACE FUNCTION generate_tontinier_identifier()
RETURNS TEXT AS $$
BEGIN
    RETURN 'T' || nextval('tontinier_id_seq')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Generate Tontine Identifier
CREATE OR REPLACE FUNCTION generate_tontine_identifier()
RETURNS TEXT AS $$
BEGIN
    RETURN nextval('tontine_id_seq')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Get Admin Stats
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

-- Increment tontine collected
CREATE OR REPLACE FUNCTION increment_tontine_collected(p_tontine_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE tontines 
    SET total_collected = total_collected + p_amount,
        updated_at = NOW()
    WHERE id = p_tontine_id;
END;
$$ LANGUAGE plpgsql;

-- Increment tontine withdrawn
CREATE OR REPLACE FUNCTION increment_tontine_withdrawn(p_tontine_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE tontines 
    SET total_withdrawn = total_withdrawn + p_amount,
        updated_at = NOW()
    WHERE id = p_tontine_id;
END;
$$ LANGUAGE plpgsql;

-- Increment participation deposited
CREATE OR REPLACE FUNCTION increment_participation_deposited(p_tontine_id UUID, p_client_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE tontine_participations 
    SET total_deposited = total_deposited + p_amount,
        last_deposit_at = NOW()
    WHERE tontine_id = p_tontine_id AND client_id = p_client_id;
END;
$$ LANGUAGE plpgsql;

-- Increment participation withdrawn
CREATE OR REPLACE FUNCTION increment_participation_withdrawn(p_tontine_id UUID, p_client_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE tontine_participations 
    SET total_withdrawn = total_withdrawn + p_amount
    WHERE tontine_id = p_tontine_id AND client_id = p_client_id;
END;
$$ LANGUAGE plpgsql;

-- Check and expire tontiniers
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

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
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

-- ============================================
-- INSERT DEFAULT CGU
-- ============================================

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
