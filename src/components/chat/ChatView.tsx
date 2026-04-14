'use client';

import { useState, useRef, useEffect, useMemo, useCallback, KeyboardEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Attachment01Icon,
  Globe02Icon,
  ArrowUp02Icon,
  UserAdd01Icon,
  Search01Icon,
  WorkflowCircle01Icon,
  Robot02Icon,
} from '@hugeicons/core-free-icons';
import { useAuth } from '@/contexts/AuthContext';
import MarkdownRenderer from './MarkdownRenderer';
import Topbar, { type BreadcrumbItem } from '@/components/topbar/Topbar';
import styles from './chat.module.scss';

interface QuickAction {
  label: string;
  icon: typeof UserAdd01Icon;
}

const quickActions: QuickAction[] = [
  { label: 'Nuovo Lead', icon: UserAdd01Icon },
  { label: 'Cerca Lead', icon: Search01Icon },
  { label: 'Avvia Scraper', icon: Robot02Icon },
  { label: 'Sposta in Pipeline', icon: WorkflowCircle01Icon },
];

interface ExampleCard {
  icon: typeof UserAdd01Icon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  prompt: string;
}

const examples: ExampleCard[] = [
  {
    icon: UserAdd01Icon,
    iconBg: '#e1e5f2',
    iconColor: '#022b3a',
    title: 'Gestione Lead',
    description:
      'Registra un nuovo lead manualmente o aggiorna lo stato di un contatto esistente, assegnalo a una pipeline.',
    prompt: 'Crea un nuovo lead: Mario Rossi, mario.rossi@email.it, 3331234567, fonte LinkedIn',
  },
  {
    icon: Robot02Icon,
    iconBg: '#bfdbf7',
    iconColor: '#1f7a8c',
    title: 'Scraping automatico',
    description:
      'Avvia uno scraper per raccogliere nuovi contatti dalle fonti configurate e inserirli nel CRM.',
    prompt: 'Avvia lo scraper LinkedIn per il settore edilizia in Lombardia',
  },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const TOOL_LABELS: Record<string, string> = {
  cercaLead: 'Ricerca lead in archivio',
  contaLead: 'Conteggio lead nel CRM',
  getLead: 'Recupero dati del lead',
  creaLead: 'Registrazione nuovo lead',
  aggiornaLead: 'Aggiornamento dati lead',
  eliminaLead: 'Rimozione lead dal CRM',
  spostaLead: 'Spostamento in pipeline',
  cercaScraper: 'Ricerca scraper configurati',
  avviaScraper: 'Avvio dello scraper',
  getPipeline: 'Recupero pipeline',
  cercaWeb: 'Ricerca sul web',
  estraiContenuto: 'Estrazione contenuto da URL',
};

function describeTool(toolName: string): string {
  return TOOL_LABELS[toolName] || 'Elaborazione in corso';
}

const IDLE_PHRASES: readonly string[] = [
  'Ragionamento in corso',
  'Analisi della richiesta',
  'Valutazione del contesto',
  'Elaborazione delle informazioni',
  'Preparazione della risposta',
  'Connessione dei dati',
];

function randomIdlePhrase(exclude?: string | null): string {
  const pool = exclude ? IDLE_PHRASES.filter((p) => p !== exclude) : IDLE_PHRASES;
  return pool[Math.floor(Math.random() * pool.length)];
}

interface ChatViewProps {
  initialConversationId?: string;
}

export default function ChatView({ initialConversationId }: ChatViewProps) {
  const { profile } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId ?? null);
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const isIdlePhraseRef = useRef(false);
  const [loading, setLoading] = useState(!!initialConversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialConversationId) return;
    setLoading(true);
    fetch(`/api/messages?conversation_id=${initialConversationId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) setChatMessages(data.messages);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });
  }, [initialConversationId]);

  const userName = useMemo(() => {
    const name = profile?.full_name;
    if (name) return name.split(' ')[0];
    return 'Alessio';
  }, [profile]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 13 ? 'Buongiorno' : 'Buonasera';
  }, []);

  const onInput = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    setMessage(target.value);
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || sending) return;
    setSending(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setMessage('');
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    isIdlePhraseRef.current = true;
    setThinkingStatus(randomIdlePhrase());

    const idleRotationTimer = setInterval(() => {
      if (isIdlePhraseRef.current) {
        setThinkingStatus((prev) => randomIdlePhrase(prev));
      }
    }, 2200);

    const botId = crypto.randomUUID();
    setChatMessages((prev) => [
      ...prev,
      { id: botId, role: 'assistant', content: '', created_at: new Date().toISOString() },
    ]);
    setStreaming(true);

    let receivedText = '';
    let displayedText = '';
    let streamDone = false;
    let doneConvId: string | null = null;

    const QUIET_MS = 700;
    let idleReturnTimer: ReturnType<typeof setTimeout> | null = null;
    const cancelIdleReturn = () => {
      if (idleReturnTimer) {
        clearTimeout(idleReturnTimer);
        idleReturnTimer = null;
      }
    };
    const scheduleIdleReturn = () => {
      cancelIdleReturn();
      idleReturnTimer = setTimeout(() => {
        if (!streamDone) {
          isIdlePhraseRef.current = true;
          setThinkingStatus(randomIdlePhrase());
        }
      }, QUIET_MS);
    };

    let lastTime = performance.now();
    const CHARS_PER_MS = 0.4;
    let rafId = 0;

    const tick = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      if (displayedText.length < receivedText.length) {
        const charsToAdd = Math.max(1, Math.floor(delta * CHARS_PER_MS));
        const end = Math.min(displayedText.length + charsToAdd, receivedText.length);
        displayedText = receivedText.slice(0, end);
      }

      if (!streamDone || displayedText.length < receivedText.length) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);

    let lastFlushedLen = 0;
    const flushTimer = setInterval(() => {
      if (displayedText.length > lastFlushedLen) {
        lastFlushedLen = displayedText.length;
        const snapshot = displayedText;
        setChatMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, content: snapshot } : m)),
        );
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }

      if (streamDone && displayedText.length >= receivedText.length && displayedText.length === lastFlushedLen) {
        clearInterval(flushTimer);
        clearInterval(idleRotationTimer);
        cancelIdleReturn();
        cancelAnimationFrame(rafId);
        setChatMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, content: receivedText } : m)),
        );
        setStreaming(false);
        setSending(false);
        isIdlePhraseRef.current = false;
        setThinkingStatus(null);
        if (doneConvId && !conversationId) {
          setConversationId(doneConvId);
          if (!initialConversationId) {
            router.replace(`/assistente/${doneConvId}`);
          }
        }
        window.dispatchEvent(new CustomEvent('lag8:conversations-updated'));
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: content.trim(),
          user_id: profile?.id || null,
        }),
      });

      if (!res.ok) throw new Error('Errore nella risposta');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let sseBuffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\n\n');
          sseBuffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'text') {
                receivedText += data.content;
                if (receivedText.length > 0) {
                  isIdlePhraseRef.current = false;
                  setThinkingStatus(null);
                  scheduleIdleReturn();
                }
              } else if (data.type === 'tool_call') {
                cancelIdleReturn();
                isIdlePhraseRef.current = false;
                setThinkingStatus(describeTool(data.tool_name || ''));
              } else if (data.type === 'tool_result') {
                // brief status, cleared by next chunk
              } else if (data.type === 'done' && data.conversation_id) {
                doneConvId = data.conversation_id;
              } else if (data.type === 'error') {
                receivedText += `\n\nErrore: ${data.content}`;
              }
            } catch {
              // skip malformed
            }
          }
        }
      }
    } catch {
      receivedText = receivedText || 'Mi dispiace, si è verificato un errore. Riprova.';
    } finally {
      streamDone = true;
    }
  }, [sending, conversationId, profile, initialConversationId, router]);

  const onSend = useCallback(() => {
    sendMessage(message);
  }, [message, sendMessage]);

  const onKeydown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);

  const onQuickAction = useCallback((action: QuickAction) => {
    setMessage(action.label + ': ');
  }, []);

  const onExample = useCallback((example: ExampleCard) => {
    sendMessage(example.prompt);
  }, [sendMessage]);

  const hasMessages = chatMessages.length > 0 || loading;

  const chatTitle = useMemo(() => {
    const first = chatMessages.find((m) => m.role === 'user');
    if (!first) return 'Nuova chat';
    return first.content.length > 50 ? first.content.slice(0, 50) + '...' : first.content;
  }, [chatMessages]);

  const breadcrumbs = useMemo(() => {
    const items: BreadcrumbItem[] = [{ label: 'Assistente', href: '/assistente' }];
    if (hasMessages) items.push({ label: chatTitle });
    return items;
  }, [hasMessages, chatTitle]);

  return (
    <>
      <Topbar breadcrumbs={breadcrumbs} />
      <div className={`${styles.assistantPage} ${hasMessages ? styles.chatMode : ''}`}>
        <div className={styles.assistantContainer}>
          {!hasMessages && (
            <div className={styles.greetingSection}>
              <h1 className={styles.greetingTitle}>
                {greeting}, {userName}
              </h1>
              <p className={styles.greetingSubtitle}>
                Il tuo assistente procacciatore è pronto. Come posso aiutarti oggi?
              </p>
            </div>
          )}

          {hasMessages && (
            <div className={styles.chatArea}>
              {chatMessages.map((msg, idx) => {
                const isActiveStream = streaming && msg.role === 'assistant' && idx === chatMessages.length - 1;
                return (
                  <div key={msg.id} className={`${styles.chatBubble} ${styles[msg.role]}`}>
                    {msg.role === 'user' ? (
                      <div className={`${styles.chatBubbleContent} ${styles.chatBubbleContentUser}`}>
                        {msg.content}
                      </div>
                    ) : (
                      <div className={styles.chatBubbleContent}>
                        {msg.content ? <MarkdownRenderer content={msg.content} /> : null}
                        {isActiveStream && thinkingStatus && (
                          <div className={styles.thinkingStatus}>
                            <span className={styles.thinkingDot} />
                            <span className={styles.thinkingText}>{thinkingStatus}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}

          <div className={`${styles.inputSection} ${hasMessages ? styles.inputSectionChat : ''}`}>
            <div className={styles.inputBox}>
              <textarea
                className={styles.chatInput}
                placeholder="Come posso aiutarti oggi?"
                value={message}
                onChange={onInput}
                onKeyDown={onKeydown}
                rows={1}
              />
              <div className={styles.inputActions}>
                <div className={styles.inputActionsLeft}>
                  <button className={styles.actionBtn}>
                    <HugeiconsIcon icon={Attachment01Icon} size={16} color="currentColor" strokeWidth={1.5} />
                    <span>Allega</span>
                  </button>
                  <button className={styles.actionBtn}>
                    <HugeiconsIcon icon={Globe02Icon} size={16} color="currentColor" strokeWidth={1.5} />
                    <span>Ricerca Web</span>
                  </button>
                </div>
                <button
                  className={`${styles.sendBtn} ${message.trim().length > 0 ? styles.active : ''}`}
                  onClick={onSend}
                  disabled={sending}
                >
                  <HugeiconsIcon icon={ArrowUp02Icon} size={18} color="currentColor" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          {!hasMessages && (
            <>
              <div className={styles.quickActions}>
                {quickActions.map((action) => (
                  <button key={action.label} className={styles.chip} onClick={() => onQuickAction(action)}>
                    <HugeiconsIcon icon={action.icon} size={15} color="currentColor" strokeWidth={1.5} />
                    {action.label}
                  </button>
                ))}
              </div>

              <div className={styles.examples}>
                {examples.map((example) => (
                  <button
                    key={example.title}
                    className={styles.exampleCard}
                    onClick={() => onExample(example)}
                  >
                    <div className={styles.exampleIcon} style={{ background: example.iconBg, color: example.iconColor }}>
                      <HugeiconsIcon icon={example.icon} size={22} color="currentColor" strokeWidth={1.5} />
                    </div>
                    <div className={styles.exampleContent}>
                      <div className={styles.exampleTitle}>{example.title}</div>
                      <div className={styles.exampleDesc}>{example.description}</div>
                      <div className={styles.examplePrompt}>
                        <span className={styles.examplePromptLabel}>Prova:</span> &ldquo;{example.prompt}&rdquo;
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
