-- ============================================
-- lag8: Tabella leads
-- ============================================

CREATE TABLE IF NOT EXISTS lag8_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  cognome text NOT NULL,
  email text,
  telefono text,
  azienda text,
  ruolo text,
  citta text,
  status text NOT NULL DEFAULT 'nuovo'
    CHECK (status IN ('nuovo', 'contattato', 'qualificato', 'cliente', 'perso')),
  fonte text DEFAULT 'manuale'
    CHECK (fonte IN ('manuale', 'scraper', 'assistente', 'referral', 'import')),
  valore_stimato numeric,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lag8_leads_status
  ON lag8_leads (status);

CREATE INDEX IF NOT EXISTS idx_lag8_leads_fonte
  ON lag8_leads (fonte);

CREATE INDEX IF NOT EXISTS idx_lag8_leads_nome
  ON lag8_leads (cognome, nome);

CREATE INDEX IF NOT EXISTS idx_lag8_leads_email
  ON lag8_leads (email)
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lag8_leads_azienda
  ON lag8_leads (azienda)
  WHERE azienda IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lag8_leads_created
  ON lag8_leads (created_at DESC);

-- Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION lag8_update_lead_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lag8_lead_updated ON lag8_leads;

CREATE TRIGGER trg_lag8_lead_updated
  BEFORE UPDATE ON lag8_leads
  FOR EACH ROW
  EXECUTE FUNCTION lag8_update_lead_timestamp();
