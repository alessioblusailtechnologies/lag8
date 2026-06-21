'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AiChat02Icon,
  Logout01Icon,
  ArrowDown01Icon,
  Add01Icon,
  MoreVerticalIcon,
  Delete02Icon,
  UserGroupIcon,
  Robot02Icon,
  WorkflowCircle01Icon,
} from '@hugeicons/core-free-icons';
import { useAuth } from '@/contexts/AuthContext';
import styles from './sidebar.module.scss';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, userInitials, userEmail, logout } = useAuth();
  const [convOpen, setConvOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Toggle the off-canvas drawer from the topbar hamburger (mobile only)
  useEffect(() => {
    const handler = () => setMobileOpen((v) => !v);
    window.addEventListener('lag8:toggle-sidebar', handler);
    return () => window.removeEventListener('lag8:toggle-sidebar', handler);
  }, []);

  // Close the drawer whenever the route changes (e.g. user tapped a nav link)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  const deleteConversation = async (id: string) => {
    setOpenMenuId(null);
    const wasActive = pathname === `/assistente/${id}`;
    setConversations((prev) => prev.filter((c) => c.id !== id));
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (wasActive) router.push('/assistente');
    } catch {
      const res = await fetch('/api/messages');
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
    }
  };

  useEffect(() => {
    const fetchConvs = () => {
      fetch('/api/messages')
        .then((r) => r.json())
        .then((data) => {
          if (data.conversations) setConversations(data.conversations);
        })
        .catch(() => {});
    };

    fetchConvs();

    const handler = () => fetchConvs();
    window.addEventListener('lag8:conversations-updated', handler);
    return () => window.removeEventListener('lag8:conversations-updated', handler);
  }, [pathname]);

  const isAssistantActive = pathname === '/assistente' || pathname.startsWith('/assistente/');

  return (
    <>
      <div
        className={`${styles.overlay} ${mobileOpen ? styles.overlayVisible : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ''}`}>
      <div className={styles.sidebarLogo}>
        <span className={styles.logoName}>
          lag8<span className={styles.logoAi}>.ai</span>
        </span>
      </div>

      <div className={styles.sidebarSection}>
        <button
          className={styles.newChatBtn}
          onClick={() => router.push('/assistente')}
          title="Nuova chat"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} color="currentColor" strokeWidth={2} />
          <span>Nuova chat</span>
        </button>

        <div className={styles.sidebarSectionLabel}>Principale</div>

        <div className={styles.navGroup}>
          <Link
            href="/assistente"
            className={`${styles.navItem} ${styles.navItemExpandable} ${isAssistantActive ? styles.active : ''}`}
          >
            <HugeiconsIcon icon={AiChat02Icon} size={18} color="currentColor" strokeWidth={1.5} />
            <span className={styles.navItemLabel}>Assistente</span>
            {conversations.length > 0 && (
              <button
                className={`${styles.collapseBtn} ${convOpen ? styles.open : ''}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConvOpen((v) => !v); }}
                title={convOpen ? 'Nascondi chat' : 'Mostra chat'}
              >
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={12}
                  color="currentColor"
                  strokeWidth={2}
                />
              </button>
            )}
          </Link>

          {conversations.length > 0 && (
            <div className={`${styles.convListWrapper} ${convOpen ? styles.open : ''}`}>
              <div className={styles.convListInner}>
                <div className={styles.convList}>
                  {conversations.slice(0, 15).map((conv) => {
                    const isActive = pathname === `/assistente/${conv.id}`;
                    const isMenuOpen = openMenuId === conv.id;
                    return (
                      <div
                        key={conv.id}
                        className={`${styles.convItemWrapper} ${isMenuOpen ? styles.menuOpen : ''}`}
                      >
                        <Link
                          href={`/assistente/${conv.id}`}
                          className={`${styles.convItem} ${isActive ? styles.active : ''}`}
                          title={conv.title || 'Chat senza titolo'}
                        >
                          <span className={styles.convItemText}>{conv.title || 'Chat senza titolo'}</span>
                        </Link>
                        <button
                          className={styles.convMenuBtn}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuId((prev) => (prev === conv.id ? null : conv.id));
                          }}
                          title="Opzioni"
                        >
                          <HugeiconsIcon icon={MoreVerticalIcon} size={14} color="currentColor" strokeWidth={2} />
                        </button>
                        {isMenuOpen && (
                          <div ref={menuRef} className={styles.convMenu}>
                            <button
                              className={styles.convMenuItem}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={14} color="currentColor" strokeWidth={1.5} />
                              Elimina
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.sidebarSection}>
        <div className={styles.sidebarSectionLabel}>CRM</div>
        <Link
          href="/leads"
          className={`${styles.navItem} ${pathname === '/leads' || pathname.startsWith('/leads/') ? styles.active : ''}`}
        >
          <HugeiconsIcon icon={UserGroupIcon} size={18} color="currentColor" strokeWidth={1.5} />
          Leads
        </Link>
        <Link
          href="/pipeline"
          className={`${styles.navItem} ${pathname === '/pipeline' || pathname.startsWith('/pipeline/') ? styles.active : ''}`}
        >
          <HugeiconsIcon icon={WorkflowCircle01Icon} size={18} color="currentColor" strokeWidth={1.5} />
          Pipeline
        </Link>
        <Link
          href="/scrapers"
          className={`${styles.navItem} ${pathname === '/scrapers' || pathname.startsWith('/scrapers/') ? styles.active : ''}`}
        >
          <HugeiconsIcon icon={Robot02Icon} size={18} color="currentColor" strokeWidth={1.5} />
          Scrapers
        </Link>
      </div>

      <div className={styles.sidebarFooter}>
        <div className={styles.userRow}>
          <div className={styles.avatar}>{userInitials}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{profile?.full_name || 'Procacciatore'}</div>
            <div className={styles.userEmail}>{userEmail}</div>
          </div>
          <button className={styles.logoutBtn} onClick={logout} title="Esci">
            <HugeiconsIcon icon={Logout01Icon} size={16} color="currentColor" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      </aside>
    </>
  );
}
