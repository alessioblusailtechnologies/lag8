import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';

const SCRAPER_TYPES = ['linkedin', 'pagine_gialle', 'google_maps', 'sito_web', 'custom'] as const;

export const cercaScraper = createTool({
  id: 'cerca-scraper',
  description: 'Elenca gli scraper configurati nel sistema.',
  inputSchema: z.object({
    tipo: z.enum(SCRAPER_TYPES).optional(),
    attivo: z.boolean().optional().describe('Filtra per scraper attivi/disattivati'),
  }),
  outputSchema: z.object({
    scrapers: z.array(z.any()),
    total: z.number(),
  }),
  execute: async (input) => {
    let query = supabaseAdmin.from('lag8_scrapers').select('*', { count: 'exact' });
    if (input.tipo) query = query.eq('tipo', input.tipo);
    if (input.attivo !== undefined) query = query.eq('attivo', input.attivo);
    const { data, error, count } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return { scrapers: data || [], total: count ?? 0 };
  },
});

export const avviaScraper = createTool({
  id: 'avvia-scraper',
  description:
    "Avvia uno scraper per la raccolta di lead. Crea un nuovo run e ritorna l'ID del run. L'esecuzione effettiva è asincrona.",
  inputSchema: z.object({
    scraper_id: z.string().describe('ID dello scraper'),
    parametri: z
      .record(z.string(), z.any())
      .optional()
      .describe('Parametri di run opzionali (es. query, filtri, settore)'),
  }),
  outputSchema: z.object({
    run: z.any(),
  }),
  execute: async (input) => {
    const { data, error } = await supabaseAdmin
      .from('lag8_scraper_runs')
      .insert({
        scraper_id: input.scraper_id,
        parametri: input.parametri || {},
        stato: 'in_coda',
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { run: data };
  },
});
