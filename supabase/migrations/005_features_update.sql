-- ============================================
-- MIGRATION 005: NOUVELLES FONCTIONNALITÉS ifiMoney
-- Adresses, Frais, Bénéfices, Validation téléphone
-- ============================================

-- ============================================
-- 1. PAYS ET VILLES D'AFRIQUE
-- ============================================

CREATE TABLE african_countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(2) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone_code VARCHAR(10) NOT NULL,
    phone_length INTEGER[] NOT NULL, -- Longueurs valides du numéro (sans indicatif)
    phone_regex VARCHAR(100), -- Regex de validation optionnel
    currency VARCHAR(3) DEFAULT 'XOF'
);

CREATE TABLE african_cities (
    id SERIAL PRIMARY KEY,
    country_code VARCHAR(2) NOT NULL REFERENCES african_countries(code),
    name VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    UNIQUE(country_code, name)
);

CREATE INDEX idx_cities_country ON african_cities(country_code);
CREATE INDEX idx_cities_name ON african_cities(name);

-- Insertion des pays d'Afrique avec indicatifs et longueurs
INSERT INTO african_countries (code, name, phone_code, phone_length, currency) VALUES
('DZ', 'Algérie', '+213', ARRAY[9], 'DZD'),
('AO', 'Angola', '+244', ARRAY[9], 'AOA'),
('BJ', 'Bénin', '+229', ARRAY[8,10], 'XOF'),
('BW', 'Botswana', '+267', ARRAY[7,8], 'BWP'),
('BF', 'Burkina Faso', '+226', ARRAY[8], 'XOF'),
('BI', 'Burundi', '+257', ARRAY[8], 'BIF'),
('CV', 'Cap-Vert', '+238', ARRAY[7], 'CVE'),
('CM', 'Cameroun', '+237', ARRAY[9], 'XAF'),
('CF', 'Centrafrique', '+236', ARRAY[8], 'XAF'),
('TD', 'Tchad', '+235', ARRAY[8], 'XAF'),
('KM', 'Comores', '+269', ARRAY[7], 'KMF'),
('CG', 'Congo', '+242', ARRAY[9], 'XAF'),
('CD', 'RD Congo', '+243', ARRAY[9], 'CDF'),
('CI', 'Côte d''Ivoire', '+225', ARRAY[10], 'XOF'),
('DJ', 'Djibouti', '+253', ARRAY[8], 'DJF'),
('EG', 'Égypte', '+20', ARRAY[10], 'EGP'),
('GQ', 'Guinée Équatoriale', '+240', ARRAY[9], 'XAF'),
('ER', 'Érythrée', '+291', ARRAY[7], 'ERN'),
('SZ', 'Eswatini', '+268', ARRAY[8], 'SZL'),
('ET', 'Éthiopie', '+251', ARRAY[9], 'ETB'),
('GA', 'Gabon', '+241', ARRAY[7,8], 'XAF'),
('GM', 'Gambie', '+220', ARRAY[7], 'GMD'),
('GH', 'Ghana', '+233', ARRAY[9], 'GHS'),
('GN', 'Guinée', '+224', ARRAY[9], 'GNF'),
('GW', 'Guinée-Bissau', '+245', ARRAY[7], 'XOF'),
('KE', 'Kenya', '+254', ARRAY[9], 'KES'),
('LS', 'Lesotho', '+266', ARRAY[8], 'LSL'),
('LR', 'Liberia', '+231', ARRAY[7,8], 'LRD'),
('LY', 'Libye', '+218', ARRAY[9], 'LYD'),
('MG', 'Madagascar', '+261', ARRAY[9], 'MGA'),
('MW', 'Malawi', '+265', ARRAY[7,8,9], 'MWK'),
('ML', 'Mali', '+223', ARRAY[8], 'XOF'),
('MR', 'Mauritanie', '+222', ARRAY[8], 'MRU'),
('MU', 'Maurice', '+230', ARRAY[8], 'MUR'),
('MA', 'Maroc', '+212', ARRAY[9], 'MAD'),
('MZ', 'Mozambique', '+258', ARRAY[9], 'MZN'),
('NA', 'Namibie', '+264', ARRAY[9], 'NAD'),
('NE', 'Niger', '+227', ARRAY[8], 'XOF'),
('NG', 'Nigeria', '+234', ARRAY[10], 'NGN'),
('RW', 'Rwanda', '+250', ARRAY[9], 'RWF'),
('ST', 'Sao Tomé-et-Príncipe', '+239', ARRAY[7], 'STN'),
('SN', 'Sénégal', '+221', ARRAY[9], 'XOF'),
('SC', 'Seychelles', '+248', ARRAY[7], 'SCR'),
('SL', 'Sierra Leone', '+232', ARRAY[8], 'SLL'),
('SO', 'Somalie', '+252', ARRAY[7,8], 'SOS'),
('ZA', 'Afrique du Sud', '+27', ARRAY[9], 'ZAR'),
('SS', 'Soudan du Sud', '+211', ARRAY[9], 'SSP'),
('SD', 'Soudan', '+249', ARRAY[9], 'SDG'),
('TZ', 'Tanzanie', '+255', ARRAY[9], 'TZS'),
('TG', 'Togo', '+228', ARRAY[8], 'XOF'),
('TN', 'Tunisie', '+216', ARRAY[8], 'TND'),
('UG', 'Ouganda', '+256', ARRAY[9], 'UGX'),
('ZM', 'Zambie', '+260', ARRAY[9], 'ZMW'),
('ZW', 'Zimbabwe', '+263', ARRAY[9], 'ZWL');

