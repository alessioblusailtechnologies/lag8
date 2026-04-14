'use client';

import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Robot02Icon,
  PlayIcon,
  Add01Icon,
  Settings02Icon,
  Linkedin01Icon,
  GoogleMapsIcon,
  Globe02Icon,
  Book01Icon,
} from '@hugeicons/core-free-icons';
import Topbar from '@/components/topbar/Topbar';
import styles from './scrapers.module.scss';

interface ScraperRun {
  id: string;
  stato: string;
  started_at: string;
  lead_trovati: number | null;
}

interface Scraper {
  id: string;
  nome: string;
  tipo: 'linkedin' | 'pagine_gialle' | 'google_maps' | 'sito_web' | 'custom';
  descrizione: string | null;
  config: Record<string, unknown>;
  attivo: boolean;
  created_at: string;
  lag8_scraper_runs?: ScraperRun[];
}

const TYPE_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  pagine_gialle: 'Pagine Gialle',
  google_maps: 'Google Maps',
  sito_web: 'Sito Web',
  custom: 'Custom',
};

const TYPE_ICONS: Record<string, typeof Robot02Icon> = {
  linkedin: Linkedin01Icon,
  pagine_gialle: Book01Icon,
  google_maps: GoogleMapsIcon,
  sito_web: Globe02Icon,
  custom: Robot02Icon,
};

export default function ScrapersPage() {
  const [scrapers, setScrapers] = useState<Scraper[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/scrapers')
      .then((r) => r.json())
      .then((data) => {
        if (data.scrapers) setScrapers(data.scrapers);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const runScraper = async (id: string) => {
    setRunning(id);
    try {
      await fetch(`/api/scrapers/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      load();
    } finally {
      setRunning(null);
    }
  };

  const totalLeadsFromScraper = (s: Scraper): number => {
    return (s.lag8_scraper_runs || []).reduce((acc, r) => acc + (r.lead_trovati || 0), 0);
  };

  const runsCount = (s: Scraper): number => (s.lag8_scraper_runs || []).length;

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'CRM', href: '/leads' }, { label: 'Scrapers' }]} />
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>Scrapers</h1>
              <p className={styles.subtitle}>
                Agenti automatici che raccolgono lead dalle fonti configurate
              </p>
            </div>
            <button className={styles.primaryBtn}>
              <HugeiconsIcon icon={Add01Icon} size={15} color="currentColor" strokeWidth={2} />
              Nuovo scraper
            </button>
          </div>

          {loading ? (
            <div className={styles.loader}>Caricamento...</div>
          ) : scrapers.length === 0 ? (
            <div className={styles.empty}>
              Nessuno scraper configurato. Crea il primo per iniziare a raccogliere lead automaticamente.
            </div>
          ) : (
            <div className={styles.grid}>
              {scrapers.map((s) => {
                const Icon = TYPE_ICONS[s.tipo] || Robot02Icon;
                return (
                  <div key={s.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div className={styles.iconBox}>
                        <HugeiconsIcon icon={Icon} size={22} color="currentColor" strokeWidth={1.8} />
                      </div>
                      <div className={styles.cardName}>
                        <div className={styles.cardTitle}>{s.nome}</div>
                        <div className={styles.cardType}>{TYPE_LABELS[s.tipo] || s.tipo}</div>
                      </div>
                      <div className={s.attivo ? styles.activeDot : styles.inactiveDot} />
                    </div>

                    <div className={styles.cardDesc}>
                      {s.descrizione || 'Nessuna descrizione'}
                    </div>

                    <div className={styles.cardStats}>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>Run totali</span>
                        <span className={styles.statValue}>{runsCount(s)}</span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>Lead raccolti</span>
                        <span className={styles.statValue}>{totalLeadsFromScraper(s)}</span>
                      </div>
                    </div>

                    <div className={styles.cardActions}>
                      <button
                        className={styles.runBtn}
                        onClick={() => runScraper(s.id)}
                        disabled={running === s.id || !s.attivo}
                      >
                        <HugeiconsIcon icon={PlayIcon} size={14} color="currentColor" strokeWidth={2} />
                        {running === s.id ? 'Avvio...' : 'Avvia'}
                      </button>
                      <button className={styles.secondaryBtn}>
                        <HugeiconsIcon icon={Settings02Icon} size={14} color="currentColor" strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
