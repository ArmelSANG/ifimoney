-- ============================================
-- MIGRATION: SYSTÈME DE NOTIFICATIONS
-- ifiMoney Platform
-- ============================================

-- ============================================
-- TABLE: notifications
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

-- ============================================
-- TABLE: notification_preferences
-- ============================================

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

-- ============================================
-- TABLE: push_subscriptions
-- ============================================

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

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Notifications: utilisateur peut voir/modifier ses propres notifications
CREATE POLICY "users_view_own_notifications" ON notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "users_update_own_notifications" ON notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "users_delete_own_notifications" ON notifications
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Système peut créer des notifications pour tout le monde
CREATE POLICY "system_create_notifications" ON notifications
    FOR INSERT TO authenticated
    WITH CHECK (TRUE);

-- Préférences: utilisateur peut gérer ses propres préférences
CREATE POLICY "users_manage_own_preferences" ON notification_preferences
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Push subscriptions: utilisateur peut gérer ses propres abonnements
CREATE POLICY "users_manage_own_push" ON push_subscriptions
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour créer une notification
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

-- Fonction pour notifier tous les clients d'un tontinier
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
    FOR v_client IN 
        SELECT user_id 
        FROM clients 
        WHERE tontinier_id = p_tontinier_id
    LOOP
        INSERT INTO notifications (user_id, type, title, message, priority)
        VALUES (v_client.user_id, p_type, p_title, p_message, p_priority);
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour notifier les participants d'une tontine
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
        SELECT client_id 
        FROM tontine_participations 
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

-- Fonction pour supprimer les anciennes notifications (plus de 30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(p_days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL
    AND is_read = TRUE;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour notifier à la validation d'une transaction
CREATE OR REPLACE FUNCTION notify_on_transaction_validation()
RETURNS TRIGGER AS $$
DECLARE
    v_client_name TEXT;
    v_tontine_name TEXT;
    v_amount_formatted TEXT;
BEGIN
    -- Récupérer les infos nécessaires
    SELECT u.full_name INTO v_client_name
    FROM users u WHERE u.id = NEW.client_id;
    
    SELECT t.name INTO v_tontine_name
    FROM tontines t WHERE t.id = NEW.tontine_id;
    
    v_amount_formatted := TO_CHAR(NEW.amount, 'FM999,999,999') || ' XOF';
    
    -- Si la transaction vient d'être validée
    IF NEW.status = 'validated' AND OLD.status = 'pending' THEN
        IF NEW.type = 'deposit' THEN
            -- Notifier le client
            PERFORM create_notification(
                NEW.client_id,
                'deposit_validated',
                'Dépôt validé',
                'Votre dépôt de ' || v_amount_formatted || ' dans "' || v_tontine_name || '" a été validé.',
                'medium',
                jsonb_build_object('transaction_id', NEW.id, 'tontine_id', NEW.tontine_id),
                '/client/transactions'
            );
        ELSIF NEW.type = 'withdrawal' THEN
            -- Notifier le client
            PERFORM create_notification(
                NEW.client_id,
                'withdrawal_validated',
                'Retrait validé',
                'Votre retrait de ' || v_amount_formatted || ' de "' || v_tontine_name || '" a été validé.',
                'medium',
                jsonb_build_object('transaction_id', NEW.id, 'tontine_id', NEW.tontine_id),
                '/client/transactions'
            );
        END IF;
    
    -- Si la transaction vient d'être refusée
    ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        IF NEW.type = 'deposit' THEN
            PERFORM create_notification(
                NEW.client_id,
                'deposit_rejected',
                'Dépôt refusé',
                'Votre dépôt de ' || v_amount_formatted || ' dans "' || v_tontine_name || '" a été refusé.' ||
                CASE WHEN NEW.rejection_reason IS NOT NULL THEN ' Raison : ' || NEW.rejection_reason ELSE '' END,
                'high',
                jsonb_build_object('transaction_id', NEW.id, 'tontine_id', NEW.tontine_id),
                '/client/transactions'
            );
        ELSIF NEW.type = 'withdrawal' THEN
            PERFORM create_notification(
                NEW.client_id,
                'withdrawal_rejected',
                'Retrait refusé',
                'Votre retrait de ' || v_amount_formatted || ' de "' || v_tontine_name || '" a été refusé.' ||
                CASE WHEN NEW.rejection_reason IS NOT NULL THEN ' Raison : ' || NEW.rejection_reason ELSE '' END,
                'high',
                jsonb_build_object('transaction_id', NEW.id, 'tontine_id', NEW.tontine_id),
                '/client/transactions'
            );
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

-- Trigger pour notifier le tontinier d'une nouvelle transaction
CREATE OR REPLACE FUNCTION notify_tontinier_new_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_client_name TEXT;
    v_tontine_name TEXT;
    v_amount_formatted TEXT;
BEGIN
    -- Récupérer les infos nécessaires
    SELECT u.full_name INTO v_client_name
    FROM users u WHERE u.id = NEW.client_id;
    
    SELECT t.name INTO v_tontine_name
    FROM tontines t WHERE t.id = NEW.tontine_id;
    
    v_amount_formatted := TO_CHAR(NEW.amount, 'FM999,999,999') || ' XOF';
    
    IF NEW.type = 'deposit' THEN
        PERFORM create_notification(
            NEW.tontinier_id,
            'deposit_received',
            'Nouveau dépôt reçu',
            v_client_name || ' a effectué un dépôt de ' || v_amount_formatted || ' dans "' || v_tontine_name || '".',
            'medium',
            jsonb_build_object('transaction_id', NEW.id, 'tontine_id', NEW.tontine_id, 'client_id', NEW.client_id),
            '/tontinier/transactions'
        );
    ELSIF NEW.type = 'withdrawal' THEN
        PERFORM create_notification(
            NEW.tontinier_id,
            'withdrawal_request',
            'Nouvelle demande de retrait',
            v_client_name || ' demande un retrait de ' || v_amount_formatted || ' de "' || v_tontine_name || '".',
            'high',
            jsonb_build_object('transaction_id', NEW.id, 'tontine_id', NEW.tontine_id, 'client_id', NEW.client_id),
            '/tontinier/transactions'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_tontinier_new_transaction
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION notify_tontinier_new_transaction();

-- Trigger pour notifier quand un client est ajouté à une tontine
CREATE OR REPLACE FUNCTION notify_client_added_to_tontine()
RETURNS TRIGGER AS $$
DECLARE
    v_tontine_name TEXT;
    v_mise_formatted TEXT;
BEGIN
    SELECT t.name, TO_CHAR(t.mise, 'FM999,999,999') || ' XOF'
    INTO v_tontine_name, v_mise_formatted
    FROM tontines t WHERE t.id = NEW.tontine_id;
    
    PERFORM create_notification(
        NEW.client_id,
        'tontine_joined',
        'Nouvelle tontine',
        'Vous avez été ajouté à la tontine "' || v_tontine_name || '" avec une mise de ' || v_mise_formatted || '.',
        'medium',
        jsonb_build_object('tontine_id', NEW.tontine_id),
        '/client/tontines'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_client_added_to_tontine
    AFTER INSERT ON tontine_participations
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_added_to_tontine();

-- ============================================
-- ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
