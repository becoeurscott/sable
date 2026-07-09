-- ═══════════════════════════════════════════════════════════════════════════
-- 0004 — SEED PLANS  (§2 pricing tiers + quotas)
-- Idempotent: re-running updates the definitions in place.
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.plans (code, name, price_monthly, price_annual, sort_order, is_public, quotas, features) VALUES
  ('free_trial', 'Free Trial', 0, NULL, 0, TRUE,
   '{"seats":1,"invoices_mo":5,"expenses_mo":20,"storage_mb":100,"ai_credits_mo":50,"ocr_mo":5,"trial_days":14}',
   '{"reports":"basic","api_access":false,"team_collab":false,"ai_cfo":false,"cash_forecast":false,"fraud_detection":false,"white_label":false,"support":"none"}'),

  ('starter', 'Starter', 1900, 1500, 1, TRUE,
   '{"seats":1,"invoices_mo":50,"expenses_mo":200,"storage_mb":1024,"ai_credits_mo":500,"ocr_mo":50}',
   '{"reports":"standard","api_access":"read","team_collab":false,"ai_cfo":"basic","cash_forecast":false,"fraud_detection":false,"white_label":false,"support":"email"}'),

  ('growth', 'Growth', 4900, 3900, 2, TRUE,
   '{"seats":3,"invoices_mo":null,"expenses_mo":null,"storage_mb":10240,"ai_credits_mo":2000,"ocr_mo":500}',
   '{"reports":"advanced","api_access":"full","team_collab":true,"ai_cfo":"advanced","cash_forecast":"3-month","fraud_detection":false,"white_label":false,"support":"email_chat"}'),

  ('professional', 'Professional', 9900, 7900, 3, TRUE,
   '{"seats":10,"invoices_mo":null,"expenses_mo":null,"storage_mb":51200,"ai_credits_mo":10000,"ocr_mo":null}',
   '{"reports":"full","api_access":"full_webhooks","team_collab":"approvals","ai_cfo":"full_memory","cash_forecast":"12-month","fraud_detection":"realtime","white_label":false,"support":"phone_chat"}'),

  ('enterprise', 'Enterprise', 0, NULL, 4, TRUE,
   '{"seats":null,"invoices_mo":null,"expenses_mo":null,"storage_mb":1048576,"ai_credits_mo":null,"ocr_mo":null}',
   '{"reports":"custom","api_access":"enterprise","team_collab":"sso","ai_cfo":"dedicated","cash_forecast":"custom","fraud_detection":"custom_ml","white_label":true,"support":"csm"}')
ON CONFLICT (code) DO UPDATE SET
  name          = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_annual  = EXCLUDED.price_annual,
  sort_order    = EXCLUDED.sort_order,
  is_public     = EXCLUDED.is_public,
  quotas        = EXCLUDED.quotas,
  features      = EXCLUDED.features;
