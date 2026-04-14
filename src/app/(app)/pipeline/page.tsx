'use client';

import { useEffect, useMemo, useState, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/topbar/Topbar';
import styles from './pipeline.module.scss';

interface Lead {
  id: string;
  nome: string;
  cognome: string;
  azienda: string | null;
  ruolo: string | null;
  email: string | null;
  telefono: string | null;
  status: 'nuovo' | 'contattato' | 'qualificato' | 'cliente' | 'perso';
  fonte: string;
  valore_stimato: number | null;
  updated_at: string;
}

const COLUMNS: Array<{
  key: Lead['status'];
  label: string;
  color: string;
}> = [
  { key: 'nuovo', label: 'Nuovi', color: '#bfdbf7' },
  { key: 'contattato', label: 'Contattati', color: '#1f7a8c' },
  { key: 'qualificato', label: 'Qualificati', color: '#022b3a' },
  { key: 'cliente', label: 'Clienti', color: '#1a7a4a' },
  { key: 'perso', label: 'Persi', color: '#9cb0bc' },
];

function formatEuro(n: number | null): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function PipelinePage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Lead['status'] | null>(null);

  useEffect(() => {
    fetch('/api/pipeline')
      .then((r) => r.json())
      .then((data) => {
        if (data.leads) setLeads(data.leads);
      })
      .finally(() => setLoading(false));
  }, []);

  const byStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const col of COLUMNS) map[col.key] = [];
    for (const l of leads) {
      if (map[l.status]) map[l.status].push(l);
    }
    return map;
  }, [leads]);

  const colTotal = (key: Lead['status']): number => {
    return (byStatus[key] || []).reduce((acc, l) => acc + (l.valore_stimato || 0), 0);
  };

  const moveLead = async (id: string, status: Lead['status']) => {
    const current = leads.find((l) => l.id === id);
    if (!current || current.status === status) return;
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await fetch('/api/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
    } catch {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: current.status } : l)));
    }
  };

  const onDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>, col: Lead['status']) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== col) setDragOverCol(col);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>, col: Lead['status']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    if (id) moveLead(id, col);
    setDraggingId(null);
    setDragOverCol(null);
  };

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'CRM', href: '/leads' }, { label: 'Pipeline' }]} />
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>Pipeline</h1>
              <p className={styles.subtitle}>
                Trascina i lead tra le colonne per aggiornare lo stato del funnel
              </p>
            </div>
          </div>

          {loading ? (
            <div className={styles.loader}>Caricamento...</div>
          ) : (
            <div className={styles.board}>
              {COLUMNS.map((col) => {
                const items = byStatus[col.key] || [];
                return (
                  <div
                    key={col.key}
                    className={`${styles.column} ${dragOverCol === col.key ? styles.dragOver : ''}`}
                    onDragOver={(e) => onDragOver(e, col.key)}
                    onDrop={(e) => onDrop(e, col.key)}
                    onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
                  >
                    <div className={styles.columnHeader}>
                      <div className={styles.columnTitle}>
                        <span className={styles.columnDot} style={{ background: col.color }} />
                        {col.label}
                      </div>
                      <span className={styles.columnCount}>{items.length}</span>
                    </div>
                    <div className={styles.columnValue}>
                      {formatEuro(colTotal(col.key))}
                    </div>
                    <div className={styles.columnList}>
                      {items.length === 0 ? (
                        <div className={styles.emptyCol}>Nessun lead</div>
                      ) : (
                        items.map((lead) => (
                          <div
                            key={lead.id}
                            className={`${styles.leadCard} ${draggingId === lead.id ? styles.dragging : ''}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, lead.id)}
                            onDragEnd={onDragEnd}
                            onClick={() => router.push(`/leads/${lead.id}`)}
                          >
                            <div className={styles.leadName}>{lead.nome} {lead.cognome}</div>
                            {lead.azienda && <div className={styles.leadCompany}>{lead.azienda}</div>}
                            <div className={styles.leadFooter}>
                              <span className={styles.leadValue}>{formatEuro(lead.valore_stimato)}</span>
                              <span className={styles.leadFonte}>{lead.fonte}</span>
                            </div>
                          </div>
                        ))
                      )}
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