-- Insertion des principales villes (sélection)
INSERT INTO african_cities (country_code, name, region) VALUES
-- Bénin
('BJ', 'Cotonou', 'Littoral'),
('BJ', 'Porto-Novo', 'Ouémé'),
('BJ', 'Parakou', 'Borgou'),
('BJ', 'Abomey-Calavi', 'Atlantique'),
('BJ', 'Djougou', 'Donga'),
('BJ', 'Bohicon', 'Zou'),
('BJ', 'Natitingou', 'Atacora'),
('BJ', 'Lokossa', 'Mono'),
('BJ', 'Ouidah', 'Atlantique'),
('BJ', 'Kandi', 'Alibori'),
-- Togo
('TG', 'Lomé', 'Maritime'),
('TG', 'Sokodé', 'Centrale'),
('TG', 'Kara', 'Kara'),
('TG', 'Kpalimé', 'Plateaux'),
('TG', 'Atakpamé', 'Plateaux'),
-- Côte d'Ivoire
('CI', 'Abidjan', 'Lagunes'),
('CI', 'Bouaké', 'Vallée du Bandama'),
('CI', 'Yamoussoukro', 'Lacs'),
('CI', 'Daloa', 'Haut-Sassandra'),
('CI', 'San-Pédro', 'Bas-Sassandra'),
('CI', 'Korhogo', 'Savanes'),
-- Sénégal
('SN', 'Dakar', 'Dakar'),
('SN', 'Thiès', 'Thiès'),
('SN', 'Saint-Louis', 'Saint-Louis'),
('SN', 'Rufisque', 'Dakar'),
('SN', 'Ziguinchor', 'Ziguinchor'),
-- Burkina Faso
('BF', 'Ouagadougou', 'Centre'),
('BF', 'Bobo-Dioulasso', 'Hauts-Bassins'),
('BF', 'Koudougou', 'Centre-Ouest'),
('BF', 'Banfora', 'Cascades'),
-- Mali
('ML', 'Bamako', 'Bamako'),
('ML', 'Sikasso', 'Sikasso'),
('ML', 'Ségou', 'Ségou'),
('ML', 'Mopti', 'Mopti'),
('ML', 'Kayes', 'Kayes'),
-- Niger
('NE', 'Niamey', 'Niamey'),
('NE', 'Zinder', 'Zinder'),
('NE', 'Maradi', 'Maradi'),
('NE', 'Tahoua', 'Tahoua'),
-- Cameroun
('CM', 'Douala', 'Littoral'),
('CM', 'Yaoundé', 'Centre'),
('CM', 'Garoua', 'Nord'),
('CM', 'Bamenda', 'Nord-Ouest'),
('CM', 'Bafoussam', 'Ouest'),
-- Ghana
('GH', 'Accra', 'Greater Accra'),
('GH', 'Kumasi', 'Ashanti'),
('GH', 'Tamale', 'Northern'),
('GH', 'Takoradi', 'Western'),
-- Nigeria
('NG', 'Lagos', 'Lagos'),
('NG', 'Abuja', 'FCT'),
('NG', 'Kano', 'Kano'),
('NG', 'Ibadan', 'Oyo'),
('NG', 'Port Harcourt', 'Rivers'),
-- Gabon
('GA', 'Libreville', 'Estuaire'),
('GA', 'Port-Gentil', 'Ogooué-Maritime'),
('GA', 'Franceville', 'Haut-Ogooué'),
-- Congo
('CG', 'Brazzaville', 'Brazzaville'),
('CG', 'Pointe-Noire', 'Pointe-Noire'),
-- RD Congo
('CD', 'Kinshasa', 'Kinshasa'),
('CD', 'Lubumbashi', 'Haut-Katanga'),
('CD', 'Mbuji-Mayi', 'Kasaï-Oriental'),
('CD', 'Goma', 'Nord-Kivu'),
-- Guinée
('GN', 'Conakry', 'Conakry'),
('GN', 'Nzérékoré', 'Nzérékoré'),
('GN', 'Kankan', 'Kankan');

