# lag8 — Supabase SQL scripts

Esegui gli script in ordine nel SQL Editor di Supabase:

1. `001_create_conversations.sql` — tabelle `lag8_conversations` e `lag8_messages` + trigger updated_at
2. `002_create_leads.sql` — tabella `lag8_leads` + indici + trigger updated_at
3. `003_create_scrapers.sql` — tabelle `lag8_scrapers` e `lag8_scraper_runs`
4. `004_enable_rls.sql` — abilita RLS con policy permissive (da restringere in produzione)
5. `005_seed_scrapers.sql` — (opzionale) scraper di esempio

Tutte le tabelle hanno prefisso `lag8_` per coesistere con altri progetti nello stesso database Supabase.
