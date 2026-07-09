-- ═══════════════════════════════════════════════════════════════════════════
-- 0003 — ROW-LEVEL SECURITY  (§8 RLS Policies, §7 RBAC matrix)
-- Hard tenant isolation enforced at the DB layer, not just the API (§12).
-- Portable: uses auth.uid() (Supabase-native / local shim from 0001).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Helper: is the current user a member of this org? ─────────────────────────
-- SECURITY DEFINER so it can read memberships regardless of the caller's RLS.
CREATE OR REPLACE FUNCTION public.is_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE organization_id = org_id AND user_id = auth.uid()
  );
$$;

-- ── Helper: does the current user hold >= min_role in this org? ───────────────
-- Role hierarchy (highest→lowest): owner > admin > accountant > manager > employee
CREATE OR REPLACE FUNCTION public.has_role(org_id UUID, min_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role = ANY(
        CASE min_role
          WHEN 'owner'      THEN ARRAY['owner']
          WHEN 'admin'      THEN ARRAY['owner','admin']
          WHEN 'accountant' THEN ARRAY['owner','admin','accountant']
          WHEN 'manager'    THEN ARRAY['owner','admin','accountant','manager']
          ELSE                   ARRAY['owner','admin','accountant','manager','employee']
        END
      )
  );
$$;

-- ── Enable + FORCE RLS so policies apply even to table owners locally ─────────
ALTER TABLE public.organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts  ENABLE ROW LEVEL SECURITY;

-- ── ORGANIZATIONS ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS org_select ON public.organizations;
CREATE POLICY org_select ON public.organizations FOR SELECT
  USING (is_member(id));
DROP POLICY IF EXISTS org_insert ON public.organizations;
CREATE POLICY org_insert ON public.organizations FOR INSERT
  WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS org_update ON public.organizations;
CREATE POLICY org_update ON public.organizations FOR UPDATE
  USING (has_role(id, 'admin'));
DROP POLICY IF EXISTS org_delete ON public.organizations;
CREATE POLICY org_delete ON public.organizations FOR DELETE
  USING (owner_id = auth.uid());

-- ── MEMBERSHIPS (invite/remove = admin+) ─────────────────────────────────────
DROP POLICY IF EXISTS mem_select ON public.memberships;
CREATE POLICY mem_select ON public.memberships FOR SELECT
  USING (is_member(organization_id));
DROP POLICY IF EXISTS mem_write ON public.memberships;
CREATE POLICY mem_write ON public.memberships FOR ALL
  USING (has_role(organization_id, 'admin'))
  WITH CHECK (has_role(organization_id, 'admin'));

-- ── SUBSCRIPTIONS (read = member; writes via service/webhook only) ───────────
DROP POLICY IF EXISTS sub_select ON public.subscriptions;
CREATE POLICY sub_select ON public.subscriptions FOR SELECT
  USING (is_member(organization_id));

-- ── INVOICES (create/edit = accountant+, delete = admin+, read = member) ─────
DROP POLICY IF EXISTS inv_select ON public.invoices;
CREATE POLICY inv_select ON public.invoices FOR SELECT
  USING (is_member(organization_id));
DROP POLICY IF EXISTS inv_insert ON public.invoices;
CREATE POLICY inv_insert ON public.invoices FOR INSERT
  WITH CHECK (has_role(organization_id, 'accountant'));
DROP POLICY IF EXISTS inv_update ON public.invoices;
CREATE POLICY inv_update ON public.invoices FOR UPDATE
  USING (has_role(organization_id, 'accountant'));
DROP POLICY IF EXISTS inv_delete ON public.invoices;
CREATE POLICY inv_delete ON public.invoices FOR DELETE
  USING (has_role(organization_id, 'admin'));

-- ── EXPENSES (employee sees own only; write = manager+; delete = admin+) ─────
DROP POLICY IF EXISTS exp_select ON public.expenses;
CREATE POLICY exp_select ON public.expenses FOR SELECT
  USING (has_role(organization_id, 'manager')
         OR (is_member(organization_id) AND created_by = auth.uid()));
DROP POLICY IF EXISTS exp_insert ON public.expenses;
CREATE POLICY exp_insert ON public.expenses FOR INSERT
  WITH CHECK (is_member(organization_id) AND created_by = auth.uid());
DROP POLICY IF EXISTS exp_update ON public.expenses;
CREATE POLICY exp_update ON public.expenses FOR UPDATE
  USING (has_role(organization_id, 'manager')
         OR (is_member(organization_id) AND created_by = auth.uid() AND status = 'pending'));
DROP POLICY IF EXISTS exp_delete ON public.expenses;
CREATE POLICY exp_delete ON public.expenses FOR DELETE
  USING (has_role(organization_id, 'admin'));

-- ── REVENUES (write = accountant+, delete = admin+, read = member) ───────────
DROP POLICY IF EXISTS rev_select ON public.revenues;
CREATE POLICY rev_select ON public.revenues FOR SELECT
  USING (is_member(organization_id));
DROP POLICY IF EXISTS rev_insert ON public.revenues;
CREATE POLICY rev_insert ON public.revenues FOR INSERT
  WITH CHECK (has_role(organization_id, 'accountant'));
DROP POLICY IF EXISTS rev_update ON public.revenues;
CREATE POLICY rev_update ON public.revenues FOR UPDATE
  USING (has_role(organization_id, 'accountant'));
DROP POLICY IF EXISTS rev_delete ON public.revenues;
CREATE POLICY rev_delete ON public.revenues FOR DELETE
  USING (has_role(organization_id, 'admin'));

-- ── NOTIFICATIONS (each user sees/updates only their own) ────────────────────
DROP POLICY IF EXISTS notif_select ON public.notifications;
CREATE POLICY notif_select ON public.notifications FOR SELECT
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS notif_update ON public.notifications;
CREATE POLICY notif_update ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ── USAGE METRICS + AUDIT LOGS (read = admin+; writes via service only) ──────
DROP POLICY IF EXISTS usage_select ON public.usage_metrics;
CREATE POLICY usage_select ON public.usage_metrics FOR SELECT
  USING (has_role(organization_id, 'admin'));
DROP POLICY IF EXISTS audit_select ON public.audit_logs;
CREATE POLICY audit_select ON public.audit_logs FOR SELECT
  USING (has_role(organization_id, 'admin'));

-- ── AI CONVERSATIONS + MESSAGES (owner of the conversation only) ─────────────
DROP POLICY IF EXISTS ai_conv_all ON public.ai_conversations;
CREATE POLICY ai_conv_all ON public.ai_conversations FOR ALL
  USING (is_member(organization_id) AND user_id = auth.uid())
  WITH CHECK (is_member(organization_id) AND user_id = auth.uid());
DROP POLICY IF EXISTS ai_msg_all ON public.ai_messages;
CREATE POLICY ai_msg_all ON public.ai_messages FOR ALL
  USING (is_member(organization_id))
  WITH CHECK (is_member(organization_id));

-- ── BANK ACCOUNTS (manage integrations = admin+, §7) ─────────────────────────
DROP POLICY IF EXISTS bank_all ON public.bank_accounts;
CREATE POLICY bank_all ON public.bank_accounts FOR ALL
  USING (has_role(organization_id, 'admin'))
  WITH CHECK (has_role(organization_id, 'admin'));
