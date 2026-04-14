import { Mastra } from '@mastra/core';
import { routerAgent } from './agents/router';
import { crmAgent } from './agents/crm';
import { scraperAgent } from './agents/scraper';
import { titlerAgent } from './agents/titler';

export const mastra = new Mastra({
  agents: {
    router: routerAgent,
    crm: crmAgent,
    scraper: scraperAgent,
    titler: titlerAgent,
  },
});
