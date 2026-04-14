'use client';

import { useEffect, useState, useMemo, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, UserAdd01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import Topbar from '@/components/topbar/Topbar';
import styles from './leads.module.scss';

interface Lead {
  id: string;
  nome: string;
  cognome: string;
  email: string | null;
  telefono: string | null;
  azienda: string | null;
  ruolo: string | null;
  citta: string | null;
  status: 'nuovo' | 'contattato' | 'qualificato' | 'cliente' | 'perso';
  fonte: string;
  valore_stimato: number | null;
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

function initials(p: Lead): string {
  const n = p.nome?.charAt(0) || '';
  const c = p.cognome?.charAt(0) || '';
  return (n + c).toUpperCase() || '?';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatEuro(n: number | null): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

const EMPTY_FORM = {
  nome: '',
  cognome: '',
  email: '',
  telefono: '',
  azienda: '',
  ruolo: '',
  citta: '',
  fonte: 'manuale',
  valore_stimato: '',
  note: '',
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadLeads = () => {
    setLoading(true);
    fetch('/api/leads')
      .then((r) => r.json())
      .then((data) => {
        if (data.leads) setLeads(data.leads);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const updateField = (field: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.cognome.trim()) {
      setFormError('Nome e cognome sono obbligatori');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        nome: form.nome.trim(),
        cognome: form.cognome.trim(),
        email: form.email.trim() || null,
        telefono: form.telefono.trim() || null,
        azienda: form.azienda.trim() || null,
        ruolo: form.ruolo.trim() || null,
        citta: form.citta.trim() || null,
        fonte: form.fonte,
        valore_stimato: form.valore_stimato ? Number(form.valore_stimato) : null,
        note: form.note.trim() || null,
      };
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante il salvataggio');
      setModalOpen(false);
      loadLeads();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (p) =>
        p.nome?.toLowerCase().includes(q) ||
        p.cognome?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.telefono?.toLowerCase().includes(q) ||
        p.azienda?.toLowerCase().includes(q),
    );
  }, [leads, search]);

  return (
    <>
      <Topbar breadcrumbs={[{ label: 'CRM', href: '/leads' }, { label: 'Leads' }]} />
      <div className={styles.page}>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>
                Leads
                {!loading && <span className={styles.countBadge}>{filtered.length}</span>}
              </h1>
              <p className={styles.subtitle}>
                Anagrafica completa dei contatti nel CRM
              </p>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.searchBox}>
                <HugeiconsIcon icon={Search01Icon} size={15} color="currentColor" strokeWidth={1.5} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Cerca per nome, email, azienda..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className={styles.primaryBtn} onClick={openModal}>
                <HugeiconsIcon icon={UserAdd01Icon} size={15} color="currentColor" strokeWidth={1.8} />
                Nuovo lead
              </button>
            </div>
          </div>

          <div className={styles.tableCard}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Lead</th>
                    <th className={styles.th}>Azienda</th>
                    <th className={styles.th}>Contatti</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Fonte</th>
                    <th className={styles.th}>Valore</th>
                    <th className={styles.th}>Creato</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className={styles.loader}>Caricamento...</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.empty}>
                        {search ? 'Nessun risultato' : 'Nessun lead nel CRM'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr
                        key={p.id}
                        className={styles.tr}
                        onClick={() => router.push(`/leads/${p.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className={styles.td}>
                          <div className={styles.nameCell}>
                            <div className={styles.avatar}>{initials(p)}</div>
                            <div className={styles.nameText}>
                              <div className={styles.fullName}>
                                {p.nome} {p.cognome}
                              </div>
                              {p.ruolo && <div className={styles.sub}>{p.ruolo}</div>}
                            </div>
                          </div>
                        </td>
                        <td className={styles.td}>
                          {p.azienda || <span className={styles.muted}>—</span>}
                          {p.citta && <div className={styles.sub}>{p.citta}</div>}
                        </td>
                        <td className={styles.td}>
                          <div>{p.email || <span className={styles.muted}>—</span>}</div>
                          {p.telefono && <div className={styles.sub}>{p.telefono}</div>}
                        </td>
                        <td className={styles.td}>
                          <span className={`${styles.statusBadge} ${styles[STATUS_CLASSES[p.status]]}`}>
                            <span className={styles.statusDot} />
                            {STATUS_LABELS[p.status] || p.status}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.fonteBadge}>{p.fonte}</span>
                        </td>
                        <td className={`${styles.td} ${styles.valueCell}`}>
                          {formatEuro(p.valore_stimato)}
                        </td>
                        <td className={`${styles.td} ${styles.dateCell}`}>
                          {formatDate(p.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Nuovo lead</h2>
                <p className={styles.modalSubtitle}>
                  Inserisci i dati del contatto. Nome e cognome sono obbligatori.
                </p>
              </div>
              <button className={styles.modalClose} onClick={closeModal} disabled={saving}>
                <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.8} />
              </button>
            </div>

            <form onSubmit={onSubmit} className={styles.modalForm}>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Nome *</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    value={form.nome}
                    onChange={(e) => updateField('nome', e.target.value)}
                    placeholder="Mario"
                    required
                    autoFocus
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Cognome *</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    value={form.cognome}
                    onChange={(e) => updateField('cognome', e.target.value)}
                    placeholder="Rossi"
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Email</label>
                  <input
                    className={styles.formInput}
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="mario.rossi@esempio.it"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Telefono</label>
                  <input
                    className={styles.formInput}
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => updateField('telefono', e.target.value)}
                    placeholder="333 1234567"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Azienda</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    value={form.azienda}
                    onChange={(e) => updateField('azienda', e.target.value)}
                    placeholder="Acme S.r.l."
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Ruolo</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    value={form.ruolo}
                    onChange={(e) => updateField('ruolo', e.target.value)}
                    placeholder="CEO, Responsabile, …"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Città</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    value={form.citta}
                    onChange={(e) => updateField('citta', e.target.value)}
                    placeholder="Milano"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Valore stimato (€)</label>
                  <input
                    className={styles.formInput}
                    type="number"
                    min="0"
                    step="100"
                    value={form.valore_stimato}
                    onChange={(e) => updateField('valore_stimato', e.target.value)}
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Fonte</label>
                <select
                  className={styles.formInput}
                  value={form.fonte}
                  onChange={(e) => updateField('fonte', e.target.value)}
                >
                  <option value="manuale">Manuale</option>
                  <option value="scraper">Scraper</option>
                  <option value="assistente">Assistente</option>
                  <option value="referral">Referral</option>
                  <option value="import">Import</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Note</label>
                <textarea
                  className={styles.formTextarea}
                  rows={3}
                  value={form.note}
                  onChange={(e) => updateField('note', e.target.value)}
                  placeholder="Informazioni aggiuntive, contesto del primo contatto, ecc."
                />
              </div>

              {formError && <div className={styles.formError}>{formError}</div>}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={closeModal}
                  disabled={saving}
                >
                  Annulla
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={saving}>
                  {saving ? 'Salvataggio...' : 'Crea lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
