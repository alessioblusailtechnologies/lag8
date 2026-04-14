-- ============================================
-- lag8: Scraper e run di scraping
-- ============================================

CREATE TABLE IF NOT EXISTS lag8_scrapers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  tipo text NOT NULL
    CHECK (tipo IN ('linkedin', 'pagine_gialle', 'google_maps', 'sito_web', 'custom')),
  descrizione text,
  config jsonb NOT NULL DEFAULT '{}',
  attivo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lag8_scrapers_tipo
  ON lag8_scrapers (tipo);

CREATE INDEX IF NOT EXISTS idx_lag8_scrapers_attivo
  ON lag8_scrapers (attivo);

-- Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION lag8_update_scraper_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lag8_scraper_updated ON lag8_scrapers;

CREATE TRIGGER trg_lag8_scraper_updated
  BEFORE UPDATE ON lag8_scrapers
  FOR EACH ROW
  EXECUTE FUNCTION lag8_update_scraper_timestamp();

-- Run storici di scraping (per tracciare quando uno scraper è stato eseguito)
CREATE TABLE IF NOT EXISTS lag8_scraper_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  scraper_id uuid NOT NULL REFERENCES lag8_scrapers(id) ON DELETE CASCADE,
  stato text NOT NULL DEFAULT 'in_coda'
    CHECK (stato IN ('in_coda', 'in_esecuzione', 'completato', 'errore')),
  parametri jsonb NOT NULL DEFAULT '{}',
  lead_trovati int DEFAULT 0,
  errore text,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_lag8_runs_scraper
  ON lag8_scraper_runs (scraper_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_lag8_runs_stato
  ON lag8_scraper_runs (stato);
