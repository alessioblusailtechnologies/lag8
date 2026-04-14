# lag8.ai

CRM verticale per procacciatori: gestione lead, pipeline e scraper AI.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript + SCSS Modules
- Supabase (prefisso tabelle: `lag8_`)
- Mastra (agenti AI)
- Hugeicons

## Setup

```bash
npm install
cp .env.local.example .env.local # e compila le chiavi
npm run dev
```

## Variabili ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
TAVILY_API_KEY=
```

## Database

Esegui gli script in `scripts/` nell'ordine 001 → 006 nel SQL Editor Supabase.

## Sezioni

- **Assistente** — chat con agenti Mastra (router + CRM agent + titler)
- **Leads** — anagrafica contatti generati da scraper o inserimento manuale
- **Scrapers** — agenti di scraping che inseriscono automaticamente lead
- **Pipeline** — board kanban per gestire i lead attraverso gli stati del funnel
