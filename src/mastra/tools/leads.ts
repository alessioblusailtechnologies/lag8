import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';

const STATUS_VALUES = ['nuovo', 'contattato', 'qualificato', 'cliente', 'perso'] as const;
const FONTE_VALUES = ['manuale', 'scraper', 'assistente', 'referral', 'import'] as const;

export const cercaLead = createTool({
  id: 'cerca-lead',
  description:
    "Cerca lead nel CRM. Tutti i filtri sono opzionali: senza filtri ritorna i lead più recenti. Supporta paginazione con limit/offset.",
  inputSchema: z.object({
    nome: z.string().optional().describe('Nome del lead (match parziale)'),
    cognome: z.string().optional().describe('Cognome del lead (match parziale)'),
    email: z.string().optional().describe('Email del lead (match parziale)'),
    telefono: z.string().optional().describe('Telefono (match parziale)'),
    azienda: z.string().optional().describe('Azienda (match parziale)'),
    status: z.enum(STATUS_VALUES).optional().describe('Stato del lead'),
    fonte: z.enum(FONTE_VALUES).optional().describe('Fonte del lead'),
    limit: z.number().int().min(1).max(100).default(10),
    offset: z.number().int().min(0).default(0),
  }),
  outputSchema: z.object({
    leads: z.array(z.any()),
    count: z.number(),
    total: z.number(),
  }),
  execute: async (input) => {
    let query = supabaseAdmin.from('lag8_leads').select('*', { count: 'exact' });

    if (input.nome) query = query.ilike('nome', `%${input.nome}%`);
    if (input.cognome) query = query.ilike('cognome', `%${input.cognome}%`);
    if (input.email) query = query.ilike('email', `%${input.email}%`);
    if (input.telefono) query = query.ilike('telefono', `%${input.telefono}%`);
    if (input.azienda) query = query.ilike('azienda', `%${input.azienda}%`);
    if (input.status) query = query.eq('status', input.status);
    if (input.fonte) query = query.eq('fonte', input.fonte);

    const limit = input.limit ?? 10;
    const offset = input.offset ?? 0;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);
    return {
      leads: data || [],
      count: data?.length || 0,
      total: count ?? 0,
    };
  },
});

export const getLead = createTool({
  id: 'get-lead',
  description: 'Recupera i dettagli di un lead dato il suo ID.',
  inputSchema: z.object({
    id: z.string().describe('ID del lead (UUID)'),
  }),
  outputSchema: z.object({
    lead: z.any().nullable(),
  }),
  execute: async (input) => {
    const { data, error } = await supabaseAdmin
      .from('lag8_leads')
      .select('*')
      .eq('id', input.id)
      .single();

    if (error) throw new Error(error.message);
    return { lead: data };
  },
});

export const creaLead = createTool({
  id: 'crea-lead',
  description: 'Crea un nuovo lead nel CRM. Richiede almeno nome e cognome.',
  inputSchema: z.object({
    nome: z.string().describe('Nome'),
    cognome: z.string().describe('Cognome'),
    email: z.string().optional(),
    telefono: z.string().optional(),
    azienda: z.string().optional().describe('Nome azienda'),
    ruolo: z.string().optional().describe('Ruolo aziendale del lead'),
    citta: z.string().optional(),
    status: z.enum(STATUS_VALUES).default('nuovo'),
    fonte: z.enum(FONTE_VALUES).default('assistente'),
    valore_stimato: z.number().optional().describe('Valore potenziale del deal in euro'),
    note: z.string().optional(),
  }),
  outputSchema: z.object({
    lead: z.any(),
  }),
  execute: async (input) => {
    const { data, error } = await supabaseAdmin
      .from('lag8_leads')
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { lead: data };
  },
});

export const aggiornaLead = createTool({
  id: 'aggiorna-lead',
  description: "Aggiorna i dati di un lead esistente. Tutti i campi sono opzionali tranne l'ID.",
  inputSchema: z.object({
    id: z.string().describe('ID del lead'),
    nome: z.string().optional(),
    cognome: z.string().optional(),
    email: z.string().optional(),
    telefono: z.string().optional(),
    azienda: z.string().optional(),
    ruolo: z.string().optional(),
    citta: z.string().optional(),
    status: z.enum(STATUS_VALUES).optional(),
    fonte: z.enum(FONTE_VALUES).optional(),
    valore_stimato: z.number().optional(),
    note: z.string().optional(),
  }),
  outputSchema: z.object({
    lead: z.any(),
  }),
  execute: async (input) => {
    const { id, ...updates } = input;
    const { data, error } = await supabaseAdmin
      .from('lag8_leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { lead: data };
  },
});

export const spostaLead = createTool({
  id: 'sposta-lead',
  description: "Sposta un lead a un nuovo stato della pipeline.",
  inputSchema: z.object({
    id: z.string().describe('ID del lead'),
    status: z.enum(STATUS_VALUES).describe('Nuovo stato della pipeline'),
  }),
  outputSchema: z.object({
    lead: z.any(),
  }),
  execute: async (input) => {
    const { data, error } = await supabaseAdmin
      .from('lag8_leads')
      .update({ status: input.status, updated_at: new Date().toISOString() })
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { lead: data };
  },
});

export const contaLead = createTool({
  id: 'conta-lead',
  description:
    'Conta quanti lead rispettano i filtri dati. Senza filtri restituisce il totale.',
  inputSchema: z.object({
    status: z.enum(STATUS_VALUES).optional(),
    fonte: z.enum(FONTE_VALUES).optional(),
    azienda: z.string().optional(),
  }),
  outputSchema: z.object({
    total: z.number(),
  }),
  execute: async (input) => {
    let query = supabaseAdmin.from('lag8_leads').select('id', { count: 'exact', head: true });
    if (input.status) query = query.eq('status', input.status);
    if (input.fonte) query = query.eq('fonte', input.fonte);
    if (input.azienda) query = query.ilike('azienda', `%${input.azienda}%`);
    const { error, count } = await query;
    if (error) throw new Error(error.message);
    return { total: count ?? 0 };
  },
});

export const eliminaLead = createTool({
  id: 'elimina-lead',
  description:
    "Elimina definitivamente un lead dal CRM. Usare solo su conferma esplicita dell'utente.",
  inputSchema: z.object({
    id: z.string().describe('ID del lead'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    id: z.string(),
  }),
  execute: async (input) => {
    const { error } = await supabaseAdmin.from('lag8_leads').delete().eq('id', input.id);
    if (error) throw new Error(error.message);
    return { success: true, id: input.id };
  },
});
