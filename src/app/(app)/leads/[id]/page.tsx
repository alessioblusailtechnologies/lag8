'use client';

import { useEffect, useState, use } from 'react';
import Topbar from '@/components/topbar/Topbar';
import styles from '../leads.module.scss';

interface Lead {
  id: string;
  nome: string;
  cognome: string;
  email: string | null;
  telefono: string | null;
  azienda: string | null;
  ruolo: string | null;
  citta: string | null;
  status: string;
  fonte: string;
  valore_stimato: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  nuovo: 'Nuovo',
  contattato: 'Contattato',
  qualificato: 'Qualificato',
  cliente: 'Cliente',
  perso: 'Perso',
};

const STATUS_CLASSES: Record<string, string> = {
  nuovo: 'statusNuovo',
  contattato: 'statusContattato',
  qualificato: 'statusQualificato',
  cliente: 'statusCliente',
  perso: 'statusPerso',
};

function formatEuro(n: number | null): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then((r) => r.json())
      .then((data) => setLead(data.lead))
      .finally(() => setLoading(false));
  }, [id]);

  const title = lead ? `${lead.nome} ${lead.cognome}` : 'Lead';

  return (
    <>
      <Topbar
        breadcrumbs={[
          { label: 'CRM', href: '/leads' },
          { label: 'Leads', href: '/leads' },
          { label: title },
        ]}
      />
      <div className={styles.page}>
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loader}>Caricamento...</div>
          ) : !lead ? (
            <div className={styles.empty}>Lead non trovato</div>
          ) : (
            <>
              <div className={styles.header}>
                <div className={styles.titleBlock}>
                  <h1 className={styles.title}>{lead.nome} {lead.cognome}</h1>
                  <p className={styles.subtitle}>
                    {lead.azienda ? `${lead.azienda} · ` : ''}{lead.ruolo || 'Lead'}
                  </p>
                </div>
                <span className={`${styles.statusBadge} ${styles[STATUS_CLASSES[lead.status] || 'statusNuovo']}`}>
                  <span className={styles.statusDot} />
                  {STATUS_LABELS[lead.status] || lead.status}
                </span>
              </div>

              <div className={styles.detailGrid}>
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Informazioni</div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Email</span>
                    <span className={styles.detailValue}>{lead.email || '—'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Telefono</span>
                    <span className={styles.detailValue}>{lead.telefono || '—'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Azienda</span>
                    <span className={styles.detailValue}>{lead.azienda || '—'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Ruolo</span>
                    <span className={styles.detailValue}>{lead.ruolo || '—'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Città</span>
                    <span className={styles.detailValue}>{lead.citta || '—'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Note</span>
                    <span className={styles.detailValue}>{lead.note || '—'}</span>
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardTitle}>Metadati</div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Fonte</span>
                    <span className={styles.detailValue}>{lead.fonte}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Valore stimato</span>
                    <span className={styles.detailValue}>{formatEuro(lead.valore_stimato)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Creato</span>
                    <span className={styles.detailValue}>{formatDate(lead.created_at)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Aggiornato</span>
                    <span className={styles.detailValue}>{formatDate(lead.updated_at)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
