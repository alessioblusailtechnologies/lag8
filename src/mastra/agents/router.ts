import { Agent } from '@mastra/core/agent';

export const routerAgent = new Agent({
  id: 'router',
  name: 'Router',
  model: 'anthropic/claude-haiku-4.5',
  instructions: `Sei un classificatore per un CRM di procacciatori. Rispondi con UNA SOLA parola.

REGOLE:
- Se il messaggio riguarda SCRAPING, raccolta automatica di contatti, avvio di un agente di scraping, estrazione lead da fonti esterne (LinkedIn, pagine gialle, siti web) → rispondi "scraper"
- In tutti gli altri casi (gestione lead, pipeline, ricerche, creazioni, aggiornamenti di contatti) → rispondi "crm"

Rispondi SOLO con "scraper" o "crm". Nessun'altra parola.`,
});
