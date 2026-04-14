-- ============================================
-- lag8: Scraper di esempio (opzionale)
-- ============================================

INSERT INTO lag8_scrapers (nome, tipo, descrizione, config, attivo) VALUES
  (
    'LinkedIn - Edilizia Lombardia',
    'linkedin',
    'Raccoglie lead dal settore edilizia in Lombardia con ruolo di decisore (CEO, Direttore, Responsabile)',
    '{"settore": "edilizia", "regione": "Lombardia", "ruoli": ["CEO", "Direttore", "Responsabile"]}'::jsonb,
    true
  ),
  (
    'Pagine Gialle - Ristoranti Milano',
    'pagine_gialle',
    'Scraping di ristoranti milanesi con contatto diretto',
    '{"categoria": "ristoranti", "citta": "Milano"}'::jsonb,
    true
  ),
  (
    'Google Maps - Studi Dentistici',
    'google_maps',
    'Estrae studi dentistici da Google Maps per la zona del nord Italia',
    '{"categoria": "dentisti", "regioni": ["Lombardia", "Veneto", "Piemonte"]}'::jsonb,
    false
  )
ON CONFLICT DO NOTHING;