-- ============================================
-- 2. MODIFICATION DES TABLES EXISTANTES
-- ============================================

-- Ajouter les champs d'adresse aux tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) REFERENCES african_countries(code);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_country_code VARCHAR(10);

-- Ajouter les champs d'adresse aux demandes d'inscription
ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);
ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS address TEXT;

-- ============================================
-- 3. FRAIS ET BÉNÉFICES TONTINIER
-- ============================================

-- Type d'abonnement tontinier
CREATE TYPE subscription_type AS ENUM ('monthly_1000', 'monthly_2000', 'monthly_3000', 'monthly_4000', 'monthly_5000', 'custom');

-- Table des abonnements tontinier
CREATE TABLE tontinier_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tontinier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_type subscription_type NOT NULL,
    monthly_amount DECIMAL(15, 2) NOT NULL CHECK (monthly_amount >= 1000 AND monthly_amount <= 5000),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tontinier_id, start_date)
);

-- Table des bénéfices tontinier (journal)
CREATE TABLE tontinier_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tontinier_id UUID NOT NULL REFERENCES users(id),
    tontine_id UUID REFERENCES tontines(id),
    client_id UUID REFERENCES users(id),
    transaction_id UUID REFERENCES transactions(id),
    earning_type VARCHAR(50) NOT NULL, -- 'mise_classique', 'mise_terme', 'percentage_flexible', 'subscription'
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    period_start DATE,
    period_end DATE
);

CREATE INDEX idx_earnings_tontinier ON tontinier_earnings(tontinier_id);
CREATE INDEX idx_earnings_tontine ON tontinier_earnings(tontine_id);
CREATE INDEX idx_earnings_client ON tontinier_earnings(client_id);
CREATE INDEX idx_earnings_date ON tontinier_earnings(calculated_at DESC);

-- Vue pour le total des bénéfices par tontinier
CREATE OR REPLACE VIEW tontinier_earnings_summary AS
SELECT 
    tontinier_id,
    SUM(amount) as total_earnings,
    SUM(CASE WHEN earning_type = 'mise_classique' THEN amount ELSE 0 END) as earnings_classique,
    SUM(CASE WHEN earning_type = 'mise_terme' THEN amount ELSE 0 END) as earnings_terme,
    SUM(CASE WHEN earning_type = 'percentage_flexible' THEN amount ELSE 0 END) as earnings_flexible,
    SUM(CASE WHEN earning_type = 'subscription' THEN amount ELSE 0 END) as earnings_subscription,
    COUNT(DISTINCT tontine_id) as tontines_count,
    COUNT(DISTINCT client_id) as clients_count
FROM tontinier_earnings
GROUP BY tontinier_id;

