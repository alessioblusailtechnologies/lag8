-- ============================================
-- lag8: Row Level Security
-- ============================================
-- Le API routes usano supabaseAdmin con service_role_key,
-- che bypassa automaticamente RLS. Queste policy lasciano
-- anche all'anon role accesso completo (da restringere in produzione).

ALTER TABLE lag8_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lag8_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lag8_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lag8_scrapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lag8_scraper_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lag8_conversations_anon_all"
  ON lag8_conversations FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "lag8_messages_anon_all"
  ON lag8_messages FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "lag8_leads_anon_all"
  ON lag8_leads FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "lag8_scrapers_anon_all"
  ON lag8_scrapers FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "lag8_scraper_runs_anon_all"
  ON lag8_scraper_runs FOR ALL TO anon USING (true) WITH CHECK (true);
