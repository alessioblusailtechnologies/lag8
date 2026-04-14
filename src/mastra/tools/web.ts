import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const TAVILY_ENDPOINT = 'https://api.tavily.com';

function getTavilyKey(): string {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    throw new Error(
      'TAVILY_API_KEY non configurata. Aggiungi la chiave in .env.local per usare la ricerca web.',
    );
  }
  return key;
}

export const cercaWeb = createTool({
  id: 'cerca-web',
  description:
    "Cerca informazioni aggiornate su internet tramite Tavily. Usa per trovare aziende, persone, notizie, siti web, email pubbliche, descrizioni di business. Ritorna snippet già ripuliti e pronti da leggere — niente HTML.",
  inputSchema: z.object({
    query: z
      .string()
      .describe('Query in linguaggio naturale (es. "CEO di Acme SRL Milano contatto")'),
    profondita: z
      .enum(['basic', 'advanced'])
      .default('basic')
      .describe('basic = veloce/economica, advanced = risultati più accurati'),
    max_risultati: z.number().int().min(1).max(10).default(5),
    domini_inclusi: z
      .array(z.string())
      .optional()
      .describe('Restringi la ricerca a questi domini (es. ["linkedin.com"])'),
    domini_esclusi: z.array(z.string()).optional(),
  }),
  outputSchema: z.object({
    query: z.string(),
    risposta: z.string().nullable().describe('Risposta sintetica generata da Tavily, se disponibile'),
    risultati: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        content: z.string(),
        score: z.number().optional(),
      }),
    ),
  }),
  execute: async (input) => {
    const res = await fetch(`${TAVILY_ENDPOINT}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: getTavilyKey(),
        query: input.query,
        search_depth: input.profondita,
        max_results: input.max_risultati,
        include_answer: true,
        include_raw_content: false,
        include_domains: input.domini_inclusi,
        exclude_domains: input.domini_esclusi,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Tavily search error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as {
      query?: string;
      answer?: string | null;
      results?: Array<{ title: string; url: string; content: string; score?: number }>;
    };

    return {
      query: data.query ?? input.query,
      risposta: data.answer ?? null,
      risultati: (data.results ?? []).map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
      })),
    };
  },
});

export const estraiContenuto = createTool({
  id: 'estrai-contenuto',
  description:
    'Estrae il contenuto testuale pulito da una o più URL tramite Tavily. Usa quando hai già una URL specifica e vuoi leggerne il contenuto (es. pagina aziendale, profilo pubblico, articolo).',
  inputSchema: z.object({
    urls: z
      .array(z.string().url())
      .min(1)
      .max(5)
      .describe('Elenco di URL da cui estrarre il contenuto (massimo 5)'),
    profondita: z.enum(['basic', 'advanced']).default('basic'),
  }),
  outputSchema: z.object({
    risultati: z.array(
      z.object({
        url: z.string(),
        contenuto: z.string(),
      }),
    ),
    falliti: z.array(z.string()),
  }),
  execute: async (input) => {
    const res = await fetch(`${TAVILY_ENDPOINT}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: getTavilyKey(),
        urls: input.urls,
        extract_depth: input.profondita,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Tavily extract error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as {
      results?: Array<{ url: string; raw_content?: string }>;
      failed_results?: Array<{ url?: string } | string>;
    };

    return {
      risultati: (data.results ?? []).map((r) => ({
        url: r.url,
        contenuto: r.raw_content ?? '',
      })),
      falliti: (data.failed_results ?? []).map((r) =>
        typeof r === 'string' ? r : r.url ?? '',
      ),
    };
  },
});