-- ============================================
-- 4. MODIFICATION TABLE TONTINES
-- ============================================

-- Ajouter les nouveaux champs aux tontines
ALTER TABLE tontines ADD COLUMN IF NOT EXISTS min_mise DECIMAL(15, 2) DEFAULT 50 CHECK (min_mise >= 50);
ALTER TABLE tontines ADD COLUMN IF NOT EXISTS duration_months INTEGER; -- Pour tontine à terme
ALTER TABLE tontines ADD COLUMN IF NOT EXISTS proposed_duration_months INTEGER; -- Durée proposée par client
ALTER TABLE tontines ADD COLUMN IF NOT EXISTS duration_validated BOOLEAN DEFAULT FALSE;
ALTER TABLE tontines ADD COLUMN IF NOT EXISTS tontinier_fee_collected DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE tontines ADD COLUMN IF NOT EXISTS total_mises_count INTEGER DEFAULT 0;

-- Contrainte sur mise minimum
ALTER TABLE tontines DROP CONSTRAINT IF EXISTS check_mise_minimum;
ALTER TABLE tontines ADD CONSTRAINT check_mise_minimum CHECK (mise >= 50);

-- ============================================
-- 5. MODIFICATION TABLE TRANSACTIONS
-- ============================================

-- Ajouter les champs pour le récapitulatif et frais
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_deposited_before DECIMAL(15, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_deposited_after DECIMAL(15, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mises_count_before INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS mises_count_after INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tontinier_fee DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS client_net_available DECIMAL(15, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_withdrawn_before DECIMAL(15, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_withdrawn_after DECIMAL(15, 2);

-- ============================================
-- 6. TABLE FRAIS RÉSERVÉS
-- ============================================

CREATE TABLE reserved_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tontine_id UUID NOT NULL REFERENCES tontines(id),
    client_id UUID NOT NULL REFERENCES users(id),
    tontinier_id UUID NOT NULL REFERENCES users(id),
    fee_type VARCHAR(50) NOT NULL, -- 'mise_fee', 'percentage_fee'
    amount DECIMAL(15, 2) NOT NULL,
    is_collected BOOLEAN DEFAULT FALSE,
    collected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tontine_id, client_id, fee_type)
);

CREATE INDEX idx_reserved_fees_tontine ON reserved_fees(tontine_id);
CREATE INDEX idx_reserved_fees_client ON reserved_fees(client_id);

-- ============================================
-- 7. FONCTIONS DE CALCUL DES FRAIS
-- ============================================

-- Fonction pour calculer les frais selon le type de tontine
CREATE OR REPLACE FUNCTION calculate_tontinier_fee(
    p_tontine_id UUID,
    p_client_id UUID,
    p_transaction_type transaction_type,
    p_amount DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_tontine RECORD;
    v_total_mises INTEGER;
    v_fee DECIMAL := 0;
    v_participation RECORD;
BEGIN
    -- Récupérer les infos de la tontine
    SELECT * INTO v_tontine FROM tontines WHERE id = p_tontine_id;
    
    -- Récupérer la participation
    SELECT * INTO v_participation 
    FROM tontine_participations 
    WHERE tontine_id = p_tontine_id AND client_id = p_client_id;
    
    IF v_tontine.type = 'flexible' THEN
        -- Tontine à montant variable: 5% du montant, minimum 200F
        v_fee := GREATEST(p_amount * 0.05, 200);
    ELSE
        -- Tontine classique ou à terme
        -- Calculer le nombre de mises après cette transaction
        IF p_transaction_type = 'deposit' THEN
            v_total_mises := FLOOR((COALESCE(v_participation.total_deposited, 0) + p_amount) / v_tontine.mise);
        ELSE
            v_total_mises := FLOOR(COALESCE(v_participation.total_deposited, 0) / v_tontine.mise);
        END IF;
        
        -- Si <= 31 mises: le tontinier gagne 1 mise
        -- Si > 31 mises: proportionnel (1 mise pour chaque tranche de 31)
        IF v_total_mises <= 31 THEN
            v_fee := v_tontine.mise; -- 1 mise
        ELSE
            v_fee := v_tontine.mise * CEIL(v_total_mises::DECIMAL / 31);
        END IF;
    END IF;
    
    RETURN v_fee;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les avoirs nets disponibles
CREATE OR REPLACE FUNCTION calculate_net_available(
    p_tontine_id UUID,
    p_client_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    v_participation RECORD;
    v_reserved DECIMAL;
    v_tontine RECORD;
    v_fee DECIMAL;
BEGIN
    -- Récupérer la participation
    SELECT * INTO v_participation 
    FROM tontine_participations 
    WHERE tontine_id = p_tontine_id AND client_id = p_client_id;
    
    -- Récupérer la tontine
    SELECT * INTO v_tontine FROM tontines WHERE id = p_tontine_id;
    
    -- Calculer les frais réservés
    SELECT COALESCE(SUM(amount), 0) INTO v_reserved
    FROM reserved_fees
    WHERE tontine_id = p_tontine_id AND client_id = p_client_id AND is_collected = FALSE;
    
    -- Si pas encore de frais réservés, les calculer
    IF v_reserved = 0 THEN
        v_fee := calculate_tontinier_fee(p_tontine_id, p_client_id, 'withdrawal', 0);
        v_reserved := v_fee;
    END IF;
    
    -- Avoirs nets = Dépôts - Retraits - Frais réservés
    RETURN GREATEST(0, 
        COALESCE(v_participation.total_deposited, 0) - 
        COALESCE(v_participation.total_withdrawn, 0) - 
        v_reserved
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le récapitulatif avant validation
CREATE OR REPLACE FUNCTION get_transaction_summary(
    p_tontine_id UUID,
    p_client_id UUID,
    p_amount DECIMAL,
    p_type transaction_type
) RETURNS TABLE (
    total_deposited_before DECIMAL,
    total_deposited_after DECIMAL,
    mises_count_before INTEGER,
    mises_count_after INTEGER,
    total_withdrawn_before DECIMAL,
    total_withdrawn_after DECIMAL,
    tontinier_fee DECIMAL,
    net_available DECIMAL
) AS $$
DECLARE
    v_participation RECORD;
    v_tontine RECORD;
    v_fee DECIMAL;
BEGIN
    SELECT * INTO v_participation 
    FROM tontine_participations 
    WHERE tontine_id = p_tontine_id AND client_id = p_client_id;
    
    SELECT * INTO v_tontine FROM tontines WHERE id = p_tontine_id;
    
    total_deposited_before := COALESCE(v_participation.total_deposited, 0);
    total_withdrawn_before := COALESCE(v_participation.total_withdrawn, 0);
    mises_count_before := FLOOR(total_deposited_before / v_tontine.mise);
    
    IF p_type = 'deposit' THEN
        total_deposited_after := total_deposited_before + p_amount;
        total_withdrawn_after := total_withdrawn_before;
    ELSE
        total_deposited_after := total_deposited_before;
        total_withdrawn_after := total_withdrawn_before + p_amount;
    END IF;
    
    mises_count_after := FLOOR(total_deposited_after / v_tontine.mise);
    tontinier_fee := calculate_tontinier_fee(p_tontine_id, p_client_id, p_type, p_amount);
    net_available := calculate_net_available(p_tontine_id, p_client_id);
    
    IF p_type = 'withdrawal' THEN
        net_available := net_available - p_amount;
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. TRIGGER POUR ENREGISTRER LES BÉNÉFICES
-- ============================================

CREATE OR REPLACE FUNCTION record_tontinier_earning()
RETURNS TRIGGER AS $$
DECLARE
    v_tontine RECORD;
    v_fee DECIMAL;
    v_earning_type VARCHAR(50);
BEGIN
    -- Seulement pour les transactions validées
    IF NEW.status = 'validated' AND OLD.status = 'pending' THEN
        SELECT * INTO v_tontine FROM tontines WHERE id = NEW.tontine_id;
        
        -- Calculer les frais
        v_fee := calculate_tontinier_fee(NEW.tontine_id, NEW.client_id, NEW.type, NEW.amount);
        
        -- Déterminer le type de bénéfice
        IF v_tontine.type = 'flexible' THEN
            v_earning_type := 'percentage_flexible';
        ELSIF v_tontine.type = 'terme' THEN
            v_earning_type := 'mise_terme';
        ELSE
            v_earning_type := 'mise_classique';
        END IF;
        
        -- Enregistrer le bénéfice
        INSERT INTO tontinier_earnings (
            tontinier_id, tontine_id, client_id, transaction_id,
            earning_type, amount, description
        ) VALUES (
            NEW.tontinier_id, NEW.tontine_id, NEW.client_id, NEW.id,
            v_earning_type, v_fee,
            'Frais sur ' || NEW.type || ' de ' || NEW.amount || ' XOF'
        );
        
        -- Mettre à jour les frais collectés de la tontine
        UPDATE tontines 
        SET tontinier_fee_collected = tontinier_fee_collected + v_fee
        WHERE id = NEW.tontine_id;
        
        -- Mettre à jour la transaction avec les frais
        NEW.tontinier_fee := v_fee;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_record_earning ON transactions;
CREATE TRIGGER trigger_record_earning
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    WHEN (OLD.status = 'pending' AND NEW.status = 'validated')
    EXECUTE FUNCTION record_tontinier_earning();

-- ============================================
-- 9. VALIDATION DES NUMÉROS DE TÉLÉPHONE
-- ============================================

CREATE OR REPLACE FUNCTION validate_phone_number(
    p_phone VARCHAR,
    p_country_code VARCHAR(2)
) RETURNS BOOLEAN AS $$
DECLARE
    v_country RECORD;
    v_clean_phone VARCHAR;
    v_phone_length INTEGER;
BEGIN
    -- Récupérer les infos du pays
    SELECT * INTO v_country FROM african_countries WHERE code = p_country_code;
    
    IF v_country IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Nettoyer le numéro (enlever espaces, tirets, etc.)
    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
    
    -- Si le numéro commence par l'indicatif, l'enlever
    IF v_clean_phone LIKE (regexp_replace(v_country.phone_code, '\+', '') || '%') THEN
        v_clean_phone := substring(v_clean_phone from length(regexp_replace(v_country.phone_code, '\+', '')) + 1);
    END IF;
    
    v_phone_length := length(v_clean_phone);
    
    -- Vérifier si la longueur est valide
    RETURN v_phone_length = ANY(v_country.phone_length);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour formater un numéro en E.164
CREATE OR REPLACE FUNCTION format_phone_e164(
    p_phone VARCHAR,
    p_country_code VARCHAR(2)
) RETURNS VARCHAR AS $$
DECLARE
    v_country RECORD;
    v_clean_phone VARCHAR;
BEGIN
    SELECT * INTO v_country FROM african_countries WHERE code = p_country_code;
    
    IF v_country IS NULL THEN
        RETURN p_phone;
    END IF;
    
    -- Nettoyer le numéro
    v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
    
    -- Si le numéro commence par l'indicatif, l'enlever
    IF v_clean_phone LIKE (regexp_replace(v_country.phone_code, '\+', '') || '%') THEN
        v_clean_phone := substring(v_clean_phone from length(regexp_replace(v_country.phone_code, '\+', '')) + 1);
    END IF;
    
    -- Retourner au format E.164
    RETURN v_country.phone_code || v_clean_phone;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. RLS POUR NOUVELLES TABLES
-- ============================================

ALTER TABLE african_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE african_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontinier_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tontinier_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserved_fees ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les pays/villes
CREATE POLICY "anyone_read_countries" ON african_countries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone_read_cities" ON african_cities FOR SELECT TO anon, authenticated USING (true);

-- Subscriptions: Admin et tontinier concerné
CREATE POLICY "admin_manage_subscriptions" ON tontinier_subscriptions FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "tontinier_view_own_subscription" ON tontinier_subscriptions FOR SELECT TO authenticated USING (tontinier_id = auth.uid());

-- Earnings: Admin et tontinier concerné
CREATE POLICY "admin_view_all_earnings" ON tontinier_earnings FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "tontinier_view_own_earnings" ON tontinier_earnings FOR SELECT TO authenticated USING (tontinier_id = auth.uid());

-- Reserved fees: Admin, tontinier et client concernés
CREATE POLICY "admin_manage_fees" ON reserved_fees FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "tontinier_view_fees" ON reserved_fees FOR SELECT TO authenticated USING (tontinier_id = auth.uid());
CREATE POLICY "client_view_own_fees" ON reserved_fees FOR SELECT TO authenticated USING (client_id = auth.uid());

-- ============================================
-- 11. MISE À JOUR CGU
-- ============================================

UPDATE cgu SET content = '
<h2>Conditions Générales d''Utilisation de ifiMoney</h2>
<p><strong>Date d''effet : Janvier 2025 - Version 2.0</strong></p>

<h3>Article 1 - Objet</h3>
<p>Les présentes Conditions Générales d''Utilisation (CGU) régissent l''utilisation de la plateforme ifiMoney, service de gestion de tontine digitale.</p>

<h3>Article 2 - Acceptation</h3>
<p>L''utilisation de la plateforme implique l''acceptation pleine et entière des présentes CGU.</p>

<h3>Article 3 - Services</h3>
<p>ifiMoney permet la création et gestion de tontines, le suivi des cotisations et retraits, et la traçabilité complète des opérations.</p>

<h3>Article 4 - Types de Tontines</h3>
<ul>
    <li><strong>Tontine Classique</strong> : Cotisations régulières avec un montant fixe (mise)</li>
    <li><strong>Tontine à Terme</strong> : Durée déterminée, aucun retrait avant échéance</li>
    <li><strong>Tontine à Montant Variable (Flexible)</strong> : Cotisations libres selon les capacités</li>
</ul>

<h3>Article 5 - Frais de Service</h3>

<h4>5.1 - Frais Tontinier (Abonnement)</h4>
<p>Chaque tontinier s''acquitte d''un abonnement mensuel compris entre <strong>1 000 F et 5 000 F</strong>, selon l''accord négocié avec ifiMoney. Ces frais sont visibles et traçables.</p>

<h4>5.2 - Frais Clients - Tontine Classique et à Terme</h4>
<ul>
    <li>Si le nombre total de mises est <strong>≤ 31</strong> : le tontinier perçoit l''équivalent de <strong>1 mise</strong></li>
    <li>Si le nombre de mises <strong>dépasse 31</strong> : le tontinier perçoit <strong>1 mise par tranche de 31 mises</strong></li>
</ul>

<h4>5.3 - Frais Clients - Tontine à Montant Variable</h4>
<ul>
    <li>Prélèvement automatique de <strong>5% du montant total collecté</strong></li>
    <li>Minimum : <strong>200 F</strong> si 5% est inférieur à ce montant</li>
</ul>

<h3>Article 6 - Montants</h3>
<ul>
    <li>Le montant minimum d''une mise de tontine est fixé à <strong>50 F</strong></li>
    <li>Aucun montant maximum n''est imposé</li>
</ul>

<h3>Article 7 - Retraits</h3>
<ul>
    <li>Les frais de service sont toujours réservés en priorité</li>
    <li>Le montant disponible pour retrait est calculé après déduction des frais</li>
    <li>Pour les tontines à terme : aucun retrait avant la fin de la durée convenue</li>
</ul>

<h3>Article 8 - Responsabilités</h3>
<p>Chaque utilisateur est responsable de la confidentialité de ses identifiants, l''exactitude des informations fournies, et le respect des engagements.</p>

<h3>Article 9 - Protection des données</h3>
<p>ifiMoney s''engage à protéger les données personnelles conformément aux réglementations en vigueur.</p>

<h3>Article 10 - Contact</h3>
<p>Pour toute question : IFIAAS au <strong>+229 67 45 54 62</strong> ou <strong>services.ifiaas@gmail.com</strong></p>
', version = '2.0'
WHERE is_active = TRUE;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

SELECT 'Migration 005 exécutée avec succès!' as message,
       (SELECT COUNT(*) FROM african_countries) as pays_africains,
       (SELECT COUNT(*) FROM african_cities) as villes_africaines;
