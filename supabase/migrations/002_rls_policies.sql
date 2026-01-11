-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- Plateforme TontinePro
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

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is tontinier
CREATE OR REPLACE FUNCTION is_tontinier()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'tontinier';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is client
CREATE OR REPLACE FUNCTION is_client()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'client';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get tontinier ID for current client
CREATE OR REPLACE FUNCTION get_client_tontinier_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT tontinier_id FROM clients WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Admin can see all users
CREATE POLICY "admin_view_all_users" ON users
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- Tontinier can see their clients
CREATE POLICY "tontinier_view_clients" ON users
    FOR SELECT
    TO authenticated
    USING (
        is_tontinier() AND (
            id = auth.uid() OR
            id IN (SELECT user_id FROM clients WHERE tontinier_id = auth.uid())
        )
    );

-- Client can see themselves and their tontinier
CREATE POLICY "client_view_self_and_tontinier" ON users
    FOR SELECT
    TO authenticated
    USING (
        is_client() AND (
            id = auth.uid() OR
            id = get_client_tontinier_id()
        )
    );

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admin can update any user
CREATE POLICY "admin_update_users" ON users
    FOR UPDATE
    TO authenticated
    USING (is_admin());

-- ============================================
-- TONTINIERS POLICIES
-- ============================================

-- Admin can see all tontiniers
CREATE POLICY "admin_view_tontiniers" ON tontiniers
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- Tontinier can see their own record
CREATE POLICY "tontinier_view_self" ON tontiniers
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Client can see their tontinier
CREATE POLICY "client_view_tontinier" ON tontiniers
    FOR SELECT
    TO authenticated
    USING (
        is_client() AND user_id = get_client_tontinier_id()
    );

-- Admin can manage tontiniers
CREATE POLICY "admin_manage_tontiniers" ON tontiniers
    FOR ALL
    TO authenticated
    USING (is_admin());

-- ============================================
-- CLIENTS POLICIES
-- ============================================

-- Admin can see all clients
CREATE POLICY "admin_view_clients" ON clients
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- Tontinier can see their clients
CREATE POLICY "tontinier_view_clients" ON clients
    FOR SELECT
    TO authenticated
    USING (is_tontinier() AND tontinier_id = auth.uid());

-- Client can see themselves
CREATE POLICY "client_view_self" ON clients
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admin can manage clients
CREATE POLICY "admin_manage_clients" ON clients
    FOR ALL
    TO authenticated
    USING (is_admin());

-- ============================================
-- REGISTRATION REQUESTS POLICIES
-- ============================================

-- Anyone can create a registration request (no auth required for insert)
CREATE POLICY "anyone_create_request" ON registration_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Admin can view all requests
CREATE POLICY "admin_view_requests" ON registration_requests
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- Admin can update requests
CREATE POLICY "admin_update_requests" ON registration_requests
    FOR UPDATE
    TO authenticated
    USING (is_admin());

-- ============================================
-- TONTINES POLICIES
-- ============================================

-- Admin can see all tontines
CREATE POLICY "admin_view_tontines" ON tontines
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- Tontinier can see their tontines
CREATE POLICY "tontinier_view_tontines" ON tontines
    FOR SELECT
    TO authenticated
    USING (is_tontinier() AND tontinier_id = auth.uid());

-- Client can see tontines they participate in
CREATE POLICY "client_view_tontines" ON tontines
    FOR SELECT
    TO authenticated
    USING (
        is_client() AND id IN (
            SELECT tontine_id FROM tontine_participations WHERE client_id = auth.uid()
        )
    );

-- Tontinier can manage their tontines
CREATE POLICY "tontinier_manage_tontines" ON tontines
    FOR ALL
    TO authenticated
    USING (is_tontinier() AND tontinier_id = auth.uid())
    WITH CHECK (is_tontinier() AND tontinier_id = auth.uid());

-- Admin can manage all tontines
CREATE POLICY "admin_manage_tontines" ON tontines
    FOR ALL
    TO authenticated
    USING (is_admin());

-- ============================================
-- TONTINE PARTICIPATIONS POLICIES
-- ============================================

-- Admin can see all participations
CREATE POLICY "admin_view_participations" ON tontine_participations
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- Tontinier can see participations of their tontines
CREATE POLICY "tontinier_view_participations" ON tontine_participations
    FOR SELECT
    TO authenticated
    USING (
        is_tontinier() AND tontine_id IN (
            SELECT id FROM tontines WHERE tontinier_id = auth.uid()
        )
    );

-- Client can see their own participations
CREATE POLICY "client_view_participations" ON tontine_participations
    FOR SELECT
    TO authenticated
    USING (is_client() AND client_id = auth.uid());

-- Tontinier can manage participations of their tontines
CREATE POLICY "tontinier_manage_participations" ON tontine_participations
    FOR ALL
    TO authenticated
    USING (
        is_tontinier() AND tontine_id IN (
            SELECT id FROM tontines WHERE tontinier_id = auth.uid()
        )
    );

-- ============================================
-- TRANSACTIONS POLICIES
-- ============================================

-- Admin can see all transactions
CREATE POLICY "admin_view_transactions" ON transactions
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- Tontinier can see transactions of their tontines
CREATE POLICY "tontinier_view_transactions" ON transactions
    FOR SELECT
    TO authenticated
    USING (is_tontinier() AND tontinier_id = auth.uid());

-- Client can see their own transactions
CREATE POLICY "client_view_transactions" ON transactions
    FOR SELECT
    TO authenticated
    USING (is_client() AND client_id = auth.uid());

-- Tontinier can manage transactions
CREATE POLICY "tontinier_manage_transactions" ON transactions
    FOR ALL
    TO authenticated
    USING (is_tontinier() AND tontinier_id = auth.uid())
    WITH CHECK (is_tontinier() AND tontinier_id = auth.uid());

-- Client can create withdrawal requests
CREATE POLICY "client_create_withdrawal" ON transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (is_client() AND client_id = auth.uid() AND type = 'withdrawal');

-- ============================================
-- CGU POLICIES
-- ============================================

-- Everyone can view active CGU
CREATE POLICY "view_active_cgu" ON cgu
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Admin can manage CGU
CREATE POLICY "admin_manage_cgu" ON cgu
    FOR ALL
    TO authenticated
    USING (is_admin());

-- ============================================
-- CGU ACCEPTANCES POLICIES
-- ============================================

-- Users can view their own acceptances
CREATE POLICY "view_own_acceptances" ON cgu_acceptances
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can create their own acceptances
CREATE POLICY "create_own_acceptance" ON cgu_acceptances
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Admin can view all acceptances
CREATE POLICY "admin_view_acceptances" ON cgu_acceptances
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Only admin can view audit logs
CREATE POLICY "admin_view_audit_logs" ON audit_logs
    FOR SELECT
    TO authenticated
    USING (is_admin());

-- System can insert audit logs
CREATE POLICY "system_insert_audit_logs" ON audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "authenticated_upload" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'documents');

-- Allow public read access
CREATE POLICY "public_read" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'documents');

-- Allow users to update their own uploads
CREATE POLICY "owner_update" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'documents' AND auth.uid()::text = owner::text);

-- Allow users to delete their own uploads
CREATE POLICY "owner_delete" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'documents' AND auth.uid()::text = owner::text);
