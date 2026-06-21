'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { Clock01Icon, Sun01Icon, Moon02Icon, Menu01Icon } from '@hugeicons/core-free-icons';
import styles from './topbar.module.scss';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface TopbarProps {
  breadcrumbs: BreadcrumbItem[];
}

export default function Topbar({ breadcrumbs }: TopbarProps) {
  const [time, setTime] = useState('');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const day = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
      const hours = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      setTime(day.charAt(0).toUpperCase() + day.slice(1) + ' - ' + hours);
    };
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.topbar}>
      <div className={styles.left}>
        <button
          className={styles.menuBtn}
          onClick={() => window.dispatchEvent(new CustomEvent('lag8:toggle-sidebar'))}
          aria-label="Apri menu"
        >
          <HugeiconsIcon icon={Menu01Icon} size={20} color="currentColor" strokeWidth={1.8} />
        </button>
        {breadcrumbs.map((item, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
            {item.href ? (
              <Link href={item.href} className={styles.breadcrumbItem}>
                {item.label}
              </Link>
            ) : (
              <span className={styles.breadcrumbItem}>{item.label}</span>
            )}
          </span>
        ))}
      </div>

      <div className={styles.right}>
        <div className={styles.clock}>
          <HugeiconsIcon icon={Clock01Icon} size={14} color="currentColor" strokeWidth={1.5} />
          {time}
        </div>
        <button
          className={styles.themeBtn}
          onClick={() => setIsDark((v) => !v)}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          <HugeiconsIcon
            icon={isDark ? Sun01Icon : Moon02Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.5}
          />
        </button>
      </div>
    </div>
  );
}
