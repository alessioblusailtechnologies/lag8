import { NextRequest } from 'next/server';
import { mastra } from '@/mastra';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/rate-limit';

// Each chat request fans out to up to 3 model calls (titler + router + the
// streaming CRM/scraper agent with tool steps), so cap how often it can fire.
const CHAT_RATE_LIMIT = 20; // requests
const CHAT_RATE_WINDOW_MS = 60_000; // per minute, per user/IP

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conversation_id, message, user_id } = body;

  if (!message?.trim()) {
    return Response.json({ error: 'message is required' }, { status: 400 });
  }

  // Best-effort throttle keyed by authenticated user, falling back to client IP.
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const limit = rateLimit(`chat:${user_id || ip}`, CHAT_RATE_LIMIT, CHAT_RATE_WINDOW_MS);
  if (!limit.ok) {
    return Response.json(
      { error: `Troppe richieste. Riprova tra ${limit.retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  let convId = conversation_id;
  let titlerPromise: Promise<string | null> | null = null;

  if (!convId) {
    const fallbackTitle = message.slice(0, 80) + (message.length > 80 ? '...' : '');
    const { data: conv, error: convErr } = await supabaseAdmin
      .from('lag8_conversations')
      .insert({ title: fallbackTitle, user_id: user_id || null })
      .select('id')
      .single();

    if (convErr) {
      return Response.json({ error: convErr.message }, { status: 500 });
    }
    convId = conv.id;

    const newConvId = convId;
    titlerPromise = (async () => {
      try {
        const titler = mastra.getAgent('titler');
        const result = await titler.generate(message);
        const generatedTitle = result.text?.trim().replace(/^["']|["']$/g, '').slice(0, 80);
        if (generatedTitle && generatedTitle.length > 0) {
          await supabaseAdmin
            .from('lag8_conversations')
            .update({ title: generatedTitle })
            .eq('id', newConvId);
          return generatedTitle;
        }
      } catch {
        // keep fallback
      }
      return null;
    })();
  }

  await supabaseAdmin
    .from('lag8_messages')
    .insert({ conversation_id: convId, role: 'user', content: message.trim() });

  const { data: history } = await supabaseAdmin
    .from('lag8_messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true });

  const rawHistory = history || [];
  const messages = rawHistory.map((m, idx) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
    ...(idx === rawHistory.length - 1
      ? { providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } } }
      : {}),
  }));

  let agentType: string;
  try {
    const router = mastra.getAgent('router');
    const routeResult = await router.generate(message);
    const routeText = routeResult.text?.trim().toLowerCase() || '';
    agentType = routeText.includes('scraper') ? 'scraper' : 'crm';
  } catch {
    agentType = 'crm';
  }

  const agent = mastra.getAgent(agentType as 'crm' | 'scraper');

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      try {
        const result = await agent.stream(messages, {
          maxSteps: 10,
          modelSettings: { temperature: undefined },
        });

        let fullText = '';
        let postToolBreakPending = false;

        for await (const chunk of result.fullStream) {
          const c = chunk as { type: string; payload?: Record<string, unknown> };

          if (c.type === 'text-delta') {
            let text = (c.payload?.text as string) || '';
            if (postToolBreakPending && text.length > 0) {
              postToolBreakPending = false;
              if (fullText.length > 0) {
                const tailNewlines = (fullText.match(/\n*$/)?.[0] || '').length;
                const headNewlines = (text.match(/^\n*/)?.[0] || '').length;
                const missing = 2 - (tailNewlines + headNewlines);
                if (missing > 0) text = '\n'.repeat(missing) + text;
              }
            }
            fullText += text;
            send({ type: 'text', content: text });
          } else if (c.type === 'tool-call') {
            postToolBreakPending = true;
            send({
              type: 'tool_call',
              tool_name: c.payload?.toolName,
              tool_call_id: c.payload?.toolCallId,
            });
          } else if (c.type === 'tool-result') {
            postToolBreakPending = true;
            send({
              type: 'tool_result',
              tool_name: c.payload?.toolName,
              tool_call_id: c.payload?.toolCallId,
            });
          } else if (c.type === 'reasoning-delta') {
            const text = (c.payload?.text as string) || '';
            send({ type: 'reasoning', content: text });
          }
        }

        if (fullText.trim()) {
          await supabaseAdmin.from('lag8_messages').insert({
            conversation_id: convId,
            role: 'assistant',
            content: fullText.trim(),
          });
        }

        let title: string | null = null;
        if (titlerPromise) {
          title = await titlerPromise;
        }

        send({ type: 'done', conversation_id: convId, title });
        controller.close();
      } catch (err) {
        const raw = err instanceof Error ? err.message : '';
        // Surface upstream rate-limit / overload (429/529) as a friendly message.
        const isRateOrOverload = /rate.?limit|\b429\b|overloaded|\b529\b/i.test(raw);
        const errorMsg = isRateOrOverload
          ? 'Il servizio AI è temporaneamente sovraccarico. Riprova tra qualche secondo.'
          : raw || 'Errore durante la generazione della risposta';
        let title: string | null = null;
        if (titlerPromise) {
          try {
            title = await titlerPromise;
          } catch {}
        }
        send({ type: 'error', content: errorMsg, conversation_id: convId, title });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
