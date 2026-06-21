---
name: French market pivot
description: Strategic pivot of lag8 CRM from Italian to French market — scope, stack, and RGPD posture decisions made on 2026-05-08.
type: project
---

The lag8 CRM is pivoting fully to the French market. No bilingual support — Italian flow is being replaced.

**Why:** strategic decision to focus on FR market for B2B prospection. French regulatory environment (CNIL/RGPD) is more aggressive than Italian, so compliance must be encoded in the agent behavior, not bolted on.

**How to apply:**
- All agent prompts, tool descriptions, UI strings, and lead status enums should be in French (not Italian).
- The pipeline funnel is: SIRENE (discovery, free) → Tavily (signals, already integrated) → Dropcontact (contact email). Pappers is intentionally deferred to a later phase to keep MVP costs at zero for exploration.
- Email finding is **Dropcontact only** — no Kaspr, no scraped sources. RGPD-safe by design.
- Do not propose Italian translations or fallbacks. Do not suggest re-adding Pappers/Kaspr unless explicitly asked.
